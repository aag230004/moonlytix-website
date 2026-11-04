/**
 * Contact form — client-side validation, then a real submission to
 * Web3Forms (https://web3forms.com), which emails the submission
 * straight to the inbox tied to the access_key in contact.html.
 * No server of our own involved.
 */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const card = form.closest('.contact-form-card');
  const successPanel = document.getElementById('form-success');
  const errorPanel = document.getElementById('form-error');
  const submitBtn = form.querySelector('.form-submit button[type="submit"]');
  const submitBtnDefaultHTML = submitBtn ? submitBtn.innerHTML : '';
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

  function setSending(isSending) {
    if (!submitBtn) return;
    submitBtn.disabled = isSending;
    submitBtn.innerHTML = isSending ? 'Sending&hellip;' : submitBtnDefaultHTML;
  }

  function showSuccess() {
    if (card) card.classList.add('is-submitted');
    if (successPanel) {
      successPanel.classList.add('is-visible');
      successPanel.setAttribute('tabindex', '-1');
      successPanel.focus();
    }
    form.reset();
  }

  function showError() {
    if (errorPanel) errorPanel.classList.add('is-visible');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (errorPanel) errorPanel.classList.remove('is-visible');

    let firstInvalid = null;
    fields.forEach((el) => {
      const ok = validateField(el);
      if (!ok && !firstInvalid) firstInvalid = el;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    setSending(true);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    })
      .then((res) => res.json())
      .then((data) => {
        setSending(false);
        if (data.success) {
          showSuccess();
        } else {
          showError();
        }
      })
      .catch(() => {
        setSending(false);
        showError();
      });
  });
})();
