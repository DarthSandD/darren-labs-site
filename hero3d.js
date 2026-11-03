// Darren Labs hero 3D, v2. Original scene, built on Three.js 0.170.0.
// One signature object: a chrome agent core (torus knot) with an amber
// glowing heart, agent nodes orbiting it on fixed rings, a dust field,
// and a bloom pass so the amber reads as light, not flat color.
// Drag orbits with a spring (velocity + damping, not linear lerp).
// Scroll dollies the camera back. Reduced motion renders one static frame.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('hero3d');
if (!canvas) throw new Error('hero3d canvas missing');
const hero = canvas.closest('.hero') || document.body;
const small = window.innerWidth < 640;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  canvas.style.display = 'none';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0c0e11, 0.045);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0.4, 9);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(5, 8, 6);
scene.add(key);
const amberPoint = new THREE.PointLight(0xffb224, 30, 14, 2);
scene.add(amberPoint);

// --- The core: chrome torus knot, amber heart, orbit rings ----------------
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.35, 0.42, 260, 36),
  new THREE.MeshPhysicalMaterial({
    color: 0x1a1d22, metalness: 1.0, roughness: 0.18,
    clearcoat: 1.0, clearcoatRoughness: 0.15, envMapIntensity: 1.25,
  })
);
coreGroup.add(knot);

const heart = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffb224 })
);
coreGroup.add(heart);

function ring(radius, tiltX, tiltZ, color, opacity) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.012, 8, 128),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
  );
  m.rotation.x = tiltX;
  m.rotation.z = tiltZ;
  coreGroup.add(m);
  return m;
}
const ringA = ring(2.4, Math.PI / 2.4, 0.3, 0xffb224, 0.55);
const ringB = ring(3.1, Math.PI / 1.8, -0.5, 0x6b7280, 0.35);

// --- Agent nodes: 18 spheres on fixed orbits, not random drift ------------
const agents = [];
const agentGeo = new THREE.SphereGeometry(0.06, 16, 16);
const agentMatAmber = new THREE.MeshBasicMaterial({ color: 0xffb224 });
const agentMatWhite = new THREE.MeshBasicMaterial({ color: 0xe8e6e1 });
for (let i = 0; i < 18; i++) {
  const m = new THREE.Mesh(agentGeo, i % 3 === 0 ? agentMatWhite : agentMatAmber);
  const radius = 2.5 + (i % 3) * 0.45;
  const tilt = new THREE.Euler(
    (i % 5) * 0.35 - 0.7, (i % 4) * 0.4 - 0.6, (i % 3) * 0.5 - 0.5
  );
  agents.push({ m, radius, speed: 0.25 + (i % 5) * 0.07, phase: (i / 18) * Math.PI * 2, tilt });
  coreGroup.add(m);
}

// --- Dust field ------------------------------------------------------------
const dustCount = small ? 450 : 900;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  const r = 5 + Math.random() * 7;
  const t = Math.random() * Math.PI * 2;
  const p = Math.acos(2 * Math.random() - 1);
  dustPos[i * 3] = r * Math.sin(p) * Math.cos(t);
  dustPos[i * 3 + 1] = r * Math.cos(p) * 0.7;
  dustPos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t) - 2;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0x8a8f98, size: 0.045, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
}));
scene.add(dust);

// --- Post: bloom makes the amber heart and agents read as light ------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  small ? 0.45 : 0.55, 0.5, 0.75
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// --- Layout: core right of the text on desktop, centered behind it mobile --
function layout() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  const heroH = hero.getBoundingClientRect().height || h;
  const scale = small ? 0.6 : 1;
  coreGroup.scale.setScalar(scale);
  coreGroup.position.set(small ? 0 : Math.min(2.2, w * 0.0016), small ? -2.2 : 0.2, 0);
  canvas.style.height = heroH + 'px';
}
layout();
window.addEventListener('resize', layout);

// --- Interaction: drag orbit with spring damping, pointer parallax ---------
let targetRY = 0.4, targetRX = 0.15;
let curRY = 0.4, curRX = 0.15, velRY = 0, velRX = 0;
let dragging = false, lastX = 0, lastY = 0;
hero.addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button')) return;
  dragging = true; lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener('pointermove', (e) => {
  if (dragging) {
    targetRY += (e.clientX - lastX) * 0.005;
    targetRX = Math.max(-0.9, Math.min(0.9, targetRX + (e.clientY - lastY) * 0.003));
    lastX = e.clientX; lastY = e.clientY;
  } else {
    targetRY = 0.4 + (e.clientX / window.innerWidth - 0.5) * 0.25;
    targetRX = 0.15 + (e.clientY / window.innerHeight - 0.5) * 0.15;
  }
});
window.addEventListener('pointerup', () => { dragging = false; });

// --- Scroll: dolly back and speed the knot slightly -------------------------
let scrollT = 0;
window.addEventListener('scroll', () => {
  scrollT = Math.min(1, window.scrollY / (window.innerHeight || 1));
}, { passive: true });

// --- Loop -------------------------------------------------------------------
let visible = true, running = true;
const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
io.observe(canvas);
document.addEventListener('visibilitychange', () => { running = !document.hidden; });

const clock = new THREE.Clock();
let elapsed = 0;
function renderFrame() {
  const dt = Math.min(0.05, clock.getDelta());
  elapsed += dt;
  const t = elapsed;

  // Spring: velocity pulls current toward target, damping settles it.
  velRY += (targetRY - curRY) * 0.06;
  velRY *= 0.9; curRY += velRY;
  velRX += (targetRX - curRX) * 0.06;
  velRX *= 0.9; curRX += velRX;
  coreGroup.rotation.y = curRY + t * 0.05;
  coreGroup.rotation.x = curRX;

  knot.rotation.x = t * 0.18 + scrollT * 0.6;
  knot.rotation.y = t * 0.24;
  const pulse = 1 + Math.sin(t * 2.2) * 0.06;
  heart.scale.setScalar(pulse);
  amberPoint.intensity = 30 * pulse;
  ringA.rotation.z = t * 0.12;
  ringB.rotation.z = -t * 0.08;
  for (const a of agents) {
    const ang = a.phase + t * a.speed;
    const v = new THREE.Vector3(Math.cos(ang) * a.radius, Math.sin(ang) * a.radius, 0).applyEuler(a.tilt);
    a.m.position.copy(v);
  }
  dust.rotation.y = t * 0.012;
  camera.position.z = 9 + scrollT * 2.2;
  camera.position.y = 0.4 - scrollT * 0.6;
  camera.lookAt(0, 0.2, 0);

  composer.render();
}

if (reduced) {
  // One static frame, no loop: knot turned to a good angle, agents placed.
  coreGroup.rotation.y = 0.7; coreGroup.rotation.x = 0.25;
  knot.rotation.set(0.5, 0.8, 0);
  for (const a of agents) {
    const v = new THREE.Vector3(Math.cos(a.phase) * a.radius, Math.sin(a.phase) * a.radius, 0).applyEuler(a.tilt);
    a.m.position.copy(v);
  }
  composer.render();
} else {
  (function loop() {
    requestAnimationFrame(loop);
    if (visible && running) renderFrame();
  })();
}
