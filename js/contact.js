/**
 * StudyHub - Contact Page Controller & Form Validation
 * Populates centralized contact config into the DOM and validates the contact form.
 */

document.addEventListener('DOMContentLoaded', () => {
  const config = window.STUDYHUB_CONFIG;

  // 1. Populate Centralized Config Data into DOM placeholders
  if (config) {
    // Phone
    document.querySelectorAll('[data-config="phone"]').forEach(el => {
      el.textContent = config.phone;
      if (el.tagName === 'A') el.href = `tel:${config.phoneClean}`;
    });

    // WhatsApp
    document.querySelectorAll('[data-config="whatsapp"]').forEach(el => {
      el.textContent = config.whatsappDisplay;
      if (el.tagName === 'A') {
        el.href = `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(config.whatsappDefaultMessage)}`;
      }
    });

    // Email
    document.querySelectorAll('[data-config="email"]').forEach(el => {
      el.textContent = config.email;
      if (el.tagName === 'A') el.href = `mailto:${config.email}`;
    });

    // Address
    document.querySelectorAll('[data-config="address"]').forEach(el => {
      el.textContent = config.address.fullAddress;
    });

    // Hours
    document.querySelectorAll('[data-config="hours"]').forEach(el => {
      el.textContent = config.hours.allDays;
    });

    document.querySelectorAll('[data-config="visiting-hours"]').forEach(el => {
      el.textContent = config.hours.visitingHours;
    });
  }

  // 2. Contact Form Validation and Submission
  const contactForm = document.getElementById('main-contact-form');
  const statusMsg = document.getElementById('contact-form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const mobileInput = document.getElementById('contact-mobile');
      const emailInput = document.getElementById('contact-email');
      const subjectInput = document.getElementById('contact-subject');
      const messageInput = document.getElementById('contact-message');

      let isValid = true;

      // Validation 1: Name
      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        setError(nameInput, 'error-contact-name', 'Please provide your full name.');
        isValid = false;
      } else {
        clearError(nameInput, 'error-contact-name');
      }

      // Validation 2: Mobile (10-digit Indian regex)
      const phoneRegex = /^[6-9]\d{9}$/;
      const cleanMobile = mobileInput.value.replace(/[\s\-+]/g, '').slice(-10);
      if (!phoneRegex.test(cleanMobile)) {
        setError(mobileInput, 'error-contact-mobile', 'Please enter a valid 10-digit mobile number.');
        isValid = false;
      } else {
        clearError(mobileInput, 'error-contact-mobile');
      }

      // Validation 3: Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        setError(emailInput, 'error-contact-email', 'Please enter a valid email address.');
        isValid = false;
      } else {
        clearError(emailInput, 'error-contact-email');
      }

      // Validation 4: Subject
      if (!subjectInput.value) {
        setError(subjectInput, 'error-contact-subject', 'Please choose a subject for your inquiry.');
        isValid = false;
      } else {
        clearError(subjectInput, 'error-contact-subject');
      }

      // Validation 5: Message
      if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
        setError(messageInput, 'error-contact-message', 'Please write a message with at least 10 characters.');
        isValid = false;
      } else {
        clearError(messageInput, 'error-contact-message');
      }

      if (!isValid) return;

      // Submission payload ready for backend API
      const contactPayload = {
        name: nameInput.value.trim(),
        mobile: cleanMobile,
        email: emailInput.value.trim(),
        subject: subjectInput.value,
        message: messageInput.value.trim(),
        submittedAt: new Date().toISOString()
      };

      console.log('[StudyHub] Contact Inquiry Payload:', contactPayload);

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending message...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.className = 'seat-toast-msg toast-success';
          statusMsg.innerHTML = `
            <i class="fa-solid fa-circle-check"></i> Thank you, <strong>${contactPayload.name}</strong>! Your message has been received. Our desk coordinator will reach out to you at <strong>${contactPayload.mobile}</strong> shortly.
          `;
          statusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        contactForm.reset();
      }, 1000);
    });
  }

  function setError(inputElem, errorId, message) {
    if (inputElem) inputElem.classList.add('is-invalid');
    const errSpan = document.getElementById(errorId);
    if (errSpan) {
      errSpan.textContent = message;
      errSpan.style.display = 'block';
    }
  }

  function clearError(inputElem, errorId) {
    if (inputElem) inputElem.classList.remove('is-invalid');
    const errSpan = document.getElementById(errorId);
    if (errSpan) {
      errSpan.textContent = '';
      errSpan.style.display = 'none';
    }
  }
});
