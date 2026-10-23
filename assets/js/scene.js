/* Hero scene: the logo's isometric cube built from voxels (three.js r128). One accent voxel per service. */
window.addEventListener('load', () => {
  const cv = document.getElementById('gl');
  if (!cv || !window.THREE) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let R;
  try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(35, 1, .1, 100);
  C.position.z = 13;
  S.add(new THREE.AmbientLight(0xffffff, .6));
  const L = new THREE.DirectionalLight(0xffffff, 1.2); L.position.set(5, 8, 7); S.add(L);
  const G = new THREE.Group(); G.rotation.order = 'YXZ'; S.add(G);
  const N = 4, gap = 1.1, box = new THREE.BoxGeometry(1, 1, 1), edge = new THREE.EdgesGeometry(box);
  const grays = [0x464646, 0xA4A4A4, 0x262626, 0x6C6C6C, 0xD9D9D6];
  const acc = { '0,3,3': 0x6EE7C0, '3,3,0': 0xF5B83D, '3,0,3': 0x2F5BFF, '0,0,0': 0xFF4F8B, '3,3,3': 0xF2F2EF };
  const V = [], rnd = () => (Math.random() - .5) * 30;
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) {
    if (x > 0 && x < 3 && y > 0 && y < 3 && z > 0 && z < 3) continue;   // hollow core
    const a = acc[[x, y, z]], c = a || grays[(x * 7 + y * 3 + z * 5) % grays.length];
    const m = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: c, roughness: .45, metalness: .25, emissive: a || 0, emissiveIntensity: .45 }));
    m.add(new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .22 })));
    const h = new THREE.Vector3((x - 1.5) * gap, (y - 1.5) * gap, (z - 1.5) * gap);
    m.userData = { h, s: h.clone().add(new THREE.Vector3(rnd(), rnd(), rnd())), d: Math.random() * .8 };
    m.position.copy(reduce ? h : m.userData.s);
    G.add(m); V.push(m);
  }
  const size = () => {
    const w = cv.clientWidth, h = cv.clientHeight, wide = w / h > 1.2;
    R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix();
    G.position.set(wide ? 3.6 : 0, wide ? 0 : (210 - h / 2) / h * 8.2, 0); G.scale.setScalar(wide ? .62 : .36);   // phone: cube sits under the text
  };
  let mx = 0, my = 0, on = true; const t0 = performance.now();
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  const ease = k => 1 - Math.pow(1 - k, 3);
  const draw = now => {
    const t = (now - t0) / 1000, ex = reduce ? 0 : Math.min(scrollY / (innerHeight * .8), 1) * 1.6;
    V.forEach(m => { const u = m.userData, k = reduce ? 1 : ease(Math.min(1, Math.max(0, (t - u.d) / 1.8))); m.position.lerpVectors(u.s, u.h, k).multiplyScalar(1 + ex); });
    G.rotation.y = Math.PI / 4 + (reduce ? 0 : Math.sin(t * .35) * .25 + mx * .6 + ex * .8);
    G.rotation.x = .615 + (reduce ? 0 : my * .4);
    R.render(S, C);
  };
  size();
  if (reduce) { draw(t0 + 1e5); addEventListener('resize', () => { size(); draw(t0 + 1e5); }); return; }
  addEventListener('resize', size);
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(cv);
  const loop = now => { if (on) draw(now); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
