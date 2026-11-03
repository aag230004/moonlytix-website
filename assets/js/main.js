(function () {
  /* Mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const header = document.querySelector('.site-header');
  if (toggle && header) {
    toggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    document.querySelectorAll('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* Header background strengthens after scroll */
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Scroll reveal */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      /* threshold:0 so a reveal fires as soon as any part of the element
         enters the trigger zone — with threshold:0.15, a block taller than
         ~85% of the viewport (very common on mobile, e.g. a service detail
         section) could sit fully in view but still invisible (opacity:0)
         because the required 15%-visible area was never reached. */
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );
    revealEls.forEach((el, i) => {
      el.style.setProperty('--i', i % 8);
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Footer year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
