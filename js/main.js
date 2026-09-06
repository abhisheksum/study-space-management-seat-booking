/**
 * StudyHub - Global Application Initialization & Interactive Enhancements
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. FAQ Accordion behavior if present on the page
  const accordionHeaders = document.querySelectorAll('.faq-question');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('active');

      // Close other open accordions in the same group
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) other.classList.remove('active');
      });

      item.classList.toggle('active', !isOpen);
    });
  });

  // 2. Smooth scrolling for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // 3. Contact Form Submission simulation
  const contactForm = document.getElementById('studyhub-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending message...';

      setTimeout(() => {
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Inquiry Received!';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-secondary');

        // Show friendly response toast or inline banner
        const alertBox = document.getElementById('contact-status-msg');
        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.textContent = "Thank you! A seat coordinator will contact you shortly via WhatsApp / Phone.";
        }
        contactForm.reset();
      }, 1200);
    });
  }
});
