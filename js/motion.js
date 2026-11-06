/* Scroll reveal + count-up. Elements opt in with data-reveal="up|left|stagger"
 * and data-count="<number>". When an element scrolls into view it gets
 * .is-in and fires a bubbling "revealed" event that other modules can use. */
(function () {
  'use strict';
  var P = (window.Portfolio = window.Portfolio || {});
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(node) {
    var target = Number(node.dataset.count);
    if (!isFinite(target)) return;
    if (reduced) { node.textContent = target; return; }
    var duration = 1400;
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min((now - t0) / duration, 1);
      node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function counters(root) {
    var list = Array.prototype.slice.call(root.querySelectorAll('[data-count]'));
    if (root.matches && root.matches('[data-count]')) list.push(root);
    return list;
  }

  function reveal(el) {
    el.classList.add('is-in');
    counters(el).forEach(countUp);
    el.dispatchEvent(new CustomEvent('revealed', { bubbles: true }));
  }

  function init() {
    var targets = document.querySelectorAll('[data-reveal], #lcCard');

    // Reset counters to 0 so they can animate up (only when motion is allowed)
    if (!reduced) {
      document.querySelectorAll('[data-count]').forEach(function (n) { n.textContent = '0'; });
    }

    if (!('IntersectionObserver' in window)) {
      targets.forEach(reveal);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        reveal(entry.target);
      });
    }, { threshold: 0.15 });
    targets.forEach(function (t) { io.observe(t); });
  }

  P.initMotion = init;
})();
