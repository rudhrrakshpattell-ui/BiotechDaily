import { useEffect, useRef } from 'react';

// A rotating DNA double helix on canvas. Strand A is brand-500, strand B helix-500, base pairs their 300 tints;
// anything turning away shrinks and fades. Still frame under prefers-reduced-motion; pauses off-screen.
export default function DnaHelix({ orientation = 'vertical', pairs = 22, turns = 2, speed = 1, className = 'relative', label = 'A rotating DNA double helix' }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const horizontal = orientation === 'horizontal';
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const css = (name, fallback) => getComputedStyle(host).getPropertyValue(name).trim() || fallback;
    const colors = {
      a: css('--color-brand-500', '#3283f8'),
      b: css('--color-helix-500', '#10b98a'),
      aLight: css('--color-brand-300', '#8ec6ff'),
      bLight: css('--color-helix-300', '#6ee7c5'),
    };
    let w = 1, h = 1, dpr = 1, raf = 0, visible = true;
    const t0 = performance.now();

    const pt = (u, x) => (horizontal ? [u, x] : [x, u]);

    function draw(now) {
      const len = horizontal ? w : h, span = horizontal ? h : w;
      const pad = Math.min(len * 0.08, 40);
      const tail = len * 0.13; // axis length each loose end takes up
      const mid = span / 2;
      // Horizontal helices are short, so they narrow a little to leave room for the ends to hang.
      const amp = Math.min(span * (horizontal ? 0.26 : 0.34), len * 0.2);
      const node = Math.max(2.5, Math.min(amp * 0.11, 7));
      const t = reduce ? 0.6 : ((now - t0) / 1000) * 0.9 * speed;
      const total = turns * Math.PI * 2;
      const start = pad + tail, run = len - 2 * (pad + tail);
      const at = (f) => { const ph = f * total + t; return { u: start + f * run, s: Math.sin(ph), z: Math.cos(ph) }; };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';

      // Base pairs, each half in its strand's tint.
      for (let i = 0; i < pairs; i++) {
        const p = at(i / (pairs - 1));
        const A = pt(p.u, mid + amp * p.s), B = pt(p.u, mid - amp * p.s), M = pt(p.u, mid);
        ctx.lineWidth = Math.max(1.5, node * 0.55);
        ctx.globalAlpha = 0.35 + 0.35 * (1 - Math.abs(p.s));
        ctx.strokeStyle = colors.aLight; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...M); ctx.stroke();
        ctx.strokeStyle = colors.bLight; ctx.beginPath(); ctx.moveTo(...M); ctx.lineTo(...B); ctx.stroke();
      }

      // Backbones: back halves first, then front, so the strands cross convincingly.
      const steps = 160;
      for (const front of [false, true]) {
        for (const [dir, color] of [[1, colors.a], [-1, colors.b]]) {
          for (let k = 0; k < steps; k++) {
            const p1 = at(k / steps), p2 = at((k + 1) / steps);
            const z = (dir * (p1.z + p2.z)) / 2;
            if ((z > 0) !== front) continue;
            ctx.globalAlpha = 0.3 + (0.7 * (z + 1)) / 2;
            ctx.lineWidth = node * (0.9 + (0.5 * (z + 1)) / 2);
            ctx.strokeStyle = color;
            ctx.beginPath(); ctx.moveTo(...pt(p1.u, mid + dir * amp * p1.s)); ctx.lineTo(...pt(p2.u, mid + dir * amp * p2.s)); ctx.stroke();
          }
        }
      }

      // Loose ends: past the last base pair each strand unzips, splays away from its partner and hangs
      // under gravity (screen-down), swaying slightly. Unpaired bases ride along, shrinking toward the tip.
      const tailDots = [];
      const segs = 36;
      for (const [f, outward] of [[0, -1], [1, 1]]) {
        const e = at(f);
        for (const [dir, color] of [[1, colors.a], [-1, colors.b]]) {
          const off = dir * amp * e.s;
          const side = Math.sign(off) || dir;
          const point = (q) => {
            let u = e.u + outward * tail * q * (1 - 0.25 * q);
            let x = mid + off + side * amp * 0.4 * q + Math.sin(t * 1.3 + q * 3 + dir) * amp * 0.12 * q;
            const drop = amp * 0.45 * q * q;
            if (horizontal) x += drop; else u += drop;
            return pt(u, x);
          };
          for (let k = 0; k < segs; k++) {
            const q = k / segs;
            ctx.globalAlpha = 0.9 - 0.65 * q;
            ctx.lineWidth = node * (1.2 - 0.7 * q);
            ctx.strokeStyle = color;
            ctx.beginPath(); ctx.moveTo(...point(q)); ctx.lineTo(...point((k + 1) / segs)); ctx.stroke();
          }
          for (const q of [0.4, 0.75]) tailDots.push({ p: point(q), q, c: color });
        }
      }
      for (const d of tailDots) {
        ctx.globalAlpha = 0.85 - 0.5 * d.q;
        ctx.fillStyle = d.c;
        ctx.beginPath(); ctx.arc(d.p[0], d.p[1], node * (1.1 - 0.5 * d.q), 0, Math.PI * 2); ctx.fill();
      }

      // Nucleotides, back to front; the front ones glow.
      const dots = [];
      for (let j = 0; j < pairs; j++) {
        const q = at(j / (pairs - 1));
        dots.push({ p: pt(q.u, mid + amp * q.s), z: q.z, c: colors.a }, { p: pt(q.u, mid - amp * q.s), z: -q.z, c: colors.b });
      }
      dots.sort((m, n) => m.z - n.z);
      for (const d of dots) {
        const k = (d.z + 1) / 2;
        ctx.globalAlpha = 0.45 + 0.55 * k;
        ctx.fillStyle = d.c;
        ctx.shadowColor = d.c;
        ctx.shadowBlur = k > 0.6 ? node * 2 * k : 0;
        ctx.beginPath(); ctx.arc(d.p[0], d.p[1], node * (0.8 + 0.6 * k), 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    function resize() {
      const r = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      draw(performance.now());
    }
    function loop(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    const start = () => { if (!reduce && !raf) raf = requestAnimationFrame(loop); };
    const onVisibility = () => { if (!document.hidden) start(); };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); });
    io.observe(host);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [orientation, pairs, turns, speed]);

  return (
    <div ref={hostRef} className={className}>
      <canvas ref={canvasRef} role="img" aria-label={label} className="block h-full w-full" />
    </div>
  );
}
