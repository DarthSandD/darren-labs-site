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
