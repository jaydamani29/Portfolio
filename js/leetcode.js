/* Fills the LeetCode panel and the stats strip from data/leetcode-data.js.
 * The HTML already contains the same numbers as a fallback, so the page still
 * reads correctly if this file or the data file fails to load. */
(function () {
  'use strict';
  var P = (window.Portfolio = window.Portfolio || {});

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (n) { n.textContent = value; });
  }

  function init() {
    var data = window.LEETCODE_DATA;
    var mount = document.getElementById('heatmap');
    if (!data || !mount || !P.renderHeatmap) return;

    var stats = P.renderHeatmap(mount, data.submissions);
    var s = data.solved || {};

    // Panel numbers
    setText('[data-lc="total"]', s.total);
    setText('[data-lc="totalQuestions"]', '/' + s.totalQuestions);
    setText('[data-lc="easy"]', s.easy.solved + '/' + s.easy.total);
    setText('[data-lc="medium"]', s.medium.solved + '/' + s.medium.total);
    setText('[data-lc="hard"]', s.hard.solved + '/' + s.hard.total);
    setText('[data-lc="activeDays"]', stats.activeDays);
    setText('[data-lc="submissions"]', stats.totalSubmissions);
    setText('[data-lc="maxStreak"]', stats.maxStreak);
    if (data.badge) setText('[data-lc="badge"]', data.badge);

    // Stats strip (count-up targets)
    var targets = { solved: s.total, submissions: stats.totalSubmissions, streak: stats.maxStreak };
    document.querySelectorAll('[data-stat]').forEach(function (n) {
      var v = targets[n.dataset.stat];
      if (v != null) { n.dataset.count = v; n.textContent = v; }
    });

    // Light up the heatmap squares when the panel scrolls into view
    var card = document.getElementById('lcCard');
    if (card) card.addEventListener('revealed', function () { mount.classList.add('is-in'); });

    // Be upfront when daily squares are an estimate rather than real data
    var note = document.getElementById('lcNote');
    if (note && data.meta && data.meta.estimated) note.hidden = false;
  }

  P.initLeetCode = init;
})();
