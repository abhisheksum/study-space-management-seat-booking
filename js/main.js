/**
 * StudyHub - Global Application Initialization & Interactive Enhancements
 */

document.addEventListener('DOMContentLoaded', () => {
  const seatPreview = document.getElementById('homepage-seat-preview');
  if (seatPreview) {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/seats/availability?date=${today}&slot=morning`)
      .then((response) => {
        if (!response.ok) throw new Error(`Seat availability request failed with status ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (!payload.success || !Array.isArray(payload.data)) {
          throw new Error('The seat availability response was invalid.');
        }
        if (payload.data.length === 0) {
          seatPreview.textContent = 'No seats are configured for this location.';
          return;
        }
        seatPreview.replaceChildren(...payload.data.slice(0, 15).map((seat) => {
          const status = seat.physicalStatus !== 'active' ? 'reserved'
            : seat.status === 'active' ? 'occupied' : 'available';
          const preview = document.createElement('div');
          preview.className = `seat-btn ${status}`;
          preview.title = `Seat ${seat.seatNumber} - ${status}`;
          preview.innerHTML = `
            <i class="seat-icon fa-solid fa-chair"></i>
            <span>${seat.seatNumber}</span>
            <span class="seat-tag">${status === 'available' ? 'Open' : status === 'reserved' ? 'Hold' : 'Taken'}</span>
          `;
          return preview;
        }));
      })
      .catch((error) => {
        console.error('Unable to load homepage seat preview:', error);
        seatPreview.textContent = 'Live seat availability is temporarily unavailable. Open the seat map to retry.';
      });
  }

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

});
