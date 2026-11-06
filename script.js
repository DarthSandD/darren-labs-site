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
