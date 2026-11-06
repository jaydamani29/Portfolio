/* Pure calendar logic for the heatmap (no DOM), so it can be unit-tested in Node.
 *
 * buildCalendar(submissions, endDate) turns { "YYYY-MM-DD": count } into a
 * week-aligned grid covering the 365 days ending on endDate.
 */
(function (root) {
  'use strict';

  var DAYS = 365; // window length, same idea as LeetCode's "past one year"
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /** Local-time YYYY-MM-DD. (toISOString would shift the day in timezones like IST.) */
  function dateKey(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }

  function levelFor(count, max) {
    if (!count || count < 1) return 0;
    if (max <= 1) return 4;
    return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
  }

  function buildCalendar(submissions, endDate) {
    submissions = submissions || {};
    var end = startOfDay(endDate || new Date());
    var start = addDays(end, -(DAYS - 1));
    var lead = start.getDay(); // 0 = Sunday: blank cells so columns are real weeks

    // Pass 1: collect days in the window
    var days = [];
    var max = 0;
    for (var i = 0; i < DAYS; i++) {
      var d = addDays(start, i);
      var key = dateKey(d);
      var count = Number(submissions[key]) || 0;
      if (count > max) max = count;
      days.push({ date: d, key: key, count: count });
    }

    // Pass 2: levels + stats
    var total = 0, active = 0, streak = 0, best = 0;
    days.forEach(function (day) {
      day.level = levelFor(day.count, max);
      total += day.count;
      if (day.count > 0) { active++; streak++; if (streak > best) best = streak; } else { streak = 0; }
    });

    // Grid cells in column-major order (7 rows per column), with leading blanks
    var cells = [];
    for (var p = 0; p < lead; p++) cells.push(null);
    days.forEach(function (day) { cells.push(day); });
    var columns = Math.ceil(cells.length / 7);

    // Month labels: one label where the month changes, skipping ones too close to the previous
    var months = [];
    var prevMonth = -1;
    var lastCol = -10;
    for (var c = 0; c < columns; c++) {
      var first = null;
      for (var r = 0; r < 7; r++) {
        var cell = cells[c * 7 + r];
        if (cell) { first = cell; break; }
      }
      if (!first) continue;
      var m = first.date.getMonth();
      if (m !== prevMonth) {
        if (c - lastCol >= 3) { months.push({ col: c, label: MONTHS[m] }); lastCol = c; }
        prevMonth = m;
      }
    }

    return {
      start: start,
      end: end,
      columns: columns,
      cells: cells,
      months: months,
      stats: { totalSubmissions: total, activeDays: active, maxStreak: best, maxDay: max }
    };
  }

  var api = { buildCalendar: buildCalendar, dateKey: dateKey, levelFor: levelFor, DAYS: DAYS };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  var P = (root.Portfolio = root.Portfolio || {});
  P.calendar = api;
})(typeof window !== 'undefined' ? window : globalThis);
