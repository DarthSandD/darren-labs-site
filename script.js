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

  /* Projects dropdown: click toggles, hover opens on desktop (CSS),
     Escape closes, arrow keys move through the menu links. */
  var dd = document.querySelector('.nav-dropdown');
  if (dd) {
    var ddBtn = dd.querySelector('.nav-drop-btn');
    var ddLinks = Array.prototype.slice.call(dd.querySelectorAll('.nav-menu a'));
    var setDd = function (open) {
      dd.classList.toggle('open', open);
      ddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    ddBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setDd(!dd.classList.contains('open'));
    });
    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target)) setDd(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dd.classList.contains('open')) { setDd(false); ddBtn.focus(); }
    });
    ddBtn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDd(true);
        if (ddLinks.length) ddLinks[0].focus();
      }
    });
    ddLinks.forEach(function (l, i) {
      l.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); var n = ddLinks[i + 1] || ddLinks[0]; n.focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); var p = ddLinks[i - 1] || ddBtn; p.focus(); }
      });
    });
  }
})();

/* Contact form: Fetch POST as JSON to Web3Forms with the hidden key
   field, inline success/error feedback, no page reload. */
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

/* Flagship slider: Apple-style swipe. One spring drives the track.
   1:1 pointer tracking, velocity handoff, momentum projection,
   rubber-band bounds, interruptible mid-flight. Reduced motion
   snaps instantly instead of springing. */
(function () {
  'use strict';
  var slider = document.getElementById('flag-slider');
  if (!slider) return;
  var viewport = slider.querySelector('.slider-viewport');
  var track = slider.querySelector('.slider-track');
  var slides = Array.prototype.slice.call(track.querySelectorAll('.flag-card'));
  var prevBtn = slider.querySelector('.slider-prev');
  var nextBtn = slider.querySelector('.slider-next');
  var countEl = slider.querySelector('.slider-count');
  var dots = Array.prototype.slice.call(slider.querySelectorAll('.slider-dot'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STIFFNESS = 260, DAMPING = 30, MASS = 1;
  var index = 0;
  var x = 0, v = 0, target = 0;
  var rafId = 0, lastT = 0;
  var dragging = false, moved = false, suppressClick = false;
  var startX = 0, startY = 0, dragStartX = 0, activePointer = null;
  var samples = [];

  function step() {
    var gap = parseFloat(window.getComputedStyle(track).gap) || 24;
    return slides[0].getBoundingClientRect().width + gap;
  }
  function maxIndex() { return slides.length - 1; }
  function clampIndex(i) { return Math.max(0, Math.min(maxIndex(), i)); }

  function applyX() {
    track.style.transform = 'translate3d(' + x + 'px,0,0)';
  }

  function updateUI() {
    countEl.textContent = (index + 1) + ' of ' + slides.length;
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === index);
      if (i === index) { d.setAttribute('aria-current', 'true'); }
      else { d.removeAttribute('aria-current'); }
    });
    slides.forEach(function (s, i) {
      s.classList.toggle('is-dim', i !== index);
    });
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === maxIndex();
  }

  function stopSpring() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    v = 0;
  }

  function springLoop(t) {
    var dt = Math.min((t - lastT) / 1000, 1 / 30);
    lastT = t;
    var a = (-STIFFNESS * (x - target) - DAMPING * v) / MASS;
    v += a * dt;
    x += v * dt;
    if (Math.abs(x - target) < 0.1 && Math.abs(v) < 0.1) {
      x = target; v = 0; rafId = 0; applyX(); updateUI(); return;
    }
    applyX();
    rafId = requestAnimationFrame(springLoop);
  }

  function springTo(t, velocity) {
    target = t;
    v = velocity || 0;
    if (reduced) {
      x = target; v = 0; applyX(); updateUI(); return;
    }
    if (!rafId) {
      lastT = performance.now();
      rafId = requestAnimationFrame(springLoop);
    }
  }

  function goTo(i, keepVelocity) {
    index = clampIndex(i);
    springTo(-index * step(), keepVelocity ? v : 0);
    updateUI();
  }

  function rubberband(overshoot, dimension, constant) {
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
  }

  function project(velocity) {
    return (velocity / 1000) * 0.998 / (1 - 0.998);
  }

  viewport.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (dragging) return;
    suppressClick = false;
    dragging = true;
    moved = false;
    activePointer = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dragStartX = x;
    samples = [{ px: e.clientX, t: performance.now() }];
    stopSpring();
    viewport.classList.add('dragging');
    try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
  });

  viewport.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== activePointer) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!moved) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) { dragging = false; viewport.classList.remove('dragging'); return; }
      moved = true;
      stopSpring();
    }
    var nx = dragStartX + dx;
    var minX = -maxIndex() * step();
    if (nx > 0) { nx = rubberband(nx, step(), 0.55); }
    else if (nx < minX) { nx = minX - rubberband(minX - nx, step(), 0.55); }
    x = nx;
    applyX();
    samples.push({ px: e.clientX, t: performance.now() });
    if (samples.length > 8) samples.shift();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    if (!moved) return;
    suppressClick = true;
    var now = performance.now();
    var recent = samples.filter(function (s) { return now - s.t <= 100; });
    var vel = 0;
    if (recent.length > 1) {
      var first = recent[0], last = recent[recent.length - 1];
      if (last.t > first.t) vel = (last.px - first.px) / (last.t - first.t) * 1000;
    }
    var projected = x + project(vel);
    index = clampIndex(Math.round(-projected / step()));
    springTo(-index * step(), vel);
    updateUI();
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', function () {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    if (moved) springTo(-index * step(), 0);
  });

  track.addEventListener('click', function (e) {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    }
  }, true);

  prevBtn.addEventListener('click', function () { goTo(index - 1, true); });
  nextBtn.addEventListener('click', function () { goTo(index + 1, true); });
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { goTo(i, true); });
  });

  slider.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1, true); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0, true); }
    else if (e.key === 'End') { e.preventDefault(); goTo(maxIndex(), true); }
  });

  window.addEventListener('resize', function () {
    stopSpring();
    x = -index * step();
    target = x;
    applyX();
  });

  applyX();
  updateUI();
})();

/* Speedbar token dots: measure each track once and on resize, so the
   dot travels the full track at the model's real relative speed. */
(function () {
  'use strict';
  var dots = Array.prototype.slice.call(document.querySelectorAll('.speedbar-track .speedbar-dot'));
  if (!dots.length) return;
  function measure() {
    dots.forEach(function (dot) {
      var track = dot.parentNode;
      var w = track.clientWidth - dot.offsetWidth;
      track.style.setProperty('--track', Math.max(w, 0) + 'px');
    });
  }
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
})();

/* Painting depth: the painting as a layered ink diorama. Script
   builds two clipped layer copies over the original image (sky,
   mountains; the original is the foreground), then one spring
   moves them at different rates from the pointer on desktop and
   from scroll on touch. The trace paths are never touched: the
   layers are extra <img> copies of the same file, and without
   scripting the single painting stays exactly as before. */
(function () {
  'use strict';
  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMQ.matches) return;
  var fineMQ = window.matchMedia('(pointer: fine)');
  var arts = Array.prototype.slice.call(document.querySelectorAll('.hero-art, .page-head-art'));
  if (!arts.length) return;
  var MAX_X = 18, MAX_Y = 11, TILT = 0.6;
  var STIFFNESS = 140, DAMPING = 20, MASS = 1;
  var sets = [];
  arts.forEach(function (art) {
    var base = art.querySelector('img, video');
    if (!base) return;
    if (base.tagName === 'VIDEO') {
      sets.push({ art: art, layers: [{ el: base, depth: 1 }] });
      return;
    }
    var sky = base.cloneNode(false);
    sky.className = 'art-layer art-layer-sky';
    sky.setAttribute('aria-hidden', 'true');
    var mid = base.cloneNode(false);
    mid.className = 'art-layer art-layer-mid';
    mid.setAttribute('aria-hidden', 'true');
    art.appendChild(sky);
    art.appendChild(mid);
    sets.push({ art: art, layers: [
      { el: base, depth: 1 },
      { el: sky, depth: 0.35 },
      { el: mid, depth: 0.7 }
    ]});
  });
  if (!sets.length) return;
  var tx = 0, ty = 0, cx = 0, cy = 0, vx = 0, vy = 0, rafId = 0, lastT = 0, dead = false;

  function apply() {
    sets.forEach(function (set) {
      set.layers.forEach(function (layer) {
        layer.el.style.transform = 'translate3d(' + (cx * MAX_X * layer.depth).toFixed(2) + 'px,' + (cy * MAX_Y * layer.depth).toFixed(2) + 'px,0)';
      });
      set.art.style.transform = 'rotateX(' + (-cy * TILT).toFixed(3) + 'deg) rotateY(' + (cx * TILT).toFixed(3) + 'deg) scale(1.04)';
    });
  }

  function loop(t) {
    var dt = Math.min((t - lastT) / 1000, 1 / 30);
    lastT = t;
    var ax = (-STIFFNESS * (cx - tx) - DAMPING * vx) / MASS;
    var ay = (-STIFFNESS * (cy - ty) - DAMPING * vy) / MASS;
    vx += ax * dt; vy += ay * dt;
    cx += vx * dt; cy += vy * dt;
    if (Math.abs(cx - tx) < 0.005 && Math.abs(cy - ty) < 0.005 && Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) {
      cx = tx; cy = ty; vx = 0; vy = 0; rafId = 0; apply(); return;
    }
    apply();
    rafId = requestAnimationFrame(loop);
  }

  function kick() {
    if (dead) return;
    if (!rafId) { lastT = performance.now(); rafId = requestAnimationFrame(loop); }
  }

  function setTarget(x, y) {
    if (dead) return;
    tx = Math.max(-1, Math.min(1, x));
    ty = Math.max(-1, Math.min(1, y));
    kick();
  }

  function tearDown() {
    dead = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    sets.forEach(function (set) {
      var clones = set.art.querySelectorAll('.art-layer');
      Array.prototype.forEach.call(clones, function (c) { c.parentNode.removeChild(c); });
      set.art.style.transform = '';
      set.layers[0].el.style.transform = '';
    });
  }

  if (reducedMQ.addEventListener) {
    reducedMQ.addEventListener('change', function (e) { if (e.matches) tearDown(); });
  }

  if (fineMQ.matches) {
    sets.forEach(function (set) {
      var zone = set.art.parentElement;
      zone.addEventListener('pointermove', function (e) {
        if (dead || e.pointerType !== 'mouse') return;
        var r = zone.getBoundingClientRect();
        if (!r.width || !r.height) return;
        setTarget(
          (e.clientX - r.left - r.width / 2) / (r.width / 2),
          (e.clientY - r.top - r.height / 2) / (r.height / 2)
        );
      });
      zone.addEventListener('pointerleave', function () { setTarget(0, 0); });
    });
  } else {
    var ticking = false;
    function onScroll() {
      if (dead || ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var vh = window.innerHeight || 800;
        var r = sets[0].art.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        setTarget(0, -Math.max(-1, Math.min(1, p)) * 0.6);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

/* Slider card tilt: each flagship card leans toward the pointer
   on its own spring, its shadow falling away from the pointer.
   Suppressed while the slider is dragging, skipped entirely
   under reduced motion or without a fine pointer. */
(function () {
  'use strict';
  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMQ.matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  var slider = document.getElementById('flag-slider');
  if (!slider) return;
  var viewport = slider.querySelector('.slider-viewport');
  var cards = Array.prototype.slice.call(slider.querySelectorAll('.flag-card'));
  var MAX_RX = 3.5, MAX_RY = 4;
  var STIFFNESS = 300, DAMPING = 28, MASS = 1;
  var states = cards.map(function (card) {
    return { card: card, rx: 0, ry: 0, vrx: 0, vry: 0, trx: 0, try_: 0, rafId: 0, lastT: 0 };
  });

  function applyState(s) {
    s.card.style.transform = 'perspective(900px) rotateX(' + s.rx.toFixed(3) + 'deg) rotateY(' + s.ry.toFixed(3) + 'deg)';
    if (Math.abs(s.rx) < 0.05 && Math.abs(s.ry) < 0.05) {
      s.card.style.boxShadow = '';
    } else {
      s.card.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,.6),' +
        (-s.ry * 1.6).toFixed(1) + 'px ' + (-s.rx * 1.6 + 8).toFixed(1) + 'px 24px rgba(27,26,23,.18)';
    }
  }

  function loopState(s, t) {
    var dt = Math.min((t - s.lastT) / 1000, 1 / 30);
    s.lastT = t;
    var ax = (-STIFFNESS * (s.rx - s.trx) - DAMPING * s.vrx) / MASS;
    var ay = (-STIFFNESS * (s.ry - s.try_) - DAMPING * s.vry) / MASS;
    s.vrx += ax * dt; s.vry += ay * dt;
    s.rx += s.vrx * dt; s.ry += s.vry * dt;
    if (Math.abs(s.rx - s.trx) < 0.01 && Math.abs(s.ry - s.try_) < 0.01 && Math.abs(s.vrx) < 0.05 && Math.abs(s.vry) < 0.05) {
      s.rx = s.trx; s.ry = s.try_; s.vrx = 0; s.vry = 0; s.rafId = 0; applyState(s); return;
    }
    applyState(s);
    s.rafId = requestAnimationFrame(function (tt) { loopState(s, tt); });
  }

  function kick(s) {
    if (!s.rafId) {
      s.lastT = performance.now();
      s.rafId = requestAnimationFrame(function (t) { loopState(s, t); });
    }
  }

  function resetAll() {
    states.forEach(function (s) { s.trx = 0; s.try_ = 0; kick(s); });
  }

  if (reducedMQ.addEventListener) {
    reducedMQ.addEventListener('change', function (e) { if (e.matches) resetAll(); });
  }

  states.forEach(function (s) {
    s.card.addEventListener('pointermove', function (e) {
      if (reducedMQ.matches || e.pointerType !== 'mouse') return;
      if (viewport.classList.contains('dragging')) return;
      var r = s.card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var nx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      var ny = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      s.trx = Math.max(-1, Math.min(1, -ny)) * MAX_RX;
      s.try_ = Math.max(-1, Math.min(1, nx)) * MAX_RY;
      kick(s);
    });
    s.card.addEventListener('pointerleave', function () {
      s.trx = 0; s.try_ = 0; kick(s);
    });
  });

  viewport.addEventListener('pointerdown', resetAll);
  viewport.addEventListener('pointerup', resetAll);
})();

/* Hero video: pause on reduced motion and hold the first frame
   (the poster still). Otherwise let it play muted and loop. */
(function () {
  'use strict';
  var video = document.querySelector('.hero-video');
  if (!video) return;
  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function apply() {
    if (reducedMQ.matches) {
      video.pause();
      try { video.currentTime = 0; } catch (e) { /* not loaded yet */ }
    } else {
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked, poster stays */ });
    }
  }
  apply();
  if (reducedMQ.addEventListener) reducedMQ.addEventListener('change', apply);
})();
