/**
 * Hero fusion video — plays only while actually on screen.
 * On mobile the video sits below the fold at load (after the headline and
 * CTAs), so a single play() call on page load starts it off-screen — most
 * mobile browsers throttle or pause video that isn't visible yet, which is
 * why it would play briefly then stall. An IntersectionObserver instead
 * starts it the moment it scrolls into view (and pauses it when it scrolls
 * back out, saving battery/data), so it plays reliably regardless of where
 * it lands in the page. Respects prefers-reduced-motion by holding on the
 * resolved (fused) frame instead of autoplaying or looping.
 */
(function () {
  const video = document.getElementById('hero-video');
  if (!video) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    video.removeAttribute('loop');
    video.addEventListener(
      'loadedmetadata',
      () => {
        video.currentTime = Math.max(0, video.duration - 0.05);
      },
      { once: true }
    );
    return;
  }

  const tryPlay = () => {
    video.play().catch(() => {
      /* Autoplay can be blocked in rare cases; the poster/first frame still shows. */
    });
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) tryPlay();
          else video.pause();
        });
      },
      { threshold: 0.1 }
    );
    io.observe(video);
  } else {
    tryPlay();
  }
})();
