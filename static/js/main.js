/* ============================================================
   Navigation — transparent → solid on scroll
   ============================================================ */
(function () {
  const header = document.getElementById('site-header');
  if (!header) return;

  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
})();

/* ============================================================
   Mobile nav toggle
   ============================================================ */
(function () {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    }
  });
})();

/* ============================================================
   Countdown timer
   ============================================================ */
(function () {
  const wedding = new Date('2026-09-19T15:00:00-07:00'); // 3pm PDT
  const els = {
    days:    document.getElementById('cd-days'),
    hours:   document.getElementById('cd-hours'),
    minutes: document.getElementById('cd-minutes'),
    seconds: document.getElementById('cd-seconds'),
  };
  if (!els.days) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = wedding - Date.now();
    if (diff <= 0) {
      els.days.textContent = '0';
      els.hours.textContent = '00';
      els.minutes.textContent = '00';
      els.seconds.textContent = '00';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    els.days.textContent    = d;
    els.hours.textContent   = pad(h);
    els.minutes.textContent = pad(m);
    els.seconds.textContent = pad(s);
  }
  tick();
  setInterval(tick, 1000);
})();

/* ============================================================
   Fade-in on scroll (Intersection Observer)
   ============================================================ */
(function () {
  const items = document.querySelectorAll('.fade-in');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach(function (el) { observer.observe(el); });
})();

/* ============================================================
   Parallax background layers
   ============================================================ */
(function () {
  var layers = document.querySelectorAll('[data-parallax-speed]');
  if (!layers.length) return;

  function updateParallax() {
    var halfH = window.innerHeight / 2;
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      var speed = parseFloat(el.getAttribute('data-parallax-speed'));
      var section = el.closest('[data-parallax-root]') || el.closest('section') || el.parentElement;
      var rect = section.getBoundingClientRect();
      var sectionCenter = rect.top + rect.height / 2;
      var offset = -(sectionCenter - halfH) * speed;
      el.style.transform = 'translateY(' + offset + 'px)';
    }
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  window.addEventListener('resize', updateParallax, { passive: true });
  updateParallax();
})();

/* ============================================================
   Smooth scroll for anchor links
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80; // header height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
});
