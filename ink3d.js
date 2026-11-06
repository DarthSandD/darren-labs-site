/* ink3d viewer for Darren Labs. Plain JS for the chips and card always runs.
   The 3D scene loads on top by dynamic import; if Three.js or WebGL is
   unavailable the canvas hides and the chips and card keep working. */
(function () {
  'use strict';

  var PRODUCTS = [
    { name: 'DarrenLabs AI Models', hook: '7B and 32B, free to download and run.', facts: '7B 169 tokens per second, 32B 54.', link: 'models.html', linkText: 'Open the models page' },
    { name: 'Styx', hook: 'A desktop agent that lives on your machine. Bring your own provider key.', facts: 'v0.1.0, Linux only, free, MIT.', link: 'styx.html', linkText: 'Open the Styx page' },
    { name: 'VoltWorks Power', hook: 'Power engineering in the browser. Every calculator shows its working.', facts: 'IEC 60364 and 60909, IEEE 1584-2018, NFPA 70E', link: 'https://voltworks-power.pages.dev/', linkText: 'Open VoltWorks Power' },
    { name: 'MEP Suits', hook: 'Eight calculators and one 3D viewer for plant-room work.', facts: 'Prepared for licensed engineer verification before construction.', link: 'https://mepsuits.pages.dev/', linkText: 'Open MEP Suits' },
    { name: 'AI Architecture Patterns', hook: 'Patterns for AI systems, with the trade-offs and the limits.', facts: 'Public GitHub repository, diagrams and runnable demos.', link: 'https://github.com/DarthSandD/ai-architecture-patterns', linkText: 'Open the patterns repository' }
  ];

  var section = document.getElementById('ink3d');
  if (!section) return;
  var canvas = document.getElementById('ink3d-canvas');
  var card = document.getElementById('ink3d-card');
  var chips = Array.prototype.slice.call(section.querySelectorAll('.ink3d-chip'));
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduced = false; }

  var current = 0;
  var cardTimer = null;
  var onFocusChange = null; /* set by the 3D layer when it loads */

  function updateCard(i) {
    var p = PRODUCTS[i];
    var apply = function () {
      document.getElementById('ink3d-card-num').textContent = String(i + 1);
      document.getElementById('ink3d-card-title').textContent = p.name;
      document.getElementById('ink3d-card-hook').textContent = p.hook;
      document.getElementById('ink3d-card-facts').textContent = p.facts;
      var a = document.getElementById('ink3d-card-link');
      a.textContent = p.linkText;
      a.setAttribute('href', p.link);
      card.classList.remove('is-changing');
    };
    if (cardTimer) { clearTimeout(cardTimer); cardTimer = null; }
    if (reduced) { apply(); return; }
    card.classList.add('is-changing');
    cardTimer = setTimeout(apply, 150);
  }

  function focus(i, fromUser) {
    var next = Math.max(0, Math.min(PRODUCTS.length - 1, i));
    var changed = next !== current;
    current = next;
    chips.forEach(function (chip, k) {
      var active = k === current;
      chip.classList.toggle('is-active', active);
      if (active) { chip.setAttribute('aria-current', 'true'); } else { chip.removeAttribute('aria-current'); }
    });
    if (changed || fromUser) updateCard(current);
    if (onFocusChange) onFocusChange(current);
  }

  /* Scroll guard: a tap on a chip must never move the page. The chip is
     already under the cursor, so no scroll is needed to see it, yet the
     browser still scrolls on activation (focus scroll, and automation
     scroll-into-view), which is the trigger that blanks the canvas in a
     real browser. mousedown preventDefault stops the focus scroll for a
     mouse, but a touch tap or a programmatic click can still scroll, so
     record the scroll position on pointerdown and restore it instantly on
     click and for 600ms after, with smooth scrolling suspended while the
     guard is armed so no smooth animation can fight the restore. */
  var scrollGuardY = null, scrollGuardUntil = 0, scrollGuardTimer = null;
  function armScrollGuard() {
    scrollGuardY = window.scrollY;
    scrollGuardUntil = Date.now() + 600;
    document.documentElement.style.scrollBehavior = 'auto';
    if (scrollGuardTimer) { clearTimeout(scrollGuardTimer); }
    scrollGuardTimer = setTimeout(function () {
      scrollGuardTimer = null; scrollGuardY = null;
      document.documentElement.style.scrollBehavior = '';
    }, 600);
  }
  function restoreScrollIfNeeded() {
    if (scrollGuardY === null || Date.now() > scrollGuardUntil) return;
    if (Math.abs(window.scrollY - scrollGuardY) > 2) {
      window.scrollTo({ top: scrollGuardY, behavior: 'instant' });
    }
  }
  window.addEventListener('scroll', function () { restoreScrollIfNeeded(); }, { passive: true });

  chips.forEach(function (chip, k) {
    /* A mouse click must never focus the chip: focusing a below-fold chip
       makes the browser smooth-scroll the page while the station
       transition runs, and in a real browser that leaves the canvas stuck
       showing the world compressed into a strip. The chip is already under
       the cursor, so it needs no scroll. Keyboard use is unaffected: Tab
       still focuses chips and Enter/Space still activate them. */
    chip.addEventListener('mousedown', function (e) { e.preventDefault(); armScrollGuard(); });
    chip.addEventListener('pointerdown', function () { armScrollGuard(); });
    chip.addEventListener('click', function () { focus(k, true); restoreScrollIfNeeded(); });
  });
  canvas.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); focus(current + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(current - 1, true); }
    else if (e.key === 'Home') { e.preventDefault(); focus(0, true); }
    else if (e.key === 'End') { e.preventDefault(); focus(PRODUCTS.length - 1, true); }
  });

  /* Spring integrator lives in boot3d (one spring per camera value). */

  window.__ink3d = {
    focus: function (i) { focus(i, true); },
    getState: function () { return { index: current, webgl: false }; }
  };

  if (typeof window.WebGLRenderingContext === 'undefined') { fallback(); return; }
  import('./vendor/three.module.min.js').then(boot3d).catch(fallback);

  function fallback() {
    section.classList.add('ink3d-no-webgl');
    if (window.__ink3d) window.__ink3d.getState = function () { return { index: current, webgl: false }; };
  }

  function boot3d(THREE) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    } catch (err) { fallback(); return; }
    if (!renderer.getContext()) { fallback(); return; }

    var PAPER = 0xF5F1E6, PAPER2 = 0xEDE7D8, INK = 0x1B1A17, INK2 = 0x4A463F, SEAL = 0xC23B22;
    renderer.setClearColor(PAPER, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(PAPER, 34, 78);
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    /* Temporary diagnostic counters (removed after the scroll-click cause is found). */
    var frameCount = 0, resizeCount = 0, reassertCount = 0;
    scene.add(new THREE.HemisphereLight(0xFBF8F0, INK2, 1.0));
    var key = new THREE.DirectionalLight(0xFBF8F0, 0.9);
    key.position.set(8, 14, 10);
    scene.add(key);

    function flat(color, opacity) {
      return new THREE.MeshBasicMaterial({ color: color, transparent: opacity < 1, opacity: opacity });
    }
    function ridge(peaks, base, color, opacity, z) {
      var shape = new THREE.Shape();
      shape.moveTo(-34, base);
      peaks.forEach(function (p) { shape.lineTo(p[0], base + p[1]); });
      shape.lineTo(34, base);
      shape.lineTo(34, base - 6);
      shape.lineTo(-34, base - 6);
      shape.closePath();
      var mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), flat(color, opacity));
      mesh.position.z = z;
      scene.add(mesh);
      return mesh;
    }
    /* Layered ink washes, far to near. Deterministic peaks, no randomness. */
    ridge([[-28, 6.5], [-18, 9], [-8, 6], [2, 8.5], [12, 5.5], [22, 8], [30, 6]], -1, INK, 0.08, -16);
    ridge([[-30, 5], [-20, 7.5], [-10, 4.5], [0, 7], [10, 5], [20, 6.5], [30, 4.5]], -1.3, INK, 0.14, -11);
    ridge([[-30, 3.5], [-18, 5.5], [-6, 3], [6, 5], [18, 3.5], [28, 5]], -1.6, INK, 0.22, -6);
    ridge([[-32, 1.6], [-20, 2.4], [-8, 1.2], [4, 2.2], [16, 1.4], [28, 2]], -2.2, INK, 0.35, 2.5);
    /* Two more layers: a very far faint wash and a mid wash, so the
       mountains read as depth, not four flat bands. */
    ridge([[-30, 8], [-20, 11], [-10, 7.5], [0, 10], [10, 7], [20, 9.5], [30, 8]], -0.6, INK, 0.05, -21);
    ridge([[-28, 4], [-16, 6], [-4, 3.5], [8, 5.5], [20, 4], [28, 5]], -1.5, INK, 0.11, -13);

    var ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), flat(PAPER2, 1));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -2.3, -6);
    scene.add(ground);

    /* Ground detail: the ground was a flat featureless cream rectangle, so
       any low framing read as blank cream. A soft darker wash near the
       horizon, low foreground hills, and ink brush strokes lying on the
       ground keep the lower frame reading as painting, never as empty. */
    var groundWash = new THREE.Mesh(new THREE.PlaneGeometry(160, 10), flat(0xE4DCCB, 1));
    groundWash.rotation.x = -Math.PI / 2;
    groundWash.position.set(0, -2.27, -18);
    scene.add(groundWash);
    ridge([[-30, 0.8], [-18, 1.4], [-6, 0.7], [6, 1.2], [18, 0.8], [28, 1.1]], -2.2, INK, 0.25, 8);
    ridge([[-28, 0.6], [-14, 1.0], [0, 0.6], [14, 0.9], [26, 0.6]], -2.2, INK, 0.35, 14);
    function groundStroke(x, z, len, wid, angle, opacity) {
      var c = Math.cos(angle), s = Math.sin(angle);
      var hx = c * len / 2, hy = s * len / 2;
      var wx = -s * wid / 2, wy = c * wid / 2;
      var shape = new THREE.Shape();
      shape.moveTo(-hx - wx, -hy - wy);
      shape.lineTo(hx - wx, hy - wy);
      shape.lineTo(hx + wx, hy + wy);
      shape.lineTo(-hx + wx, -hy + wy);
      shape.closePath();
      var m = new THREE.Mesh(new THREE.ShapeGeometry(shape), flat(INK, opacity));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, -2.24, z);
      scene.add(m);
      return m;
    }
    groundStroke(-12, 4, 18, 0.5, 0.12, 0.10);
    groundStroke(10, 8, 22, 0.4, -0.08, 0.08);
    groundStroke(0, 12, 14, 0.6, 0.05, 0.10);
    groundStroke(-24, -2, 12, 0.4, 0.2, 0.07);

    /* Vermillion sun, upper left, moved central and higher so every
       focused view holds the full disc. Breathes gently unless reduced motion. */
    var sun = new THREE.Mesh(new THREE.CircleGeometry(5.5, 48), flat(SEAL, 1));
    sun.position.set(-13, 5.0, -18);
    scene.add(sun);

    /* Cliff and pagoda, moved central with the sun so the pagoda stays
       in frame at every station instead of falling off the left edge.
       The pagoda is a solid object now, not a flat wash: four tiers with
       eave slabs, a stone base and a spire with an orb, in a standard
       material so the light gives each face a slightly different ink. */
    var cliff = ridge([[-2, 0], [1, 7.5], [4, 8.5], [7, 7], [9, 0]], -2.2, INK, 0.85, -8);
    cliff.position.x = -20;
    var pagoda = new THREE.Group();
    var inkMat = flat(INK, 1);
    var inkStd = new THREE.MeshStandardMaterial({ color: INK, roughness: 1, metalness: 0 });
    function box(w, h, d, y) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), inkStd);
      m.position.y = y;
      pagoda.add(m);
      return m;
    }
    function roof(r, y) {
      var m = new THREE.Mesh(new THREE.ConeGeometry(r, 0.9, 4), inkStd);
      m.rotation.y = Math.PI / 4;
      m.position.y = y;
      pagoda.add(m);
      return m;
    }
    function eave(w, y) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, w), inkStd);
      m.position.y = y;
      pagoda.add(m);
      return m;
    }
    box(3.6, 0.35, 3.6, 0.17);
    box(2.2, 1.0, 2.2, 1.0);
    eave(2.9, 1.6);
    roof(2.1, 2.05);
    box(1.7, 0.9, 1.7, 2.7);
    eave(2.3, 3.25);
    roof(1.7, 3.65);
    box(1.3, 0.8, 1.3, 4.3);
    eave(1.8, 4.75);
    roof(1.35, 5.05);
    box(0.9, 0.6, 0.9, 5.55);
    roof(1.0, 6.0);
    var spire = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 8), inkStd);
    spire.position.y = 6.55;
    pagoda.add(spire);
    var orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), inkStd);
    orb.position.y = 7.15;
    pagoda.add(orb);
    pagoda.position.set(-19.5, 5.6, -8);
    scene.add(pagoda);

    /* Pine silhouettes, layered foliage: five cones per pine so the
       canopy reads as stacked branches, in the same shaded ink as the
       pagoda. A few more pines at varied depths, one low in the
       foreground right. */
    function pine(x, z, s) {
      var g = new THREE.Group();
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.1, 6), inkStd);
      trunk.position.y = 0.55;
      g.add(trunk);
      [[0.95, 1.35, 0.9], [0.8, 2.0, 1.4], [0.62, 2.6, 1.9], [0.45, 3.1, 2.35], [0.28, 3.5, 2.75]].forEach(function (c) {
        var cone = new THREE.Mesh(new THREE.ConeGeometry(c[0], 1.3, 7), inkStd);
        cone.position.y = c[2];
        g.add(cone);
      });
      g.position.set(x, -2.2, z);
      g.scale.setScalar(s);
      scene.add(g);
      return g;
    }
    pine(-26, -4, 1.6); pine(-22, -6, 1.2); pine(-29, -7, 1.0);
    pine(28, -4, 1.5); pine(27, -6, 1.1);
    pine(-13, -3, 0.9); pine(13.5, -3.2, 0.85);
    pine(-31, -5, 1.3); pine(24, -5, 1.3); pine(22, 3, 0.8);

    /* Drifting mist planes, paper coloured, slow. Six planes at varied
       depths and widths, so the mist reads as layers, not one sheet. */
    var mists = [];
    [[0, 1.4, -8, 0, 64], [-6, 2.8, -12, 2, 64], [7, 0.6, -4, 4, 64],
     [-14, 3.6, -14, 1, 56], [12, 2.0, -10, 3, 72], [-2, 4.2, -16, 5, 48]].forEach(function (m, i) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(m[4] || 64, 3.4), new THREE.MeshBasicMaterial({ color: PAPER, transparent: true, opacity: 0.5, depthWrite: false }));
      p.position.set(m[0], m[1], m[2]);
      p.userData.baseX = m[0];
      p.userData.phase = m[3];
      scene.add(p);
      mists.push(p);
    });

    /* Ink birds drifting across the sky: shallow V gulls, slow, wrapping
       around the scene. Frozen under reduced motion, like the mist. */
    var birds = [];
    function bird(x, y, z, speed, scale) {
      var g = new THREE.Group();
      var wingMat = flat(INK, 0.85);
      var wl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.18), wingMat);
      wl.position.x = -0.42;
      wl.rotation.z = 0.35;
      var wr = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.18), wingMat);
      wr.position.x = 0.42;
      wr.rotation.z = -0.35;
      g.add(wl); g.add(wr);
      g.position.set(x, y, z);
      g.scale.setScalar(scale);
      g.userData.speed = speed;
      scene.add(g);
      birds.push(g);
      return g;
    }
    bird(-20, 11, -15, 1.4, 1.0);
    bird(8, 13, -17, 1.1, 0.8);
    bird(18, 12, -14, 1.7, 1.1);

    /* Five stations along the ridge path. */
    var STATIONS = [
      { x: -16, z: -1 }, { x: -8, z: 1.5 }, { x: 0, z: 0 }, { x: 8, z: -1.5 }, { x: 16, z: 1 }
    ];
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x33302B, roughness: 0.9, metalness: 0 });
    var monoliths = [];
    var labelMats = [];
    /* Station label: solid paper plaque with an ink border, so the
       number and name read against sun and mountains at any angle.
       The plaque hugs the wider line, so a short name gets a narrow
       plaque: far labels stop colliding and none hangs past the frame.
       The focused station gets a vermillion border and number. */
    function labelTexture(i, active) {
      var c = document.createElement('canvas');
      c.width = 640; c.height = 320;
      var g = c.getContext('2d');
      g.clearRect(0, 0, 640, 320);
      g.textAlign = 'center';
      g.font = '700 150px system-ui, sans-serif';
      var numW = g.measureText(String(i + 1)).width;
      var name = PRODUCTS[i].name;
      var size = 54;
      g.font = '600 ' + size + 'px system-ui, sans-serif';
      while (g.measureText(name).width > 560 && size > 32) {
        size -= 2;
        g.font = '600 ' + size + 'px system-ui, sans-serif';
      }
      var nameW = g.measureText(name).width;
      var pw = Math.min(616, Math.max(numW, nameW) + 72);
      var px = (640 - pw) / 2;
      g.beginPath();
      if (g.roundRect) { g.roundRect(px, 12, pw, 296, 18); } else { g.rect(px, 12, pw, 296); }
      g.fillStyle = '#F5F1E6';
      g.fill();
      g.lineWidth = active ? 7 : 4;
      g.strokeStyle = active ? '#C23B22' : '#1B1A17';
      g.stroke();
      g.fillStyle = active ? '#C23B22' : '#1B1A17';
      g.font = '700 150px system-ui, sans-serif';
      g.fillText(String(i + 1), 320, 168);
      g.font = '600 ' + size + 'px system-ui, sans-serif';
      g.fillText(name, 320, 262);
      var tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 4;
      return tex;
    }
    STATIONS.forEach(function (s, i) {
      var mono = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.6, 1.1), stoneMat);
      mono.position.set(s.x, 1.8, s.z);
      mono.userData.index = i;
      scene.add(mono);
      monoliths.push(mono);
      var tex = labelTexture(i, i === 0);
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      var sprite = new THREE.Sprite(mat);
      sprite.scale.set(4.6, 2.3, 1);
      sprite.position.set(s.x, 5.9, s.z);
      sprite.userData.index = i;
      scene.add(sprite);
      /* Station 1 starts focused, so its first texture is the active one;
         its plain texture is a separate draw, or it would stay vermillion
         after another station takes focus. */
      labelMats.push({ mat: mat, plain: i === 0 ? labelTexture(0, false) : tex, active: null });
    });
    /* Vermillion cap marks the focused station. */
    var cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 1.3), flat(SEAL, 1));
    cap.position.set(STATIONS[0].x, 3.74, STATIONS[0].z);
    scene.add(cap);

    /* Camera orbit state, one spring per value (ios-touch Rule 2).
       The camera sits closer (radius 22) and aims at the painting's
       vertical middle (ty 6.0) through a narrower field of view (42),
       so the ink world fills the canvas instead of leaving a blank
       cream band across the bottom. phi 1.28 still aims up so the sun
       disc and the pagoda roofs stay in frame at every station instead
       of sliding out of the top edge. */
    function spring(value) {
      return { x: value, v: 0, target: value,
        step: function (dt) {
          dt = Math.min(dt, 1 / 30);
          var a = (-170 * (this.x - this.target) - 26 * this.v);
          this.v += a * dt;
          this.x += this.v * dt;
          if (Math.abs(this.x - this.target) < 0.001 && Math.abs(this.v) < 0.001) { this.x = this.target; this.v = 0; return true; }
          return false;
        } };
    }
    var theta = spring(0), phi = spring(1.28), radius = spring(22);
    var tx = spring(STATIONS[0].x), ty = spring(6.0), tz = spring(STATIONS[0].z);
    var THETA_MIN = -1.1, THETA_MAX = 1.1, PHI_MIN = 0.95, PHI_MAX = 1.35;
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    /* Rubber-band, ios-touch Rule 4: progressive resistance with a ceiling. */
    function rubberband(overshoot, dimension, constant) {
      constant = constant || 0.55;
      return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
    }
    function displayAngle(value, lo, hi) {
      if (value > hi) return hi + rubberband(value - hi, hi - lo, 0.55);
      if (value < lo) return lo + rubberband(value - lo, hi - lo, 0.55);
      return value;
    }
    function snapAll() {
      [theta, phi, radius, tx, ty, tz].forEach(function (s) { s.x = s.target; s.v = 0; });
    }
    function applyCamera() {
      var th = displayAngle(theta.x, THETA_MIN, THETA_MAX);
      var ph = displayAngle(phi.x, PHI_MIN, PHI_MAX);
      var sp = Math.sin(ph), cp = Math.cos(ph);
      camera.position.set(
        tx.x + radius.x * sp * Math.sin(th),
        ty.x + radius.x * cp,
        tz.x + radius.x * sp * Math.cos(th));
      camera.lookAt(tx.x, ty.x, tz.x);
    }
    function resize() {
      resizeCount++;
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) { new ResizeObserver(resize).observe(canvas); }
    window.addEventListener('resize', resize);
    resize();

    /* Self-heal: if a render ever lands in a bad state (for example a
       resize mid-scroll), re-asserting the size, camera and render
       recovers it without user action. Runs after every focus change and
       when page scrolling settles. */
    var reassertTimer = null;
    function reassert() {
      reassertCount++;
      resize();
      applyCamera();
      renderer.render(scene, camera);
    }
    function scheduleReassert(ms) {
      if (reassertTimer) { clearTimeout(reassertTimer); }
      reassertTimer = setTimeout(function () { reassertTimer = null; reassert(); }, ms);
    }
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) { clearTimeout(scrollTimer); }
      scrollTimer = setTimeout(function () { scrollTimer = null; reassert(); }, 300);
    }, { passive: true });
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', function () { reassert(); forceRepaint(); });
    }

    /* Force the compositor to re-present the canvas layer. The live
       diagnostic proved the failure is not in the render: while the canvas
       shows blank cream, the loop still runs, the camera values are exactly
       correct, and the buffer is the right size. The browser is showing a
       stale blank layer instead of the buffer. Re-rendering alone does not
       fix it. A 1px CSS height change, a forced reflow, then restoring the
       rule rebuilds the layer and makes the browser present the current
       buffer. Runs after every focus change and when scrolling settles. */
    var repaintCount = 0;
    function forceRepaint() {
      repaintCount++;
      var h = canvas.clientHeight || 1;
      canvas.style.height = (h + 1) + 'px';
      void canvas.offsetHeight;
      canvas.style.height = '';
      /* If the canvas top is scrolled above the viewport, the browser
         leaves the canvas blank even after a rebuild. Put the whole canvas
         back in view (top 88px, just below the nav) and tell the scroll
         guard to protect the new position instead of the old one. */
      var top = canvas.getBoundingClientRect().top;
      if (top < 0) {
        window.scrollTo({ top: window.scrollY + top - 88, behavior: 'instant' });
        scrollGuardY = window.scrollY;
      }
      resize();
      applyCamera();
      renderer.render(scene, camera);
    }

    function setActiveLabel(i) {
      labelMats.forEach(function (lm, k) {
        var active = k === i;
        if (!lm.active) lm.active = labelTexture(k, true);
        lm.mat.map = active ? lm.active : lm.plain;
        lm.mat.needsUpdate = true;
      });
    }

    /* Focus framing: the target pulls toward the painting centre for the
       right-hand stations and the camera swings to look back left, so the
       full sun disc and the pagoda stay in frame at stations 1 to 5.
       Left stations keep their target: the painting already sits there.
       The target height (6.0) and radius (22) hold the ink world full
       frame after every focus, with no blank cream band at the bottom.
       On narrow screens the horizontal field is small, so the pull and
       the swing are gentler: otherwise the focused station's own label
       is pushed past the frame edge. */
    onFocusChange = function (i) {
      var s = STATIONS[i];
      var aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      var narrow = aspect < 1.2;
      var pull = narrow ? 0.85 : 0.55;
      var thetaCap = narrow ? 0.22 : 0.38;
      tx.target = s.x > 0 ? s.x * pull : s.x;
      ty.target = 6.0; tz.target = s.z;
      theta.target = Math.max(0, Math.min(thetaCap, s.x * 0.03));
      phi.target = 1.28; radius.target = 22;
      setActiveLabel(i);
      if (reduced) snapAll();
      applyCamera();
      renderer.render(scene, camera);
      scheduleReassert(700);
      forceRepaint();
    };

    /* Drag: pointer events, 1:1 tracking, velocity handoff, tap to select. */
    var dragging = false, moved = 0, downAt = 0, lastWheel = 0;
    var samples = [];
    var raycaster = new THREE.Raycaster();
    var pointerNDC = new THREE.Vector2();
    function pick(cx, cy) {
      var r = canvas.getBoundingClientRect();
      pointerNDC.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointerNDC, camera);
      var hits = raycaster.intersectObjects(monoliths.concat(scene.children.filter(function (o) { return o.isSprite; })));
      return hits.length ? hits[0].object.userData.index : -1;
    }
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; moved = 0; downAt = Date.now();
      samples = [{ t: Date.now(), th: theta.x, ph: phi.x }];
      canvas.setPointerCapture(e.pointerId);
      theta.v = 0; phi.v = 0;
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var last = samples[samples.length - 1];
      var dx = e.movementX || 0, dy = e.movementY || 0;
      if (!e.movementX && last && last.x !== undefined) { dx = e.clientX - last.x; dy = e.clientY - last.y; }
      moved += Math.abs(dx) + Math.abs(dy);
      theta.x -= dx * 0.0045;
      phi.x += dy * 0.003;
      theta.target = theta.x; phi.target = phi.x;
      samples.push({ t: Date.now(), th: theta.x, ph: phi.x, x: e.clientX, y: e.clientY });
      if (samples.length > 6) samples.shift();
      applyCamera();
      renderer.render(scene, camera);
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      var now = Date.now();
      var recent = samples.filter(function (s) { return now - s.t <= 120; });
      if (recent.length >= 2) {
        var a = recent[0], b = recent[recent.length - 1];
        var dt = Math.max(1, b.t - a.t) / 1000;
        var vTh = (b.th - a.th) / dt, vPh = (b.ph - a.ph) / dt;
        vTh = clamp(vTh, -6, 6); vPh = clamp(vPh, -6, 6);
        /* Apple projection: rest = current + (v / 1000) * d / (1 - d), d 0.998. */
        var projTh = clamp(theta.x + (vTh / 1000) * 0.998 / 0.002, THETA_MIN, THETA_MAX);
        var projPh = clamp(phi.x + (vPh / 1000) * 0.998 / 0.002, PHI_MIN, PHI_MAX);
        theta.target = projTh; theta.v = vTh;
        phi.target = projPh; phi.v = vPh;
      } else {
        theta.target = clamp(theta.x, THETA_MIN, THETA_MAX);
        phi.target = clamp(phi.x, PHI_MIN, PHI_MAX);
      }
      if (moved < 8 && now - downAt < 500) {
        var hit = pick(e.clientX, e.clientY);
        if (hit >= 0) focus(hit, true);
      }
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var now = Date.now();
      if (now - lastWheel < 450) return;
      lastWheel = now;
      focus(current + (e.deltaY > 0 ? 1 : -1), true);
    }, { passive: false });

    var clock = new THREE.Clock();
    var capX = STATIONS[0].x, capZ = STATIONS[0].z;
    function loop() {
      requestAnimationFrame(loop);
      frameCount++;
      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;
      [theta, phi, radius, tx, ty, tz].forEach(function (s) { s.step(dt); });
      if (!reduced) {
        var s = 1 + 0.018 * Math.sin(t * 0.4);
        sun.scale.set(s, s, 1);
        mists.forEach(function (m) { m.position.x = m.userData.baseX + Math.sin(t * 0.05 + m.userData.phase) * 2.5; });
        birds.forEach(function (b) {
          b.position.x += b.userData.speed * dt;
          if (b.position.x > 34) { b.position.x = -34; }
        });
      }
      var targetCapX = STATIONS[current].x, targetCapZ = STATIONS[current].z;
      capX += (targetCapX - capX) * Math.min(1, dt * 6);
      capZ += (targetCapZ - capZ) * Math.min(1, dt * 6);
      cap.position.set(capX, 3.74, capZ);
      applyCamera();
      renderer.render(scene, camera);
    }
    /* Temporary diagnostic readout (removed after the scroll-click cause is
       found). Writes the live viewer state into a small visible line under
       the canvas, so a real browser check can read the exact numbers the
       local harness cannot see: canvas rect, client size, buffer size,
       device pixel ratio, camera values and targets, aspect, scroll, and
       how many frames, resizes and re-asserts have run. */
    var dbg = document.createElement('pre');
    dbg.id = 'ink3d-debug';
    dbg.setAttribute('aria-label', 'Viewer diagnostic, temporary');
    dbg.style.cssText = 'font:11px/1.5 monospace;color:#8a8378;background:#f5f1e6;border:1px solid #d8d2c4;padding:8px 10px;margin:12px 0 0;white-space:pre-wrap;word-break:break-word;';
    dbg.textContent = 'viewer diagnostic loading...';
    canvas.parentNode.insertBefore(dbg, canvas.nextSibling);
    function dumpState(tag) {
      var r = canvas.getBoundingClientRect();
      dbg.textContent = 'ink3d [' + tag + '] frames=' + frameCount + ' resizes=' + resizeCount + ' reasserts=' + reassertCount + ' repaints=' + repaintCount +
        ' scrollY=' + Math.round(window.scrollY) +
        ' rect=' + Math.round(r.width) + 'x' + Math.round(r.height) + '@top' + Math.round(r.top) +
        ' client=' + canvas.clientWidth + 'x' + canvas.clientHeight +
        ' buf=' + canvas.width + 'x' + canvas.height +
        ' dpr=' + (window.devicePixelRatio || 1) +
        ' cam tx=' + tx.x.toFixed(2) + '/' + tx.target + ' ty=' + ty.x.toFixed(2) + '/' + ty.target + ' tz=' + tz.x.toFixed(2) + '/' + tz.target +
        ' th=' + theta.x.toFixed(3) + '/' + theta.target + ' ph=' + phi.x.toFixed(3) + '/' + phi.target + ' r=' + radius.x.toFixed(2) + '/' + radius.target +
        ' aspect=' + camera.aspect.toFixed(3) + ' fov=' + camera.fov +
        ' station=' + current + ' reduced=' + reduced;
    }
    setInterval(function () { dumpState('tick'); }, 500);
    dumpState('boot');

    applyCamera();
    renderer.render(scene, camera);
    loop();

    window.__ink3d.getState = function () {
      return { index: current, theta: theta.x, phi: phi.x, radius: radius.x, webgl: true };
    };
  }
})();
