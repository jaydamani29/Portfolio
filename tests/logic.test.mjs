// Run with: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { buildData, parseCalendar, serialize } from '../scripts/update-leetcode.mjs';

const require = createRequire(import.meta.url);
const { buildCalendar, dateKey } = require('../js/calendar.js');

test('calendar: 365-day window, weeks start on Sunday, stats are right', () => {
  const end = new Date(2026, 10, 6); // Fri 6 Nov 2026
  const subs = { '2026-11-06': 3, '2026-11-05': 2, '2026-11-04': 1, '2026-11-01': 5, '2025-11-05': 9 /* outside window */ };
  const cal = buildCalendar(subs, end);
  const real = cal.cells.filter(Boolean);
  assert.equal(real.length, 365);
  assert.equal(cal.columns, Math.ceil(cal.cells.length / 7), 'columns cover every cell');
  assert.equal(dateKey(real[real.length - 1].date), '2026-11-06');
  assert.equal(dateKey(real[0].date), '2025-11-07');
  // first real cell sits on the row matching its weekday (Fri = 5)
  assert.equal(cal.cells.indexOf(real[0]) % 7, real[0].date.getDay());
  assert.deepEqual(
    { t: cal.stats.totalSubmissions, a: cal.stats.activeDays, s: cal.stats.maxStreak },
    { t: 11, a: 4, s: 3 }
  );
});

test('calendar: dateKey uses local date (no UTC day shift)', () => {
  assert.equal(dateKey(new Date(2026, 0, 1, 0, 30)), '2026-01-01');
});

test('shipped data file matches the real profile totals (310 / 72 / 24)', () => {
  const text = readFileSync(new URL('../data/leetcode-data.js', import.meta.url), 'utf8');
  const data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  const cal = buildCalendar(data.submissions, new Date(2026, 10, 6));
  assert.equal(cal.stats.totalSubmissions, 310);
  assert.equal(cal.stats.activeDays, 72);
  assert.equal(cal.stats.maxStreak, 24);
  assert.equal(data.solved.total, data.solved.easy.solved + data.solved.medium.solved + data.solved.hard.solved);
});

test('sync: parses LeetCode calendar and builds site data', () => {
  const ts = (iso) => String(Date.parse(iso + 'T00:00:00Z') / 1000);
  const response = (year) => ({
    data: {
      allQuestionsCount: [
        { difficulty: 'All', count: 4101 }, { difficulty: 'Easy', count: 975 },
        { difficulty: 'Medium', count: 2139 }, { difficulty: 'Hard', count: 987 }
      ],
      matchedUser: {
        submitStatsGlobal: { acSubmissionNum: [
          { difficulty: 'All', count: 239 }, { difficulty: 'Easy', count: 115 },
          { difficulty: 'Medium', count: 84 }, { difficulty: 'Hard', count: 40 }
        ] },
        badges: [{ displayName: '50 Days Badge 2026' }],
        userCalendar: { submissionCalendar: JSON.stringify(year === 2026 ? { [ts('2026-10-01')]: 4 } : { [ts('2025-12-24')]: 2 }) }
      }
    }
  });
  assert.deepEqual(parseCalendar(JSON.stringify({ [ts('2026-03-05')]: 7 })), { '2026-03-05': 7 });
  const data = buildData([response(2026), response(2025)], {}, 'Jay_Damani', new Date('2026-11-06T00:00:00Z'));
  assert.equal(data.solved.total, 239);
  assert.equal(data.solved.hard.total, 987);
  assert.equal(data.badge, '50 Days Badge 2026');
  assert.deepEqual(data.submissions, { '2025-12-24': 2, '2026-10-01': 4 });
  assert.equal(data.meta.estimated, false);
  assert.ok(serialize(data).startsWith('/* LeetCode data'));
});

test('sync: clear error when the user is missing', () => {
  assert.throws(() => buildData([{ data: { matchedUser: null } }], {}, 'nobody'), /not found/);
});
