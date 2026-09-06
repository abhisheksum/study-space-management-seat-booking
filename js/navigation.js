/**
 * StudyHub - Navigation and Header Interaction Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const desktopNav = document.querySelector('.desktop-nav');
  const header = document.querySelector('.site-header');

  // Toggle mobile navigation drawer
  if (mobileToggle && desktopNav) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      desktopNav.classList.toggle('mobile-active');

      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (desktopNav.classList.contains('mobile-active')) {
          icon.className = 'fa-solid fa-xmark';
        } else {
          icon.className = 'fa-solid fa-bars';
        }
      }
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!desktopNav.contains(e.target) && !mobileToggle.contains(e.target)) {
        desktopNav.classList.remove('mobile-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      }
    });
  }

  // Scroll effect for header
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Set active link based on current path
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});
