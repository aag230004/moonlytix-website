/**
 * Contact form — client-side validation + success state only.
 *
 * No backend is wired up yet. To actually receive submissions, point the
 * <form> at a form backend (e.g. Formspree, Resend, Basin) by setting its
 * action/method attributes, remove the preventDefault() below, and let the
 * browser submit natively — or fetch() the action URL from this handler.
 */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const card = form.closest('.contact-form-card');
  const successPanel = document.getElementById('form-success');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function fieldWrap(el) {
    return el.closest('.field');
  }

  function validateField(el) {
    const wrap = fieldWrap(el);
    if (!wrap) return true;
    el.setAttribute('data-touched', 'true');

    let valid = true;
    if (el.hasAttribute('required') && !el.value.trim()) {
      valid = false;
    }
    if (valid && el.type === 'email' && el.value.trim() && !emailPattern.test(el.value.trim())) {
      valid = false;
    }

    wrap.setAttribute('data-error', valid ? 'false' : 'true');
    return valid;
  }

  const fields = Array.from(form.querySelectorAll('input, textarea, select'));
  fields.forEach((el) => {
    el.addEventListener('blur', () => validateField(el));
    el.addEventListener('input', () => {
      if (el.getAttribute('data-touched') === 'true') validateField(el);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let firstInvalid = null;
    fields.forEach((el) => {
      const ok = validateField(el);
      if (!ok && !firstInvalid) firstInvalid = el;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    /* Wire a real backend here. For now, show a success state. */
    if (card) card.classList.add('is-submitted');
    if (successPanel) {
      successPanel.classList.add('is-visible');
      successPanel.setAttribute('tabindex', '-1');
      successPanel.focus();
    }
    form.reset();
  });
})();
