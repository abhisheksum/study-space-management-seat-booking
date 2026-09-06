/**
 * ==============================================================================
 * StudyHub - Seat Management & Time Overlap Allocation Engine
 * ==============================================================================
 * 
 * Business Logic & Conflict Rules:
 * 1. Every workstation has a unique ID (A01-A10, B01-B10, C01-C10).
 * 2. Students can select:
 *    - Full Day (06:00 - 23:00)
 *    - Half Day (06:00 - 18:00 or 12:00 - 23:00)
 *    - One specific slot: Morning (06:00-12:00), Afternoon (12:00-18:00), Evening (18:00-22:00)
 * 3. A seat can be assigned to different students on the same day if time slots DO NOT overlap:
 *    - Morning (06:00-12:00) and Afternoon (12:00-18:00) DO NOT overlap.
 *    - Afternoon (12:00-18:00) and Evening (18:00-22:00) DO NOT overlap.
 * 4. The same seat MUST NOT be assigned to two students during overlapping time periods.
 * 5. A Full-Day booking covers [06:00 - 23:00] and blocks that seat for ALL other slots that day.
 * 6. A Half-Day booking (e.g. 06:00-18:00) blocks both Morning and Afternoon, but leaves Evening open.
 * 7. Availability changes dynamically when either the date or time slot filter changes.
 */

// 1. Definition of 30 physical seat workstations
const ALL_SEAT_IDS = [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10',
  'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10'
];

// 2. Standardized Slot Windows with military hour bounds for robust interval calculation
const SLOT_TIME_WINDOWS = {
  morning: {
    id: 'morning',
    name: 'Morning Shift',
    startHour: 6,
    endHour: 12,
    label: '06:00 AM – 12:00 PM'
  },
  afternoon: {
    id: 'afternoon',
    name: 'Afternoon Shift',
    startHour: 12,
    endHour: 18,
    label: '12:00 PM – 06:00 PM'
  },
  evening: {
    id: 'evening',
    name: 'Evening Shift',
    startHour: 18,
    endHour: 22,
    label: '06:00 PM – 10:00 PM'
  },
  'half-day-am': {
    id: 'half-day-am',
    name: 'Half Day (Morning + Afternoon)',
    startHour: 6,
    endHour: 18,
    label: '06:00 AM – 06:00 PM'
  },
  'half-day-pm': {
    id: 'half-day-pm',
    name: 'Half Day (Afternoon + Evening)',
    startHour: 12,
    endHour: 23,
    label: '12:00 PM – 11:00 PM'
  },
  'full-day': {
    id: 'full-day',
    name: 'Full Day Pass',
    startHour: 6,
    endHour: 23,
    label: '06:00 AM – 11:00 PM'
  }
};

/**
 * MOCK BOOKING DATABASE
 * Stored in array format mimicking a relational database table:
 * [
 *   { bookingId, studentId, seatId, date, slot, status }
 * ]
 */
let MOCK_BOOKINGS = [
  // Today's Date bookings
  {
    bookingId: "BK001",
    studentId: "ST001",
    seatId: "A01",
    date: getTodayFormatted(),
    slot: "morning",
    status: "occupied"
  },
  {
    bookingId: "BK002",
    studentId: "ST002",
    seatId: "A01",
    date: getTodayFormatted(),
    slot: "afternoon", // Same seat A01, but afternoon -> Allowed, no overlap with morning!
    status: "occupied"
  },
  {
    bookingId: "BK003",
    studentId: "ST003",
    seatId: "A02",
    date: getTodayFormatted(),
    slot: "full-day", // Full day blocks A02 across morning, afternoon, evening!
    status: "occupied"
  },
  {
    bookingId: "BK004",
    studentId: "ST004",
    seatId: "A03",
    date: getTodayFormatted(),
    slot: "morning",
    status: "reserved" // Payment pending hold
  },
  {
    bookingId: "BK005",
    studentId: "ST005",
    seatId: "B01",
    date: getTodayFormatted(),
    slot: "half-day-am", // 06:00-18:00 blocks morning and afternoon, evening stays available!
    status: "occupied"
  },
  {
    bookingId: "BK006",
    studentId: "ST006",
    seatId: "B04",
    date: getTodayFormatted(),
    slot: "morning",
    status: "occupied"
  },
  {
    bookingId: "BK007",
    studentId: "ST007",
    seatId: "B04",
    date: getTodayFormatted(),
    slot: "evening", // Same seat B04 in evening -> Allowed!
    status: "occupied"
  },
  {
    bookingId: "BK008",
    studentId: "ST008",
    seatId: "C01",
    date: getTodayFormatted(),
    slot: "afternoon",
    status: "occupied"
  },
  {
    bookingId: "BK009",
    studentId: "ST009",
    seatId: "C06",
    date: getTodayFormatted(),
    slot: "evening",
    status: "occupied"
  },
  {
    bookingId: "BK010",
    studentId: "ST010",
    seatId: "C10",
    date: getTodayFormatted(),
    slot: "full-day",
    status: "occupied"
  }
];

// Helper to get formatted string for today (YYYY-MM-DD)
function getTodayFormatted(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * ==============================================================================
 * CORE ALLOCATION FUNCTIONS
 * ==============================================================================
 */

/**
 * Checks whether two time slot periods overlap on the clock.
 * Interval intersection test:
 * Two slots [startA, endA) and [startB, endB) overlap if and only if:
 * startA < endB AND endA > startB
 * 
 * @param {string} slotKey1 - First slot identifier (e.g. 'morning')
 * @param {string} slotKey2 - Second slot identifier (e.g. 'full-day')
 * @returns {boolean} True if the slots share any overlapping time window.
 */
function checkTimeOverlap(slotKey1, slotKey2) {
  const slotA = SLOT_TIME_WINDOWS[slotKey1];
  const slotB = SLOT_TIME_WINDOWS[slotKey2];

  if (!slotA || !slotB) return false;

  // Exact time interval overlap formula
  return (slotA.startHour < slotB.endHour) && (slotA.endHour > slotB.startHour);
}

/**
 * Checks if a specific seat is available for a requested date and slot.
 * Inspects all existing bookings for that seat on that date.
 * If any existing booking has an overlapping time window with the requested slot,
 * the seat is deemed UNAVAILABLE.
 * 
 * @param {string} seatId - e.g. "A01"
 * @param {string} targetDate - "YYYY-MM-DD"
 * @param {string} targetSlot - e.g. "morning", "afternoon", "evening", "full-day"
 * @returns {object} { isAvailable: boolean, status: string, conflictingBooking: object|null }
 */
function isSeatAvailable(seatId, targetDate, targetSlot) {
  // Find all active bookings for this specific seat on the target date
  const seatBookingsOnDate = MOCK_BOOKINGS.filter(b => 
    b.seatId === seatId && b.date === targetDate
  );

  for (const booking of seatBookingsOnDate) {
    // Check if the booking's time slot conflicts with the target slot
    if (checkTimeOverlap(booking.slot, targetSlot)) {
      return {
        isAvailable: false,
        status: booking.status, // "occupied" or "reserved"
        conflictingBooking: booking
      };
    }
  }

  return {
    isAvailable: true,
    status: 'available',
    conflictingBooking: null
  };
}

/**
 * Returns the status list of all 30 seats for a specific date and time slot.
 * 
 * @param {string} targetDate - e.g. "2026-09-10"
 * @param {string} targetSlot - e.g. "morning", "afternoon", "evening", "full-day"
 * @returns {Array<object>} Array of seat status objects:
 *                          [{ seatId, status, slot, date, conflictingBooking }]
 */
function getAvailableSeats(targetDate, targetSlot) {
  return ALL_SEAT_IDS.map(seatId => {
    const checkResult = isSeatAvailable(seatId, targetDate, targetSlot);
    return {
      seatId: seatId,
      status: checkResult.status,
      slot: targetSlot,
      date: targetDate,
      conflictingBooking: checkResult.conflictingBooking
    };
  });
}

/**
 * Allocates a seat to a student after validating anti-overlap rules.
 * Simulates a successful reservation transaction.
 * 
 * @param {string} studentId - Student identifier
 * @param {string} seatId - Workstation number (e.g. "A04")
 * @param {string} date - Date of reservation (YYYY-MM-DD)
 * @param {string} slot - Desired slot key
 * @returns {object} { success: boolean, message: string, booking: object|null }
 */
function allocateSeat(studentId, seatId, date, slot) {
  const availability = isSeatAvailable(seatId, date, slot);

  if (!availability.isAvailable) {
    return {
      success: false,
      message: `Cannot allocate ${seatId}: It is already ${availability.status} during an overlapping period (${availability.conflictingBooking.slot}).`,
      booking: null
    };
  }

  const newBooking = {
    bookingId: `BK${Date.now().toString().slice(-4)}`,
    studentId: studentId,
    seatId: seatId,
    date: date,
    slot: slot,
    status: "occupied"
  };

  MOCK_BOOKINGS.push(newBooking);

  return {
    success: true,
    message: `Seat ${seatId} successfully allocated for ${SLOT_TIME_WINDOWS[slot].name} on ${date}!`,
    booking: newBooking
  };
}

/**
 * Releases/cancels a previously allocated seat booking.
 * 
 * @param {string} bookingId - The booking ID to cancel
 * @returns {boolean} True if released, false if not found.
 */
function releaseSeat(bookingId) {
  const index = MOCK_BOOKINGS.findIndex(b => b.bookingId === bookingId);
  if (index !== -1) {
    MOCK_BOOKINGS.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * ==============================================================================
 * UI CONTROLLER & VIEW BINDING
 * ==============================================================================
 */
class SeatMapController {
  constructor() {
    this.container = document.getElementById('seats-matrix-container');
    this.datePicker = document.getElementById('filter-date');
    this.slotButtons = document.querySelectorAll('.slot-filter-btn');

    // UI Feedback elements
    this.toastElem = document.getElementById('seat-status-alert');
    this.selectedSeatDisplay = document.getElementById('summary-selected-seat');
    this.selectedDateDisplay = document.getElementById('summary-selected-date');
    this.selectedSlotDisplay = document.getElementById('summary-selected-slot');
    this.selectedStatusDisplay = document.getElementById('summary-selected-status');
    this.btnConfirmSeat = document.getElementById('btn-choose-seat');

    // Counts
    this.availCountDisplay = document.getElementById('stat-available-count');
    this.occupCountDisplay = document.getElementById('stat-occupied-count');
    this.totalCountDisplay = document.getElementById('stat-total-count');

    // State
    this.currentDate = getTodayFormatted();
    this.currentSlot = 'morning';
    this.selectedSeatId = null;

    this.init();
  }

  init() {
    // 1. Initialize Date Picker
    if (this.datePicker) {
      this.datePicker.value = this.currentDate;
      this.datePicker.min = this.currentDate;
      this.datePicker.addEventListener('change', (e) => {
        this.currentDate = e.target.value;
        this.selectedSeatId = null; // Clear seat selection on date switch
        this.render();
      });
    }

    // 2. Parse Query Params (e.g. ?slot=evening or ?plan=half-day)
    const params = new URLSearchParams(window.location.search);
    const requestedSlot = params.get('slot') || params.get('plan');
    if (requestedSlot && SLOT_TIME_WINDOWS[requestedSlot]) {
      this.currentSlot = requestedSlot;
    } else if (requestedSlot === 'half-day') {
      this.currentSlot = 'half-day-am';
    }

    // 3. Bind Slot Filter Buttons
    this.slotButtons.forEach(btn => {
      const slotKey = btn.getAttribute('data-slot');
      if (slotKey === this.currentSlot) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      btn.addEventListener('click', (e) => {
        const slot = e.currentTarget.getAttribute('data-slot');
        if (slot && SLOT_TIME_WINDOWS[slot]) {
          this.slotButtons.forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.currentSlot = slot;
          this.selectedSeatId = null; // Clear seat selection on slot switch
          this.render();
        }
      });
    });

    // 4. Bind Choose This Seat button
    if (this.btnConfirmSeat) {
      this.btnConfirmSeat.addEventListener('click', () => {
        this.handleSeatBookingSubmission();
      });
    }

    this.render();
  }

  render() {
    if (!this.container) return;

    // Fetch dynamic seat status array via core calculation function
    const seatList = getAvailableSeats(this.currentDate, this.currentSlot);

    // Group seats by Bay Rows: A, B, C
    const rows = { A: [], B: [], C: [] };
    seatList.forEach(seat => {
      const rowKey = seat.seatId.charAt(0);
      if (rows[rowKey]) rows[rowKey].push(seat);
    });

    this.container.innerHTML = '';

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

      seats.forEach(seat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `seat-btn ${seat.status}`;
        btn.setAttribute('data-seat-id', seat.seatId);
        btn.setAttribute('aria-label', `Seat ${seat.seatId}, Status: ${seat.status}`);

        const isSelected = (this.selectedSeatId === seat.seatId);
        if (isSelected) {
          btn.classList.add('selected');
        }

        btn.innerHTML = `
          <i class="seat-icon fa-solid fa-chair"></i>
          <span class="seat-id-label">${seat.seatId}</span>
          <span class="seat-tag">${isSelected ? 'SELECTED' : seat.status}</span>
        `;

        btn.addEventListener('click', () => this.onSeatClick(seat));
        grid.appendChild(btn);
      });

      rowBlock.appendChild(grid);
      this.container.appendChild(rowBlock);
    });

    this.updateStats(seatList);
    this.updateSelectionPanel();
  }

  onSeatClick(seat) {
    if (seat.status === 'occupied') {
      const conflictMsg = seat.conflictingBooking 
        ? `Seat ${seat.seatId} is OCCUPIED (${seat.conflictingBooking.slot}). Cannot double-book.`
        : `Seat ${seat.seatId} is OCCUPIED during this time window.`;
      this.notify(conflictMsg, 'warning');
      return;
    }

    if (seat.status === 'reserved') {
      this.notify(`Seat ${seat.seatId} is on payment hold (RESERVED). Please choose an available seat.`, 'warning');
      return;
    }

    // Toggle selected state
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
      if (this.toastElem) this.toastElem.style.display = 'none';
    }, 4500);
  }

  updateStats(seatList) {
    const total = seatList.length;
    const available = seatList.filter(s => s.status === 'available').length;
    const occupied = seatList.filter(s => s.status === 'occupied' || s.status === 'reserved').length;

    if (this.availCountDisplay) this.availCountDisplay.textContent = available;
    if (this.occupCountDisplay) this.occupCountDisplay.textContent = occupied;
    if (this.totalCountDisplay) this.totalCountDisplay.textContent = total;
  }

  updateSelectionPanel() {
    if (this.selectedDateDisplay) {
      this.selectedDateDisplay.textContent = this.currentDate;
    }

    if (this.selectedSlotDisplay) {
      this.selectedSlotDisplay.textContent = `${SLOT_TIME_WINDOWS[this.currentSlot].name} (${SLOT_TIME_WINDOWS[this.currentSlot].label})`;
    }

    if (this.selectedSeatId) {
      if (this.selectedSeatDisplay) {
        this.selectedSeatDisplay.textContent = this.selectedSeatId;
        this.selectedSeatDisplay.style.color = 'var(--accent)';
      }
      if (this.selectedStatusDisplay) {
        this.selectedStatusDisplay.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Available & Verified Non-Overlapping</span>`;
      }
      if (this.btnConfirmSeat) {
        this.btnConfirmSeat.disabled = false;
        this.btnConfirmSeat.innerHTML = `<i class="fa-solid fa-check"></i> Choose This Seat (${this.selectedSeatId})`;
      }
    } else {
      if (this.selectedSeatDisplay) {
        this.selectedSeatDisplay.textContent = 'None Selected';
        this.selectedSeatDisplay.style.color = 'var(--text-subtle)';
      }
      if (this.selectedStatusDisplay) {
        this.selectedStatusDisplay.innerHTML = `<span style="font-size: 0.88rem; color: var(--text-subtle);">Select an open desk in the layout</span>`;
      }
      if (this.btnConfirmSeat) {
        this.btnConfirmSeat.disabled = true;
        this.btnConfirmSeat.innerHTML = `<i class="fa-solid fa-hand-pointer"></i> Choose This Seat`;
      }
    }
  }

  handleSeatBookingSubmission() {
    if (!this.selectedSeatId) return;

    // Direct student seamlessly to the registration form with their selected seat & slot
    const targetUrl = `register.html?seat=${encodeURIComponent(this.selectedSeatId)}&slot=${encodeURIComponent(this.currentSlot)}&date=${encodeURIComponent(this.currentDate)}`;
    window.location.href = targetUrl;
  }
}

// Attach engine globally for debugging or testing in browser console
window.StudyHubSeatEngine = {
  checkTimeOverlap,
  isSeatAvailable,
  getAvailableSeats,
  allocateSeat,
  releaseSeat,
  getMockBookings: () => MOCK_BOOKINGS,
  resetMockBookings: () => {
    // helper to reset for testing
    MOCK_BOOKINGS = [];
  }
};

// Auto-initialize when interactive map DOM is present
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('seats-matrix-container')) {
    window.seatMapController = new SeatMapController();
  }
});
