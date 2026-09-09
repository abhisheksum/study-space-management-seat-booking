/**
 * StudyHub - Seat availability map
 * Availability is supplied by GET /api/seats/availability.
 */

const SLOT_TIME_WINDOWS = {
  morning: { name: 'Morning Shift', label: '06:00 AM – 12:00 PM' },
  afternoon: { name: 'Afternoon Shift', label: '12:00 PM – 06:00 PM' },
  evening: { name: 'Evening Shift', label: '06:00 PM – 10:00 PM' },
  'half-day-am': { name: 'Half Day (Morning + Afternoon)', label: '06:00 AM – 06:00 PM' },
  'half-day-pm': { name: 'Half Day (Afternoon + Evening)', label: '12:00 PM – 11:00 PM' },
  'full-day': { name: 'Full Day Pass', label: '06:00 AM – 11:00 PM' }
};

function getTodayFormatted() {
  return new Date().toISOString().split('T')[0];
}

class SeatMapController {
  constructor() {
    this.container = document.getElementById('seats-matrix-container');
    this.datePicker = document.getElementById('filter-date');
    this.slotButtons = document.querySelectorAll('.slot-filter-btn');
    this.toastElem = document.getElementById('seat-status-alert');
    this.selectedSeatDisplay = document.getElementById('summary-selected-seat');
    this.selectedDateDisplay = document.getElementById('summary-selected-date');
    this.selectedSlotDisplay = document.getElementById('summary-selected-slot');
    this.selectedStatusDisplay = document.getElementById('summary-selected-status');
    this.btnConfirmSeat = document.getElementById('btn-choose-seat');
    this.availCountDisplay = document.getElementById('stat-available-count');
    this.occupCountDisplay = document.getElementById('stat-occupied-count');
    this.totalCountDisplay = document.getElementById('stat-total-count');
    this.currentDate = getTodayFormatted();
    this.currentSlot = 'morning';
    this.selectedSeatId = null;
    this.seats = [];
    this.isLoading = false;
    this.init();
  }

  init() {
    if (this.datePicker) {
      this.datePicker.value = this.currentDate;
      this.datePicker.min = this.currentDate;
      this.datePicker.addEventListener('change', (event) => {
        if (!event.target.value) return;
        this.currentDate = event.target.value;
        this.selectedSeatId = null;
        this.loadAvailability();
      });
    }

    const params = new URLSearchParams(window.location.search);
    const requestedSlot = params.get('slot') || params.get('plan');
    if (requestedSlot === 'half-day') {
      this.currentSlot = 'half-day-am';
    } else if (requestedSlot && SLOT_TIME_WINDOWS[requestedSlot]) {
      this.currentSlot = requestedSlot;
    }

    this.slotButtons.forEach((button) => {
      const slot = button.getAttribute('data-slot');
      button.classList.toggle('active', slot === this.currentSlot);
      button.addEventListener('click', () => {
        if (!slot || !SLOT_TIME_WINDOWS[slot] || slot === this.currentSlot) return;
        this.slotButtons.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        this.currentSlot = slot;
        this.selectedSeatId = null;
        this.loadAvailability();
      });
    });

    if (this.btnConfirmSeat) {
      this.btnConfirmSeat.addEventListener('click', () => this.handleSeatBookingSubmission());
    }

    this.loadAvailability();
  }

  async loadAvailability() {
    if (!this.container) return;
    this.isLoading = true;
    this.selectedSeatId = null;
    this.renderStatus('Loading seat availability...');
    this.updateSelectionPanel();

    try {
      const query = new URLSearchParams({ date: this.currentDate, slot: this.currentSlot });
      const response = await fetch(`/api/seats/availability?${query.toString()}`);
      if (!response.ok) throw new Error(`Seat availability request failed with status ${response.status}`);
      const payload = await response.json();
      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error('The seat availability response was invalid.');
      }
      this.seats = payload.data.map((seat) => ({
        ...seat,
        seatId: seat.seatNumber,
        status: seat.status === 'active' ? 'occupied' : seat.status
      }));
      this.render();
    } catch (error) {
      console.error('Unable to load seat availability:', error);
      this.seats = [];
      this.renderStatus('We could not load seat availability. Please refresh the page or try again later.', true);
      this.updateStats([]);
      this.updateSelectionPanel();
    } finally {
      this.isLoading = false;
    }
  }

  renderStatus(message, isError = false) {
    this.container.replaceChildren();
    const status = document.createElement('p');
    status.className = `seat-map-status${isError ? ' seat-map-status-error' : ''}`;
    status.setAttribute('role', isError ? 'alert' : 'status');
    status.textContent = message;
    this.container.appendChild(status);
  }

  render() {
    const rows = { A: [], B: [], C: [] };
    this.seats.forEach((seat) => {
      const row = seat.seatId.charAt(0);
      if (rows[row]) rows[row].push(seat);
    });
    this.container.replaceChildren();

    Object.entries(rows).forEach(([rowLetter, seats]) => {
      const rowBlock = document.createElement('div');
      rowBlock.className = 'seat-row-block';
      rowBlock.innerHTML = `
        <div class="seat-row-header">
          <span class="seat-row-label">Reading Bay Row ${rowLetter}</span>
          <span class="seat-row-sub">Workstations ${rowLetter}01 – ${rowLetter}10</span>
        </div>
      `;
      const grid = document.createElement('div');
      grid.className = 'seat-row-grid';

      seats.forEach((seat) => {
        const button = document.createElement('button');
        const unavailable = seat.status !== 'available';
        const isSelected = this.selectedSeatId === seat.seatId;
        button.type = 'button';
        button.className = `seat-btn ${seat.status}${isSelected ? ' selected' : ''}`;
        button.dataset.seatId = seat.seatId;
        button.disabled = unavailable;
        button.setAttribute('aria-label', `Seat ${seat.seatId}, Status: ${seat.status}`);
        button.innerHTML = `
          <i class="seat-icon fa-solid fa-chair"></i>
          <span class="seat-id-label">${seat.seatId}</span>
          <span class="seat-tag">${isSelected ? 'SELECTED' : seat.status}</span>
        `;
        if (!unavailable) button.addEventListener('click', () => this.onSeatClick(seat));
        grid.appendChild(button);
      });
      rowBlock.appendChild(grid);
      this.container.appendChild(rowBlock);
    });

    this.updateStats(this.seats);
    this.updateSelectionPanel();
  }

  onSeatClick(seat) {
    if (seat.status !== 'available' || this.isLoading) return;
    if (this.selectedSeatId === seat.seatId) {
      this.selectedSeatId = null;
      this.notify(`Seat ${seat.seatId} deselected.`, 'info');
    } else {
      this.selectedSeatId = seat.seatId;
      this.notify(`Workstation ${seat.seatId} selected for ${SLOT_TIME_WINDOWS[this.currentSlot].name}.`, 'success');
    }
    this.render();
  }

  notify(message, type = 'info') {
    if (!this.toastElem) return;
    this.toastElem.textContent = message;
    this.toastElem.className = `seat-toast-msg toast-${type}`;
    this.toastElem.style.display = 'block';
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.toastElem.style.display = 'none';
    }, 4500);
  }

  updateStats(seats) {
    const available = seats.filter((seat) => seat.status === 'available').length;
    const unavailable = seats.filter((seat) => seat.status !== 'available').length;
    if (this.availCountDisplay) this.availCountDisplay.textContent = available;
    if (this.occupCountDisplay) this.occupCountDisplay.textContent = unavailable;
    if (this.totalCountDisplay) this.totalCountDisplay.textContent = seats.length;
  }

  updateSelectionPanel() {
    if (this.selectedDateDisplay) this.selectedDateDisplay.textContent = this.currentDate;
    if (this.selectedSlotDisplay) {
      const slot = SLOT_TIME_WINDOWS[this.currentSlot];
      this.selectedSlotDisplay.textContent = `${slot.name} (${slot.label})`;
    }

    if (this.selectedSeatId) {
      this.selectedSeatDisplay.textContent = this.selectedSeatId;
      this.selectedSeatDisplay.style.color = 'var(--accent)';
      this.selectedStatusDisplay.innerHTML = '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Available & Verified Non-Overlapping</span>';
      this.btnConfirmSeat.disabled = false;
      this.btnConfirmSeat.innerHTML = `<i class="fa-solid fa-check"></i> Choose This Seat (${this.selectedSeatId})`;
    } else {
      this.selectedSeatDisplay.textContent = 'None Selected';
      this.selectedSeatDisplay.style.color = 'var(--text-subtle)';
      this.selectedStatusDisplay.innerHTML = '<span style="font-size: 0.88rem; color: var(--text-subtle);">Select an open desk in the layout</span>';
      this.btnConfirmSeat.disabled = true;
      this.btnConfirmSeat.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> Choose This Seat';
    }
  }

  handleSeatBookingSubmission() {
    if (!this.selectedSeatId) return;
    const targetUrl = `register.html?seat=${encodeURIComponent(this.selectedSeatId)}&slot=${encodeURIComponent(this.currentSlot)}&date=${encodeURIComponent(this.currentDate)}`;
    window.location.href = targetUrl;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('seats-matrix-container')) {
    window.seatMapController = new SeatMapController();
  }
});
