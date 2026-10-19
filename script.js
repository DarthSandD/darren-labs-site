(function () {
  'use strict';

  /* ---------- Nav (existing) ---------- */
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Menu';
      });
    });
  }

  /* ---------- Interactive 3D: 3 contained canvases, lazy, with 2D fallback ---------- */
  var REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { REDUCED = false; }

  var VIZ = {
    hero3d: { kind: 'hero', labelId: 'hero3d-label', auto: !REDUCED },
    volt3d: { kind: 'volt', labelId: 'volt3d-label', auto: !REDUCED },
    patterns3d: { kind: 'patterns', labelId: 'patterns3d-label', auto: !REDUCED }
  };
  window.__dl3d = { canvases: Object.keys(VIZ), status: {}, fallback: {} };

  function setLabel(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function fitCanvas(canvas) {
    var w = canvas.clientWidth || canvas.width || 520;
    var h = canvas.getAttribute('height') ? parseInt(canvas.getAttribute('height'), 10) : 300;
    // Keep aspect from attribute when CSS width is responsive
    var aspect = (canvas.width || 520) / (canvas.height || 300);
    h = Math.round(w / aspect);
    if (h < 220) h = 220;
    if (h > 360) h = 360;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return { w: w, h: h, dpr: dpr };
  }

  /* ---- 2D fallback: same diagram language, no WebGL ---- */
  function drawFallback2D(canvas, kind) {
    try {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      var size = fitCanvas(canvas);
      var dpr = size.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var W = size.w, H = size.h;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#eef2ef';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#0f6a5e';
      ctx.fillStyle = '#1a1e23';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      function node(x, y, r, label, fill) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = '#1a1e23'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#1a1e23'; ctx.fillText(label, x, y + r + 16);
      }
      function line(x1, y1, x2, y2) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#0f6a5e'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (kind === 'hero') {
        var cx = W / 2, cy = H / 2 - 8;
        line(cx, cy, cx - 110, cy - 45); line(cx, cy, cx + 110, cy - 45);
        line(cx, cy, cx - 90, cy + 60); line(cx, cy, cx + 90, cy + 60);
        node(cx, cy, 26, 'Darren Labs', '#1a1e23');
        ctx.fillStyle = '#faf7f1'; ctx.font = '700 9px system-ui, sans-serif'; ctx.fillText('DL', cx, cy + 3); ctx.font = '600 13px system-ui, sans-serif';
        node(cx - 110, cy - 45, 16, 'VoltWorks', '#0f6a5e');
        node(cx + 110, cy - 45, 16, 'Patterns', '#0f6a5e');
        node(cx - 90, cy + 60, 11, 'Agents', '#faf7f1');
        node(cx + 90, cy + 60, 11, 'Verify', '#faf7f1');
      } else if (kind === 'volt') {
        ctx.fillStyle = '#d9d2c0'; ctx.fillRect(0, H - 42, W, 42);
        node(W * 0.18, H - 90, 14, 'Pylon', '#faf7f1');
        node(W * 0.48, H - 70, 22, 'Transformer', '#0f6a5e');
        node(W * 0.76, H - 80, 16, 'Switchgear', '#1a1e23');
        line(W * 0.18, H - 90, W * 0.48, H - 70); line(W * 0.48, H - 70, W * 0.76, H - 80);
      } else {
        var pts = [
          [W * 0.18, H * 0.5, 'Brief'],
          [W * 0.40, H * 0.28, 'Generate'],
          [W * 0.62, H * 0.5, 'Verify'],
          [W * 0.82, H * 0.72, 'Fix']
        ];
        for (var i = 0; i < pts.length; i++) {
          var a = pts[i], b = pts[(i + 1) % pts.length];
          line(a[0], a[1], b[0], b[1]);
        }
        pts.forEach(function (p) { node(p[0], p[1], 16, p[2], i === 0 ? '#faf7f1' : '#0f6a5e'); });
      }
      window.__dl3d.fallback[canvas.id] = true;
    } catch (e) { /* fallback must never break site */ }
  }

  /* ---- Load Three.js with CDN fallback ---- */
  var threePromise = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threePromise) return threePromise;
    threePromise = new Promise(function (resolve, reject) {
      var urls = [
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'
      ];
      function tryUrl(i) {
        if (i >= urls.length) { reject(new Error('Three.js failed')); return; }
        var s = document.createElement('script');
        s.src = urls[i];
        s.async = true;
        s.onload = function () {
          if (window.THREE) resolve(window.THREE);
          else tryUrl(i + 1);
        };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        // 8s timeout per CDN
        setTimeout(function () {
          if (!window.THREE && s.parentNode) { s.remove(); tryUrl(i + 1); }
        }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return threePromise;
  }

  /* ---- Scene builders (data only, no invented facts) ---- */
  function buildScene(THREE, kind) {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeef2ef);
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.6, 5.2);
    camera.lookAt(0, 0, 0);
    var amb = new THREE.AmbientLight(0xffffff, 0.85); scene.add(amb);
    var dir = new THREE.DirectionalLight(0xffffff, 0.7); dir.position.set(3, 5, 4); scene.add(dir);
    var group = new THREE.Group(); scene.add(group);
    var pickables = [];
    function mat(hex) { return new THREE.MeshLambertMaterial({ color: hex }); }
    function sphere(x, y, z, r, hex, label) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat(hex));
      m.position.set(x, y, z); m.userData.label = label; group.add(m); pickables.push(m); return m;
    }
    function box(w, h, d, x, y, z, hex, label) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(hex));
      m.position.set(x, y, z); m.userData.label = label; group.add(m); pickables.push(m); return m;
    }
    function line(a, b, hex) {
      var g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2])]);
      var l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: hex || 0x0f6a5e }));
      group.add(l); return l;
    }
    function cyl(rt, rb, h, x, y, z, hex, label) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), mat(hex));
      m.position.set(x, y, z); m.userData.label = label; group.add(m); pickables.push(m); return m;
    }

    var desc = '';
    if (kind === 'hero') {
      sphere(0, 0, 0, 0.55, 0x1a1e23, 'Darren Labs hub — direction + verification.');
      var agents = [[1.7, 0.7, 0.3], [-1.6, 0.9, -0.4], [1.4, -0.9, -0.5], [-1.5, -0.7, 0.6], [0.4, 1.5, -0.8], [-0.3, -1.5, 0.7]];
      agents.forEach(function (p, i) {
        sphere(p[0], p[1], p[2], 0.22, 0xfaf7f1, 'Agent node — builds, then gets checked.');
        line([0, 0, 0], p, 0x9ab8b2);
      });
      sphere(2.3, 0.2, -0.6, 0.38, 0x0f6a5e, 'VoltWorks Power — applied engineering proof.');
      sphere(-2.3, 0.1, 0.5, 0.38, 0x0f6a5e, 'AI Architecture Patterns — architect-thinking proof.');
      line([0, 0, 0], [2.3, 0.2, -0.6], 0x0f6a5e);
      line([0, 0, 0], [-2.3, 0.1, 0.5], 0x0f6a5e);
      desc = 'Studio hub — click a node to see what it is.';
    } else if (kind === 'volt') {
      // Ground
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshLambertMaterial({ color: 0xd9d2c0 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = -1; group.add(ground);
      // Pylon: two legs + crossarm
      cyl(0.06, 0.08, 2.2, -2.2, 0, 0, 0x1a1e23, 'Pylon — carries the overhead line.');
      box(1.1, 0.1, 0.12, -2.2, 0.9, 0, 0x1a1e23, 'Pylon — carries the overhead line.');
      // Transformer + fins
      box(1.1, 0.9, 0.8, -0.3, -0.45, 0, 0x0f6a5e, 'Transformer — steps voltage, drawn to scale.');
      box(0.2, 0.5, 0.85, 0.35, -0.5, 0, 0x0b4f47, 'Transformer — steps voltage, drawn to scale.');
      // Switchgear
      box(1.0, 1.1, 0.6, 1.8, -0.35, 0, 0x1a1e23, 'Switchgear — breaker + protection in one cubicle.');
      // Bus
      line([-2.2, 0.95, 0], [1.8, 0.35, 0], 0x0f6a5e);
      desc = 'VoltWorks preview — simplified substation. Click equipment to inspect it.';
    } else {
      // patterns: 4 nodes in a loop
      var P = [
        [-2.0, 0.5, 0, 'Brief — Darren sets direction, scope, and what good looks like.'],
        [-0.6, -0.9, 0.9, 'Generate — agents build the first version.'],
        [0.8, 0.7, -0.6, 'Verify — checked against explicit criteria.'],
        [2.0, -0.5, 0.2, 'Fix — agents fix, then it is checked again.']
      ];
      P.forEach(function (p, i) {
        sphere(p[0], p[1], p[2], 0.38, i === 0 ? 0x1a1e23 : 0x0f6a5e, p[3]);
      });
      for (var i = 0; i < P.length; i++) {
        var a = P[i], b = P[(i + 1) % P.length];
        line([a[0], a[1], a[2]], [b[0], b[1], b[2]], 0x0f6a5e);
      }
      desc = 'Architecture loop — Brief → Generate → Verify → Fix. Click a step.';
    }
    return { scene: scene, camera: camera, group: group, pickables: pickables, desc: desc };
  }

  function initViz(canvas) {
    var cfg = VIZ[canvas.id];
    if (!cfg || canvas.dataset.init === '1') return;
    canvas.dataset.init = '1';
    window.__dl3d.status[canvas.id] = 'loading';

    // WebGL support check
    var webglOK = true;
    try {
      var test = document.createElement('canvas');
      webglOK = !!(test.getContext('webgl') || test.getContext('experimental-webgl'));
    } catch (e) { webglOK = false; }
    if (!webglOK) {
      drawFallback2D(canvas, cfg.kind);
      setLabel(cfg.labelId, '3D not available here — static diagram shown.');
      window.__dl3d.status[canvas.id] = 'fallback-no-webgl';
      return;
    }

    loadThree().then(function (THREE) {
      try {
        var built = buildScene(THREE, cfg.kind);
        var size = fitCanvas(canvas);
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size.w, size.h, false);
        built.camera.aspect = size.w / size.h;
        built.camera.updateProjectionMatrix();

        var state = { rotX: 0.12, rotY: 0, velX: 0, velY: 0, dragging: false, lastX: 0, lastY: 0, moved: 0, dist: 5.2, pinch: 0 };
        var auto = cfg.auto;
        var btnToggle = document.querySelector('[data-rotate-toggle="' + canvas.id + '"]');
        function syncToggle() {
          if (!btnToggle) return;
          btnToggle.setAttribute('aria-pressed', auto ? 'true' : 'false');
          btnToggle.textContent = auto ? 'Pause rotation' : 'Resume rotation';
        }
        syncToggle();
        if (btnToggle) btnToggle.addEventListener('click', function () { auto = !auto; syncToggle(); });

        var ray = new THREE.Raycaster();
        var pointerNDC = new THREE.Vector2();
        function pick(clientX, clientY) {
          var rect = canvas.getBoundingClientRect();
          pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
          pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
          ray.setFromCamera(pointerNDC, built.camera);
          var hits = ray.intersectObjects(built.pickables, false);
          if (hits.length) setLabel(cfg.labelId, hits[0].object.userData.label || built.desc);
        }
        function onDown(e) {
          state.dragging = true; state.moved = 0;
          state.lastX = e.clientX; state.lastY = e.clientY;
          canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
        }
        function onMove(e) {
          if (!state.dragging) return;
          var dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
          state.lastX = e.clientX; state.lastY = e.clientY;
          state.moved += Math.abs(dx) + Math.abs(dy);
          state.rotY += dx * 0.008; state.rotX += dy * 0.006;
          state.rotX = Math.max(-0.9, Math.min(0.9, state.rotX));
          state.velY = dx * 0.008; state.velX = dy * 0.006;
        }
        function onUp(e) {
          state.dragging = false;
          if (state.moved < 6) pick(e.clientX, e.clientY);
        }
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', function () { state.dragging = false; });
        canvas.addEventListener('wheel', function (e) {
          e.preventDefault();
          state.dist = Math.max(3.2, Math.min(8, state.dist + (e.deltaY > 0 ? 0.3 : -0.3)));
        }, { passive: false });
        // Pinch zoom (two pointers)
        var pointers = new Map();
        canvas.addEventListener('pointerdown', function (e) { pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
        canvas.addEventListener('pointermove', function (e) {
          if (!pointers.has(e.pointerId)) return;
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.size === 2) {
            var vals = Array.from(pointers.values());
            var d = Math.hypot(vals[0].x - vals[1].x, vals[0].y - vals[1].y);
            if (state.pinch && Math.abs(d - state.pinch) > 4) {
              state.dist = Math.max(3.2, Math.min(8, state.dist + (d < state.pinch ? 0.15 : -0.15)));
            }
            state.pinch = d;
          }
        });
        canvas.addEventListener('pointerup', function (e) { pointers.delete(e.pointerId); state.pinch = 0; });
        canvas.addEventListener('pointercancel', function (e) { pointers.delete(e.pointerId); state.pinch = 0; });

        function onResize() {
          var s = fitCanvas(canvas);
          renderer.setSize(s.w, s.h, false);
          built.camera.aspect = s.w / s.h;
          built.camera.updateProjectionMatrix();
        }
        window.addEventListener('resize', onResize);

        var last = performance.now();
        function frame(now) {
          requestAnimationFrame(frame);
          var dt = Math.min(0.05, (now - last) / 1000); last = now;
          if (!state.dragging) {
            if (auto) state.rotY += dt * 0.35;
            else { state.rotY += state.velY * 0.92; state.rotX += state.velX * 0.92; state.velY *= 0.92; state.velX *= 0.92; }
          }
          built.group.rotation.set(state.rotX, state.rotY, 0);
          built.camera.position.set(0, 1.6, state.dist);
          built.camera.lookAt(0, 0, 0);
          renderer.render(built.scene, built.camera);
        }
        requestAnimationFrame(frame);
        window.__dl3d.status[canvas.id] = 'webgl';
        setLabel(cfg.labelId, built.desc);
      } catch (err) {
        drawFallback2D(canvas, cfg.kind);
        setLabel(cfg.labelId, '3D could not start — static diagram shown.');
        window.__dl3d.status[canvas.id] = 'fallback-error';
      }
    }).catch(function () {
      drawFallback2D(canvas, cfg.kind);
      setLabel(cfg.labelId, '3D library could not load — static diagram shown.');
      window.__dl3d.status[canvas.id] = 'fallback-no-cdn';
    });
  }

  function initAll() {
    var canvases = Object.keys(VIZ).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!('IntersectionObserver' in window)) { canvases.forEach(initViz); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { initViz(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '200px' });
    canvases.forEach(function (c) { io.observe(c); });
    // Also init hero promptly (above the fold) if already visible
    setTimeout(function () {
      var hero = document.getElementById('hero3d');
      if (hero && hero.dataset.init !== '1') initViz(hero);
    }, 300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
