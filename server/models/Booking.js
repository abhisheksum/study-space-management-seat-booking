/**
 * StudyHub — Booking Model
 * Per-day seat reservations with anti-overlap SQL enforcement.
 */
'use strict';

const { pool } = require('../config/database');

const Booking = {
  /**
   * Insert a new booking.
   * NOTE: Caller (bookingController) MUST run checkSeatOverlap() BEFORE calling this.
   * 
   * @param {object} data - { membership_id?, student_id, seat_id, slot_key, booking_date, start_hour, end_hour }
   * @returns {Promise<number>} Inserted booking ID
   */
  async create(data) {
    const [result] = await pool.execute(`
      INSERT INTO bookings
        (membership_id, student_id, seat_id, slot_key, booking_date, start_hour, end_hour, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      data.membership_id || null,
      data.student_id,
      data.seat_id,
      data.slot_key,
      data.booking_date,
      data.start_hour,
      data.end_hour
    ]);
    return result.insertId;
  },

  /**
   * Find bookings with optional filters.
   * @param {object} [filters] - { student_id, seat_id, date, status }
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let sql = `
      SELECT
        b.id, b.slot_key, b.booking_date, b.start_hour, b.end_hour,
        b.status, b.created_at,
        s.full_name  AS student_name,
        s.mobile     AS student_mobile,
        st.seat_number,
        st.zone
      FROM bookings b
      JOIN students s  ON s.id  = b.student_id
      JOIN seats    st ON st.id = b.seat_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.student_id) {
      sql += ' AND b.student_id = ?';
      params.push(filters.student_id);
    }
    if (filters.seat_id) {
      sql += ' AND b.seat_id = ?';
      params.push(filters.seat_id);
    }
    if (filters.date) {
      sql += ' AND b.booking_date = ?';
      params.push(filters.date);
    }
    if (filters.status) {
      sql += ' AND b.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY b.booking_date DESC, b.start_hour ASC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Find a single booking by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(`
      SELECT b.*, s.full_name AS student_name, st.seat_number, st.zone
      FROM bookings b
      JOIN students s  ON s.id  = b.student_id
      JOIN seats    st ON st.id = b.seat_id
      WHERE b.id = ?
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  },

  /**
   * Cancel a booking (soft status update).
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async cancel(id) {
    const [result] = await pool.execute(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Mark a booking as completed.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async complete(id) {
    const [result] = await pool.execute(
      "UPDATE bookings SET status = 'completed' WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Count today's bookings (for dashboard stats).
   * @returns {Promise<number>}
   */
  async countToday() {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM bookings WHERE booking_date = CURDATE() AND status = 'active'"
    );
    return rows[0].cnt;
  }
};

module.exports = Booking;
