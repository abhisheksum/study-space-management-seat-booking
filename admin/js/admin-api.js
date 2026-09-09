'use strict';

const adminApi = async (path, options = {}) => {
  const response = await window.studyHubAdminFetch(`/api${path}`, options);
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.message || 'Unable to load admin data.');
  return payload.data;
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const emptyRow = (tbody, columns, message) => {
  tbody.innerHTML = `<tr><td colspan="${columns}" style="text-align:center;color:var(--admin-text-muted);">${escapeHtml(message)}</td></tr>`;
};
const notify = (message, isError = false) => {
  let box = document.getElementById('admin-operation-status');
  if (!box) {
    box = document.createElement('p');
    box.id = 'admin-operation-status';
    box.style.cssText = 'position:fixed;right:1rem;bottom:1rem;padding:.8rem 1rem;border-radius:8px;background:#0f172a;color:#fff;z-index:20';
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.style.background = isError ? '#991b1b' : '#047857';
  clearTimeout(box._timer);
  box._timer = setTimeout(() => box.remove(), 3500);
};

const statusClass = (status) => ({
  active: 'status-active', completed: 'status-active', paid: 'status-active',
  available: 'status-available', pending: 'status-reserved', cancelled: 'status-expired',
  expired: 'status-expired', maintenance: 'status-reserved', inactive: 'status-expired'
}[status] || 'status-slot');

function renderTable(tbody, rows, columns, renderer) {
  if (!rows.length) return emptyRow(tbody, columns, 'No records found.');
  tbody.innerHTML = rows.map(renderer).join('');
}

async function loadStudents() {
  const tbody = document.getElementById('students-table-body');
  const search = document.getElementById('student-search-input');
  let students = await adminApi('/students');
  const render = () => renderTable(tbody, students.filter((student) => {
    const q = (search?.value || '').toLowerCase();
    return !q || [student.full_name, student.id, student.mobile, student.email].join(' ').toLowerCase().includes(q);
  }), 9, (student) => `<tr>
    <td><strong>ST-${student.id}</strong></td><td><strong>${escapeHtml(student.full_name)}</strong><br><span style="font-size:.78rem;color:var(--admin-text-muted)">${escapeHtml(student.email || '')}</span></td>
    <td>${escapeHtml(student.mobile)}</td><td><span class="status-badge status-slot">See memberships</span></td><td>--</td><td>--</td><td>--</td>
    <td><span class="status-badge ${statusClass(student.is_active ? 'active' : 'inactive')}">${student.is_active ? 'active' : 'inactive'}</span></td>
    <td><button class="admin-btn admin-btn-outline admin-btn-sm" data-edit-student="${student.id}">Edit</button>
    <button class="admin-btn admin-btn-outline admin-btn-sm" data-delete-student="${student.id}">Deactivate</button></td></tr>`);
  search?.addEventListener('input', render);
  render();
  tbody.addEventListener('click', async (event) => {
    const edit = event.target.closest('[data-edit-student]');
    const remove = event.target.closest('[data-delete-student]');
    const id = edit?.dataset.editStudent || remove?.dataset.deleteStudent;
    if (!id) return;
    try {
      if (remove) await adminApi(`/students/${id}`, { method: 'DELETE' });
      else {
        const name = window.prompt('Student full name');
        if (name) await adminApi(`/students/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: name }) });
      }
      students = await adminApi('/students'); render(); notify('Student updated.');
    } catch (error) { notify(error.message, true); }
  });
}

async function loadSeats() {
  const tbody = document.getElementById('seats-table-body');
  const filter = document.getElementById('seat-status-filter');
  const seats = await adminApi('/seats');
  const seatMetrics = document.querySelectorAll('.metric-value');
  if (seatMetrics[0]) seatMetrics[0].textContent = `${seats.filter((seat) => seat.status === 'active').length} Desks`;
  if (seatMetrics[1]) seatMetrics[1].textContent = `${seats.filter((seat) => seat.status !== 'active').length} Desks`;
  const render = () => renderTable(tbody, seats.filter((seat) => filter?.value === 'all' || filter?.value === seat.status), 6, (seat) => {
    const status = seat.status === 'active' ? 'available' : seat.status;
    return `<tr><td><strong style="font-size:1.1rem;color:var(--admin-primary)">${escapeHtml(seat.seat_number)}</strong></td>
      <td>Bay ${escapeHtml(seat.zone)}</td><td><span class="status-badge ${statusClass(status)}">${status}</span></td>
      <td>--</td><td>--</td><td><button class="admin-btn admin-btn-outline admin-btn-sm" data-edit-seat="${seat.id}">Edit</button></td></tr>`;
  });
  filter?.addEventListener('change', render);
  render();
  document.querySelector('[data-add-seat]')?.addEventListener('click', async () => {
    const seat_number = window.prompt('Seat number (for example A01)');
    if (!seat_number) return;
    try {
      await adminApi('/seats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_number, zone: seat_number[0], row_position: Number(seat_number.slice(1)) }) });
      notify('Seat created. Refreshing list.'); window.location.reload();
    } catch (error) { notify(error.message, true); }
  });
  tbody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-edit-seat]');
    if (!button) return;
    const status = window.prompt('Seat status: active, maintenance, or inactive');
    if (!status) return;
    try { await adminApi(`/seats/${button.dataset.editSeat}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); notify('Seat status updated.'); window.location.reload(); }
    catch (error) { notify(error.message, true); }
  });
}

async function loadBookings() {
  const tbody = document.getElementById('bookings-table-body');
  const search = document.getElementById('booking-search-input');
  let bookings = await adminApi('/bookings');
  const render = () => renderTable(tbody, bookings.filter((booking) => {
    const q = (search?.value || '').toLowerCase();
    return !q || [booking.id, booking.student_name, booking.seat_number].join(' ').toLowerCase().includes(q);
  }), 8, (booking) => `<tr><td><strong style="font-family:monospace;color:var(--admin-accent)">BK-${booking.id}</strong></td>
    <td><strong>${escapeHtml(booking.student_name)}</strong></td><td>ST-${booking.student_id || '--'}</td><td><strong style="color:var(--admin-primary)">${escapeHtml(booking.seat_number)}</strong></td>
    <td>${escapeHtml(booking.booking_date)}</td><td>${escapeHtml(booking.slot_key)}</td>
    <td><span class="status-badge ${statusClass(booking.status)}">${escapeHtml(booking.status)}</span></td>
    <td><button class="admin-btn admin-btn-outline admin-btn-sm" data-booking-status="${booking.id}" data-status="cancelled" ${booking.status !== 'active' ? 'disabled' : ''}>Cancel</button>
    <button class="admin-btn admin-btn-outline admin-btn-sm" data-booking-status="${booking.id}" data-status="completed" ${booking.status !== 'active' ? 'disabled' : ''}>Complete</button></td></tr>`);
  search?.addEventListener('input', render);
  render();
  tbody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-booking-status]');
    if (!button) return;
    try {
      await adminApi(`/bookings/${button.dataset.bookingStatus}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: button.dataset.status }) });
      bookings = await adminApi('/bookings');
      render();
      notify('Booking status updated.');
    } catch (error) { notify(error.message, true); }
  });
}

async function loadPayments() {
  const tbody = document.getElementById('payments-table-body');
  const payments = await adminApi('/payments');
  const paymentMetrics = document.querySelectorAll('.metric-value');
  const today = new Date().toISOString().slice(0, 10);
  const completed = payments.filter((payment) => payment.status === 'completed');
  const todayCompleted = completed.filter((payment) => String(payment.payment_date).slice(0, 10) === today);
  if (paymentMetrics[0]) paymentMetrics[0].textContent = `₹${todayCompleted.reduce((sum, payment) => sum + Number(payment.amount), 0).toLocaleString('en-IN')}`;
  if (paymentMetrics[1]) paymentMetrics[1].textContent = `₹${completed.reduce((sum, payment) => sum + Number(payment.amount), 0).toLocaleString('en-IN')}`;
  if (paymentMetrics[2]) paymentMetrics[2].textContent = `${payments.filter((payment) => payment.status === 'pending').length} Invoices`;
  renderTable(tbody, payments, 8, (payment) => `<tr><td><strong style="font-family:monospace;color:var(--admin-accent)">TXN-${payment.id}</strong></td>
    <td><strong>${escapeHtml(payment.student_name)}</strong></td><td>₹${Number(payment.amount).toLocaleString('en-IN')}</td><td>${escapeHtml(payment.payment_date)}</td>
    <td>${escapeHtml(payment.payment_method)}</td><td>--</td><td><span class="status-badge ${statusClass(payment.status)}">${escapeHtml(payment.status)}</span></td><td><button class="admin-btn admin-btn-outline admin-btn-sm" data-payment-status="${payment.id}">Update</button></td></tr>`);
  tbody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-payment-status]');
    if (!button) return;
    const status = window.prompt('Payment status: pending, completed, failed, or refunded');
    if (!status) return;
    try { await adminApi(`/payments/${button.dataset.paymentStatus}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); notify('Payment status updated.'); window.location.reload(); }
    catch (error) { notify(error.message, true); }
  });
  document.querySelector('[data-export-payments]')?.addEventListener('click', () => {
    const csv = ['id,student,amount,status,payment_method,payment_date', ...payments.map((p) => [p.id, p.student_name, p.amount, p.status, p.payment_method, p.payment_date].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'studyhub-payments.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });
  document.querySelector('[data-record-payment]')?.addEventListener('click', async () => {
    const student_id = window.prompt('Student ID');
    const amount = window.prompt('Amount');
    if (!student_id || !amount) return;
    try {
      await adminApi('/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id, amount, payment_method: 'cash', status: 'completed' }) });
      notify('Payment recorded.'); window.location.reload();
    } catch (error) { notify(error.message, true); }
  });
}

async function loadAttendance() {
  const tbody = document.getElementById('attendance-table-body');
  const today = new Date().toISOString().slice(0, 10);
  let records = await adminApi(`/attendance?date=${today}`);
  const attendanceMetric = document.querySelector('.metric-value');
  if (attendanceMetric) attendanceMetric.textContent = `${records.filter((record) => !record.check_out_time).length} Students`;
  const metricValues = document.querySelectorAll('.metric-value');
  if (metricValues[1]) metricValues[1].textContent = `${records.filter((record) => record.check_out_time).length} Students`;
  renderTable(tbody, records, 6, (record) => `<tr><td><strong>${escapeHtml(record.student_name)}</strong></td><td><strong style="color:var(--admin-primary)">${escapeHtml(record.seat_number)}</strong></td>
    <td>${escapeHtml(record.check_in_time)}</td><td>${escapeHtml(record.check_out_time || '--')}</td>
    <td><span class="status-badge ${statusClass(record.check_out_time ? 'completed' : 'active')}">${record.check_out_time ? 'completed' : 'present'}</span></td>
    <td>${record.check_out_time ? '--' : `<button class="admin-btn admin-btn-outline admin-btn-sm" data-checkout="${record.id}">Check-out</button>`}</td></tr>`);
  tbody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-checkout]');
    if (!button) return;
    try { await adminApi(`/attendance/${button.dataset.checkout}/checkout`, { method: 'PATCH' }); notify('Check-out recorded.'); records = await adminApi(`/attendance?date=${today}`); renderTable(tbody, records, 6, attendanceRow); }
    catch (error) { notify(error.message, true); }
  });
  const attendanceRow = (record) => `<tr><td><strong>${escapeHtml(record.student_name)}</strong></td><td><strong style="color:var(--admin-primary)">${escapeHtml(record.seat_number)}</strong></td>
    <td>${escapeHtml(record.check_in_time)}</td><td>${escapeHtml(record.check_out_time || '--')}</td>
    <td><span class="status-badge ${statusClass(record.check_out_time ? 'completed' : 'active')}">${record.check_out_time ? 'completed' : 'present'}</span></td>
    <td>${record.check_out_time ? '--' : `<button class="admin-btn admin-btn-outline admin-btn-sm" data-checkout="${record.id}">Check-out</button>`}</td></tr>`;
  document.querySelector('[data-checkin]')?.addEventListener('click', async () => {
    const student_id = window.prompt('Student ID');
    const booking_id = window.prompt('Active booking ID');
    const seat_id = window.prompt('Seat ID');
    const slot_key = window.prompt('Slot key (morning, afternoon, evening, half-day-am, half-day-pm, full-day)');
    if (!student_id || !booking_id || !seat_id || !slot_key) return;
    try {
      await adminApi('/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, booking_id, seat_id, slot_key, booking_date: today }) });
      notify('Check-in recorded.'); window.location.reload();
    } catch (error) { notify(error.message, true); }
  });
}

async function loadPlans() {
  const cards = document.querySelectorAll('[data-plan-card]');
  const [plans, memberships] = await Promise.all([adminApi('/plans'), adminApi('/memberships')]);
  const membershipCount = document.getElementById('active-membership-count');
  if (membershipCount) membershipCount.textContent = `${memberships.filter((membership) => membership.status === 'active').length} active memberships`;
  if (!plans.length) {
    cards.forEach((card) => { card.innerHTML = '<p style="color:var(--admin-text-muted)">No membership plans configured.</p>'; });
    return;
  }

  async function loadSettings() {
    const settings = await adminApi('/settings');
    const fields = document.querySelectorAll('.admin-content input, .admin-content select');
    fields.forEach((field) => {
      const label = field.parentElement?.querySelector('label')?.textContent?.toLowerCase() || '';
      if (label.includes('branch')) field.value = settings.branch_name || field.value;
      if (label.includes('helpline')) field.value = settings.helpline_phone || field.value;
      if (label.includes('whatsapp')) field.value = settings.whatsapp_phone || field.value;
      if (label.includes('admissions')) field.value = settings.admissions_email || field.value;
    });
    document.querySelector('[data-save-settings]')?.addEventListener('click', async () => {
      const inputs = document.querySelectorAll('.admin-content input');
      const selects = document.querySelectorAll('.admin-content select');
      try {
        await adminApi('/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch_name: inputs[0]?.value, helpline_phone: inputs[1]?.value,
            whatsapp_phone: inputs[2]?.value, admissions_email: inputs[3]?.value,
            strict_overlap: Boolean(inputs[4]?.checked), handover_buffer_minutes: Number(selects[0]?.value || 15),
            auto_release_expired: Boolean(inputs[5]?.checked), gate_ip: inputs[6]?.value, sync_frequency: selects[1]?.value
          })
        });
        notify('Settings saved.');
      } catch (error) { notify(error.message, true); }
    });
  }
  plans.forEach((plan, index) => {
    const card = cards[index];
    if (!card) return;
    card.querySelector('[data-plan-name]').textContent = plan.name;
    card.querySelector('[data-plan-price]').textContent = `₹${Number(plan.price).toLocaleString('en-IN')}`;
    card.querySelector('[data-plan-description]').textContent = plan.description || '';
    card.querySelector('[data-plan-status]').textContent = plan.is_active ? 'Active Tier' : 'Inactive Tier';
    card.querySelector('[data-edit-plan]')?.setAttribute('data-edit-plan', plan.id);
  });
  document.querySelector('[data-add-plan]')?.addEventListener('click', async () => {
    const name = window.prompt('Plan name');
    if (!name) return;
    try {
      await adminApi('/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type: 'slot', price: 0, duration_days: 30, description: '' }) });
      notify('Membership plan created.'); window.location.reload();
    } catch (error) { notify(error.message, true); }
  });
  document.querySelectorAll('[data-edit-plan]').forEach((button) => button.addEventListener('click', async () => {
    const price = window.prompt('New monthly price');
    if (price === null) return;
    try { await adminApi(`/plans/${button.dataset.editPlan}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: Number(price) }) }); notify('Membership plan updated.'); window.location.reload(); }
    catch (error) { notify(error.message, true); }
  }));
}

async function loadDashboard() {
  const [students, seats, bookings, memberships, payments, availability] = await Promise.all([
    adminApi('/students'), adminApi('/seats'), adminApi('/bookings'), adminApi('/memberships'), adminApi('/payments'),
    fetch(`/api/seats/availability?date=${new Date().toISOString().slice(0, 10)}&slot=morning`).then((response) => response.json()).then((body) => body.data || [])
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const values = document.querySelectorAll('.metric-value');
  const metrics = [
    seats.length,
    availability.filter((seat) => seat.status === 'available').length,
    availability.filter((seat) => seat.status === 'active').length,
    memberships.filter((membership) => membership.status === 'active').length,
    bookings.filter((booking) => String(booking.booking_date).slice(0, 10) === today).length,
    `₹${payments.filter((payment) => payment.status === 'completed' && String(payment.payment_date).slice(0, 10) === today).reduce((sum, payment) => sum + Number(payment.amount), 0).toLocaleString('en-IN')}`,
    memberships.filter((membership) => membership.status === 'active' && String(membership.end_date).slice(0, 10) <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length
  ];
  values.forEach((element, index) => { if (metrics[index] !== undefined) element.textContent = metrics[index]; });
  const tbody = document.querySelector('.admin-table tbody');
  renderTable(tbody, bookings.slice(0, 5), 5, (booking) => `<tr><td><strong>BK-${booking.id}</strong></td><td>${escapeHtml(booking.student_name)}</td><td><span class="status-badge status-active">${escapeHtml(booking.seat_number)}</span></td><td>${escapeHtml(booking.slot_key)}</td><td><span class="status-badge ${statusClass(booking.status)}">${escapeHtml(booking.status)}</span></td></tr>`);
  void students;
}

document.addEventListener('DOMContentLoaded', () => {
  const loaders = {
    'students.html': loadStudents, 'seats.html': loadSeats, 'bookings.html': loadBookings,
    'payments.html': loadPayments, 'attendance.html': loadAttendance, 'memberships.html': loadPlans,
    'index.html': loadDashboard, 'settings.html': loadSettings
  };
  const loader = loaders[window.location.pathname.split('/').pop()];
  if (!loader) return;
  loader().catch((error) => {
    console.error(error);
    const table = document.querySelector('tbody');
    if (table) emptyRow(table, table.closest('table').querySelectorAll('th').length, 'Unable to load live data. Please refresh.');
  });
});
