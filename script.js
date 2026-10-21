(function () {
  'use strict';
  /* Nav */
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
    nav.querySelectorAll('a').forEach(function (l) {
      l.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = 'Menu'; });
    });
  }

  var REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { REDUCED = false; }
  var canvas = document.getElementById('story3d');
  var caption = document.getElementById('story-caption');
  var chapterEls = Array.prototype.slice.call(document.querySelectorAll('.story-chapter'));
  var CAPTION_DEFAULT = 'Three zones: AI Studio \u00B7 VoltWorks Power \u00B7 AI Architecture Patterns. Drag to orbit \u00B7 Scroll builds the scene \u00B7 Select an item for a short description.';
  var INFO = {
    darren: 'Darren: sets direction, scope, and the definition of \u201Cgood\u201D.',
    agent: 'Agent: 3D model (CC0, Quaternius), working at a desk in the AI Studio, building from the brief.',
    voltworks: 'VoltWorks Power: power-system CAD that removes repetitive drafting.',
    patterns: 'AI Architecture Patterns: the node diagram on the board \u2014 components and how they connect.',
    pylon: 'Pylon: lattice transmission tower model (BSD-3-Clause). Carries the overhead line at a safe height.',
    generator: 'Generator: 3D model (CC0, Poly Haven). Power equipment, shown at true scale.',
    transformer: 'Transformer: steps voltage between the overhead line and the switchgear.',
    switchgear: 'Switchgear: breaker and protection. Green = closed, red = open.',
    bus: 'Bus line: the shared conductor everything connects to.',
    breaker: 'Circuit breaker: trips on fault current to protect the transformer and the switchgear downstream.',
    controlpanel: 'Control panel: indicator lamps for the power box and breaker. Amber, green and red show live state.',
    lamp: 'Desk lamp: articulated task lamp on the studio desk (CC0, Poly Haven).',
    scale: 'Scale: figure 1.8 m, bar 1 m. 1 unit = 1 m.',
    brief: '01 Brief: Darren sets direction. Nothing is built without it.',
    generate: '02 Generate: agents build the first working version.',
    verify: '03 Verify: checked against explicit criteria.',
    fix: '04 Fix: correct and re-verify until it meets the acceptance criteria.'
  };

  function fitCanvas() {
    var w = canvas.clientWidth || 640;
    var aspect = 640 / 420;
    var h = Math.round(w / aspect);
    if (h < 240) h = 240;
    if (h > 440) h = 440;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return { w: w, h: h, dpr: dpr };
  }

  /* 2D fallback — the same three zones, drawn flat. Used when WebGL or
     Three.js is unavailable. The active chapter's zone gets the amber frame. */
  function drawFallback(ch) {
    try {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      var s = fitCanvas(), dpr = s.dpr, W = s.w, H = s.h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0B0D10'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#15181C'; ctx.fillRect(0, H - 34, W, 34);
      var zones = [
        { name: 'AI Studio', sub: 'AGENTS AT WORK' },
        { name: 'VoltWorks Power', sub: 'POWER SYSTEMS' },
        { name: 'AI Architecture Patterns', sub: 'SYSTEM DESIGN' }
      ];
      var pad = 14, gap = 12, zw = (W - pad * 2 - gap * 2) / 3, zt = 26, zb = H - 52;
      zones.forEach(function (z, i) {
        var x0 = pad + i * (zw + gap), cx = x0 + zw / 2;
        var active = (ch === 3) || (ch === i);
        ctx.strokeStyle = active ? '#FFB224' : '#39414B'; ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(x0, zt, zw, zb - zt);
        ctx.fillStyle = '#F2EFE9'; ctx.font = '600 13px "Space Grotesk", system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(z.name, cx, zt + 22, zw - 8);
        ctx.fillStyle = '#FFB224'; ctx.font = '700 8.5px ui-monospace, Menlo, monospace';
        ctx.fillText(z.sub, cx, zt + 38, zw - 8);
        ctx.strokeStyle = '#F2EFE9'; ctx.fillStyle = '#F2EFE9'; ctx.lineWidth = 1.5;
        if (i === 0) {
          for (var d = 0; d < 3; d++) {
            var dx = x0 + zw * (0.22 + d * 0.28), dy = zb - 44;
            ctx.strokeRect(dx - 13, dy, 26, 4);
            ctx.beginPath(); ctx.arc(dx, dy - 12, 6, 0, Math.PI * 2); ctx.fillStyle = '#FFB224'; ctx.fill();
          }
        } else if (i === 1) {
          var px = x0 + zw * 0.3, py = zb - 16;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 10, py - 58); ctx.lineTo(px + 20, py); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px - 4, py - 40); ctx.lineTo(px + 24, py - 40); ctx.stroke();
          ctx.fillStyle = '#FFB224'; ctx.fillRect(x0 + zw * 0.55, zb - 34, zw * 0.32, 18);
          ctx.fillStyle = '#0B0D10'; ctx.font = '9px system-ui, sans-serif'; ctx.fillText('Generator', x0 + zw * 0.71, zb - 40);
        } else {
          var nd = [[0.22, 0.62], [0.5, 0.5], [0.78, 0.62], [0.5, 0.82]];
          ctx.strokeStyle = '#FFB224';
          for (var e = 0; e < 3; e++) { ctx.beginPath(); ctx.moveTo(x0 + zw * nd[e][0], zt + (zb - zt) * nd[e][1]); ctx.lineTo(x0 + zw * nd[e + 1][0], zt + (zb - zt) * nd[e + 1][1]); ctx.stroke(); }
          ctx.beginPath(); ctx.moveTo(x0 + zw * 0.5, zt + (zb - zt) * 0.5); ctx.lineTo(x0 + zw * 0.5, zt + (zb - zt) * 0.82); ctx.stroke();
          nd.forEach(function (n) { ctx.beginPath(); ctx.arc(x0 + zw * n[0], zt + (zb - zt) * n[1], 6, 0, Math.PI * 2); ctx.fillStyle = '#FFB224'; ctx.fill(); });
        }
      });
      ctx.fillStyle = '#A8A59C'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(ch === 3 ? 'Verify loop: brief, generate, verify, fix.' : 'Static diagram: the three zones of the studio.', W / 2, H - 14);
      if (caption) caption.textContent = 'Static diagram shown.';
    } catch (e) { /* fallback must never break site */ }
  }

  var threePromise = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threePromise) return threePromise;
    threePromise = new Promise(function (resolve, reject) {
      var urls = ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'];
      function tryUrl(i) {
        if (i >= urls.length) { reject(new Error('Three.js failed')); return; }
        var s = document.createElement('script'); s.src = urls[i]; s.async = true;
        s.onload = function () { if (window.THREE) resolve(window.THREE); else tryUrl(i + 1); };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        setTimeout(function () { if (!window.THREE && s.parentNode) { s.remove(); tryUrl(i + 1); } }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return threePromise;
  }

  var gltfPromise = null;
  function loadGLTF() {
    if (window.THREE && window.THREE.GLTFLoader) return Promise.resolve(window.THREE.GLTFLoader);
    if (gltfPromise) return gltfPromise;
    gltfPromise = new Promise(function (resolve, reject) {
      var urls = ['https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js', 'https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js'];
      function tryUrl(i) {
        if (i >= urls.length) { reject(new Error('GLTFLoader failed')); return; }
        var s = document.createElement('script'); s.src = urls[i]; s.async = true;
        s.onload = function () { if (window.THREE && window.THREE.GLTFLoader) resolve(window.THREE.GLTFLoader); else tryUrl(i + 1); };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        setTimeout(function () { if (!(window.THREE && window.THREE.GLTFLoader) && s.parentNode) { s.remove(); tryUrl(i + 1); } }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return gltfPromise;
  }

  var roomEnvPromise = null;
  function loadRoomEnv() {
    if (window.THREE && window.THREE.RoomEnvironment) return Promise.resolve(window.THREE.RoomEnvironment);
    if (roomEnvPromise) return roomEnvPromise;
    roomEnvPromise = new Promise(function (resolve, reject) {
      var urls = ['https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/environments/RoomEnvironment.js', 'https://unpkg.com/three@0.128.0/examples/js/environments/RoomEnvironment.js'];
      function tryUrl(i) {
        if (i >= urls.length) { reject(new Error('RoomEnvironment failed')); return; }
        var s = document.createElement('script'); s.src = urls[i]; s.async = true;
        s.onload = function () { if (window.THREE && window.THREE.RoomEnvironment) resolve(window.THREE.RoomEnvironment); else tryUrl(i + 1); };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        setTimeout(function () { if (!(window.THREE && window.THREE.RoomEnvironment) && s.parentNode) { s.remove(); tryUrl(i + 1); } }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return roomEnvPromise;
  }

  /* Fit a loaded GLB into a placeholder group: base at group origin, itemId on every mesh for picking. */
  function placeModel(THREE, group, obj, targetH, targetW, itemId, allMeshes) {
    var box3 = new THREE.Box3().setFromObject(obj);
    var size = new THREE.Vector3(); box3.getSize(size);
    var center = new THREE.Vector3(); box3.getCenter(center);
    var s = Math.min(targetH / Math.max(0.001, size.y), targetW / Math.max(0.001, Math.max(size.x, size.z)));
    obj.scale.setScalar(s);
    obj.position.set(-center.x * s, -box3.min.y * s, -center.z * s);
    obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.itemId = itemId; allMeshes.push(o); } });
    group.add(obj);
    return obj;
  }

  /* Load the real CC0 / BSD GLB models. The robot file is fetched once per
     desk (browser-cached) so each agent is an independent animated figure.
     On ANY failure, show a clean message and keep the rest of the site
     working — NO placeholder blocks are shown as the scene. */
  function loadModels(THREE, built) {
    function failRobot(i) {
      built.robotFailed[i] = true;
      if (built.robotGroups[i]) built.robotGroups[i].visible = false;
      if (caption) caption.textContent = 'The 3D agent model could not load. The rest of the site still works; refresh to retry.';
    }
    function failGenerator() {
      built.generatorFailed = true;
      if (built.generatorGroup) built.generatorGroup.visible = false;
      if (caption) caption.textContent = 'The 3D generator model could not load. The rest of the site still works; refresh to retry.';
    }
    function failPylon() {
      built.pylonFailed = true;
      if (built.pylonGroup) built.pylonGroup.visible = false;
      if (caption) caption.textContent = 'The 3D pylon model could not load. The rest of the site still works; refresh to retry.';
    }
    loadGLTF().then(function (Loader) {
      var loader = new Loader();
      var robotPref = ['Idle', 'Yes', 'Idle'];
      built.robotGroups.forEach(function (group, i) {
        loader.load('models/robot-expressive.glb', function (gltf) {
          var obj = gltf.scene || gltf.scenes[0];
          /* Height governs: the raw bbox is dominated by the arm span
             (6.6 wide vs 4.8 tall), so a tight width cap shrinks the
             robot to 0.45 tall and the desk hides it completely. */
          placeModel(THREE, group, obj, 1.08, 2.4, 'agent', built.allMeshes);
          if (gltf.animations && gltf.animations.length) {
            var mx = new THREE.AnimationMixer(obj);
            var want = robotPref[i] || 'Idle';
            var clip = gltf.animations.filter(function (c) { return c.name.toLowerCase().indexOf(want.toLowerCase()) !== -1; })[0]
              || gltf.animations.filter(function (c) { return /idle/i.test(c.name); })[0]
              || gltf.animations[0];
            var action = mx.clipAction(clip); action.time = i * 0.9; action.play();
            built.mixers.push(mx);
          }
        }, undefined, function () { failRobot(i); });
      });
      loader.load('models/portable-generator.glb', function (gltf) {
        var obj = gltf.scene || gltf.scenes[0];
        placeModel(THREE, built.generatorGroup, obj, 0.95, 1.35, 'generator', built.allMeshes);
      }, undefined, function () { failGenerator(); });
      loader.load('models/pylon.glb', function (gltf) {
        var obj = gltf.scene || gltf.scenes[0];
        placeModel(THREE, built.pylonGroup, obj, 2.6, 1.3, 'pylon', built.allMeshes);
      }, undefined, function () { failPylon(); });
    }).catch(function () {
      built.robotGroups.forEach(function (g, i) { failRobot(i); });
      failGenerator(); failPylon();
    });
  }

  /* Per-chapter lazy models (all CC0, Poly Haven: see ASSETS.md). The three
     eager models above are the initial payload (about 4 MB); these load
     once, the first time their chapter (or any later chapter) activates:
       chapter 0, Studio:    metal office desk + classic laptop + desk lamp
       chapter 1, VoltWorks: power box + drill
       chapter 2, Patterns:  circuit board
     The desk and laptop files each load once and are cloned in code for
     the second desk row, so the extra row costs no extra download.
     Loading is cumulative, matching the scene rule that a built zone stays
     built. A failed load marks only that model failed; applyAssembly hides
     its group and the rest of the scene keeps working. */
  function loadChapterModels(THREE, built, ch) {
    var want = [];
    if (ch >= 0) want.push('desk', 'laptop', 'lamp');
    if (ch >= 1) want.push('powerbox', 'drill');
    if (ch >= 2) want.push('circuit');
    var pending = want.filter(function (k) { return !built.lazyState[k]; });
    if (!pending.length) return;
    pending.forEach(function (k) { built.lazyState[k] = 'loading'; });
    var SPECS = {
      desk: { file: 'models/metal-office-desk.glb', group: built.deskGroup, targetH: 0.79, targetW: 2.0, itemId: 'desk' },
      laptop: { file: 'models/classic-laptop.glb', group: built.laptopGroup, targetH: 0.28, targetW: 0.40, itemId: 'laptop' },
      lamp: { file: 'models/desk-lamp.glb', group: built.lampGroup, targetH: 0.42, targetW: 0.45, itemId: 'lamp' },
      powerbox: { file: 'models/power-box.glb', group: built.powerBoxGroup, targetH: 0.50, targetW: 0.55, itemId: 'powerbox' },
      drill: { file: 'models/drill.glb', group: built.drillGroup, targetH: 0.185, targetW: 0.19, itemId: 'drill' },
      circuit: { file: 'models/circuit-board.glb', group: built.circuitGroup, targetH: 0.08, targetW: 0.41, itemId: 'circuit' }
    };
    loadGLTF().then(function (Loader) {
      var loader = new Loader();
      pending.forEach(function (k) {
        var spec = SPECS[k];
        loader.load(spec.file, function (gltf) {
          var obj = gltf.scene || gltf.scenes[0];
          var rawH = 0;
          if (k === 'desk') {
            var rb = new THREE.Box3().setFromObject(obj); var rs = new THREE.Vector3(); rb.getSize(rs); rawH = rs.y;
          }
          /* Second desk row: clone the raw scene before placeModel
             transforms it, then fit the clone into its own group. */
          var deskClone = (k === 'desk' && built.deskGroup2) ? obj.clone(true) : null;
          var laptopClone = (k === 'laptop' && built.laptopGroup2) ? obj.clone(true) : null;
          placeModel(THREE, spec.group, obj, spec.targetH, spec.targetW, spec.itemId, built.allMeshes);
          built.lazyState[k] = 'loaded';
          if (deskClone) {
            placeModel(THREE, built.deskGroup2, deskClone, spec.targetH, spec.targetW, spec.itemId, built.allMeshes);
            if (rawH > 0) built.laptopGroup2.position.y = rawH * deskClone.scale.x;
          }
          if (laptopClone) placeModel(THREE, built.laptopGroup2, laptopClone, spec.targetH, spec.targetW, spec.itemId, built.allMeshes);
          /* Sit the laptop exactly on the fitted desktop, whatever scale
             placeModel chose for the desk. */
          if (k === 'desk' && rawH > 0) built.laptopGroup.position.y = rawH * obj.scale.x;
        }, undefined, function () { built.lazyState[k] = 'failed'; built.lazyFailed[k] = true; });
      });
    }).catch(function () {
      pending.forEach(function (k) { built.lazyState[k] = 'failed'; built.lazyFailed[k] = true; });
    });
  }

  function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  /* ONE scene, THREE labelled zones on a single ground plane:
       left   — AGENTIC AI STUDIO: robot agents at desks with monitors
       centre — VOLTWORKS POWER: pylon + transformer + generator + switchgear
       right  — AI ARCHITECTURE PATTERNS: a blueprint board with a node diagram
     Scrolling assembles the zones left to right; the final chapter rings all
     three with the Brief → Generate → Verify → Fix loop. Every zone carries
     an always-visible plate label so the work reads at a glance. */
  function buildScene(THREE) {
    var scene = new THREE.Scene(); scene.background = null;
    /* Subtle depth fog matched to the page background. It starts past the
       farthest zone, so zone legibility is untouched. */
    scene.fog = new THREE.Fog(0x0E1013, 12, 28);
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 2.0, 6.2); camera.lookAt(0, 0.05, 0);
    // Lighting: hemisphere + key (shadows) + warm fill + cool rim + IBL env (set in init via RoomEnvironment).
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a8a8a, 0.6));
    var key = new THREE.DirectionalLight(0xffffff, 1.42); key.position.set(4, 7, 5);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    key.shadow.camera.near = 1; key.shadow.camera.far = 22;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
    key.shadow.camera.updateProjectionMatrix();
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffe6c4, 0.5); fill.position.set(-5, 3, 3); scene.add(fill);
    var rim = new THREE.DirectionalLight(0xdfeeff, 0.6); rim.position.set(-2, 4, -5); scene.add(rim);

    function std(hex, o) {
      o = o || {};
      return new THREE.MeshStandardMaterial({ color: hex, roughness: o.rough !== undefined ? o.rough : 0.55, metalness: o.metal !== undefined ? o.metal : 0.15, emissive: new THREE.Color(o.emissive || 0x000000), emissiveIntensity: o.ei || 0 });
    }
    var M = {
      ink: std(0x1a1e23, { rough: 0.6 }), inkLight: std(0x2a2f34, { rough: 0.55 }),
      teal: std(0x0f6a5e, { rough: 0.42, metal: 0.25 }), tealDark: std(0x0b4f47, { rough: 0.45, metal: 0.25 }),
      steel: std(0x6b7280, { rough: 0.35, metal: 0.65 }), steelDark: std(0x374151, { rough: 0.4, metal: 0.6 }),
      ceramic: std(0xfaf7f1, { rough: 0.35 }), wood: std(0x8a5a2b, { rough: 0.7 }),
      gold: std(0xc98a2b, { rough: 0.45, metal: 0.3 }), brass: std(0xFFB224, { rough: 0.45, metal: 0.35 }),
      amber: std(0xFFB224, { rough: 0.4, metal: 0.2, emissive: 0x6a4500, ei: 0.45 }),
      copper: std(0xB87333, { rough: 0.3, metal: 0.85 }), porcelain: std(0xEDE8DC, { rough: 0.35, metal: 0.05 }),
      gravel: std(0x2E2A26, { rough: 1.0, metal: 0 }),
      skin: std(0xd9a97a, { rough: 0.65 }), paper: std(0xf2eee5, { rough: 0.8 }),
      green: std(0x2fa36b, { rough: 0.4, emissive: 0x0a3d22, ei: 0.6 }), red: std(0xc0392b, { rough: 0.4, emissive: 0x4a0f0a, ei: 0.6 })
    };

    /* Glowing monitor screens: two CanvasTexture variants drawn in code
       (dashboard bars / code lines, amber and off-white on near-black),
       used as emissive maps so the screens visibly glow. */
    function makeScreenTexture(variant) {
      var c = document.createElement('canvas'); c.width = 256; c.height = 160;
      var g = c.getContext('2d');
      g.fillStyle = '#07090B'; g.fillRect(0, 0, 256, 160);
      g.fillStyle = '#FFB224'; g.fillRect(0, 0, 256, 16);
      g.fillStyle = '#0E1013'; g.fillRect(8, 5, 52, 6);
      var rnd = [0.7, 0.4, 0.9, 0.55, 0.3, 0.8, 0.45, 0.65];
      if (variant === 0) {
        for (var r = 0; r < 4; r++) {
          var y0 = 30 + r * 30;
          g.fillStyle = '#2A2F34'; g.fillRect(10, y0, 110, 20);
          g.fillStyle = '#FFB224'; g.fillRect(14, y0 + 12, Math.round(90 * rnd[r]), 5);
          g.fillStyle = '#F2EFE9'; g.fillRect(134, y0 + 2, Math.round(100 * rnd[r + 4]), 5);
          g.fillStyle = '#8A8578'; g.fillRect(134, y0 + 11, Math.round(70 * rnd[7 - r]), 4);
        }
      } else {
        for (var ln2 = 0; ln2 < 8; ln2++) {
          var ly = 28 + ln2 * 16, ind = (ln2 % 3) * 14;
          g.fillStyle = ln2 % 3 === 0 ? '#FFB224' : '#F2EFE9'; g.fillRect(12 + ind, ly, Math.round(60 * rnd[ln2]) + 18, 5);
          g.fillStyle = '#6B7280'; g.fillRect(96 + ind, ly, Math.round(80 * rnd[7 - ln2]) + 12, 5);
        }
      }
      var tex = new THREE.CanvasTexture(c);
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      return tex;
    }
    function screenMat(variant) {
      var tex = makeScreenTexture(variant);
      return new THREE.MeshStandardMaterial({ color: 0x181A1C, roughness: 0.35, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 1.15, emissiveMap: tex, map: tex });
    }
    var screenMats = [screenMat(0), screenMat(1)];

    var root = new THREE.Group(); scene.add(root);
    var SC = new THREE.Group(); root.add(SC);
    var allMeshes = [];
    var labels = [];
    var parts = []; // {obj, group, appear}
    function reg(obj, group, appear, itemId) {
      obj.userData.itemId = itemId || null; obj.userData.appear = appear; obj.userData.baseY = obj.position.y;
      obj.castShadow = true; obj.receiveShadow = true;
      group.add(obj); allMeshes.push(obj); parts.push({ obj: obj, group: group, appear: appear });
      return obj;
    }
    function mesh(geo, mat, x, y, z, group, appear, itemId) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return reg(m, group, appear, itemId); }
    function box(w, h, d, mat, x, y, z, g, ap, id) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, g, ap, id); }
    function cyl(rt, rb, h, mat, x, y, z, g, ap, id, seg) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat, x, y, z, g, ap, id); }
    function sph(r, mat, x, y, z, g, ap, id) { return mesh(new THREE.SphereGeometry(r, 24, 16), mat, x, y, z, g, ap, id); }
    function torus(r, t, mat, x, y, z, g, ap, id) { return mesh(new THREE.TorusGeometry(r, t, 12, 40), mat, x, y, z, g, ap, id); }
    function cone(r, h, mat, x, y, z, g, ap, id) { return mesh(new THREE.ConeGeometry(r, h, 20), mat, x, y, z, g, ap, id); }
    /* Always-visible plate label: grotesque name + mono descriptor on a dark
       plate with an amber hairline — the site's instrument style, in 3D.
       Billboarded toward the camera every frame (see init). */
    function makeLabel(main, sub, o) {
      o = o || {};
      var fsMain = o.fs || 46, fsSub = Math.round(fsMain * 0.52), padX = 26, padY = 15;
      var c = document.createElement('canvas'); var g = c.getContext('2d');
      var fMain = '600 ' + fsMain + 'px "Space Grotesk", system-ui, sans-serif';
      var fSub = '700 ' + fsSub + 'px ui-monospace, Menlo, Consolas, monospace';
      g.font = fMain; var wMain = g.measureText(main).width;
      var wSub = 0; if (sub) { g.font = fSub; wSub = g.measureText(sub).width; }
      c.width = Math.ceil(Math.max(wMain, wSub) + padX * 2);
      c.height = Math.ceil(padY * 2 + fsMain * 1.12 + (sub ? fsSub * 1.55 : 0));
      g = c.getContext('2d');
      g.fillStyle = 'rgba(14,16,19,0.97)'; g.fillRect(0, 0, c.width, c.height);
      g.strokeStyle = '#FFB224'; g.lineWidth = 3; g.strokeRect(2, 2, c.width - 4, c.height - 4);
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = '#F2EFE9'; g.font = fMain;
      var yMain = padY + fsMain * 0.9;
      g.fillText(main, c.width / 2, yMain);
      if (sub) { g.fillStyle = '#FFB224'; g.font = fSub; g.fillText(sub, c.width / 2, yMain + fsSub * 1.5); }
      var tex = new THREE.CanvasTexture(c);
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      var h = o.h || 0.5, w = h * c.width / c.height;
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.renderOrder = 20; m.userData.isLabel = true;
      labels.push(m);
      return m;
    }
    function addLabel(parent, main, sub, o, x, y, z, appear) {
      var m = makeLabel(main, sub, o);
      m.position.set(x, y, z);
      m.userData.appear = appear; m.userData.baseY = y; m.userData.baseScale = 1;
      parent.add(m); parts.push({ obj: m, group: parent, appear: appear });
      return m;
    }

    var GY = -0.92; // top surface of the zone plates — everything stands on this

    /* One ground plane for the whole scene */
    var groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(18, 11), new THREE.MeshStandardMaterial({ color: 0x10141A, roughness: 1.0, metalness: 0 }));
    groundPlane.rotation.x = -Math.PI / 2; groundPlane.position.y = -1.02; groundPlane.receiveShadow = true; SC.add(groundPlane);
    var grid = new THREE.GridHelper(17, 26, 0x2A3138, 0x1E242B); grid.position.y = -1.01; grid.material.transparent = true; grid.material.opacity = 0.35; SC.add(grid);

    /* Zone plates — three clearly separated slabs with an amber rim */
    function zonePlate(zx, hex) {
      var rimM = box(3.05, 0.03, 3.45, M.brass, zx, -1.005, 0, SC, 0, null); rimM.castShadow = false;
      var slab = box(2.95, 0.08, 3.35, std(hex, { rough: 0.9, metal: 0 }), zx, -0.96, 0, SC, 0, null); slab.castShadow = false;
    }
    zonePlate(-3.35, 0x1B2027); zonePlate(0, 0x161A20); zonePlate(3.35, 0x1B2027);

    /* ============ ZONE 1 — AGENTIC AI STUDIO (left) ============ */
    var ZX1 = -3.35;
    addLabel(SC, 'AI Studio', 'AGENTS AT WORK', { h: 0.52 }, ZX1, 1.95, -0.6, 0.05);
    // Darren — the director, standing at the front corner of the studio plate
    cyl(0.3, 0.34, 0.06, M.ink, -4.35, GY + 0.03, 1.05, SC, 0.02, 'darren', 24);
    cyl(0.16, 0.21, 0.8, M.ink, -4.35, GY + 0.46, 1.05, SC, 0.02, 'darren');
    sph(0.21, M.skin, -4.35, GY + 1.05, 1.05, SC, 0.02, 'darren');
    cyl(0.19, 0.2, 0.08, M.teal, -4.35, GY + 1.22, 1.05, SC, 0.02, 'darren');
    // Three workstations: desk + monitor + papers, robot agent behind each desk.
    // The robots are real GLBs (RobotExpressive, CC0) loaded async into these groups.
    var robotGroups = [];
    var deskX = [-4.15, -3.3, -2.45];
    deskX.forEach(function (dx, i) {
      var ap = 0.03 + i * 0.04;
      box(0.8, 0.05, 0.52, M.wood, dx, GY + 0.72, 0.35, SC, ap, 'agent');
      box(0.05, 0.7, 0.46, M.inkLight, dx - 0.36, GY + 0.36, 0.35, SC, ap, 'agent');
      box(0.05, 0.7, 0.46, M.inkLight, dx + 0.36, GY + 0.36, 0.35, SC, ap, 'agent');
      box(0.46, 0.32, 0.03, M.ink, dx, GY + 1.02, 0.18, SC, ap, 'agent');
      box(0.4, 0.26, 0.012, screenMats[i % 2], dx, GY + 1.02, 0.198, SC, ap, 'agent');
      cyl(0.03, 0.03, 0.14, M.steelDark, dx, GY + 0.8, 0.18, SC, ap, 'agent');
      box(0.34, 0.015, 0.24, M.paper, dx - 0.08, GY + 0.755, 0.4, SC, ap, 'agent');
      box(0.3, 0.02, 0.12, M.inkLight, dx + 0.1, GY + 0.76, 0.44, SC, ap, 'agent');
      cyl(0.035, 0.032, 0.07, i === 1 ? M.brass : M.ceramic, dx + 0.27, GY + 0.78, 0.5, SC, ap, 'agent');
      if (i === 1) {
        cyl(0.015, 0.015, 0.3, M.steelDark, dx + 0.31, GY + 0.9, 0.2, SC, ap, 'agent');
        sph(0.05, M.amber, dx + 0.31, GY + 1.07, 0.2, SC, ap, 'agent');
      }
      var rg = new THREE.Group();
      rg.position.set(dx + 0.3, GY, -0.28);
      rg.rotation.y = [-0.38, 0.10, 0.42][i];
      rg.userData.itemId = 'agent'; rg.userData.appear = ap; rg.userData.baseY = GY; rg.userData.baseScale = 1;
      SC.add(rg); robotGroups.push(rg);
      parts.push({ obj: rg, group: SC, appear: ap });
    });
    /* Real workstation (CC0, Poly Haven): a metal office desk at the front
       of the studio plate with a laptop on top. Both GLBs load lazily with
       chapter 0 (see loadChapterModels); until then these groups stay empty. */
    var deskGroup = new THREE.Group();
    deskGroup.position.set(-2.98, GY, 1.10);
    deskGroup.userData.itemId = 'desk'; deskGroup.userData.appear = 0.06; deskGroup.userData.baseY = GY; deskGroup.userData.baseScale = 1;
    deskGroup.userData.lazyId = 'desk';
    SC.add(deskGroup);
    parts.push({ obj: deskGroup, group: SC, appear: 0.06 });
    var laptopGroup = new THREE.Group();
    /* Child of the desk: it rides the desk's assembly motion. Position is
       relative to the desk base (plate top). y is corrected to the fitted
       desktop height when the desk GLB loads. */
    laptopGroup.position.set(0.1, 0.788, 0.05);
    deskGroup.add(laptopGroup);
    /* Second desk row at the back of the studio plate: one more fitted
       instance of the same metal office desk GLB, cloned from the single
       download in loadChapterModels, with its own cloned laptop. It shares
       the chapter 0 lazy load (lazyId desk / laptop). */
    var deskGroup2 = new THREE.Group();
    deskGroup2.position.set(-3.35, GY, -0.92);
    deskGroup2.userData.itemId = 'desk'; deskGroup2.userData.appear = 0.09; deskGroup2.userData.baseY = GY; deskGroup2.userData.baseScale = 1;
    deskGroup2.userData.lazyId = 'desk';
    SC.add(deskGroup2);
    parts.push({ obj: deskGroup2, group: SC, appear: 0.09 });
    var laptopGroup2 = new THREE.Group();
    laptopGroup2.position.set(-0.15, 0.788, 0.05);
    deskGroup2.add(laptopGroup2);
    /* Desk lamp (CC0, Poly Haven): articulated task lamp standing on the
       front desk. Loads lazily with chapter 0 like the desk and laptop. */
    var lampGroup = new THREE.Group();
    lampGroup.position.set(-3.62, GY + 0.79, 0.92);
    lampGroup.userData.itemId = 'lamp'; lampGroup.userData.appear = 0.07; lampGroup.userData.baseY = GY + 0.79; lampGroup.userData.baseScale = 1;
    lampGroup.userData.lazyId = 'lamp';
    SC.add(lampGroup);
    parts.push({ obj: lampGroup, group: SC, appear: 0.07 });
    /* Glowing monitors, keyboards and mugs on the two GLB desks. The fitted
       GLB desktop sits at GY + 0.79 (see ASSETS.md). */
    [[-3.78, -1.14], [-2.92, -1.14]].forEach(function (mp, mi) {
      box(0.46, 0.32, 0.03, M.ink, mp[0], GY + 1.10, mp[1], SC, 0.10, 'agent');
      box(0.4, 0.26, 0.012, screenMats[mi % 2], mp[0], GY + 1.10, mp[1] + 0.02, SC, 0.10, 'agent');
      cyl(0.03, 0.03, 0.13, M.steelDark, mp[0], GY + 0.86, mp[1], SC, 0.10, 'agent');
    });
    var kb1 = box(0.32, 0.015, 0.11, M.inkLight, -3.3, GY + 0.80, -0.78, SC, 0.10, 'agent'); kb1.rotation.y = 0.08;
    cyl(0.035, 0.032, 0.07, M.ceramic, -2.62, GY + 0.83, -1.02, SC, 0.10, 'agent');
    var kb2 = box(0.32, 0.015, 0.11, M.inkLight, -2.88, GY + 0.80, 1.40, SC, 0.08, 'agent'); kb2.rotation.y = -0.06;
    cyl(0.035, 0.032, 0.07, M.brass, -3.5, GY + 0.83, 1.3, SC, 0.08, 'agent');
    /* Shelving unit against the studio back edge: two uprights, three
       shelves, muted book and box props. Original built-in geometry. */
    var shelfAp = 0.11;
    box(0.05, 1.6, 0.22, M.inkLight, -4.52, GY + 0.8, -1.56, SC, shelfAp, null);
    box(0.05, 1.6, 0.22, M.inkLight, -2.18, GY + 0.8, -1.56, SC, shelfAp, null);
    [0.35, 0.85, 1.35].forEach(function (sy) { box(2.39, 0.04, 0.24, M.wood, -3.35, GY + sy, -1.56, SC, shelfAp, null); });
    var bookCols = [M.ink, M.steel, M.paper, M.gold, M.steelDark, M.tealDark];
    for (var bk = 0; bk < 6; bk++) { var bh = 0.18 + (bk % 3) * 0.04; box(0.05, bh, 0.16, bookCols[bk], -4.3 + bk * 0.075, GY + 0.37 + bh / 2, -1.56, SC, shelfAp, null); }
    box(0.24, 0.18, 0.18, M.inkLight, -3.6, GY + 0.96, -1.56, SC, shelfAp, null);
    box(0.2, 0.14, 0.16, M.wood, -3.28, GY + 0.94, -1.56, SC, shelfAp, null);
    for (var bk2 = 0; bk2 < 4; bk2++) { var bh2 = 0.16 + (bk2 % 2) * 0.05; box(0.05, bh2, 0.16, bookCols[5 - bk2], -2.9 + bk2 * 0.075, GY + 1.37 + bh2 / 2, -1.56, SC, shelfAp, null); }
    box(0.26, 0.16, 0.18, M.steelDark, -4.15, GY + 1.45, -1.56, SC, shelfAp, null);

    /* ============ ZONE 2 — VOLTWORKS POWER (centre) ============ */
    addLabel(SC, 'VoltWorks Power', 'POWER SYSTEMS', { h: 0.52 }, 0, 2.32, -0.6, 0.28);
    /* Ground detail on the power plate: gravel-tone surface, painted amber
       safety border lines, and a cable trench strip along the back. */
    box(2.9, 0.02, 3.3, M.gravel, 0, GY + 0.005, 0, SC, 0.33, null);
    box(2.78, 0.006, 0.05, M.brass, 0, GY + 0.018, 1.58, SC, 0.33, null);
    box(2.78, 0.006, 0.05, M.brass, 0, GY + 0.018, -1.58, SC, 0.33, null);
    box(0.05, 0.006, 3.11, M.brass, -1.39, GY + 0.018, 0, SC, 0.33, null);
    box(0.05, 0.006, 3.11, M.brass, 1.39, GY + 0.018, 0, SC, 0.33, null);
    box(2.6, 0.012, 0.2, M.ink, 0, GY + 0.016, -1.45, SC, 0.33, null);
    for (var ts = 0; ts < 4; ts++) box(0.03, 0.014, 0.2, M.steelDark, -0.98 + ts * 0.65, GY + 0.017, -1.45, SC, 0.33, null);
    // Pylon — real downloaded GLB (lattice transmission tower, BSD-3-Clause).
    var pylonGroup = new THREE.Group();
    pylonGroup.position.set(-0.78, GY, -0.55); pylonGroup.rotation.y = 0.15;
    pylonGroup.userData.itemId = 'pylon'; pylonGroup.userData.appear = 0.30; pylonGroup.userData.baseY = GY; pylonGroup.userData.baseScale = 1;
    SC.add(pylonGroup);
    parts.push({ obj: pylonGroup, group: SC, appear: 0.30 });
    /* Insulator strings hanging from the pylon crossarm area: a short rod
       plus five stacked porcelain discs per string. Built-in geometry. */
    [-1.3, -0.85, -0.4].forEach(function (sx) {
      cyl(0.012, 0.012, 0.18, M.steelDark, sx, GY + 2.02, -0.55, SC, 0.36, 'pylon');
      for (var sd2 = 0; sd2 < 5; sd2++) cyl(0.07, 0.07, 0.028, M.porcelain, sx, GY + 1.90 - sd2 * 0.05, -0.55, SC, 0.36, 'pylon');
    });
    // Transformer — tank, cooling fins, bushings, conservator, nameplate
    var TX = 1.02, TZ = -0.5, TAP = 0.34;
    box(0.78, 0.95, 0.6, M.steel, TX, GY + 0.475, TZ, SC, TAP, 'transformer');
    box(0.84, 0.07, 0.66, M.steelDark, TX, GY + 0.985, TZ, SC, TAP, 'transformer');
    for (var fi = 0; fi < 5; fi++) box(0.05, 0.72, 0.06, M.steelDark, TX - 0.26 + fi * 0.13, GY + 0.475, TZ + 0.33, SC, TAP, 'transformer');
    [-1, 1].forEach(function (sd) {
      for (var si = 0; si < 3; si++) box(0.05, 0.72, 0.14, M.steelDark, TX + sd * 0.42, GY + 0.475, TZ - 0.19 + si * 0.19, SC, TAP, 'transformer');
    });
    [0.82, 1.02, 1.22].forEach(function (bx) {
      cyl(0.032, 0.052, 0.3, M.ceramic, bx, GY + 1.17, TZ + 0.08, SC, TAP, 'transformer');
      sph(0.045, M.gold, bx, GY + 1.36, TZ + 0.08, SC, TAP, 'transformer');
    });
    var cons = cyl(0.12, 0.12, 0.55, M.steel, TX, GY + 1.38, TZ - 0.14, SC, TAP, 'transformer'); cons.rotation.z = Math.PI / 2;
    box(0.05, 0.34, 0.05, M.steelDark, TX - 0.17, GY + 1.16, TZ - 0.14, SC, TAP, 'transformer');
    box(0.05, 0.34, 0.05, M.steelDark, TX + 0.17, GY + 1.16, TZ - 0.14, SC, TAP, 'transformer');
    box(0.02, 0.18, 0.26, M.gold, TX + 0.4, GY + 0.5, TZ, SC, TAP, 'transformer');
    addLabel(SC, 'Transformer', null, { h: 0.2, fs: 38 }, TX, 0.75, TZ, 0.35);
    // Generator — real downloaded GLB (Poly Haven, CC0, full PBR).
    var generatorGroup = new THREE.Group();
    generatorGroup.position.set(0.72, GY, 0.72); generatorGroup.rotation.y = -0.3;
    generatorGroup.userData.itemId = 'generator'; generatorGroup.userData.appear = 0.38; generatorGroup.userData.baseY = GY; generatorGroup.userData.baseScale = 1;
    SC.add(generatorGroup);
    parts.push({ obj: generatorGroup, group: SC, appear: 0.38 });
    addLabel(SC, 'Generator', null, { h: 0.2, fs: 38 }, 0.72, 0.38, 0.72, 0.38);
    // Switchgear — 2 cubicles with doors, handles, status lamps
    [-0.92, -0.34].forEach(function (cx, ci) {
      box(0.58, 1.15, 0.55, M.ink, cx, GY + 0.575, 0.85, SC, 0.41, 'switchgear');
      box(0.48, 0.98, 0.03, M.inkLight, cx, GY + 0.575, 1.13, SC, 0.41, 'switchgear');
      box(0.05, 0.2, 0.05, M.gold, cx + 0.15, GY + 0.55, 1.16, SC, 0.41, 'switchgear');
      sph(0.06, ci === 0 ? M.green : M.red, cx - 0.15, GY + 0.95, 1.14, SC, 0.41, 'switchgear');
      box(0.26, 0.07, 0.02, M.steel, cx, GY + 0.3, 1.14, SC, 0.41, 'switchgear');
    });
    addLabel(SC, 'Switchgear', null, { h: 0.2, fs: 38 }, -0.63, 0.5, 0.85, 0.42);
    /* Power box (CC0, Poly Haven): an electrical cabinet with its door open,
       standing at the back of the power plate beside the transformer. Drill
       (CC0, Poly Haven) rests on top of the left switchgear cubicle. Both
       load lazily with chapter 1 (see loadChapterModels). */
    var powerBoxGroup = new THREE.Group();
    powerBoxGroup.position.set(1.12, GY, -1.05); powerBoxGroup.rotation.y = 0.35;
    powerBoxGroup.userData.itemId = 'powerbox'; powerBoxGroup.userData.appear = 0.42; powerBoxGroup.userData.baseY = GY; powerBoxGroup.userData.baseScale = 1;
    powerBoxGroup.userData.lazyId = 'powerbox';
    SC.add(powerBoxGroup);
    parts.push({ obj: powerBoxGroup, group: SC, appear: 0.42 });
    var drillGroup = new THREE.Group();
    drillGroup.position.set(-0.92, GY + 1.15, 0.85); drillGroup.rotation.y = 0.5;
    drillGroup.userData.itemId = 'drill'; drillGroup.userData.appear = 0.43; drillGroup.userData.baseY = GY + 1.15; drillGroup.userData.baseScale = 1;
    drillGroup.userData.lazyId = 'drill';
    SC.add(drillGroup);
    parts.push({ obj: drillGroup, group: SC, appear: 0.43 });
    /* Busbar: three parallel copper bars running from the transformer
       toward the switchgear, carried on posts topped with porcelain
       insulator stacks. Original built-in geometry. */
    var busbarAp = 0.44;
    [-0.02, -0.15, -0.28].forEach(function (bz) { box(1.5, 0.03, 0.05, M.copper, 0.17, GY + 0.99, bz, SC, busbarAp, 'bus'); });
    [0.8, 0.17, -0.46].forEach(function (px) {
      cyl(0.03, 0.035, 0.80, M.steelDark, px, GY + 0.40, -0.15, SC, busbarAp, 'bus');
      for (var is2 = 0; is2 < 3; is2++) cyl(0.055, 0.055, 0.024, M.porcelain, px, GY + 0.83 + is2 * 0.035, -0.15, SC, busbarAp, 'bus');
      box(0.08, 0.03, 0.4, M.steelDark, px, GY + 0.94, -0.15, SC, busbarAp, 'bus');
    });
    /* Circuit breaker between the transformer and the switchgear: tank
       body on legs, two bushings, and a small operating cabinet.
       Original built-in geometry. */
    var brkAp = 0.45, BX = -0.05, BZ = 0.18;
    [[-0.18, -0.14], [0.18, -0.14], [-0.18, 0.14], [0.18, 0.14]].forEach(function (lo) { box(0.05, 0.22, 0.05, M.steelDark, BX + lo[0], GY + 0.11, BZ + lo[1], SC, brkAp, 'breaker'); });
    box(0.52, 0.55, 0.42, M.steel, BX, GY + 0.50, BZ, SC, brkAp, 'breaker');
    box(0.56, 0.05, 0.46, M.steelDark, BX, GY + 0.80, BZ, SC, brkAp, 'breaker');
    [-0.13, 0.13].forEach(function (bo) {
      cyl(0.028, 0.045, 0.26, M.porcelain, BX + bo, GY + 0.95, BZ, SC, brkAp, 'breaker');
      sph(0.04, M.gold, BX + bo, GY + 1.10, BZ, SC, brkAp, 'breaker');
    });
    box(0.30, 0.38, 0.10, M.inkLight, BX, GY + 0.42, BZ + 0.26, SC, brkAp, 'breaker');
    box(0.04, 0.14, 0.04, M.gold, BX + 0.09, GY + 0.42, BZ + 0.32, SC, brkAp, 'breaker');
    addLabel(SC, 'Breaker', null, { h: 0.2, fs: 38 }, BX, 0.62, BZ, 0.46);
    /* Control panel near the power box: a small cabinet on a post with
       four indicator lamps that blink in the render loop. The lamps stay
       steady under reduced motion. Lamp colors are functional: amber,
       green, red. */
    var blinkLamps = [];
    cyl(0.03, 0.035, 0.55, M.steelDark, 0.55, GY + 0.275, -1.2, SC, 0.46, 'controlpanel');
    box(0.36, 0.46, 0.10, M.ink, 0.55, GY + 0.78, -1.2, SC, 0.46, 'controlpanel');
    [0xFFB224, 0x2fa36b, 0xc0392b, 0xFFB224].forEach(function (lc, li2) {
      var lm = std(lc, { rough: 0.35, emissive: lc, ei: 0.95 });
      var lampMesh = sph(0.028, lm, 0.43 + li2 * 0.08, GY + 0.88, -1.13, SC, 0.46, 'controlpanel');
      lampMesh.castShadow = false;
      blinkLamps.push({ mat: lm, phase: li2 * 1.7, speed: 2.2 + li2 * 0.6 });
    });
    /* Safety fencing around the power plate: posts, two rails and a
       semi-transparent mesh plane per run, with a gap at the front. */
    var fenceAp = 0.50;
    var fenceMat = new THREE.MeshStandardMaterial({ color: 0x9AA3AD, roughness: 0.6, metalness: 0.4, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    function fenceRun(x0, z0, x1, z1) {
      var dx = x1 - x0, dz = z1 - z0, len = Math.sqrt(dx * dx + dz * dz), ang = Math.atan2(-dz, dx);
      var n = Math.max(2, Math.round(len / 0.71) + 1);
      for (var fp = 0; fp < n; fp++) cyl(0.022, 0.022, 0.92, M.steelDark, x0 + dx * fp / (n - 1), GY + 0.46, z0 + dz * fp / (n - 1), SC, fenceAp, null, 10);
      var rail1 = box(len, 0.04, 0.03, M.steel, (x0 + x1) / 2, GY + 0.90, (z0 + z1) / 2, SC, fenceAp, null); rail1.rotation.y = ang;
      var rail2 = box(len, 0.03, 0.025, M.steel, (x0 + x1) / 2, GY + 0.46, (z0 + z1) / 2, SC, fenceAp, null); rail2.rotation.y = ang;
      var fm = mesh(new THREE.PlaneGeometry(len, 0.84), fenceMat, (x0 + x1) / 2, GY + 0.46, (z0 + z1) / 2, SC, fenceAp, null); fm.rotation.y = ang; fm.castShadow = false;
    }
    fenceRun(-1.42, -1.60, 1.42, -1.60);
    fenceRun(-1.42, -1.60, -1.42, 1.60);
    fenceRun(1.42, -1.60, 1.42, 1.60);
    fenceRun(-1.42, 1.60, -0.42, 1.60);
    fenceRun(0.42, 1.60, 1.42, 1.60);
    // Bus line — pylon → transformer → switchgear, with flow dots
    var busPts = [[-0.78, 1.42, -0.55], [1.02, 0.28, -0.42], [-0.63, 0.33, 0.85]];
    function busSeg(a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 12), M.amber);
      c.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      c.castShadow = true; c.userData.itemId = 'bus'; c.userData.baseY = c.position.y;
      SC.add(c); allMeshes.push(c);
      parts.push({ obj: c, group: SC, appear: 0.47 });
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
      return c;
    }
    busSeg(busPts[0], busPts[1]); busSeg(busPts[1], busPts[2]);
    var flowDots = [];
    for (var di = 0; di < 5; di++) { var d = sph(0.08, std(0xffd94d, { rough: 0.3, emissive: 0x8a6a00, ei: 0.8 }), 0, 0, 0, SC, 0.47, 'bus'); d.castShadow = false; flowDots.push(d); }
    // Scale — 1.8 m figure + 1 m bar at the front of the power plate
    sph(0.12, M.skin, 0.05, GY + 1.68, 1.38, SC, 0.49, 'scale');
    cyl(0.12, 0.13, 0.71, M.ink, 0.05, GY + 1.2, 1.38, SC, 0.49, 'scale');
    cyl(0.1, 0.12, 0.85, M.inkLight, 0.05, GY + 0.42, 1.38, SC, 0.49, 'scale');
    box(1.0, 0.05, 0.05, M.gold, 0.05, GY + 0.03, 1.38, SC, 0.49, 'scale');

    /* ============ ZONE 3 — AI ARCHITECTURE PATTERNS (right) ============ */
    var ZX3 = 3.35;
    addLabel(SC, 'AI Architecture Patterns', 'SYSTEM DESIGN', { h: 0.52 }, ZX3, 1.42, -0.3, 0.55);
    // Drawing table (scaled up 1.2x, still inside the plate)
    box(2.76, 0.06, 1.92, M.wood, ZX3, GY + 0.55, -0.15, SC, 0.57, 'patterns');
    [[-1.26, -0.78], [1.26, -0.78], [-1.26, 0.78], [1.26, 0.78]].forEach(function (off) {
      cyl(0.04, 0.04, 0.55, M.inkLight, ZX3 + off[0], GY + 0.27, -0.15 + off[1], SC, 0.57, 'patterns');
    });
    // Blueprint board, tilted toward the viewer like a drawing board
    var panelGroup = new THREE.Group();
    panelGroup.position.set(ZX3, GY + 1.22, -0.3); panelGroup.rotation.x = -0.12;
    panelGroup.scale.setScalar(1.3); // whiteboard scaled up 1.3x, still on the plate
    SC.add(panelGroup);
    box(2.15, 1.4, 0.03, M.ink, 0, 0, -0.03, panelGroup, 0.57, 'patterns');
    box(2.05, 1.3, 0.05, M.paper, 0, 0, 0, panelGroup, 0.57, 'patterns');
    // Node diagram on the board: components (discs) + connections (edges)
    var nodes = [
      { x: -0.78, y: 0.33 }, { x: -0.26, y: 0.33 }, { x: 0.26, y: 0.33 }, { x: 0.78, y: 0.33 }, { x: 0, y: -0.36 }
    ];
    nodes.forEach(function (n, ni) {
      var nd = cyl(0.115, 0.115, 0.05, M.teal, n.x, n.y, 0.05, panelGroup, 0.60 + ni * 0.025, 'patterns');
      nd.rotation.x = Math.PI / 2;
      sph(0.045, M.gold, n.x, n.y, 0.1, panelGroup, 0.60 + ni * 0.025, 'patterns');
    });
    [[0, 1], [1, 2], [2, 3], [1, 4], [2, 4]].forEach(function (pr) {
      var a = nodes[pr[0]], b = nodes[pr[1]];
      /* Solid amber tubes instead of 1px lines: lines wash out at the
         default camera distance, tubes keep the diagram legible. */
      var len = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
      var ln = cyl(0.016, 0.016, len, M.amber, (a.x + b.x) / 2, (a.y + b.y) / 2, 0.045, panelGroup, 0.72, 'patterns');
      ln.rotation.z = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
    });
    box(0.16, 0.1, 0.04, M.inkLight, -0.78, -0.02, 0.04, panelGroup, 0.68, 'patterns');
    box(0.16, 0.1, 0.04, M.inkLight, 0.78, -0.02, 0.04, panelGroup, 0.68, 'patterns');
    /* Circuit board (CC0, Poly Haven): a physical PCB sample lying on the
       drawing table beside the diagram board. Loads lazily with chapter 2
       (see loadChapterModels). */
    var circuitGroup = new THREE.Group();
    circuitGroup.position.set(2.62, GY + 0.58, 0.28); circuitGroup.rotation.y = 0.3;
    circuitGroup.userData.itemId = 'circuit'; circuitGroup.userData.appear = 0.58; circuitGroup.userData.baseY = GY + 0.58; circuitGroup.userData.baseScale = 1;
    circuitGroup.userData.lazyId = 'circuit';
    SC.add(circuitGroup);
    parts.push({ obj: circuitGroup, group: SC, appear: 0.58 });
    /* Drafting props on the drawing table: two paper sheets with slight
       rotations, an amber pencil and a steel ruler. The table top surface
       is at GY + 0.58. Original built-in geometry. */
    var paper1 = box(0.42, 0.008, 0.30, M.paper, 3.88, GY + 0.585, -0.52, SC, 0.60, 'patterns'); paper1.rotation.y = 0.18;
    var paper2 = box(0.42, 0.008, 0.30, M.paper, 3.52, GY + 0.585, 0.52, SC, 0.61, 'patterns'); paper2.rotation.y = -0.14;
    var pencil = cyl(0.012, 0.012, 0.16, M.brass, 3.62, GY + 0.59, -0.05, SC, 0.61, 'patterns'); pencil.rotation.z = Math.PI / 2; pencil.rotation.y = 0.4;
    box(0.30, 0.008, 0.045, M.steel, 3.05, GY + 0.585, -0.72, SC, 0.61, 'patterns');

    /* ============ VERIFY LOOP — a ring around all three zones ============ */
    var ring = torus(5.2, 0.04, M.amber, 0, -0.95, 0, SC, 0.78, null); ring.rotation.x = Math.PI / 2;
    for (var ai = 0; ai < 4; ai++) {
      var ang = ai * Math.PI / 2;
      var cn = cone(0.11, 0.3, M.amber, Math.cos(ang) * 5.2, -0.9, Math.sin(ang) * 5.2, SC, 0.80, null);
      cn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)));
    }
    var pulseStations = [];
    var stations = [
      { id: 'brief', name: 'BRIEF', x: -3.68, z: 3.68, ap: 0.82 },
      { id: 'generate', name: 'GENERATE', x: 3.68, z: 3.68, ap: 0.85 },
      { id: 'verify', name: 'VERIFY', x: 3.68, z: -3.68, ap: 0.88 },
      { id: 'fix', name: 'FIX', x: -3.68, z: -3.68, ap: 0.91 }
    ];
    stations.forEach(function (st) {
      cyl(0.5, 0.54, 0.08, M.paper, st.x, -0.96, st.z, SC, st.ap, st.id, 28);
      var markMat = std(0xFFB224, { rough: 0.4, emissive: 0xFFB224, ei: 0.25 });
      cyl(0.58, 0.62, 0.03, markMat, st.x, -0.905, st.z, SC, st.ap, st.id, 28);
      pulseStations.push({ mat: markMat, angle: Math.atan2(st.z, st.x) });
      if (st.id === 'brief') {
        box(0.44, 0.58, 0.05, M.ink, st.x, -0.55, st.z, SC, st.ap, st.id);
        box(0.2, 0.07, 0.07, M.gold, st.x, -0.22, st.z, SC, st.ap, st.id);
        for (var li = 0; li < 3; li++) box(0.3, 0.045, 0.02, M.ceramic, st.x, -0.42 - li * 0.13, st.z + 0.04, SC, st.ap, st.id);
      } else if (st.id === 'generate') {
        var g1 = torus(0.24, 0.065, M.teal, st.x - 0.13, -0.5, st.z, SC, st.ap, st.id); g1.rotation.x = Math.PI / 2;
        var g2 = torus(0.17, 0.055, M.gold, st.x + 0.2, -0.5, st.z, SC, st.ap, st.id); g2.rotation.x = Math.PI / 2;
        cyl(0.07, 0.07, 0.1, M.ink, st.x - 0.13, -0.5, st.z, SC, st.ap, st.id);
      } else if (st.id === 'verify') {
        var sh = sph(0.28, M.teal, st.x, -0.5, st.z, SC, st.ap, st.id); sh.scale.set(1, 1.15, 0.45);
        var c1 = box(0.2, 0.065, 0.05, M.ceramic, st.x - 0.07, -0.55, st.z + 0.15, SC, st.ap, st.id); c1.rotation.z = 0.7;
        var c2 = box(0.32, 0.065, 0.05, M.ceramic, st.x + 0.09, -0.49, st.z + 0.15, SC, st.ap, st.id); c2.rotation.z = -0.7;
      } else {
        box(0.09, 0.5, 0.07, M.ink, st.x, -0.58, st.z, SC, st.ap, st.id);
        torus(0.16, 0.06, M.teal, st.x, -0.24, st.z, SC, st.ap, st.id);
      }
      addLabel(SC, st.name, null, { h: 0.2, fs: 40 }, st.x, 0.32, st.z, st.ap);
    });
    /* Animated pulse: a small emissive amber sphere that travels the loop
       ring in Brief, Generate, Verify, Fix order. The frame loop moves it
       and swells each station marker as it passes. It is hidden under
       reduced motion and the stations stay static then. */
    var pulseMat = std(0xFFB224, { rough: 0.3, emissive: 0xFFB224, ei: 1.6 });
    var pulse = sph(0.11, pulseMat, 5.2, 0.55, 0, SC, 0.95, null);
    pulse.castShadow = false;

    return {
      scene: scene, camera: camera, root: root, parts: parts, allMeshes: allMeshes, labels: labels,
      flowDots: flowDots, busPts: busPts,
      robotGroups: robotGroups, robotFailed: [false, false, false],
      generatorGroup: generatorGroup, pylonGroup: pylonGroup,
      deskGroup: deskGroup, laptopGroup: laptopGroup,
      deskGroup2: deskGroup2, laptopGroup2: laptopGroup2, lampGroup: lampGroup,
      pulse: pulse, pulseStations: pulseStations, blinkLamps: blinkLamps,
      powerBoxGroup: powerBoxGroup, drillGroup: drillGroup, circuitGroup: circuitGroup,
      lazyState: {}, lazyFailed: {},
      mixers: [], generatorFailed: false, pylonFailed: false
    };
  }

  function init() {
    if (!canvas || canvas.dataset.init === '1') return;
    canvas.dataset.init = '1';
    var webglOK = true;
    try { var t = document.createElement('canvas'); webglOK = !!(t.getContext('webgl') || t.getContext('experimental-webgl')); } catch (e) { webglOK = false; }
    if (!webglOK) { drawFallback(0); return; }
    loadThree().then(function (THREE) {
      try {
        var built = buildScene(THREE);
        var size = fitCanvas();
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size.w, size.h, false);
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.physicallyCorrectLights = true;
        // IBL: RoomEnvironment via PMREM — gives PBR materials real reflections. Lights above still carry the shadows.
        loadRoomEnv().then(function (RoomEnv) {
          try {
            var pmrem = new THREE.PMREMGenerator(renderer);
            var envScene = new RoomEnv();
            built.scene.environment = pmrem.fromScene(envScene, 0.04).texture;
            pmrem.dispose();
          } catch (e) { /* env is enhancement only; lights still light the scene */ }
        }).catch(function () { /* no env — lights still light the scene */ });
        built.camera.aspect = size.w / size.h; built.camera.updateProjectionMatrix();
        loadModels(THREE, built);

        var state = { rotX: 0.08, rotY: 0, dragging: false, lastX: 0, lastY: 0, moved: 0, dist: 5.8, targetDist: 5.8, camX: 0, targetCamX: 0, cur: 0, target: 0, active: 0, local: 0 };
        var start = performance.now();
        var lastT = start;
        var CAMDIST = [5.4, 6.3, 6.3, 7.5];
        var CAMX = [-1.1, 0.1, 1.1, 0]; // chapter focus drifts across the three zones

        function setActive(ch) {
          state.active = ch;
          loadChapterModels(THREE, built, ch);
          chapterEls.forEach(function (el) { el.classList.toggle('active', parseInt(el.getAttribute('data-chapter'), 10) === ch); });
        }
        /* Scroll assembles zones left → right along global progress p.
           Once built, a zone stays built — the scene only gains, never swaps. */
        function applyAssembly() {
          var p = state.cur;
          built.parts.forEach(function (pt) {
            var o = pt.obj;
            var ri = built.robotGroups.indexOf(o);
            if (ri !== -1 && built.robotFailed[ri]) { o.visible = false; return; }
            if (o === built.generatorGroup && built.generatorFailed) { o.visible = false; return; }
            if (o === built.pylonGroup && built.pylonFailed) { o.visible = false; return; }
            if (o.userData.lazyId && built.lazyFailed[o.userData.lazyId]) { o.visible = false; return; }
            var s = ease((p - pt.appear) / 0.10);
            o.visible = s > 0.02;
            if (o.visible && (o.isMesh || o.isGroup)) {
              var bs = o.userData.baseScale || 1;
              o.scale.setScalar(Math.max(0.02, bs * (0.6 + 0.4 * s)));
              o.position.y = (o.userData.baseY || 0) + (1 - s) * 0.25;
            }
          });
          // Flow dots only once the power zone is built
          built.flowDots.forEach(function (dot) { dot.visible = p > 0.52; });
        }
        function computeScroll() {
          var story = document.getElementById('story');
          if (!story) return { p: 0, active: 0, local: 0 };
          var rect = story.getBoundingClientRect();
          var vh = window.innerHeight || 800;
          var total = Math.max(1, (story.offsetHeight || 1) - vh * 0.6);
          var p = Math.min(1, Math.max(0, (0 - rect.top + vh * 0.3) / total));
          var active = Math.min(3, Math.floor(p * 4));
          var local = Math.min(1, Math.max(0, (p - active * 0.25) / 0.25));
          return { p: p, active: active, local: local };
        }
        var ticking = false;
        function onScroll() {
          if (ticking) return; ticking = true;
          requestAnimationFrame(function () { ticking = false; var c = computeScroll(); state.target = c.p; state.active = c.active; state.local = c.local; setActive(c.active); state.targetDist = CAMDIST[c.active]; state.targetCamX = CAMX[c.active]; });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () { var s = fitCanvas(); renderer.setSize(s.w, s.h, false); built.camera.aspect = s.w / s.h; built.camera.updateProjectionMatrix(); onScroll(); });

        var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
        function pick(cx, cy) {
          var r = canvas.getBoundingClientRect();
          ndc.x = ((cx - r.left) / r.width) * 2 - 1; ndc.y = -((cy - r.top) / r.height) * 2 + 1;
          ray.setFromCamera(ndc, built.camera);
          var hits = ray.intersectObjects(built.allMeshes, false);
          for (var i = 0; i < hits.length; i++) { var o = hits[i].object; if (o.visible && o.userData.itemId && INFO[o.userData.itemId]) { if (caption) caption.textContent = INFO[o.userData.itemId]; return; } }
          if (caption) caption.textContent = CAPTION_DEFAULT;
        }
        canvas.addEventListener('pointerdown', function (e) { state.dragging = true; state.moved = 0; state.lastX = e.clientX; state.lastY = e.clientY; if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} } });
        canvas.addEventListener('pointermove', function (e) {
          if (!state.dragging) return;
          var dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
          state.lastX = e.clientX; state.lastY = e.clientY; state.moved += Math.abs(dx) + Math.abs(dy);
          state.rotY += dx * 0.008; state.rotX = Math.max(-0.9, Math.min(0.9, state.rotX + dy * 0.006));
        });
        canvas.addEventListener('pointerup', function (e) { state.dragging = false; if (state.moved < 6) pick(e.clientX, e.clientY); });
        canvas.addEventListener('pointercancel', function () { state.dragging = false; });
        canvas.addEventListener('wheel', function (e) { e.preventDefault(); state.dist = Math.max(3.2, Math.min(8, state.dist + (e.deltaY > 0 ? 0.3 : -0.3))); state.targetDist = state.dist; }, { passive: false });
        canvas.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); state.rotY += 0.25; }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); state.rotY -= 0.25; }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (caption) caption.textContent = INFO.darren; }
        });

        if (REDUCED) { state.cur = 1; state.target = 1; state.active = 3; state.local = 1; setActive(3); state.targetDist = CAMDIST[3]; state.dist = CAMDIST[3]; state.camX = 0; state.targetCamX = 0; applyAssembly(); }
        else { onScroll(); setTimeout(onScroll, 120); }

        var tmpPQ = new THREE.Quaternion();
        function frame(now) {
          requestAnimationFrame(frame);
          if (!REDUCED) {
            state.cur += (state.target - state.cur) * 0.12;
            var p = state.cur;
            state.active = Math.min(3, Math.floor(p * 4));
            state.local = Math.min(1, Math.max(0, (p - state.active * 0.25) / 0.25));
            setActive(state.active);
            state.targetDist = CAMDIST[state.active]; state.targetCamX = CAMX[state.active];
            applyAssembly();
          }
          state.dist += (state.targetDist - state.dist) * 0.08;
          state.camX += (state.targetCamX - state.camX) * 0.08;
          built.root.rotation.set(state.rotX, state.rotY, 0);
          built.camera.position.set(state.camX, 2.0, state.dist); built.camera.lookAt(state.camX * 0.6, 0.05, 0);
          // Labels always face the camera, whatever the orbit.
          for (var li = 0; li < built.labels.length; li++) {
            var lb = built.labels[li];
            if (!lb.visible) continue;
            lb.parent.getWorldQuaternion(tmpPQ); tmpPQ.invert();
            lb.quaternion.copy(tmpPQ.multiply(built.camera.quaternion));
          }
          if (!REDUCED && built.mixers.length) { var dt = Math.min(0.05, (now - lastT) / 1000); built.mixers.forEach(function (mx) { mx.update(dt); }); }
          lastT = now;
          if (built.flowDots.length && state.cur > 0.52) {
            var t = (((now - start) / 1000) * 0.25) % 1;
            built.flowDots.forEach(function (dot, di) {
              var tt = (t + di / built.flowDots.length) % 1;
              var seg = tt < 0.5 ? 0 : 1, lt = seg === 0 ? tt * 2 : (tt - 0.5) * 2;
              var a = built.busPts[seg], b = built.busPts[seg + 1];
              if (a && b) dot.position.set(a[0] + (b[0] - a[0]) * lt, a[1] + (b[1] - a[1]) * lt, a[2] + (b[2] - a[2]) * lt);
            });
          }
          // Control panel lamps blink while the scene animates. Under
          // reduced motion this block is skipped and they stay steady.
          if (built.blinkLamps && built.blinkLamps.length && !REDUCED) {
            var bt2 = (now - start) / 1000;
            built.blinkLamps.forEach(function (lamp) { lamp.mat.emissiveIntensity = Math.sin(bt2 * lamp.speed + lamp.phase) > 0.2 ? 1.9 : 0.12; });
          }
          // Verify loop pulse: travel the ring in station order and swell
          // each station marker as it passes. Hidden if reduced motion.
          if (built.pulse) {
            if (REDUCED) { built.pulse.visible = false; }
            else {
              var el2 = (now - start) / 1000;
              var th2 = Math.PI * 0.75 - el2 * (Math.PI * 2 / 9);
              built.pulse.visible = state.cur > 0.72;
              built.pulse.position.set(Math.cos(th2) * 5.2, 0.55, Math.sin(th2) * 5.2);
              built.pulseStations.forEach(function (ps) {
                var dd = Math.abs(Math.atan2(Math.sin(th2 - ps.angle), Math.cos(th2 - ps.angle)));
                var swell = Math.max(0, 1 - dd / 0.7);
                ps.mat.emissiveIntensity = 0.25 + swell * 1.7;
              });
            }
          }
          renderer.render(built.scene, built.camera);
        }
        requestAnimationFrame(frame);
      } catch (err) { drawFallback(0); }
    }).catch(function () { drawFallback(0); });
  }

  function initAll() {
    if (!canvas) return;
    if (!('IntersectionObserver' in window)) { init(); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { init(); io.disconnect(); } }); }, { rootMargin: '200px' });
    io.observe(canvas);
    setTimeout(function () { if (canvas.dataset.init !== '1') init(); }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
})();

/* Contact form: same pattern as the portfolio site. Fetch POST as JSON to
   Web3Forms with the hidden key field, inline success/error feedback, no
   page reload. The 3D scene code above is untouched. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var keyInput = document.getElementById('web3forms-key');
  var submitBtn = document.getElementById('form-submit');
  var feedback = document.getElementById('form-feedback');
  if (!keyInput || !submitBtn || !feedback) return;

  function setFeedback(msg, kind) {
    feedback.textContent = msg;
    feedback.className = 'contact-form__feedback' + (kind ? ' contact-form__feedback--' + kind : '');
  }

  function sendSuccess() {
    setFeedback('Query sent. Thank you, we will take a look.', 'success');
    form.reset();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Honeypot: humans never see or check this box. If it is checked,
       show the success state and send nothing. */
    var honey = form.querySelector('input[name="botcheck"]');
    if (honey && honey.checked) { sendSuccess(); return; }

    var key = keyInput.value.trim();
    if (!key) {
      setFeedback('This form is not configured yet. Please reach out via LinkedIn instead.', 'error');
      return;
    }

    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    setFeedback('', '');

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: key,
        apikey: key,
        subject: form.subject.value,
        from_name: form.from_name.value,
        name: form.name.value,
        email: form.email.value,
        message: form.message.value
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.success) { sendSuccess(); }
        else { setFeedback((data && data.message) || 'Something went wrong. Please try again.', 'error'); }
      })
      .catch(function () {
        setFeedback('Network error. Check your connection and try again.', 'error');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  });
})();
