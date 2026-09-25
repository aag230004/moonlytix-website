/**
 * Moonlytix signature visual — the terminator.
 * A moon rendered half as raw, cratered texture (unstructured operational
 * data) and half as a connected node mesh (the clarity Moonlytix builds),
 * split by an animated seam. Canvas 2D, seeded for a consistent look,
 * paused off-screen and under prefers-reduced-motion.
 */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let raf = null;
  let running = false;
  let t = 0;

  /* Seeded PRNG so the composition is stable across reloads */
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(1108);

  let stars = [];
  let craters = [];
  let grain = [];
  let nodes = [];
  let edges = [];

  function buildScene() {
    const area = width * height;
    stars = Array.from({ length: Math.min(140, Math.round(area / 9000)) }, () => ({
      x: rand() * width,
      y: rand() * height,
      r: rand() * 1.3 + 0.3,
      phase: rand() * Math.PI * 2,
      speed: 0.4 + rand() * 0.6,
    }));

    const cx = width * 0.66;
    const cy = height * 0.5;
    const radius = Math.min(width * 0.42, height * 0.62);

    craters = Array.from({ length: 16 }, () => {
      const a = rand() * Math.PI * 2;
      const d = rand() * radius * 0.85;
      return {
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d,
        r: radius * (0.06 + rand() * 0.16),
        o: 0.06 + rand() * 0.16,
      };
    });

    grain = Array.from({ length: 260 }, () => {
      const a = rand() * Math.PI * 2;
      const d = rand() * radius;
      return {
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d,
        r: rand() * 1.1 + 0.3,
        o: 0.08 + rand() * 0.22,
      };
    });

    nodes = Array.from({ length: 42 }, () => {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * radius;
      return {
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d,
        baseX: 0,
        baseY: 0,
        r: rand() * 1.6 + 1,
        phase: rand() * Math.PI * 2,
      };
    }).map((n) => ({ ...n, baseX: n.x, baseY: n.y }));

    edges = [];
    nodes.forEach((n, i) => {
      const dists = nodes
        .map((m, j) => (i === j ? Infinity : Math.hypot(n.x - m.x, n.y - m.y)))
        .map((d, j) => ({ d, j }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      dists.forEach(({ d, j }) => {
        if (d < radius * 0.5) edges.push([i, j]);
      });
    });

    canvas._scene = { cx, cy, radius };
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildScene();
  }

  function seamX(y, cy, radius, time) {
    const rel = (y - cy) / radius;
    const wave = Math.sin(rel * 2.4 + time * 0.35) * radius * 0.1;
    return Math.cos(Math.asin(Math.max(-1, Math.min(1, rel))) || 0) * radius * 0.12 + wave;
  }

  function draw() {
    const { cx, cy, radius } = canvas._scene || {};
    ctx.clearRect(0, 0, width, height);
    if (!cx) return;

    /* starfield */
    stars.forEach((s) => {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${(0.15 + tw * 0.5).toFixed(3)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    /* moon disc base */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const base = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    base.addColorStop(0, '#2a2d5c');
    base.addColorStop(1, '#0c0e33');
    ctx.fillStyle = base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    /* cratered left hemisphere, clipped to the animated seam */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy - radius);
    for (let y = cy - radius; y <= cy + radius; y += 6) {
      ctx.lineTo(cx - seamX(y, cy, radius, t) - radius * 0.02, y);
    }
    ctx.lineTo(cx - radius, cy + radius);
    ctx.closePath();
    ctx.clip();

    craters.forEach((c) => {
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      g.addColorStop(0, `rgba(180,183,214,${c.o})`);
      g.addColorStop(1, 'rgba(180,183,214,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    grain.forEach((g) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(210,212,232,${g.o})`;
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    /* mesh right hemisphere */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx + radius, cy - radius);
    for (let y = cy - radius; y <= cy + radius; y += 6) {
      ctx.lineTo(cx - seamX(y, cy, radius, t) - radius * 0.02, y);
    }
    ctx.lineTo(cx + radius, cy + radius);
    ctx.closePath();
    ctx.clip();

    const liveNodes = nodes.map((n) => ({
      ...n,
      x: n.baseX + Math.sin(t * 0.5 + n.phase) * 2.2,
      y: n.baseY + Math.cos(t * 0.4 + n.phase) * 2.2,
    }));

    edges.forEach(([i, j]) => {
      const a = liveNodes[i];
      const b = liveNodes[j];
      const distFromSeam = Math.min(a.x - cx, b.x - cx) / radius;
      const o = Math.max(0.05, 0.32 - distFromSeam * 0.18);
      ctx.strokeStyle = `rgba(255,255,255,${o.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    liveNodes.forEach((n) => {
      const nearSeam = 1 - Math.min(1, (n.x - cx) / (radius * 0.6));
      const pulse = 0.6 + 0.4 * Math.sin(t * 1.4 + n.phase);
      ctx.beginPath();
      if (nearSeam > 0.55) {
        ctx.fillStyle = `rgba(255,145,77,${(0.55 + pulse * 0.35).toFixed(3)})`;
      } else {
        ctx.fillStyle = `rgba(255,255,255,${(0.55 + pulse * 0.3).toFixed(3)})`;
      }
      ctx.arc(n.x, n.y, n.r + pulse * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    /* seam glow */
    ctx.save();
    ctx.beginPath();
    for (let y = cy - radius; y <= cy + radius; y += 4) {
      const x = cx - seamX(y, cy, radius, t) - radius * 0.02;
      y === cy - radius ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const seamGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
    seamGrad.addColorStop(0, 'rgba(255,49,49,0)');
    seamGrad.addColorStop(0.5, 'rgba(255,145,77,0.55)');
    seamGrad.addColorStop(1, 'rgba(255,49,49,0)');
    ctx.strokeStyle = seamGrad;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    /* rim light */
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  function frame() {
    t += 0.016;
    draw();
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || prefersReduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      draw();
    }, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
  draw();
  start();
})();
