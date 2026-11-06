/* Entry point: wires the modules together once the DOM is ready. */
(function () {
  'use strict';
  var P = window.Portfolio || {};

  function start() {
    if (P.initNav) P.initNav();
    if (P.initLeetCode) P.initLeetCode(); // builds the heatmap before motion observes it
    if (P.initMotion) P.initMotion();

    // Start the hero intro on the next frame so the hidden state paints first
    var hero = document.querySelector('.hero');
    if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-loaded'); }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
