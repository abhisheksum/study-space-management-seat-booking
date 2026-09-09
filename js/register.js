/**
 * StudyHub - Student Membership Registration Form Controller
 * 
 * Features:
 * - Field-level validation (Mobile, Email, Pincode, File types, Terms)
 * - Dynamic slot options update when Membership Type changes
 * - Dynamic seat status preview when seat or slot is changed
 * - Confirmation screen generation with Registration ID, Name, Slot, Seat, and Next Steps
 * - Modular data structure ready for backend API POST submission
 */

// Membership slot options mapping
const MEMBERSHIP_SLOT_OPTIONS = {
  'full-day': [
    { value: 'full-day', label: 'Full Day Unlimited (06:00 AM – 11:00 PM)' }
  ],
  'half-day': [
    { value: 'half-day-am', label: 'Half Day Morning (06:00 AM – 06:00 PM)' },
    { value: 'half-day-pm', label: 'Half Day Evening (12:00 PM – 11:00 PM)' }
  ],
  'slot-based': [
    { value: 'morning', label: 'Morning Slot (06:00 AM – 12:00 PM)' },
    { value: 'afternoon', label: 'Afternoon Slot (12:00 PM – 06:00 PM)' },
    { value: 'evening', label: 'Evening Slot (06:00 PM – 10:00 PM)' }
  ]
};

// 30 physical seat workstations
const REGISTRATION_SEATS = [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10',
  'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10'
];

class RegistrationController {
  constructor() {
    this.form = document.getElementById('student-registration-form');
    this.formSection = document.getElementById('registration-form-section');
    this.confirmationSection = document.getElementById('registration-confirmation-section');

    // Key interactive fields
    this.membershipTypeSelect = document.getElementById('reg-membership-type');
    this.timeSlotSelect = document.getElementById('reg-time-slot');
    this.seatSelect = document.getElementById('reg-seat-number');
    this.dateInput = document.getElementById('reg-preferred-date');
    this.photoInput = document.getElementById('reg-profile-photo');
    this.seatPreviewBadge = document.getElementById('reg-seat-preview-badge');

    if (this.form) {
      this.init();
    }
  }

  init() {
    // 1. Set default date to today and prevent past dates
    if (this.dateInput) {
      const today = new Date().toISOString().split('T')[0];
      this.dateInput.value = today;
      this.dateInput.min = today;
    }

    // 2. Populate seat dropdown with 30 seats
    this.populateSeatDropdown();

    // 3. Pre-fill from URL parameters if available (e.g. from seats.html)
    this.prefillFromParams();

    // 4. Bind dynamic event listeners
    if (this.membershipTypeSelect) {
      this.membershipTypeSelect.addEventListener('change', (e) => {
        this.updateTimeSlotOptions(e.target.value);
        this.updateSeatPreview();
      });
    }

    if (this.timeSlotSelect) {
      this.timeSlotSelect.addEventListener('change', () => {
        this.updateSeatPreview();
      });
    }

    if (this.seatSelect) {
      this.seatSelect.addEventListener('change', () => {
        this.updateSeatPreview();
      });
    }

    if (this.photoInput) {
      this.photoInput.addEventListener('change', (e) => {
        this.validatePhotoFile(e.target);
      });
    }

    // 5. Form submission validation
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.updateSeatPreview();
  }

  populateSeatDropdown() {
    if (!this.seatSelect) return;
    this.seatSelect.innerHTML = '<option value="">-- Choose a Seat (A01 - C10) --</option>';
    
    REGISTRATION_SEATS.forEach(seatId => {
      const opt = document.createElement('option');
      opt.value = seatId;
      opt.textContent = `Workstation ${seatId}`;
      this.seatSelect.appendChild(opt);
    });
  }

  prefillFromParams() {
    const params = new URLSearchParams(window.location.search);
    const seatParam = params.get('seat');
    const slotParam = params.get('slot');
    const planParam = params.get('plan');

    if (planParam && MEMBERSHIP_SLOT_OPTIONS[planParam]) {
      this.membershipTypeSelect.value = planParam;
      this.updateTimeSlotOptions(planParam);
    } else {
      this.updateTimeSlotOptions(this.membershipTypeSelect.value || 'slot-based');
    }

    if (slotParam) {
      this.timeSlotSelect.value = slotParam;
    }

    if (seatParam && REGISTRATION_SEATS.includes(seatParam)) {
      this.seatSelect.value = seatParam;
    }
  }

  updateTimeSlotOptions(membershipType) {
    if (!this.timeSlotSelect) return;
    this.timeSlotSelect.innerHTML = '';

    const options = MEMBERSHIP_SLOT_OPTIONS[membershipType] || MEMBERSHIP_SLOT_OPTIONS['slot-based'];
    options.forEach(opt => {
      const optionElem = document.createElement('option');
      optionElem.value = opt.value;
      optionElem.textContent = opt.label;
      this.timeSlotSelect.appendChild(optionElem);
    });
  }

  updateSeatPreview() {
    if (!this.seatPreviewBadge) return;
    const selectedSeat = this.seatSelect ? this.seatSelect.value : '';
    const selectedSlotText = this.timeSlotSelect && this.timeSlotSelect.selectedOptions[0]
      ? this.timeSlotSelect.selectedOptions[0].textContent
      : '';

    if (selectedSeat && selectedSlotText) {
      this.seatPreviewBadge.innerHTML = `
        <div style="background: var(--primary-light); border: 1px solid var(--border-focus); padding: 0.85rem 1.25rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong style="color: var(--primary); font-size: 1.05rem;"><i class="fa-solid fa-chair"></i> Desk: ${selectedSeat}</strong>
            <span style="color: var(--text-muted); font-size: 0.88rem; display: block; margin-top: 0.15rem;">Slot: ${selectedSlotText}</span>
          </div>
          <span class="badge badge-success"><i class="fa-solid fa-check"></i> Hold Assigned</span>
        </div>
      `;
    } else {
      this.seatPreviewBadge.innerHTML = `
        <div style="background: var(--bg-alt); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-subtle);">
          <i class="fa-solid fa-circle-info"></i> Select both a Membership Slot and Seat Number above to review desk hold status.
        </div>
      `;
    }
  }

  validatePhotoFile(fileInput) {
    const file = fileInput.files[0];
    const errorElem = document.getElementById('error-profile-photo');
    if (!file) return true;

    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 3 * 1024 * 1024; // 3MB

    if (!validExtensions.includes(file.type)) {
      this.setError(fileInput, errorElem, 'Please upload a valid image file (JPG, PNG, or WebP).');
      fileInput.value = '';
      return false;
    }

    if (file.size > maxSizeBytes) {
      this.setError(fileInput, errorElem, 'Image size exceeds 3MB limit. Please upload a smaller photo.');
      fileInput.value = '';
      return false;
    }

    this.clearError(fileInput, errorElem);
    return true;
  }

  validateForm() {
    let isValid = true;

    // Helper validation rules
    const nameInput = document.getElementById('reg-full-name');
    const mobileInput = document.getElementById('reg-mobile');
    const emailInput = document.getElementById('reg-email');
    const dobInput = document.getElementById('reg-dob');
    const genderInput = document.getElementById('reg-gender');

    const addressInput = document.getElementById('reg-address');
    const cityInput = document.getElementById('reg-city');
    const stateInput = document.getElementById('reg-state');
    const pincodeInput = document.getElementById('reg-pincode');

    const emergencyNameInput = document.getElementById('reg-emergency-name');
    const emergencyPhoneInput = document.getElementById('reg-emergency-phone');
    const emergencyRelInput = document.getElementById('reg-emergency-rel');

    const studentIdInput = document.getElementById('reg-student-id');
    const termsCheckbox = document.getElementById('reg-terms');

    // 1. Full Name
    if (!nameInput.value.trim() || nameInput.value.trim().length < 3) {
      this.setError(nameInput, document.getElementById('error-full-name'), 'Please provide your full legal name (at least 3 characters).');
      isValid = false;
    } else {
      this.clearError(nameInput, document.getElementById('error-full-name'));
    }

    // 2. Mobile (10-digit Indian standard regex or international)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanMobile = mobileInput.value.replace(/[\s\-+]/g, '').slice(-10);
    if (!phoneRegex.test(cleanMobile)) {
      this.setError(mobileInput, document.getElementById('error-mobile'), 'Please enter a valid 10-digit mobile number.');
      isValid = false;
    } else {
      this.clearError(mobileInput, document.getElementById('error-mobile'));
    }

    // 3. Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      this.setError(emailInput, document.getElementById('error-email'), 'Please enter a valid email address.');
      isValid = false;
    } else {
      this.clearError(emailInput, document.getElementById('error-email'));
    }

    // 4. DOB
    if (!dobInput.value) {
      this.setError(dobInput, document.getElementById('error-dob'), 'Date of birth is required.');
      isValid = false;
    } else {
      this.clearError(dobInput, document.getElementById('error-dob'));
    }

    // 5. Gender
    if (!genderInput.value) {
      this.setError(genderInput, document.getElementById('error-gender'), 'Please select your gender.');
      isValid = false;
    } else {
      this.clearError(genderInput, document.getElementById('error-gender'));
    }

    // 6. Address
    if (!addressInput.value.trim()) {
      this.setError(addressInput, document.getElementById('error-address'), 'Street address is required.');
      isValid = false;
    } else {
      this.clearError(addressInput, document.getElementById('error-address'));
    }

    // 7. City
    if (!cityInput.value.trim()) {
      this.setError(cityInput, document.getElementById('error-city'), 'City is required.');
      isValid = false;
    } else {
      this.clearError(cityInput, document.getElementById('error-city'));
    }

    // 8. State
    if (!stateInput.value.trim()) {
      this.setError(stateInput, document.getElementById('error-state'), 'State is required.');
      isValid = false;
    } else {
      this.clearError(stateInput, document.getElementById('error-state'));
    }

    // 9. Pincode (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincodeInput.value.trim())) {
      this.setError(pincodeInput, document.getElementById('error-pincode'), 'Enter a valid 6-digit postal pincode.');
      isValid = false;
    } else {
      this.clearError(pincodeInput, document.getElementById('error-pincode'));
    }

    // 10. Seat Selection
    if (!this.seatSelect.value) {
      this.setError(this.seatSelect, document.getElementById('error-seat'), 'Please choose an available workstation.');
      isValid = false;
    } else {
      this.clearError(this.seatSelect, document.getElementById('error-seat'));
    }

    // 11. Emergency Name & Phone
    if (!emergencyNameInput.value.trim()) {
      this.setError(emergencyNameInput, document.getElementById('error-emergency-name'), 'Emergency contact name is required.');
      isValid = false;
    } else {
      this.clearError(emergencyNameInput, document.getElementById('error-emergency-name'));
    }

    const cleanEmergPhone = emergencyPhoneInput.value.replace(/[\s\-+]/g, '').slice(-10);
    if (!phoneRegex.test(cleanEmergPhone)) {
      this.setError(emergencyPhoneInput, document.getElementById('error-emergency-phone'), 'Enter a valid 10-digit emergency contact number.');
      isValid = false;
    } else {
      this.clearError(emergencyPhoneInput, document.getElementById('error-emergency-phone'));
    }

    if (!emergencyRelInput.value.trim()) {
      this.setError(emergencyRelInput, document.getElementById('error-emergency-rel'), 'Specify relationship (e.g. Parent, Sibling, Guardian).');
      isValid = false;
    } else {
      this.clearError(emergencyRelInput, document.getElementById('error-emergency-rel'));
    }

    // 12. Terms & Conditions
    if (!termsCheckbox.checked) {
      this.setError(termsCheckbox, document.getElementById('error-terms'), 'You must agree to the center rules and silence policies.');
      isValid = false;
    } else {
      this.clearError(termsCheckbox, document.getElementById('error-terms'));
    }

    return isValid;
  }

  setError(inputElem, errorElem, message) {
    if (inputElem) inputElem.classList.add('is-invalid');
    if (errorElem) {
      errorElem.textContent = message;
      errorElem.style.display = 'block';
    }
  }

  clearError(inputElem, errorElem) {
    if (inputElem) inputElem.classList.remove('is-invalid');
    if (errorElem) {
      errorElem.textContent = '';
      errorElem.style.display = 'none';
    }
  }

  async handleSubmit() {
    if (!this.validateForm()) {
      // Scroll to the first error
      const firstInvalid = document.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return;
    }

    const submitButton = document.getElementById('btn-submit-registration');
    const submitError = document.getElementById('registration-submit-error');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Registering...';
    submitError.textContent = '';
    submitError.style.display = 'none';

    const registrationPayload = {
      full_name: document.getElementById('reg-full-name').value.trim(),
      mobile: document.getElementById('reg-mobile').value.replace(/[\s\-+]/g, '').slice(-10),
      email: document.getElementById('reg-email').value.trim(),
      date_of_birth: document.getElementById('reg-dob').value,
      gender: document.getElementById('reg-gender').value,
      address: document.getElementById('reg-address').value.trim(),
      city: document.getElementById('reg-city').value.trim(),
      state: document.getElementById('reg-state').value.trim(),
      pincode: document.getElementById('reg-pincode').value.trim(),
      student_id_no: document.getElementById('reg-student-id').value.trim(),
      emergency_contact_name: document.getElementById('reg-emergency-name').value.trim(),
      emergency_contact_mobile: document.getElementById('reg-emergency-phone').value.replace(/[\s\-+]/g, '').slice(-10),
      emergency_contact_rel: document.getElementById('reg-emergency-rel').value.trim()
    };

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.data) {
        const details = Array.isArray(payload.errors) && payload.errors.length
          ? ` ${payload.errors.join(' ')}`
          : '';
        throw new Error(`${payload.message || 'Registration failed.'}${details}`);
      }

      this.renderConfirmation({
        registrationId: payload.data.id,
        personal: {
          fullName: payload.data.full_name,
          mobile: payload.data.mobile
        },
        membership: {
          typeLabel: this.membershipTypeSelect.selectedOptions[0].textContent,
          preferredDate: this.dateInput.value,
          slotLabel: this.timeSlotSelect.selectedOptions[0].textContent,
          seatNumber: this.seatSelect.value
        }
      });
    } catch (error) {
      console.error('Student registration failed:', error);
      submitError.textContent = error.message;
      submitError.style.display = 'block';
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Registration & Reserve Seat';
    }
  }

  renderConfirmation(data) {
    if (!this.formSection || !this.confirmationSection) return;

    // Hide form, show confirmation
    this.formSection.style.display = 'none';
    this.confirmationSection.style.display = 'block';
    this.confirmationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    this.confirmationSection.innerHTML = `
      <div class="confirmation-card">
        <div class="confirmation-icon">
          <i class="fa-solid fa-check"></i>
        </div>

        <span class="badge badge-success" style="font-size: 0.9rem; padding: 0.4rem 1rem; margin-bottom: 0.85rem;">
          Application Received & Desk Reserved
        </span>

        <h2 style="font-size: 2rem; margin-bottom: 0.5rem; color: var(--text-main);">
          Registration Successful!
        </h2>
        <p style="color: var(--text-muted); font-size: 1.05rem;">
          Welcome to StudyHub, <strong>${data.personal.fullName}</strong>. Your desk has been placed on provisional reservation.
        </p>

        <!-- Summary Details Box -->
        <div class="confirmation-details-box">
          <div class="confirmation-detail-row">
            <span style="color: var(--text-muted);">Registration ID:</span>
            <strong style="color: var(--accent); font-family: monospace; font-size: 1.15rem;">${data.registrationId}</strong>
          </div>

          <div class="confirmation-detail-row">
            <span style="color: var(--text-muted);">Student Name:</span>
            <strong>${data.personal.fullName}</strong>
          </div>

          <div class="confirmation-detail-row">
            <span style="color: var(--text-muted);">Membership Type:</span>
            <strong>${data.membership.typeLabel}</strong>
          </div>

          <div class="confirmation-detail-row">
            <span style="color: var(--text-muted);">Selected Time Slot:</span>
            <strong>${data.membership.slotLabel}</strong>
          </div>

          <div class="confirmation-detail-row">
            <span style="color: var(--text-muted);">Selected Desk Number:</span>
            <strong style="color: var(--accent); font-size: 1.25rem;">Workstation ${data.membership.seatNumber}</strong>
          </div>

          <div class="confirmation-detail-row">
            <span style="color: var(--text-muted);">Start Date:</span>
            <strong>${data.membership.preferredDate}</strong>
          </div>

          <div class="confirmation-detail-row">
            <span style="color: var(--text-muted);">Registered Phone:</span>
            <strong>${data.personal.mobile}</strong>
          </div>
        </div>

        <!-- Next Steps Instruction Block -->
        <div class="next-steps-list">
          <h4 style="color: var(--primary); margin-bottom: 0.75rem; font-size: 1.05rem;">
            <i class="fa-solid fa-list-check"></i> What Happens Next?
          </h4>
          <ol style="margin-left: 1.25rem; font-size: 0.95rem; color: var(--text-muted); line-height: 1.7; list-style-type: decimal;">
            <li><strong>SMS / WhatsApp Verification:</strong> Our desk coordinator will send your digital confirmation pass to <strong>${data.personal.mobile}</strong> within 30 minutes.</li>
            <li><strong>Center Walk-In:</strong> Visit StudyHub on or before <strong>${data.membership.preferredDate}</strong> with your Student / Government Photo ID.</li>
            <li><strong>Biometric Setup & Orientation:</strong> Complete 2-minute fingerprint registration, collect your desk locker key, and begin your focused study journey.</li>
          </ol>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="index.html" class="btn btn-outline btn-lg">Back to Home</a>
          <a href="seats.html" class="btn btn-secondary btn-lg">View Seat Map</a>
          <button type="button" class="btn btn-primary btn-lg" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print Confirmation Receipt
          </button>
        </div>
      </div>
    `;
  }
}

// Auto-initialize when register form is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('student-registration-form')) {
    window.registrationController = new RegistrationController();
  }
});
