/* Mobile menu toggle. */
(function () {
  'use strict';
  var P = (window.Portfolio = window.Portfolio || {});

  function init() {
    var nav = document.querySelector('.nav');
    var toggle = document.querySelector('.nav-toggle');
    if (!nav || !toggle) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) setOpen(false); });
  }

  P.initNav = init;
})();
