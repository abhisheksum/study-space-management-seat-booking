/**
 * StudyHub — Seat Model
 * Queries for the `seats` table and availability lookups.
 */
'use strict';

const { pool } = require('../config/database');

const Seat = {
  /**
   * Return all 30 seats with their physical details.
   * @returns {Promise<Array>}
   */
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, seat_number, zone, row_position, status, notes FROM seats ORDER BY zone, row_position'
    );
    return rows;
  },

  /**
   * Find a single seat by its database PK.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM seats WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find a seat by its human-readable number (e.g. "A01").
   * @param {string} seatNumber
   * @returns {Promise<object|null>}
   */
  async findBySeatNumber(seatNumber) {
    const [rows] = await pool.execute(
      'SELECT * FROM seats WHERE seat_number = ? LIMIT 1',
      [seatNumber]
    );
    return rows[0] || null;
  },

  /**
   * Returns all seats enriched with booking status for a specific date + slot window.
   * Each row: { id, seat_number, zone, row_position, seat_status, booking_status, slot_key }
   * 
   * "available"  — no overlapping active booking
   * "occupied"   — has an active booking during the requested window
   * "reserved"   — seat is under maintenance
   * 
   * @param {string} date       'YYYY-MM-DD'
   * @param {number} startHour
   * @param {number} endHour
   * @returns {Promise<Array>}
   */
  async getAvailability(date, startHour, endHour) {
    const sql = `
      SELECT
        s.id,
        s.seat_number,
        s.zone,
        s.row_position,
        s.status                                         AS seat_status,
        CASE
          WHEN s.status != 'active'    THEN 'maintenance'
          WHEN b.id IS NOT NULL        THEN b.status
          ELSE 'available'
        END                                              AS booking_status,
        b.slot_key,
        b.start_hour,
        b.end_hour,
        b.id                                             AS booking_id
      FROM seats s
      LEFT JOIN bookings b
        ON  b.seat_id      = s.id
        AND b.booking_date = ?
        AND b.status       = 'active'
        AND b.start_hour   < ?
        AND b.end_hour     > ?
      ORDER BY s.zone, s.row_position
    `;
    const [rows] = await pool.execute(sql, [date, endHour, startHour]);
    return rows;
  },

  /**
   * Update seat status (active / maintenance / inactive).
   * @param {number} id
   * @param {string} status
   * @returns {Promise<boolean>}
   */
  async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE seats SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Seat;
