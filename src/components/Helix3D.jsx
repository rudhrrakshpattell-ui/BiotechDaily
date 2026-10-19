import { useEffect, useRef, useState } from 'react';
import DnaHelix from './DnaHelix.jsx';

// The home page's hero: a 3D DNA double helix (three.js, loaded on demand) that turns on its own, spins
// faster as you scroll and leans toward the pointer. Lies across wide screens, stands up on phones.
// Until three.js arrives, or if WebGL isn't available, the 2D canvas helix stands in.
export default function Helix3D({ className = '' }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed) return;
      try {
        cleanup = mount(THREE, hostRef.current, canvasRef.current, () => setReady(true));
      } catch {
        setFailed(true);
      }
    }, () => setFailed(true));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={hostRef} className={`relative ${className}`}>
      {!ready && <DnaHelix orientation="horizontal" pairs={30} turns={3} speed={0.8} className="absolute inset-x-0 top-1/2 h-48 -translate-y-1/2 sm:h-64" />}
      {!failed && <canvas ref={canvasRef} role="img" aria-label="A rotating DNA double helix" className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`} />}
    </div>
  );
}

function mount(THREE, host, canvas, onReady) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const tilt = new THREE.Group(); // overall pose
  const spin = new THREE.Group(); // turns around the helix axis
  tilt.add(spin);
  scene.add(tilt);

  const BLUE = new THREE.Color('#3283f8');
  const GREEN = new THREE.Color('#10b98a');
  const BASES = ['#8ec6ff', '#6ee7c5', '#bcdcff', '#b4f1dd'].map((c) => new THREE.Color(c));
  const PAIRS = 64, LEN = 18, R = 1.55, TWIST = 0.36, OFFSET = Math.PI * 0.82;
  const pt = (i, phase) => new THREE.Vector3(Math.cos(i * TWIST + phase) * R, -LEN / 2 + (i / (PAIRS - 1)) * LEN, Math.sin(i * TWIST + phase) * R);
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  // Backbones.
  for (const [phase, color] of [[0, BLUE], [OFFSET, GREEN]]) {
    const pts = [];
    for (let i = 0; i < PAIRS; i += 0.25) pts.push(pt(i, phase));
    const geometry = keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.13, 14, false));
    const material = keep(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.12, metalness: 0.35, roughness: 0.28 }));
    spin.add(new THREE.Mesh(geometry, material));
  }

  // Nucleotides and base pairs (each rung is two halves, one per strand).
  const nodes = new THREE.InstancedMesh(keep(new THREE.SphereGeometry(0.24, 20, 20)), keep(new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.25 })), PAIRS * 2);
  const rungs = new THREE.InstancedMesh(keep(new THREE.CylinderGeometry(0.07, 0.07, 1, 10)), keep(new THREE.MeshStandardMaterial({ metalness: 0.1, roughness: 0.4 })), PAIRS * 2);
  const d = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < PAIRS; i++) {
    const a = pt(i, 0), b = pt(i, OFFSET), mid = a.clone().lerp(b, 0.5);
    [[a, BLUE], [b, GREEN]].forEach(([p, color], k) => {
      d.position.copy(p); d.quaternion.identity(); d.scale.setScalar(1); d.updateMatrix();
      nodes.setMatrixAt(i * 2 + k, d.matrix);
      nodes.setColorAt(i * 2 + k, color);
      const dir = mid.clone().sub(p);
      const len = dir.length();
      d.position.copy(p).add(mid).multiplyScalar(0.5);
      d.quaternion.setFromUnitVectors(up, dir.normalize());
      d.scale.set(1, len * 0.92, 1); d.updateMatrix();
      rungs.setMatrixAt(i * 2 + k, d.matrix);
      const base = (i * 7 + k) % 4;
      rungs.setColorAt(i * 2 + k, BASES[k ? base ^ 1 : base]);
    });
  }
  spin.add(nodes, rungs);

  // Drifting specks, like a cell under the microscope.
  const N = 380, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = (Math.random() - 0.5) * 26; pos[i * 3 + 2] = (Math.random() - 0.5) * 10; }
  const specksGeometry = keep(new THREE.BufferGeometry());
  specksGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const specks = new THREE.Points(specksGeometry, keep(new THREE.PointsMaterial({ color: '#7fb4ff', size: 0.05, transparent: true, opacity: 0.7 })));
  tilt.add(specks);

  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 8); scene.add(key);
  const blue = new THREE.PointLight(0x3283f8, 60, 40, 1.4); blue.position.set(-8, 3, 6); scene.add(blue);
  const green = new THREE.PointLight(0x10b98a, 60, 40, 1.4); green.position.set(8, -3, 6); scene.add(green);

  let baseZ = Math.PI / 2 - 0.32;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    baseZ = aspect > 1.1 ? Math.PI / 2 - 0.32 : 0.28;
    // Tall phone screens (helix behind the headline): pull back so it reads as a slender background strand.
    camera.position.set(0, 0, aspect > 1.1 ? Math.max(18, 26 / aspect + 7) : aspect < 0.75 ? 30 : 20);
  }

  let tx = 0, ty = 0, px = 0, py = 0, vel = 0, angle = 0, lastY = window.scrollY, visible = true, raf = 0, prev = performance.now();
  const onPointer = (e) => { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; };
  const onScroll = () => { vel += (window.scrollY - lastY) * 0.0016; lastY = window.scrollY; };

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    vel *= 0.92;
    angle += dt * 0.45 + vel;
    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;
    const p = Math.min(1, window.scrollY / window.innerHeight);
    spin.rotation.y = angle;
    tilt.rotation.z = baseZ + px * 0.25;
    tilt.rotation.x = py * 0.35 + p * 0.3;
    tilt.scale.setScalar(1 + p * 0.18);
    specks.rotation.y = -angle * 0.15;
    renderer.render(scene, camera);
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    frame(now);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!reduce && !raf) { prev = performance.now(); raf = requestAnimationFrame(loop); } };

  const ro = new ResizeObserver(() => { resize(); if (reduce) frame(performance.now()); });
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); });
  io.observe(host);
  const onVisibility = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVisibility);
  if (!reduce) {
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  resize();
  frame(performance.now());
  onReady();
  start();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
    disposables.forEach((x) => x.dispose());
    nodes.dispose();
    rungs.dispose();
    renderer.dispose();
  };
}
