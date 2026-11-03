/* Darren Labs hero simulation, original code, 2026-11-04.
   An agent mesh: nodes drift, near nodes link, one amber core holds
   the centre. Drag to orbit, scroll shifts the camera. No metrics,
   no invented data: this is a visual, not a claim about any system. */
import * as THREE from 'three';

(function () {
  var canvas = document.getElementById('hero3d');
  if (!canvas) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 640;
  var COUNT = small ? 55 : 95;
  var LINK = 3.4;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0e11, 0.028);
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  var group = new THREE.Group();
  scene.add(group);

  var coreGeo = new THREE.IcosahedronGeometry(1.1, 1);
  var coreMat = new THREE.MeshStandardMaterial({ color: 0xffb224, emissive: 0xffb224, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.4 });
  var core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);
  var coreWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(coreGeo),
    new THREE.LineBasicMaterial({ color: 0xffb224, transparent: true, opacity: 0.35 })
  );
  coreWire.scale.setScalar(1.35);
  group.add(coreWire);
  var light = new THREE.PointLight(0xffb224, 60, 40);
  light.position.set(0, 0, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xd9d6ce, 0.7));

  var nodeGeo = new THREE.SphereGeometry(0.09, 12, 12);
  var nodeMat = new THREE.MeshStandardMaterial({ color: 0xd9d6ce, roughness: 0.5, metalness: 0.2 });
  var nodes = [];
  var pos = new Float32Array(COUNT * 3);
  var vel = [];
  for (var i = 0; i < COUNT; i++) {
    var a = Math.random() * Math.PI * 2;
    var r = 3.5 + Math.random() * 6.5;
    var x = Math.cos(a) * r;
    var y = Math.sin(a) * r * 0.62;
    var z = (Math.random() - 0.5) * 5;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vel.push([(Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.004]);
    var m = new THREE.Mesh(nodeGeo, nodeMat);
    m.position.set(x, y, z);
    group.add(m);
    nodes.push(m);
  }
  var edgeGeo = new THREE.BufferGeometry();
  var edgePos = new Float32Array(COUNT * COUNT * 3);
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
  var edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x8a877e, transparent: true, opacity: 0.28 }));
  group.add(edges);

  var targetRX = 0.15, targetRY = 0;
  var curRX = 0.15, curRY = 0;
  var dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', function (e) {
    if (dragging) {
      targetRY += (e.clientX - lastX) * 0.005;
      targetRX += (e.clientY - lastY) * 0.003;
      targetRX = Math.max(-0.9, Math.min(0.9, targetRX));
      lastX = e.clientX; lastY = e.clientY;
    }
  });
  function endDrag() { dragging = false; }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function frame(t) {
    for (var i = 0; i < COUNT; i++) {
      var p = nodes[i].position;
      p.x += vel[i][0]; p.y += vel[i][1]; p.z += vel[i][2];
      if (Math.abs(p.x) > 11) vel[i][0] *= -1;
      if (Math.abs(p.y) > 7) vel[i][1] *= -1;
      if (Math.abs(p.z) > 3) vel[i][2] *= -1;
    }
    var k = 0;
    for (var a = 0; a < COUNT; a++) {
      for (var b = a + 1; b < COUNT; b++) {
        var dx = nodes[a].position.x - nodes[b].position.x;
        var dy = nodes[a].position.y - nodes[b].position.y;
        var dz = nodes[a].position.z - nodes[b].position.z;
        if (dx * dx + dy * dy + dz * dz < LINK * LINK) {
          edgePos[k++] = nodes[a].position.x; edgePos[k++] = nodes[a].position.y; edgePos[k++] = nodes[a].position.z;
          edgePos[k++] = nodes[b].position.x; edgePos[k++] = nodes[b].position.y; edgePos[k++] = nodes[b].position.z;
        }
      }
    }
    edgeGeo.setDrawRange(0, k / 3);
    edgeGeo.attributes.position.needsUpdate = true;
    curRX += (targetRX - curRX) * 0.05;
    curRY += (targetRY - curRY) * 0.05;
    group.rotation.x = curRX;
    group.rotation.y = curRY + t * 0.00004;
    core.rotation.y = t * 0.0003;
    core.rotation.x = t * 0.0002;
    var scroll = window.scrollY || 0;
    camera.position.z = 15 - Math.min(scroll * 0.004, 3);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  if (reduced) {
    frame(0);
    return;
  }
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  }
  function loop(t) {
    requestAnimationFrame(loop);
    if (visible && !document.hidden) frame(t);
  }
  requestAnimationFrame(loop);
})();
