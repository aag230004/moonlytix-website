/**
 * Services page — on phones, a service link from the home page should
 * jump straight to that service (no room to spare, and scrolling back
 * up to a hero they already saw on Home is just friction). On
 * desktop, land on the hero instead, since it's worth seeing and the
 * sub-nav right below it makes finding the right service a single
 * click away. Runs after the browser's own jump-to-anchor so it can
 * override it back to the top on wider screens.
 */
(function () {
  if (window.location.hash && window.innerWidth > 640) {
    window.scrollTo(0, 0);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
})();

/**
 * Services page — scrollspy for the sticky jump-nav.
 * Highlights the nav link for whichever service section currently
 * occupies the "active" band of the viewport as the user scrolls.
 */
(function () {
  const nav = document.querySelector('.services-nav');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll('a'));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  function setActive(id) {
    links.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
      /* The nav scrolls horizontally on narrow screens, so the newly
         active link can land off-screen — keep it in view as the
         highlight moves instead of leaving it to look unchanged. */
      if (isActive) {
        link.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  if (!('IntersectionObserver' in window)) {
    setActive(sections[0].id);
    return;
  }

  const header = document.querySelector('.site-header');
  const topOffset = (header ? header.offsetHeight : 0) + nav.offsetHeight;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    {
      /* Treat a horizontal band just below the sticky header+nav as the
         "active" line: a section counts as current as soon as it crosses
         that line, well before it reaches the very top of the viewport. */
      rootMargin: `-${topOffset + 4}px 0px -65% 0px`,
      threshold: 0,
    }
  );

  sections.forEach((section) => io.observe(section));
  setActive(sections[0].id);
})();
