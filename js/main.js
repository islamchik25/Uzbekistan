// ══════════════════════════════════════
// THREE.JS 3D BACKGROUND
// ══════════════════════════════════════
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// ── GOLD PARTICLE FIELD ──
const pGeo = new THREE.BufferGeometry();
const pCount = 2000;
const pPos = new Float32Array(pCount * 3);
const pSize = new Float32Array(pCount);
const pPhase = new Float32Array(pCount);
for (let i = 0; i < pCount; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 30;
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
  pPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
  pSize[i] = Math.random() * 2 + 0.5;
  pPhase[i] = Math.random() * Math.PI * 2;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1));

const pMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0xC8942A) }, color2: { value: new THREE.Color(0x3DBDBD) } },
  vertexShader: `
    attribute float size;
    uniform float time;
    varying float vAlpha;
    varying float vType;
    void main(){
      vType = mod(position.x * 7.3 + position.y * 3.1, 1.0);
      float wave = sin(time * 0.8 + position.x * 0.4 + position.y * 0.3) * 0.5 + 0.5;
      vAlpha = wave * 0.6 + 0.1;
      vec3 p = position;
      p.y += sin(time * 0.3 + position.x * 0.5) * 0.15;
      p.x += cos(time * 0.25 + position.y * 0.4) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      gl_PointSize = size * (vAlpha + 0.4) * (300.0 / -gl_Position.z);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform vec3 color2;
    varying float vAlpha;
    varying float vType;
    void main(){
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if(d > 0.5) discard;
      float soft = 1.0 - smoothstep(0.3,0.5,d);
      vec3 col = mix(color, color2, vType);
      gl_FragColor = vec4(col, vAlpha * soft);
    }
  `,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ── 3D DOME (MOSQUE SILHOUETTE) ──
function createDome() {
  const group = new THREE.Group();

  // Main dome sphere
  const domeGeo = new THREE.SphereGeometry(1.4, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const domeMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, color1: { value: new THREE.Color(0xC8942A) }, color2: { value: new THREE.Color(0x1A3A6E) } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      uniform float time;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vec3 p = position;
        p += normal * sin(time * 0.5 + uv.y * 8.0) * 0.01;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      uniform float time;
      varying vec3 vNormal;
      varying vec2 vUv;
      void main(){
        float rim = 1.0 - dot(vNormal, vec3(0,0,1));
        float pulse = sin(time * 1.2 + vUv.y * 6.0) * 0.5 + 0.5;
        vec3 col = mix(color1 * 0.3, color2 * 0.8, rim);
        col += color1 * pulse * 0.15;
        float alpha = rim * 0.6 + 0.1;
        gl_FragColor = vec4(col, alpha * 0.5);
      }
    `,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.rotation.x = Math.PI;
  dome.position.y = -0.5;
  group.add(dome);

  // Wireframe dome
  const wireGeo = new THREE.SphereGeometry(1.42, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xC8942A, wireframe: true, transparent: true, opacity: 0.08 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  wire.rotation.x = Math.PI;
  wire.position.y = -0.5;
  group.add(wire);

  // Minarets
  function addMinaret(x) {
    const mGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.8, 8);
    const mMat = new THREE.MeshBasicMaterial({ color: 0xC8942A, transparent: true, opacity: 0.25, wireframe: true });
    const m = new THREE.Mesh(mGeo, mMat);
    m.position.set(x, -0.2, 0);
    group.add(m);
    // Minaret cap
    const capGeo = new THREE.ConeGeometry(0.1, 0.35, 8);
    const cap = new THREE.Mesh(capGeo, mMat);
    cap.position.set(x, 0.72, 0);
    group.add(cap);
  }
  addMinaret(-1.9);
  addMinaret(1.9);

  // Girih ring
  const ringGeo = new THREE.TorusGeometry(2.2, 0.008, 8, 80);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xE8B84B, transparent: true, opacity: 0.3 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = -0.5;
  group.add(ring);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.005, 8, 60), new THREE.MeshBasicMaterial({ color: 0x3DBDBD, transparent: true, opacity: 0.2 }));
  ring2.position.y = -0.5;
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);

  group.position.set(0, 0.5, -3);
  scene.add(group);
  return { group, domeMat, dome, wire };
}
const domeObj = createDome();

// ── ORBIT RINGS (Girih geometric) ──
function createOrbitRings() {
  const rings = [];
  const configs = [
    { r: 3.5, tube: 0.006, col: 0xC8942A, opacity: .15, tiltX: 0.4, tiltZ: 0.2, speed: 0.003 },
    { r: 4.5, tube: 0.004, col: 0xE8B84B, opacity: .1, tiltX: -0.3, tiltZ: 0.5, speed: -0.002 },
    { r: 5.5, tube: 0.003, col: 0x3DBDBD, opacity: .08, tiltX: 0.6, tiltZ: -0.3, speed: 0.0015 },
    { r: 6.5, tube: 0.003, col: 0xB8452A, opacity: .06, tiltX: -0.5, tiltZ: 0.4, speed: -0.001 },
  ];
  configs.forEach(c => {
    const geo = new THREE.TorusGeometry(c.r, c.tube, 6, 120);
    const mat = new THREE.MeshBasicMaterial({ color: c.col, transparent: true, opacity: c.opacity });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = c.tiltX;
    mesh.rotation.z = c.tiltZ;
    scene.add(mesh);
    rings.push({ mesh, speed: c.speed });
  });
  return rings;
}
const orbitRings = createOrbitRings();

// ── FLOATING GEOMETRIC STARS ──
function createStar3D(x, y, z, scale, col) {
  const group = new THREE.Group();
  // 8-pointed star from two pyramids
  const geo = new THREE.OctahedronGeometry(0.12 * scale);
  const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, wireframe: true });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  const solid = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.15 }));
  group.add(solid);
  group.position.set(x, y, z);
  scene.add(group);
  return group;
}
const stars3D = [];
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  const r = 3 + Math.random() * 3;
  const col = [0xC8942A, 0xE8B84B, 0x3DBDBD, 0xB8452A][Math.floor(Math.random() * 4)];
  stars3D.push({
    mesh: createStar3D(Math.cos(angle) * r, (Math.random() - 0.5) * 4, Math.sin(angle) * r - 2, 0.5 + Math.random(), col),
    speed: 0.002 + Math.random() * 0.004,
    offset: Math.random() * Math.PI * 2,
    floatAmp: 0.1 + Math.random() * 0.2,
  });
}

// ── SILK ROAD TRAIL (ribbon) ──
const trailPoints = [];
for (let i = 0; i < 200; i++) {
  const t = (i / 200) * Math.PI * 4;
  trailPoints.push(new THREE.Vector3(
    Math.cos(t) * 4 + Math.sin(t * 2) * 1.5,
    Math.sin(t * 0.7) * 2,
    -5 + i * 0.05
  ));
}
const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
const trailMat = new THREE.LineBasicMaterial({ color: 0xC8942A, transparent: true, opacity: 0.12 });
const trail = new THREE.Line(trailGeo, trailMat);
scene.add(trail);

// ── MOUSE INTERACTION ──
let mouse = { x: 0, y: 0 };
const targetRot = { x: 0, y: 0 };
document.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

// ── SCROLL-BASED CAMERA ──
let scrollProgress = 0;
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = window.scrollY / max;
});

// ── RESIZE ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── ANIMATE ──
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.012;

  // Particle animation
  pMat.uniforms.time.value = time;

  // Dome animation
  domeObj.domeMat.uniforms.time.value = time;
  domeObj.group.rotation.y = time * 0.08;
  domeObj.group.position.y = 0.5 + Math.sin(time * 0.4) * 0.08;

  // Wireframe opacity pulse
  domeObj.wire.material.opacity = 0.05 + Math.sin(time * 0.7) * 0.04;

  // Orbit rings
  orbitRings.forEach(r => {
    r.mesh.rotation.y += r.speed;
    r.mesh.rotation.z += r.speed * 0.3;
  });

  // Floating stars
  stars3D.forEach(s => {
    s.mesh.rotation.x += s.speed;
    s.mesh.rotation.y += s.speed * 0.7;
    s.mesh.position.y += Math.sin(time * 0.5 + s.offset) * s.floatAmp * 0.01;
  });

  // Trail pulse
  trailMat.opacity = 0.06 + Math.sin(time * 0.6) * 0.06;

  // Camera mouse parallax
  targetRot.x += (mouse.y * 0.08 - targetRot.x) * 0.05;
  targetRot.y += (mouse.x * 0.08 - targetRot.y) * 0.05;
  scene.rotation.x = targetRot.x;
  scene.rotation.y = targetRot.y;

  // Scroll camera drift
  camera.position.y = -scrollProgress * 2;
  camera.position.z = 5 - scrollProgress * 1.5;

  // Particles slow rotation
  particles.rotation.y = time * 0.015;
  particles.rotation.x = time * 0.008;

  renderer.render(scene, camera);
}
animate();

// ══════════════════════════════════════
// UI INTERACTIONS
// ══════════════════════════════════════

// CURSOR
const cdot = document.getElementById('cdot');
const cring = document.getElementById('cring');
let mx = 0;
let my = 0;
let rx = 0;
let ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
function animCursor() {
  cdot.style.left = `${mx}px`;
  cdot.style.top = `${my}px`;
  rx += (mx - rx) * .1;
  ry += (my - ry) * .1;
  cring.style.left = `${rx}px`;
  cring.style.top = `${ry}px`;
  requestAnimationFrame(animCursor);
}
animCursor();

// NAV scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 60 ? 'rgba(5,3,10,.92)' : 'linear-gradient(to bottom,rgba(5,3,10,.85),transparent)';
});

// REVEAL observer
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
}, { threshold: .12 });
document.querySelectorAll('.reveal,.q-text,.tl-item,.card3d,.stat-b').forEach(el => obs.observe(el));

// COUNT-UP
const cuObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const t = +el.dataset.t;
    const dur = 2000;
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(ease * t).toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    cuObs.unobserve(el);
  });
}, { threshold: .4 });
document.querySelectorAll('.cu').forEach(el => cuObs.observe(el));

// 3D CARD hover tilt
document.querySelectorAll('.card3d').forEach(card => {
  const glow = card.querySelector('.card3d-glow');
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width * 2;
    const dy = (e.clientY - cy) / rect.height * 2;
    card.style.transform = `perspective(800px) rotateY(${dx * 12}deg) rotateX(${-dy * 10}deg) translateZ(8px)`;
    card.style.boxShadow = `${-dx * 20}px ${-dy * 20}px 60px rgba(200,148,42,0.2)`;
    if (glow) {
      glow.style.left = `${e.clientX - rect.left}px`;
      glow.style.top = `${e.clientY - rect.top}px`;
    }
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateZ(0)';
    card.style.boxShadow = 'none';
  });
});

// GLITCH TEXT on hero on load
function glitch(el, final, delay = 800) {
  const chars = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي0123456789✦★◆';
  setTimeout(() => {
    let i = 0;
    const id = setInterval(() => {
      el.textContent = final.split('').map((c, idx) => idx < Math.floor(i / 1.5) ? c : chars[Math.floor(Math.random() * chars.length)]).join('');
      i++;
      if (i > final.length * 2) { clearInterval(id); el.textContent = final; }
    }, 30);
  }, delay);
}
// apply to hero overline after animation
setTimeout(() => {
  const ov = document.querySelector('.hero-overline');
  if (ov) glitch(ov, 'Великий Шёлковый Путь', 0);
}, 1200);
