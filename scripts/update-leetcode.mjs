#!/usr/bin/env node
/**
 * Pulls your real LeetCode stats and daily submission calendar, then rewrites
 * data/leetcode-data.js (which the site reads).
 *
 * Usage:   node scripts/update-leetcode.mjs [username]
 * Needs:   Node 18+ (built-in fetch) and internet access to leetcode.com.
 *
 * LeetCode has no official public API. This uses the same GraphQL endpoint the
 * website uses; if LeetCode changes it, only the QUERY below needs updating.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'data', 'leetcode-data.js');
const ENDPOINT = 'https://leetcode.com/graphql';

const QUERY = `
query siteStats($username: String!, $year: Int) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $username) {
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    badges { displayName }
    userCalendar(year: $year) { submissionCalendar }
  }
}`;

/** Read the existing data file (it is `window.LEETCODE_DATA = {...};`). */
export function readExisting(file = DATA_FILE) {
  try {
    const text = readFileSync(file, 'utf8');
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** LeetCode gives { "<unix seconds at UTC midnight>": count } as a JSON string. */
export function parseCalendar(jsonString) {
  const out = {};
  const raw = JSON.parse(jsonString || '{}');
  for (const [ts, count] of Object.entries(raw)) {
    const day = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
    out[day] = (out[day] || 0) + Number(count);
  }
  return out;
}

function pick(list, difficulty, field = 'count') {
  const row = (list || []).find((r) => r.difficulty === difficulty);
  return row ? row[field] : 0;
}

/**
 * Pure transform: raw GraphQL responses -> the data object the site expects.
 * `responses` is an array (one per calendar year fetched).
 */
export function buildData(responses, existing = {}, username = existing.username, now = new Date()) {
  const first = responses[0]?.data;
  const user = first?.matchedUser;
  if (!user) throw new Error(`LeetCode user "${username}" not found (or profile is private).`);

  const solvedList = user.submitStatsGlobal.acSubmissionNum;
  const totals = first.allQuestionsCount;

  const submissions = {};
  for (const r of responses) {
    const cal = r?.data?.matchedUser?.userCalendar?.submissionCalendar;
    Object.assign(submissions, parseCalendar(cal));
  }

  // Keep only the last ~13 months so the file stays small
  const cutoff = new Date(now.getTime() - 400 * 864e5).toISOString().slice(0, 10);
  const sorted = Object.fromEntries(
    Object.entries(submissions).filter(([d, c]) => d >= cutoff && c > 0).sort(([a], [b]) => (a < b ? -1 : 1))
  );

  const daysBadges = (user.badges || []).map((b) => b.displayName).filter((n) => /days badge/i.test(n));
  const badge = daysBadges.length ? daysBadges[daysBadges.length - 1] : existing.badge;

  return {
    username,
    profileUrl: `https://leetcode.com/u/${username}/`,
    meta: { asOf: now.toISOString().slice(0, 10), estimated: false, note: 'Synced from LeetCode.' },
    solved: {
      total: pick(solvedList, 'All'),
      totalQuestions: pick(totals, 'All'),
      easy: { solved: pick(solvedList, 'Easy'), total: pick(totals, 'Easy') },
      medium: { solved: pick(solvedList, 'Medium'), total: pick(totals, 'Medium') },
      hard: { solved: pick(solvedList, 'Hard'), total: pick(totals, 'Hard') }
    },
    badge,
    submissions: sorted
  };
}

export function serialize(data) {
  return (
    '/* LeetCode data used by js/leetcode.js. Regenerate with: node scripts/update-leetcode.mjs */\n' +
    'window.LEETCODE_DATA = ' + JSON.stringify(data, null, 2) + ';\n'
  );
}

async function query(username, year) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com', 'User-Agent': 'portfolio-stats-sync' },
    body: JSON.stringify({ query: QUERY, variables: { username, year } })
  });
  if (!res.ok) throw new Error(`LeetCode responded with HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error('LeetCode API error: ' + JSON.stringify(json.errors));
  return json;
}

async function main() {
  const existing = readExisting();
  const username = process.argv[2] || existing.username || 'Jay_Damani';
  const year = new Date().getUTCFullYear();

  console.log(`Fetching LeetCode data for ${username}...`);
  // userCalendar returns one calendar year at a time, so fetch this year and last
  const responses = [await query(username, year), await query(username, year - 1)];
  const data = buildData(responses, existing, username);

  writeFileSync(DATA_FILE, serialize(data));
  const days = Object.keys(data.submissions).length;
  console.log(`Done. ${data.solved.total} solved, ${days} active days written to data/leetcode-data.js`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error('Update failed:', err.message); process.exit(1); });
}
