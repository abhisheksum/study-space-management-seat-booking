/**
 * StudyHub — Attendance Model
 * Gate check-in / check-out log for daily student presence tracking.
 */
'use strict';

const { pool } = require('../config/database');

const Attendance = {
  /**
   * Create a check-in record (check_out_time is NULL until check-out).
   * @param {object} data - { student_id, seat_id, booking_id?, slot_key, booking_date }
   * @returns {Promise<number>} Inserted attendance ID
   */
  async checkIn(data) {
    const [result] = await pool.execute(`
      INSERT INTO attendance
        (student_id, seat_id, booking_id, slot_key, booking_date, check_in_time)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      data.student_id,
      data.seat_id,
      data.booking_id  || null,
      data.slot_key,
      data.booking_date
    ]);
    return result.insertId;
  },

  /**
   * Record check-out time for an existing attendance record.
   * @param {number} id - Attendance record ID
   * @returns {Promise<boolean>}
   */
  async checkOut(id) {
    const [result] = await pool.execute(
      'UPDATE attendance SET check_out_time = NOW() WHERE id = ? AND check_out_time IS NULL',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Find attendance records with optional filters.
   * @param {object} [filters] - { student_id, date, seat_id }
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let sql = `
      SELECT
        a.id, a.slot_key, a.booking_date,
        a.check_in_time, a.check_out_time,
        s.full_name   AS student_name,
        s.mobile      AS student_mobile,
        st.seat_number,
        st.zone,
        TIMESTAMPDIFF(MINUTE, a.check_in_time, COALESCE(a.check_out_time, NOW())) AS duration_minutes
      FROM attendance a
      JOIN students s  ON s.id  = a.student_id
      JOIN seats    st ON st.id = a.seat_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.student_id) {
      sql += ' AND a.student_id = ?';
      params.push(filters.student_id);
    }
    if (filters.date) {
      sql += ' AND a.booking_date = ?';
      params.push(filters.date);
    }
    if (filters.seat_id) {
      sql += ' AND a.seat_id = ?';
      params.push(filters.seat_id);
    }

    sql += ' ORDER BY a.booking_date DESC, a.check_in_time DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Find a single attendance record by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = Attendance;
