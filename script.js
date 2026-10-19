(function () {
  'use strict';

  /* ---------- Nav ---------- */
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

  /* ---------- Story 3D: ONE sticky stage, scroll-driven ---------- */
  var REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { REDUCED = false; }

  var CANVAS_ID = 'story3d';
  window.__dl3d = { canvas: CANVAS_ID, status: 'idle', fallback: false };

  var CHAPTERS = [
    { id: 0, title: 'Studio \u2014 who does what', defaultItem: 'darren', camDist: 5.6 },
    { id: 1, title: 'VoltWorks \u2014 substation assembles', defaultItem: 'transformer', camDist: 6.4 },
    { id: 2, title: 'Patterns \u2014 loop builds', defaultItem: 'brief', camDist: 5.6 },
    { id: 3, title: 'Verify loop \u2014 pulled back', defaultItem: 'verify', camDist: 7.2 }
  ];
  var LEGENDS = {
    0: [
      ['#1a1e23', 'Ink = Darren (human)'],
      ['#0f6a5e', 'Teal = Flagships'],
      ['#c98a2b', 'Warm colours = Agent tools'],
      ['#9ab8b2', 'Thin lines = Direction']
    ],
    1: [
      ['#1a1e23', 'Dark = Structure / switchgear'],
      ['#0f6a5e', 'Teal = Transformer'],
      ['#e8b93c', 'Amber = Energized bus'],
      ['#2fa36b', 'Green lamp = Closed / live'],
      ['#c0392b', 'Red lamp = Open / off']
    ],
    2: [
      ['#1a1e23', 'Ink = Brief (human)'],
      ['#0f6a5e', 'Teal = Generate / Verify / Fix'],
      ['#e8b93c', 'Amber arrows = Next step'],
      ['#faf7f1', 'Centre = Verify loop']
    ],
    3: [
      ['#0f6a5e', 'Teal = Loop stations'],
      ['#e8b93c', 'Amber = Loop ring + arrows'],
      ['#1a1e23', 'Pulled back = whole system']
    ]
  };
  // chapter: 0 studio, 1 volt, 2 patterns, 2.5 patterns-visible-in-2-and-3, 3 ring-only-in-3
  var ITEM_DATA = [
    { id: 'darren', chapter: 0, appear: 0.00, title: 'Darren \u2014 sets direction', body: 'Darren decides the goal, scope, and what \u201cgood\u201d looks like. Agents do the building. Darren checks the result.', what: 'What it does: keeps every build pointed at a real outcome, not just output.' },
    { id: 'builder', chapter: 0, appear: 0.12, title: 'Builder \u2014 builds the first version', body: 'The Builder agent writes the code, pages, and structure from the brief. It ships a working first version, not a sketch.', what: 'What it does: turns a brief into something you can open and use.' },
    { id: 'checker', chapter: 0, appear: 0.22, title: 'Checker \u2014 verifies before handoff', body: 'The Checker compares the build against the brief and the acceptance checks. Nothing ships without evidence.', what: 'What it does: catches wrong numbers, broken links, and missing steps.' },
    { id: 'writer', chapter: 0, appear: 0.32, title: 'Writer \u2014 explains it plainly', body: 'The Writer turns technical work into plain language a beginner can follow, with steps and examples.', what: 'What it does: makes the app understandable, not just working.' },
    { id: 'calculator', chapter: 0, appear: 0.42, title: 'Calculator \u2014 checks the numbers', body: 'The Calculator agent runs the engineering math and shows its working, so results can be checked by hand.', what: 'What it does: numbers you can trust, with the steps shown.' },
    { id: 'designer', chapter: 0, appear: 0.52, title: 'Designer \u2014 makes it clear and calm', body: 'The Designer lays out pages so the important thing is obvious, with generous space and one clear action.', what: 'What it does: removes clutter so people finish the task.' },
    { id: 'researcher', chapter: 0, appear: 0.62, title: 'Researcher \u2014 finds what is true', body: 'The Researcher gathers standards, docs, and references, and notes what is official versus inferred.', what: 'What it does: stops the build from inventing facts.' },
    { id: 'voltworks', chapter: 0, appear: 0.75, title: 'VoltWorks Power \u2014 applied proof', body: 'Power-system CAD automation: true-scale 3D substation, SLD builder, and calculators that explain themselves.', what: 'What it proves: agents can build real engineering tools, not just demos.' },
    { id: 'patterns', chapter: 0, appear: 0.85, title: 'AI Architecture Patterns \u2014 thinking proof', body: 'A visual library of AI system designs: diagrams, tradeoffs, runnable demos, and when NOT to use each pattern.', what: 'What it proves: the judgment behind choosing the right system.' },
    { id: 'pylon', chapter: 1, appear: 0.05, title: 'Pylon \u2014 carries the overhead line', body: 'A lattice steel tower that holds conductors in the air at a safe height and spacing. The crossarm sets the phase separation.', what: 'Why it matters: height and spacing decide safety clearances and sag.' },
    { id: 'transformer', chapter: 1, appear: 0.30, title: 'Transformer \u2014 steps voltage', body: 'The transformer changes voltage so power can move safely from line to load. Fins cool it. The conservator on top handles oil expansion. Bushings carry the connections out.', what: 'Why it matters: get the rating and connections wrong and the design does not work in real life.' },
    { id: 'switchgear', chapter: 1, appear: 0.55, title: 'Switchgear \u2014 breaker + protection', body: 'Three cubicles: breaker, protection, and metering. Green lamp means closed and live. Red lamp means open and off. Doors and handles let an operator isolate a circuit.', what: 'Why it matters: this is where you safely open a circuit for work.' },
    { id: 'bus', chapter: 1, appear: 0.75, title: 'Bus line \u2014 the shared conductor', body: 'The bus connects pylon, transformer, and switchgear on one shared conductor. Toggle \u201cEnergized path\u201d to see power flow along it.', what: 'Why it matters: the bus is the backbone every circuit connects to.' },
    { id: 'scale', chapter: 1, appear: 0.85, title: 'Scale \u2014 1 unit = 1 metre', body: 'The figure is 1.8 m tall, the bar is 1 m long. The substation is drawn at true scale, so heights and clearances read as real.', what: 'Why it matters: real scale turns a diagram into a design you can build from.' },
    { id: 'brief', chapter: 2.5, appear: 0.05, title: '01 Brief \u2014 Darren sets direction', body: 'Darren writes what the app must do, who it is for, and what \u201cgood\u201d looks like. No building starts without this.', what: 'Example: \u201cBuild a calculator that explains itself to a beginner, with IEC 60364 checks.\u201d' },
    { id: 'generate', chapter: 2.5, appear: 0.25, title: '02 Generate \u2014 agents build v1', body: 'Agents build the first working version from the brief: code, pages, and structure you can open and test.', what: 'Example: a working calculator page, not a description of one.' },
    { id: 'verify', chapter: 2.5, appear: 0.45, title: '03 Verify \u2014 checked against criteria', body: 'Darren checks the build against explicit criteria: does it do what the brief asked, are the numbers right, is it clear?', what: 'Example: run the checks, read the output, compare to the brief.' },
    { id: 'fix', chapter: 2.5, appear: 0.65, title: '04 Fix \u2014 fix and re-verify', body: 'Agents fix what failed, then it is checked again. The loop repeats until it meets the bar.', what: 'Example: fix the formula, re-run the check, confirm it passes.' }
  ];

  function itemById(id) {
    for (var i = 0; i < ITEM_DATA.length; i++) { if (ITEM_DATA[i].id === id) return ITEM_DATA[i]; }
    return null;
  }
  function itemsForChapter(ch) {
    if (ch === 3) return ITEM_DATA.filter(function (d) { return d.chapter === 2.5; });
    return ITEM_DATA.filter(function (d) { return d.chapter === ch; });
  }

  var stageTitle = document.getElementById('story-stage-title');
  var legendEl = document.getElementById('story-legend');
  var chipsEl = document.getElementById('story-chips');
  var detailsWrap = document.getElementById('story3d-details');
  var labelEl = document.getElementById('story3d-label');
  var progressBar = document.getElementById('story-progress-bar');
  var voltFill = document.getElementById('volt-assembly-fill');
  var voltLabel = document.getElementById('volt-assembly-label');
  var chapterEls = Array.prototype.slice.call(document.querySelectorAll('.story-chapter'));

  var selectedId = 'darren';
  var activeChapter = 0;
  var lastChapter = -1;

  function renderLegend(ch) {
    if (!legendEl) return;
    legendEl.innerHTML = '';
    (LEGENDS[ch] || LEGENDS[0]).forEach(function (entry) {
      var li = document.createElement('li');
      var sw = document.createElement('span');
      sw.className = 'legend-swatch';
      sw.style.background = entry[0];
      li.appendChild(sw);
      li.appendChild(document.createTextNode(entry[1]));
      legendEl.appendChild(li);
    });
  }
  function renderChips(ch) {
    if (!chipsEl) return;
    chipsEl.innerHTML = '';
    itemsForChapter(ch).forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-item-select', CANVAS_ID);
      b.setAttribute('data-item', d.id);
      b.textContent = d.title.split(' \u2014 ')[0];
      if (d.id === selectedId) b.classList.add('active');
      b.addEventListener('click', function () { select(d.id, false); });
      chipsEl.appendChild(b);
    });
  }
  function setDetails(item) {
    if (!item || !detailsWrap) return;
    var t = detailsWrap.querySelector('h4');
    var b = detailsWrap.querySelector('p');
    var w = detailsWrap.querySelector('.viz-details-what');
    if (t) t.textContent = item.title;
    if (b) b.textContent = item.body;
    if (w) w.textContent = item.what;
    var chips = chipsEl ? chipsEl.querySelectorAll('button') : [];
    chips.forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-item') === item.id); });
    if (labelEl) labelEl.textContent = item.title + ' \u2014 see details above.';
  }
  // select is wired to the 3D highlight via window hook (set by initViz)
  function select(id, focusCanvas) {
    var data = itemById(id);
    if (!data) return;
    selectedId = id;
    setDetails(data);
    if (window.__dl3d && window.__dl3d.pick) window.__dl3d.pick(id);
    if (focusCanvas) {
      var cv = document.getElementById(CANVAS_ID);
      if (cv) { try { cv.focus({ preventScroll: true }); } catch (e) { cv.focus(); } }
    }
  }
  window.__dl3d.select = select;

  function setChapterUI(ch, progress, local) {
    activeChapter = ch;
    chapterEls.forEach(function (el) {
      el.classList.toggle('active', parseInt(el.getAttribute('data-chapter'), 10) === ch);
    });
    if (stageTitle) stageTitle.textContent = CHAPTERS[ch].title;
    if (progressBar && progress !== undefined) progressBar.style.width = Math.round(progress * 100) + '%';
    if (ch === 1 && voltFill && voltLabel) {
      voltFill.style.width = Math.round(local * 100) + '%';
      voltLabel.textContent = local < 0.05 ? 'Ground ready' : local < 0.30 ? 'Pylon going up' : local < 0.55 ? 'Transformer placed' : local < 0.75 ? 'Switchgear placed' : local < 0.90 ? 'Bus energized' : 'Substation complete';
    }
    if (ch !== lastChapter) {
      lastChapter = ch;
      renderLegend(ch);
      renderChips(ch);
      var def = itemById(CHAPTERS[ch].defaultItem);
      if (def) { selectedId = def.id; setDetails(def); }
    }
  }

  function fitCanvas(canvas) {
    var w = canvas.clientWidth || canvas.width || 640;
    var aspect = (canvas.width || 640) / (canvas.height || 420);
    var h = Math.round(w / aspect);
    if (h < 240) h = 240;
    if (h > 440) h = 440;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return { w: w, h: h, dpr: dpr };
  }

  function drawFallback2D(canvas, ch) {
    try {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      var size = fitCanvas(canvas);
      var dpr = size.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var W = size.w, H = size.h;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#eef2ef'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1a1e23'; ctx.font = '600 13px system-ui, sans-serif'; ctx.textAlign = 'center';
      function node(x, y, r, label, fill) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = '#1a1e23'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#1a1e23'; ctx.fillText(label, x, y + r + 16);
      }
      function line(x1, y1, x2, y2) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#0f6a5e'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (ch === 0) {
        var cx = W / 2, cy = H / 2 - 8;
        line(cx, cy, cx - 110, cy - 45); line(cx, cy, cx + 110, cy - 45);
        line(cx, cy, cx - 90, cy + 60); line(cx, cy, cx + 90, cy + 60);
        node(cx, cy, 26, 'Darren', '#1a1e23');
        node(cx - 110, cy - 45, 16, 'VoltWorks', '#0f6a5e');
        node(cx + 110, cy - 45, 16, 'Patterns', '#0f6a5e');
        node(cx - 90, cy + 60, 11, 'Builder', '#e8b93c');
        node(cx + 90, cy + 60, 11, 'Checker', '#0f6a5e');
      } else if (ch === 1) {
        ctx.fillStyle = '#d9d2c0'; ctx.fillRect(0, H - 42, W, 42);
        node(W * 0.18, H - 90, 14, 'Pylon', '#faf7f1');
        node(W * 0.48, H - 70, 22, 'Transformer', '#0f6a5e');
        node(W * 0.76, H - 80, 16, 'Switchgear', '#1a1e23');
        line(W * 0.18, H - 90, W * 0.48, H - 70); line(W * 0.48, H - 70, W * 0.76, H - 80);
      } else {
        var pts = [[W * 0.18, H * 0.5, 'Brief'], [W * 0.40, H * 0.28, 'Generate'], [W * 0.62, H * 0.5, 'Verify'], [W * 0.82, H * 0.72, 'Fix']];
        for (var i = 0; i < pts.length; i++) { var a = pts[i], b2 = pts[(i + 1) % pts.length]; line(a[0], a[1], b2[0], b2[1]); }
        pts.forEach(function (p) { node(p[0], p[1], 16, p[2], '#0f6a5e'); });
        if (ch === 3) { ctx.font = '600 12px system-ui, sans-serif'; ctx.fillText('Verify loop \u2014 pulled back', W / 2, 20); }
      }
      window.__dl3d.fallback = true;
    } catch (e) { /* fallback must never break site */ }
  }

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
        s.src = urls[i]; s.async = true;
        s.onload = function () { if (window.THREE) resolve(window.THREE); else tryUrl(i + 1); };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        setTimeout(function () { if (!window.THREE && s.parentNode) { s.remove(); tryUrl(i + 1); } }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return threePromise;
  }

  function makeLabelSprite(THREE, text) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(250,247,241,0.96)';
    g.strokeStyle = '#1a1e23'; g.lineWidth = 3;
    var r = 14;
    g.beginPath();
    g.moveTo(r, 2); g.lineTo(254 - r, 2); g.quadraticCurveTo(254, 2, 254, r);
    g.lineTo(254, 62 - r); g.quadraticCurveTo(254, 62, 254 - r, 62);
    g.lineTo(r, 62); g.quadraticCurveTo(2, 62, 2, 62 - r);
    g.lineTo(2, r); g.quadraticCurveTo(2, 2, r, 2);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#1a1e23'; g.font = '700 26px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 34);
    var tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true }));
    spr.scale.set(1.15, 0.29, 1);
    return spr;
  }

  /* ---- Build ONE scene with all three worlds; visibility driven by scroll ---- */
  function buildStoryScene(THREE) {
    var scene = new THREE.Scene();
    scene.background = null;
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.8, 5.6);
    camera.lookAt(0, 0.1, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    var dir = new THREE.DirectionalLight(0xffffff, 0.75); dir.position.set(3, 5, 4); scene.add(dir);
    var dir2 = new THREE.DirectionalLight(0xfff2dd, 0.35); dir2.position.set(-4, 3, -3); scene.add(dir2);
    var group = new THREE.Group(); scene.add(group);
    var allObjects = []; // {obj, chapter, appear}
    var allMeshes = [];
    var items = []; // {id, meshes, anchor, chapter}

    function lam(hex) { return new THREE.MeshLambertMaterial({ color: hex }); }
    function tag(obj, chapter, appear, itemId) {
      obj.userData.chapter = chapter; obj.userData.appear = appear;
      if (itemId) obj.userData.itemId = itemId;
      allObjects.push(obj);
      return obj;
    }
    function mesh(geo, material, x, y, z, chapter, appear, itemId) {
      var m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z);
      group.add(m);
      tag(m, chapter, appear, itemId);
      allMeshes.push(m);
      return m;
    }
    function box(w, h, d, hex, x, y, z, chapter, appear, itemId) { return mesh(new THREE.BoxGeometry(w, h, d), lam(hex), x, y, z, chapter, appear, itemId); }
    function cyl(rt, rb, h, hex, x, y, z, chapter, appear, itemId, seg) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 18), lam(hex), x, y, z, chapter, appear, itemId); }
    function sph(r, hex, x, y, z, chapter, appear, itemId) { return mesh(new THREE.SphereGeometry(r, 24, 16), lam(hex), x, y, z, chapter, appear, itemId); }
    function torus(r, t, hex, x, y, z, chapter, appear, itemId) { return mesh(new THREE.TorusGeometry(r, t, 10, 24), lam(hex), x, y, z, chapter, appear, itemId); }
    function cone(r, h, hex, x, y, z, chapter, appear, itemId) { return mesh(new THREE.ConeGeometry(r, h, 18), lam(hex), x, y, z, chapter, appear, itemId); }
    function line(a, b, hex, opacity, chapter, appear) {
      var g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2])]);
      var l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: hex || 0x0f6a5e, transparent: true, opacity: opacity === undefined ? 0.55 : opacity }));
      group.add(l); tag(l, chapter, appear, null); return l;
    }
    function groundPlane(w, d, hex, y, chapter) {
      var g = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color: hex }));
      g.rotation.x = -Math.PI / 2; g.position.y = y; group.add(g); tag(g, chapter, 0, null); return g;
    }
    function grid(w, div, y, chapter) {
      var gh = new THREE.GridHelper(w, div, 0xd8d0bd, 0xe8e2d4);
      gh.position.y = y; group.add(gh); tag(gh, chapter, 0, null); return gh;
    }
    function label(text, x, y, z, chapter, appear, itemId) {
      var s = makeLabelSprite(THREE, text);
      s.position.set(x, y, z); group.add(s); tag(s, chapter, appear, itemId); return s;
    }
    function registerItem(id, meshes, anchor, chapter) {
      meshes.forEach(function (m) { m.userData.itemId = id; });
      items.push({ id: id, meshes: meshes, anchor: anchor, chapter: chapter });
    }

    var extra = { flowDots: [], busMats: [], busPath: [] };

    /* ---- Chapter 0: Studio ---- */
    groundPlane(7.5, 5.5, 0xe6dfd2, -1.05, 0);
    grid(7, 12, -1.04, 0);
    var dBase = cyl(0.42, 0.46, 0.08, 0x1a1e23, 0, -0.95, 0, 0, 0, 'darren', 24);
    var dBody = cyl(0.20, 0.26, 0.95, 0x1a1e23, 0, -0.42, 0, 0, 0, 'darren');
    var dHead = sph(0.28, 0xd9a97a, 0, 0.28, 0, 0, 0, 'darren');
    var dHat = cyl(0.24, 0.26, 0.10, 0x0f6a5e, 0, 0.50, 0, 0, 0, 'darren');
    label('Darren', 0, 0.95, 0, 0, 0, 'darren');
    registerItem('darren', [dBase, dBody, dHead, dHat], new THREE.Vector3(0, 0, 0), 0);

    function agentAt(id, x, z, appear, buildFn, labelText) {
      var disc = cyl(0.38, 0.42, 0.07, 0xf2eee5, x, -0.98, z, 0, appear, id, 24);
      var parts = buildFn(x, z, id, appear);
      label(labelText, x, 0.95, z, 0, appear, id);
      line([0, 0.1, 0], [x, -0.4, z], 0x9ab8b2, 0.5, 0, appear);
      registerItem(id, [disc].concat(parts), new THREE.Vector3(x, 0, z), 0);
    }
    agentAt('builder', 1.95, 0, 0.12, function (x, z, id, ap) {
      var handle = box(0.09, 0.75, 0.09, 0x8a5a2b, x, -0.5, z, 0, ap, id);
      var head = box(0.52, 0.14, 0.14, 0x1a1e23, x, -0.08, z, 0, ap, id);
      var claw = box(0.14, 0.10, 0.10, 0x1a1e23, x + 0.26, -0.08, z, 0, ap, id);
      return [handle, head, claw];
    }, 'Builder');
    agentAt('checker', 0.98, 1.68, 0.22, function (x, z, id, ap) {
      var ring = torus(0.28, 0.05, 0x0f6a5e, x, -0.35, z, 0, ap, id);
      var lens = mesh(new THREE.CircleGeometry(0.24, 24), new THREE.MeshLambertMaterial({ color: 0xcfe8e2, transparent: true, opacity: 0.85 }), x, -0.35, z + 0.02, 0, ap, id);
      var handle = cyl(0.05, 0.05, 0.5, 0x1a1e23, x + 0.28, -0.78, z, 0, ap, id);
      handle.rotation.z = -0.7;
      return [ring, lens, handle];
    }, 'Checker');
    agentAt('writer', -0.98, 1.68, 0.32, function (x, z, id, ap) {
      var body = cyl(0.09, 0.09, 0.6, 0x2b5aa6, x, -0.5, z, 0, ap, id);
      var tip = cone(0.09, 0.22, 0x1a1e23, x, -0.90, z, 0, ap, id);
      tip.rotation.x = Math.PI;
      var clip = box(0.05, 0.3, 0.03, 0xe8b93c, x + 0.10, -0.42, z, 0, ap, id);
      return [body, tip, clip];
    }, 'Writer');
    agentAt('calculator', -1.95, 0, 0.42, function (x, z, id, ap) {
      var body = box(0.52, 0.68, 0.14, 0xc98a2b, x, -0.55, z, 0, ap, id);
      var screen = box(0.38, 0.16, 0.02, 0xfaf7f1, x, -0.38, z + 0.08, 0, ap, id);
      var btns = [];
      for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) {
        btns.push(box(0.10, 0.10, 0.03, 0xfaf7f1, x - 0.14 + c * 0.14, -0.62 - r * 0.14, z + 0.08, 0, ap, id));
      }
      return [body, screen].concat(btns);
    }, 'Calculator');
    agentAt('designer', -0.98, -1.68, 0.52, function (x, z, id, ap) {
      var pal = sph(0.32, 0x0f6a5e, x, -0.55, z, 0, ap, id);
      pal.scale.set(1, 0.45, 1);
      var dots = [
        sph(0.06, 0xe8b93c, x - 0.12, -0.42, z + 0.10, 0, ap, id),
        sph(0.06, 0xc0392b, x + 0.08, -0.42, z + 0.12, 0, ap, id),
        sph(0.06, 0x2b5aa6, x + 0.02, -0.42, z - 0.10, 0, ap, id)
      ];
      return [pal].concat(dots);
    }, 'Designer');
    agentAt('researcher', 0.98, -1.68, 0.62, function (x, z, id, ap) {
      var cover = box(0.55, 0.08, 0.42, 0x7a4a8a, x, -0.62, z, 0, ap, id);
      var pages = box(0.50, 0.22, 0.38, 0xfaf7f1, x, -0.50, z, 0, ap, id);
      var cover2 = box(0.55, 0.08, 0.42, 0x7a4a8a, x, -0.36, z, 0, ap, id);
      cover2.rotation.z = 0.18;
      return [cover, pages, cover2];
    }, 'Researcher');
    var vwBase = box(0.9, 0.08, 0.6, 0xf2eee5, 2.85, -0.98, -1.0, 0, 0.75, 'voltworks');
    var vwPole = cyl(0.05, 0.06, 0.9, 0x1a1e23, 2.55, -0.5, -1.0, 0, 0.75, 'voltworks');
    var vwArm = box(0.5, 0.07, 0.07, 0x1a1e23, 2.55, -0.12, -1.0, 0, 0.75, 'voltworks');
    var vwTank = box(0.55, 0.5, 0.4, 0x0f6a5e, 3.05, -0.70, -1.0, 0, 0.75, 'voltworks');
    var vwFin = box(0.08, 0.3, 0.4, 0x0b4f47, 3.36, -0.70, -1.0, 0, 0.75, 'voltworks');
    label('VoltWorks', 2.85, 0.35, -1.0, 0, 0.75, 'voltworks');
    line([0, 0, 0], [2.85, -0.6, -1.0], 0x0f6a5e, 0.8, 0, 0.75);
    registerItem('voltworks', [vwBase, vwPole, vwArm, vwTank, vwFin], new THREE.Vector3(2.85, -0.4, -1.0), 0);
    var p1 = box(0.65, 0.06, 0.5, 0xfaf7f1, -2.85, -0.70, -1.0, 0, 0.85, 'patterns');
    var p2 = box(0.65, 0.06, 0.5, 0x0f6a5e, -2.85, -0.60, -1.0, 0, 0.85, 'patterns');
    var p3 = box(0.65, 0.06, 0.5, 0xe8b93c, -2.85, -0.50, -1.0, 0, 0.85, 'patterns');
    var pBase = box(0.9, 0.08, 0.6, 0xf2eee5, -2.85, -0.98, -1.0, 0, 0.85, 'patterns');
    label('Patterns', -2.85, 0.05, -1.0, 0, 0.85, 'patterns');
    line([0, 0, 0], [-2.85, -0.6, -1.0], 0x0f6a5e, 0.8, 0, 0.85);
    registerItem('patterns', [p1, p2, p3, pBase], new THREE.Vector3(-2.85, -0.4, -1.0), 0);

    /* ---- Chapter 1: VoltWorks substation ---- */
    groundPlane(10, 6, 0xd9d2c0, -1.0, 1);
    grid(10, 16, -0.99, 1);
    var pylParts = [];
    [[-2.85, -0.25], [-2.35, -0.25], [-2.85, 0.25], [-2.35, 0.25]].forEach(function (lp) {
      var leg = cyl(0.045, 0.07, 2.3, 0x1a1e23, lp[0], 0.15, lp[1], 1, 0.05, 'pylon');
      leg.rotation.z = (lp[0] < -2.6 ? 0.12 : -0.12);
      leg.rotation.x = (lp[1] < 0 ? 0.12 : -0.12);
      pylParts.push(leg);
    });
    var cross = box(1.7, 0.10, 0.14, 0x1a1e23, -2.6, 1.15, 0, 1, 0.05, 'pylon'); pylParts.push(cross);
    var peak = cyl(0.04, 0.04, 0.5, 0x1a1e23, -2.6, 1.45, 0, 1, 0.05, 'pylon'); pylParts.push(peak);
    [-3.25, -2.6, -1.95].forEach(function (ix) {
      for (var ii = 0; ii < 3; ii++) {
        pylParts.push(cyl(0.09, 0.09, 0.07, 0xfaf7f1, ix, 1.02 - ii * 0.09, 0, 1, 0.05, 'pylon'));
      }
    });
    label('Pylon', -2.6, 1.85, 0, 1, 0.05, 'pylon');
    registerItem('pylon', pylParts, new THREE.Vector3(-2.6, 0.5, 0), 1);

    var trParts = [];
    var tank = box(1.25, 1.05, 0.95, 0x0f6a5e, -0.3, -0.45, 0, 1, 0.30, 'transformer'); trParts.push(tank);
    for (var f = 0; f < 5; f++) {
      trParts.push(box(0.08, 0.7, 0.85, 0x0b4f47, -0.98, -0.45, -0.36 + f * 0.18, 1, 0.30, 'transformer'));
      trParts.push(box(0.08, 0.7, 0.85, 0x0b4f47, 0.38, -0.45, -0.36 + f * 0.18, 1, 0.30, 'transformer'));
    }
    var cons = cyl(0.22, 0.22, 0.95, 0x1a1e23, -0.3, 0.32, 0, 1, 0.30, 'transformer'); cons.rotation.z = Math.PI / 2; trParts.push(cons);
    [-0.70, -0.30, 0.10].forEach(function (bx) {
      trParts.push(cyl(0.06, 0.08, 0.55, 0xfaf7f1, bx, 0.35, 0, 1, 0.30, 'transformer'));
      for (var bi = 0; bi < 3; bi++) {
        trParts.push(cyl(0.11, 0.11, 0.04, 0x8a8a8a, bx, 0.20 + bi * 0.15, 0, 1, 0.30, 'transformer'));
      }
    });
    trParts.push(box(0.5, 0.32, 0.03, 0xfaf7f1, -0.3, -0.45, 0.49, 1, 0.30, 'transformer'));
    trParts.push(box(1.5, 0.12, 1.15, 0x1a1e23, -0.3, -1.0, 0, 1, 0.30, 'transformer'));
    label('Transformer', -0.3, 1.05, 0, 1, 0.30, 'transformer');
    registerItem('transformer', trParts, new THREE.Vector3(-0.3, -0.2, 0), 1);

    var swParts = [];
    for (var ci = 0; ci < 3; ci++) {
      var cx = 1.55 + ci * 0.70;
      swParts.push(box(0.62, 1.25, 0.62, 0x1a1e23, cx, -0.35, 0, 1, 0.55, 'switchgear'));
      swParts.push(box(0.50, 1.05, 0.04, 0x2a2f34, cx, -0.35, 0.32, 1, 0.55, 'switchgear'));
      swParts.push(box(0.06, 0.22, 0.06, 0xe8b93c, cx + 0.16, -0.35, 0.36, 1, 0.55, 'switchgear'));
      swParts.push(sph(0.07, (ci < 2 ? 0x2fa36b : 0xc0392b), cx - 0.16, 0.22, 0.32, 1, 0.55, 'switchgear'));
      swParts.push(box(0.3, 0.08, 0.02, 0x5a625e, cx, -0.75, 0.32, 1, 0.55, 'switchgear'));
    }
    label('Switchgear', 2.25, 0.65, 0, 1, 0.55, 'switchgear');
    registerItem('switchgear', swParts, new THREE.Vector3(2.25, -0.2, 0), 1);

    var busMat = new THREE.MeshLambertMaterial({ color: 0xe8b93c, emissive: new THREE.Color(0x8a6a00) });
    extra.busMats.push(busMat);
    var busPts = [[-2.6, 1.05, 0], [-0.3, 0.72, 0], [2.25, 0.42, 0]];
    function busSeg(a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 10), busMat);
      c.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      c.userData.itemId = 'bus';
      group.add(c); tag(c, 1, 0.75, 'bus'); allMeshes.push(c);
      var up = new THREE.Vector3(0, 1, 0);
      var dirV = new THREE.Vector3(dx, dy, dz).normalize();
      c.quaternion.setFromUnitVectors(up, dirV);
      return c;
    }
    var b1 = busSeg(busPts[0], busPts[1]);
    var b2 = busSeg(busPts[1], busPts[2]);
    extra.busPath = busPts;
    for (var di = 0; di < 6; di++) {
      var dot = sph(0.08, 0xffd94d, 0, 0, 0, 1, 0.85, 'bus');
      dot.visible = true; extra.flowDots.push(dot);
    }
    label('Bus line', 0.95, 1.05, 0, 1, 0.75, 'bus');
    registerItem('bus', [b1, b2].concat(extra.flowDots), new THREE.Vector3(0.95, 0.7, 0), 1);

    var scParts = [];
    scParts.push(sph(0.12, 0xd9a97a, 3.15, 0.95, 0.9, 1, 0.85, 'scale'));
    scParts.push(cyl(0.13, 0.15, 1.15, 0x1a1e23, 3.15, 0.25, 0.9, 1, 0.85, 'scale'));
    scParts.push(cyl(0.11, 0.13, 0.45, 0x2a2f34, 3.15, -0.72, 0.9, 1, 0.85, 'scale'));
    scParts.push(box(1.0, 0.06, 0.06, 0xe8b93c, 3.15, -0.97, 0.9, 1, 0.85, 'scale'));
    label('1.8 m person \u2022 1 m bar', 3.15, 1.35, 0.9, 1, 0.85, 'scale');
    registerItem('scale', scParts, new THREE.Vector3(3.15, 0, 0.9), 1);

    /* ---- Chapters 2 + 3: Patterns loop (chapter 2.5 = visible in both) ---- */
    groundPlane(7.5, 5.5, 0xe6dfd2, -1.05, 2.5);
    grid(7, 12, -1.04, 2.5);
    var hub = cyl(0.55, 0.6, 0.16, 0xf2eee5, 0, -0.98, 0, 2.5, 0, null, 28);
    var hubTop = cyl(0.35, 0.35, 0.10, 0x0f6a5e, 0, -0.86, 0, 2.5, 0, null);
    label('Verify loop', 0, -0.35, 0, 2.5, 0, null);
    var loopRing = torus(2.05, 0.045, 0xe8b93c, 0, -0.92, 0, 3, 0, null);
    loopRing.rotation.x = Math.PI / 2;
    var stations = [
      { id: 'brief', x: -2.05, z: 0, ap: 0.05, lbl: 'Brief' },
      { id: 'generate', x: 0, z: 2.05, ap: 0.25, lbl: 'Generate' },
      { id: 'verify', x: 2.05, z: 0, ap: 0.45, lbl: 'Verify' },
      { id: 'fix', x: 0, z: -2.05, ap: 0.65, lbl: 'Fix' }
    ];
    var NUMS = { brief: '01', generate: '02', verify: '03', fix: '04' };
    stations.forEach(function (st) {
      var parts = [];
      parts.push(cyl(0.58, 0.62, 0.09, 0xf2eee5, st.x, -0.98, st.z, 2.5, st.ap, st.id, 28));
      var numSpr = makeLabelSprite(THREE, NUMS[st.id] + ' ' + st.lbl);
      numSpr.position.set(st.x, 0.95, st.z); group.add(numSpr); tag(numSpr, 2.5, st.ap, st.id);
      if (st.id === 'brief') {
        parts.push(box(0.52, 0.68, 0.06, 0x1a1e23, st.x, -0.35, st.z, 2.5, st.ap, st.id));
        parts.push(box(0.22, 0.08, 0.08, 0xe8b93c, st.x, 0.02, st.z, 2.5, st.ap, st.id));
        for (var li = 0; li < 3; li++) { parts.push(box(0.34, 0.05, 0.02, 0xfaf7f1, st.x, -0.18 - li * 0.14, st.z + 0.04, 2.5, st.ap, st.id)); }
      } else if (st.id === 'generate') {
        var gear1 = torus(0.26, 0.07, 0x0f6a5e, st.x - 0.14, -0.45, st.z, 2.5, st.ap, st.id); gear1.rotation.x = Math.PI / 2; parts.push(gear1);
        var gear2 = torus(0.18, 0.06, 0xc98a2b, st.x + 0.22, -0.45, st.z, 2.5, st.ap, st.id); gear2.rotation.x = Math.PI / 2; parts.push(gear2);
        parts.push(cyl(0.08, 0.08, 0.12, 0x1a1e23, st.x - 0.14, -0.45, st.z, 2.5, st.ap, st.id));
      } else if (st.id === 'verify') {
        var shield = sph(0.30, 0x0f6a5e, st.x, -0.45, st.z, 2.5, st.ap, st.id); shield.scale.set(1, 1.15, 0.45); parts.push(shield);
        var chk1 = box(0.22, 0.07, 0.05, 0xfaf7f1, st.x - 0.08, -0.50, st.z + 0.16, 2.5, st.ap, st.id); chk1.rotation.z = 0.7; parts.push(chk1);
        var chk2 = box(0.34, 0.07, 0.05, 0xfaf7f1, st.x + 0.10, -0.44, st.z + 0.16, 2.5, st.ap, st.id); chk2.rotation.z = -0.7; parts.push(chk2);
      } else {
        parts.push(box(0.10, 0.55, 0.08, 0x1a1e23, st.x, -0.55, st.z, 2.5, st.ap, st.id));
        parts.push(torus(0.18, 0.07, 0x0f6a5e, st.x, -0.18, st.z, 2.5, st.ap, st.id));
        var arrow = torus(0.38, 0.045, 0xe8b93c, st.x, -0.45, st.z, 2.5, st.ap, st.id); arrow.rotation.x = Math.PI / 2; parts.push(arrow);
      }
      var idx = stations.indexOf(st);
      var nxt = stations[(idx + 1) % stations.length];
      var mx = (st.x + nxt.x) / 2, mz = (st.z + nxt.z) / 2;
      var ang = Math.atan2(nxt.z - st.z, nxt.x - st.x);
      var coneM = cone(0.12, 0.32, 0xe8b93c, mx, -0.55, mz, 2.5, st.ap, st.id);
      coneM.rotation.z = -Math.PI / 2; coneM.rotation.y = -ang; parts.push(coneM);
      line([st.x, -0.95, st.z], [nxt.x, -0.95, nxt.z], 0x0f6a5e, 0.45, 2.5, st.ap);
      registerItem(st.id, parts, new THREE.Vector3(st.x, -0.2, st.z), 2.5);
    });

    return { scene: scene, camera: camera, group: group, items: items, allObjects: allObjects, allMeshes: allMeshes, extra: extra };
  }

  function chapterWeight(chapterOfObj, progress, activeCh) {
    // progress 0..1, chapter ranges: 0:[0,.25) 1:[.25,.5) 2:[.5,.75) 3:[.75,1]
    if (chapterOfObj === 2.5) {
      // visible in chapters 2 and 3
      if (activeCh === 2 || activeCh === 3) return 1;
      return 0;
    }
    if (chapterOfObj === 3) return activeCh === 3 ? 1 : 0;
    return chapterOfObj === activeCh ? 1 : 0;
  }

  function initViz() {
    var canvas = document.getElementById(CANVAS_ID);
    if (!canvas || canvas.dataset.init === '1') return;
    canvas.dataset.init = '1';
    window.__dl3d.status = 'loading';

    var webglOK = true;
    try {
      var test = document.createElement('canvas');
      webglOK = !!(test.getContext('webgl') || test.getContext('experimental-webgl'));
    } catch (e) { webglOK = false; }
    if (!webglOK) {
      drawFallback2D(canvas, 0);
      if (labelEl) labelEl.textContent = '3D not available here \u2014 static diagram shown.';
      window.__dl3d.status = 'fallback-no-webgl';
      renderLegend(0); renderChips(0);
      return;
    }

    loadThree().then(function (THREE) {
      try {
        var built = buildStoryScene(THREE);
        var size = fitCanvas(canvas);
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size.w, size.h, false);
        built.camera.aspect = size.w / size.h;
        built.camera.updateProjectionMatrix();

        var state = { rotX: 0.08, rotY: 0, velX: 0, velY: 0, dragging: false, lastX: 0, lastY: 0, moved: 0, dist: 5.6, targetDist: 5.6, pinch: 0, focus: new THREE.Vector3(0, 0, 0), focusTarget: new THREE.Vector3(0, 0, 0), pauseUntil: 0 };
        var energized = true;
        var clockStart = performance.now();
        var scrollProgress = 0;
        var scrollLocal = 0;
        var scrollActive = 0;

        var btnEnergized = document.getElementById('story-energized');
        function syncEnergized() {
          if (!btnEnergized) return;
          btnEnergized.setAttribute('aria-pressed', energized ? 'true' : 'false');
          btnEnergized.textContent = energized ? 'Energized path: On' : 'Energized path: Off';
          btnEnergized.classList.toggle('viz-toggle-on', energized);
        }
        if (btnEnergized) btnEnergized.addEventListener('click', function () { energized = !energized; syncEnergized(); });
        var btnNext = document.getElementById('story-next');
        if (btnNext) btnNext.addEventListener('click', function () {
          var next = Math.min(3, scrollActive + 1);
          var el = document.getElementById('story-chapter-' + next);
          if (el) el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
        });

        function clearHighlight() {
          built.allMeshes.forEach(function (m) {
            if (m.material && m.material.emissive) m.material.emissive.setHex(0x000000);
          });
        }
        function applyHighlight(item) {
          clearHighlight();
          if (!item) return;
          item.meshes.forEach(function (m) {
            if (m.material && m.material.emissive) m.material.emissive.setHex(0x2fa36b);
          });
          state.focusTarget.copy(item.anchor).multiplyScalar(-0.35);
          state.targetDist = Math.max(3.8, CHAPTERS[scrollActive].camDist - 1.0);
        }
        window.__dl3d.pick = function (id) {
          var found = null;
          for (var i = 0; i < built.items.length; i++) { if (built.items[i].id === id) found = built.items[i]; }
          if (found) applyHighlight(found);
        };

        function computeScroll() {
          var story = document.getElementById('story');
          if (!story) return { progress: 0, active: 0, local: 0 };
          var rect = story.getBoundingClientRect();
          var storyH = story.offsetHeight || 1;
          var vh = window.innerHeight || 800;
          // progress: 0 when story top hits viewport centre, 1 when story bottom passes
          var total = Math.max(1, storyH - vh * 0.6);
          var done = Math.min(1, Math.max(0, (0 - rect.top + vh * 0.3) / total));
          // Alternative stable mapping: use scroll position within story section
          var p = done;
          var active = Math.min(3, Math.floor(p * 4));
          var local = Math.min(1, Math.max(0, (p - active * 0.25) / 0.25));
          return { progress: p, active: active, local: local };
        }

        function applyVisibility() {
          var p = scrollProgress, active = scrollActive, local = scrollLocal;
          if (REDUCED) {
            // Final assembled state: show patterns loop fully
            built.allObjects.forEach(function (o) {
              var ch = o.obj ? o.obj.userData.chapter : o.userData.chapter;
              o.visible = (ch === 2.5 || ch === 3);
            });
            return;
          }
          built.allObjects.forEach(function (obj) {
            var ch = obj.userData.chapter;
            var ap = obj.userData.appear || 0;
            var w = chapterWeight(ch, p, active);
            var show = false;
            if (w > 0) {
              if (ch === 2.5) {
                var lp = active === 3 ? 1 : local;
                show = lp >= ap;
              } else if (ch === 3) {
                show = active === 3;
              } else {
                show = local >= ap;
              }
            }
            obj.visible = show;
          });
        }

        var ticking = false;
        function onScroll() {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(function () {
            ticking = false;
            if (Date.now() < state.pauseUntil) return; // drag pauses scroll-drive for 3s
            var c = computeScroll();
            scrollProgress = c.progress; scrollActive = c.active; scrollLocal = c.local;
            setChapterUI(c.active, c.progress, c.local);
            state.targetDist = CHAPTERS[c.active].camDist;
            applyVisibility();
          });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () {
          var s = fitCanvas(canvas);
          renderer.setSize(s.w, s.h, false);
          built.camera.aspect = s.w / s.h;
          built.camera.updateProjectionMatrix();
          onScroll();
        });

        var ray = new THREE.Raycaster();
        var pointerNDC = new THREE.Vector2();
        function pick(clientX, clientY) {
          var rect = canvas.getBoundingClientRect();
          pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
          pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
          ray.setFromCamera(pointerNDC, built.camera);
          var hits = ray.intersectObjects(built.allMeshes, false);
          // only pick visible objects
          for (var i = 0; i < hits.length; i++) {
            var o = hits[i].object;
            if (o.visible && o.userData.itemId) { select(o.userData.itemId, false); return; }
          }
          clearHighlight();
          state.focusTarget.set(0, 0, 0);
          state.targetDist = CHAPTERS[scrollActive].camDist;
          var chips = chipsEl ? chipsEl.querySelectorAll('button') : [];
          chips.forEach(function (c) { c.classList.remove('active'); });
        }
        function onDown(e) {
          state.dragging = true; state.moved = 0;
          state.lastX = e.clientX; state.lastY = e.clientY;
          if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
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
          state.pauseUntil = Date.now() + 3000;
          if (state.moved < 6) pick(e.clientX, e.clientY);
        }
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', function () { state.dragging = false; state.pauseUntil = Date.now() + 3000; });
        canvas.addEventListener('wheel', function (e) {
          e.preventDefault();
          state.dist = Math.max(3.2, Math.min(8, state.dist + (e.deltaY > 0 ? 0.3 : -0.3)));
          state.targetDist = state.dist;
        }, { passive: false });
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
              state.targetDist = state.dist;
            }
            state.pinch = d;
          }
        });
        canvas.addEventListener('pointerup', function (e) { pointers.delete(e.pointerId); state.pinch = 0; });
        canvas.addEventListener('pointercancel', function (e) { pointers.delete(e.pointerId); state.pinch = 0; });
        canvas.addEventListener('keydown', function (e) {
          var list = itemsForChapter(scrollActive);
          if (!list.length) return;
          var idx = 0;
          for (var i = 0; i < list.length; i++) { if (list[i].id === selectedId) idx = i; }
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(list[(idx + 1) % list.length].id, false); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(list[(idx - 1 + list.length) % list.length].id, false); }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(list[idx].id, false); }
        });

        // Initial state
        renderLegend(0); renderChips(0);
        var initDef = itemById('darren');
        if (initDef) setDetails(initDef);
        if (REDUCED) {
          scrollActive = 3; scrollProgress = 1; scrollLocal = 1;
          setChapterUI(3, 1, 1);
          state.targetDist = CHAPTERS[3].camDist;
          state.dist = CHAPTERS[3].camDist;
          applyVisibility();
        } else {
          onScroll();
          // force one sync after layout
          setTimeout(onScroll, 120);
        }

        var last = performance.now();
        function frame(now) {
          requestAnimationFrame(frame);
          var dt = Math.min(0.05, (now - last) / 1000); last = now;
          if (!state.dragging) {
            state.rotY += state.velY * 0.92; state.rotX += state.velX * 0.92;
            state.velY *= 0.92; state.velX *= 0.92;
          }
          state.focus.lerp(state.focusTarget, 0.08);
          state.dist += (state.targetDist - state.dist) * 0.08;
          built.group.rotation.set(state.rotX, state.rotY, 0);
          built.group.position.copy(state.focus);
          built.camera.position.set(0, 1.8, state.dist);
          built.camera.lookAt(0, 0.1, 0);
          if (built.extra && built.extra.flowDots && built.extra.flowDots.length) {
            var showFlow = energized && scrollActive === 1 && scrollLocal > 0.85;
            var t = (((now - clockStart) / 1000) * 0.25) % 1;
            var path = built.extra.busPath || [];
            built.extra.flowDots.forEach(function (dot, di) {
              dot.visible = showFlow && dot.visible !== false && true;
              // dot visibility is also gated by applyVisibility (appear 0.85); keep flow only when chapter active
              if (!showFlow) { dot.visible = false; return; }
              dot.visible = true;
              var tt = (t + di / built.extra.flowDots.length) % 1;
              var seg = tt < 0.5 ? 0 : 1;
              var lt = seg === 0 ? tt * 2 : (tt - 0.5) * 2;
              var a = path[seg], b = path[seg + 1];
              if (a && b) dot.position.set(a[0] + (b[0] - a[0]) * lt, a[1] + (b[1] - a[1]) * lt, a[2] + (b[2] - a[2]) * lt);
            });
            built.extra.busMats.forEach(function (bm) { bm.emissive.setHex(energized && scrollActive === 1 ? 0x8a6a00 : 0x000000); });
          }
          renderer.render(built.scene, built.camera);
        }
        requestAnimationFrame(frame);
        window.__dl3d.status = 'webgl';
      } catch (err) {
        drawFallback2D(canvas, 0);
        if (labelEl) labelEl.textContent = '3D could not start \u2014 static diagram shown.';
        window.__dl3d.status = 'fallback-error';
        renderLegend(0); renderChips(0);
      }
    }).catch(function () {
      drawFallback2D(canvas, 0);
      if (labelEl) labelEl.textContent = '3D library could not load \u2014 static diagram shown.';
      window.__dl3d.status = 'fallback-no-cdn';
      renderLegend(0); renderChips(0);
    });
  }

  function initAll() {
    renderLegend(0); renderChips(0);
    var def = itemById('darren');
    if (def) setDetails(def);
    var canvas = document.getElementById(CANVAS_ID);
    if (!canvas) return;
    if (!('IntersectionObserver' in window)) { initViz(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { initViz(); io.disconnect(); }
      });
    }, { rootMargin: '200px' });
    io.observe(canvas);
    setTimeout(function () {
      if (canvas.dataset.init !== '1') initViz();
    }, 300);
    // Fallback chapter UI: if 3D never loads, still update chapter highlight on scroll
    var fallbackTick = false;
    window.addEventListener('scroll', function () {
      if (fallbackTick) return;
      fallbackTick = true;
      requestAnimationFrame(function () {
        fallbackTick = false;
        if (window.__dl3d.status === 'webgl' || window.__dl3d.status === 'loading') return;
        var story = document.getElementById('story');
        if (!story) return;
        var rect = story.getBoundingClientRect();
        var total = Math.max(1, (story.offsetHeight || 1) - (window.innerHeight || 800) * 0.6);
        var p = Math.min(1, Math.max(0, (0 - rect.top + (window.innerHeight || 800) * 0.3) / total));
        var active = Math.min(3, Math.floor(p * 4));
        var local = Math.min(1, Math.max(0, (p - active * 0.25) / 0.25));
        setChapterUI(active, p, local);
        drawFallback2D(canvas, active);
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
