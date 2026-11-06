/* Heatmap rendering (DOM). Depends on js/calendar.js. */
(function () {
  'use strict';
  var P = (window.Portfolio = window.Portfolio || {});

  var DAY_LABELS = { 1: 'Mon', 3: 'Wed', 5: 'Fri' }; // row index -> label

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  /** One shared tooltip for every cell, positioned with fixed coordinates so
   *  the scroll container can never clip it. */
  function createTooltip() {
    var tip = el('div', 'heat-tip');
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    return {
      show: function (target, text) {
        tip.textContent = text;
        var r = target.getBoundingClientRect();
        tip.style.left = r.left + r.width / 2 + 'px';
        tip.style.top = r.top - 8 + 'px';
        tip.classList.add('is-visible');
      },
      hide: function () { tip.classList.remove('is-visible'); }
    };
  }

  /**
   * Render a heatmap into `mount`. Returns the calendar stats.
   * @param {HTMLElement} mount
   * @param {Object<string, number>} submissions  { "YYYY-MM-DD": count }
   * @param {Date} [today]
   */
  function renderHeatmap(mount, submissions, today) {
    var cal = P.calendar.buildCalendar(submissions, today || new Date());
    var s = cal.stats;
    var tooltip = createTooltip();

    mount.textContent = '';
    mount.className = 'heat';

    // Weekday labels
    var days = el('div', 'heat-days');
    days.setAttribute('aria-hidden', 'true');
    for (var r = 0; r < 7; r++) days.appendChild(el('span', null, DAY_LABELS[r] || ''));

    // Scroll area: month labels + grid
    var scroll = el('div', 'heat-scroll');
    scroll.setAttribute('role', 'img');
    scroll.setAttribute('aria-label',
      plural(s.totalSubmissions, 'submission') + ' on ' + plural(s.activeDays, 'active day') +
      ' in the past year, longest streak ' + plural(s.maxStreak, 'day') + '.');

    var months = el('div', 'heat-months');
    months.setAttribute('aria-hidden', 'true');
    cal.months.forEach(function (m) {
      var span = el('span', null, m.label);
      span.style.gridColumn = (m.col + 1) + ' / span 3';
      months.appendChild(span);
    });

    var grid = el('div', 'heat-grid');
    grid.setAttribute('aria-hidden', 'true');
    cal.cells.forEach(function (cell, i) {
      var node = el('i', 'cell');
      if (!cell) {
        node.classList.add('cell--pad');
      } else {
        node.dataset.level = cell.level;
        node.dataset.date = cell.key;
        node.dataset.tip = (cell.count ? plural(cell.count, 'submission') : 'No submissions') + ' on ' + formatDate(cell.date);
        var col = Math.floor(i / 7), row = i % 7;
        node.style.setProperty('--d', Math.round(col * 12 + row * 8) + 'ms'); // left-to-right wave
      }
      grid.appendChild(node);
    });

    scroll.appendChild(months);
    scroll.appendChild(grid);
    mount.appendChild(days);
    mount.appendChild(scroll);

    // Tooltip: hover (mouse) and tap (touch). Touch browsers fire emulated mouse
    // events after a tap (including a stray mouseleave), so on touch the tooltip
    // stays until the next tap elsewhere or a scroll.
    var touchMode = false;
    grid.addEventListener('pointerdown', function (e) { touchMode = e.pointerType === 'touch'; });
    grid.addEventListener('mouseover', function (e) {
      if (touchMode) return;
      var t = e.target.closest('.cell[data-date]');
      if (t) tooltip.show(t, t.dataset.tip); else tooltip.hide();
    });
    grid.addEventListener('mouseleave', function () { if (!touchMode) tooltip.hide(); });
    grid.addEventListener('click', function (e) {
      var t = e.target.closest('.cell[data-date]');
      if (t) tooltip.show(t, t.dataset.tip); else tooltip.hide();
    });
    document.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.heat-grid')) tooltip.hide();
    });
    scroll.addEventListener('scroll', tooltip.hide, { passive: true });
    window.addEventListener('scroll', tooltip.hide, { passive: true });

    // Show the most recent weeks first on narrow screens
    scroll.scrollLeft = scroll.scrollWidth;

    return s;
  }

  P.renderHeatmap = renderHeatmap;
})();
