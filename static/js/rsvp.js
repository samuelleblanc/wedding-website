/* ============================================================
   RSVP form — email lookup + dynamic field rendering + submission
   ============================================================ */
(function () {
  const stepLookup   = document.getElementById('rsvp-step-lookup');
  const stepForm     = document.getElementById('rsvp-step-form');
  if (!stepLookup || !stepForm) return; // RSVP disabled — nothing to do

  const emailInput   = document.getElementById('rsvp-email');
  const lookupBtn    = document.getElementById('rsvp-lookup-btn');
  const lookupError  = document.getElementById('rsvp-lookup-error');
  const guestName    = document.getElementById('rsvp-guest-name');
  const emailHidden  = document.getElementById('rsvp-email-hidden');
  const form         = document.getElementById('rsvp-form');
  const attendFields = document.getElementById('rsvp-attending-fields');
  const plusOneBlock = document.getElementById('rsvp-plus-one');
  const childrenBlock= document.getElementById('rsvp-children');
  const submitBtn    = document.getElementById('rsvp-submit-btn');
  const submitError  = document.getElementById('rsvp-submit-error');
  const submitSuccess= document.getElementById('rsvp-submit-success');

  /* ---------- helpers ---------- */
  function showError(el, msg) {
    el.textContent = msg;
    el.classList.add('visible');
  }
  function hideError(el) { el.classList.remove('visible'); }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait…' : btn.dataset.label || btn.textContent;
  }

  /* ---------- Step 1: email lookup ---------- */
  lookupBtn.dataset.label = lookupBtn.textContent;

  lookupBtn.addEventListener('click', async function () {
    hideError(lookupError);
    const email = emailInput.value.trim();
    if (!email) { showError(lookupError, 'Please enter your email address.'); return; }

    setLoading(lookupBtn, true);
    try {
      const res = await fetch('/.netlify/functions/validate-guest?email=' + encodeURIComponent(email));
      const data = await res.json();

      if (!res.ok) {
        showError(lookupError, data.error || 'We couldn\'t find that email on our guest list. Please double-check or contact us.');
        return;
      }

      /* Success — populate form */
      emailHidden.value = email;
      guestName.textContent = 'Welcome, ' + data.name + '!';

      if (data.plus_one_allowed) plusOneBlock.classList.add('shown');
      if (data.children_allowed) childrenBlock.classList.add('shown');

      stepLookup.style.display = 'none';
      stepForm.classList.remove('rsvp-step--hidden');

      /* Scroll to form */
      stepForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      showError(lookupError, 'Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(lookupBtn, false);
    }
  });

  emailInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') lookupBtn.click();
  });

  /* ---------- Show/hide attending fields ---------- */
  form.querySelectorAll('input[name="attending"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (this.value === 'yes') {
        attendFields.classList.add('shown');
      } else {
        attendFields.classList.remove('shown');
      }
    });
  });

  /* ---------- Step 2: submission ---------- */
  submitBtn.dataset.label = submitBtn.textContent;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError(submitError);
    submitSuccess.classList.remove('visible');

    const attending = form.querySelector('input[name="attending"]:checked');
    if (!attending) {
      showError(submitError, 'Please let us know if you\'ll be attending.');
      return;
    }

    if (attending.value === 'yes') {
      const meal = document.getElementById('meal').value;
      if (!meal) {
        showError(submitError, 'Please select a meal preference.');
        return;
      }
    }

    const payload = {
      email:               emailHidden.value,
      attending:           attending.value,
      meal:                document.getElementById('meal').value,
      plus_one_name:       document.getElementById('plus_one_name').value.trim(),
      plus_one_meal:       document.getElementById('plus_one_meal').value,
      children_count:      document.getElementById('children_count').value,
      children_meal:       document.getElementById('children_meal').value,
      dietary_restrictions:document.getElementById('dietary').value.trim(),
      song_request:        document.getElementById('song_request').value.trim(),
      message:             document.getElementById('message').value.trim(),
    };

    setLoading(submitBtn, true);
    try {
      const res = await fetch('/.netlify/functions/submit-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showError(submitError, data.error || 'Something went wrong. Please try again.');
        return;
      }

      /* Success — hide form, show confirmation */
      form.style.display = 'none';
      submitSuccess.textContent = attending.value === 'yes'
        ? '🎉 Your RSVP is confirmed! We can\'t wait to celebrate with you.'
        : '💌 We\'ll miss you! Thank you for letting us know.';
      submitSuccess.classList.add('visible');
      submitSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      showError(submitError, 'Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(submitBtn, false);
    }
  });
})();
