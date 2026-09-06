/**
 * StudyHub — Membership Model
 * A student's active subscription linking them to a plan + assigned seat.
 */
'use strict';

const { pool } = require('../config/database');

const Membership = {
  /**
   * Create a new membership record.
   * @param {object} data - { student_id, plan_id, seat_id, start_date, end_date }
   * @returns {Promise<number>} Inserted membership ID
   */
  async create(data) {
    const [result] = await pool.execute(`
      INSERT INTO memberships (student_id, plan_id, seat_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [data.student_id, data.plan_id, data.seat_id, data.start_date, data.end_date]);
    return result.insertId;
  },

  /**
   * Find all memberships, optionally filtered.
   * @param {object} [filters] - { student_id, status }
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let sql = `
      SELECT
        m.id, m.status, m.start_date, m.end_date, m.created_at,
        s.full_name   AS student_name,
        s.mobile      AS student_mobile,
        p.name        AS plan_name,
        p.type        AS plan_type,
        p.price,
        st.seat_number,
        st.zone
      FROM memberships m
      JOIN students        s  ON s.id  = m.student_id
      JOIN membership_plans p ON p.id  = m.plan_id
      JOIN seats           st ON st.id = m.seat_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.student_id) {
      sql += ' AND m.student_id = ?';
      params.push(filters.student_id);
    }
    if (filters.status) {
      sql += ' AND m.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY m.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Find a single membership by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(`
      SELECT
        m.*,
        s.full_name AS student_name, s.mobile AS student_mobile,
        p.name AS plan_name, p.type AS plan_type, p.price,
        st.seat_number, st.zone
      FROM memberships m
      JOIN students        s  ON s.id  = m.student_id
      JOIN membership_plans p ON p.id  = m.plan_id
      JOIN seats           st ON st.id = m.seat_id
      WHERE m.id = ?
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  },

  /**
   * Update membership status.
   * @param {number} id
   * @param {string} status - 'pending'|'active'|'expired'|'cancelled'
   * @returns {Promise<boolean>}
   */
  async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE memberships SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Count memberships expiring within the next N days.
   * Used by admin dashboard.
   * @param {number} [days=7]
   * @returns {Promise<number>}
   */
  async countExpiringSoon(days = 7) {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) AS cnt
      FROM memberships
      WHERE status = 'active'
        AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    `, [days]);
    return rows[0].cnt;
  }
};

module.exports = Membership;
