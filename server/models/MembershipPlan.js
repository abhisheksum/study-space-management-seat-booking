/**
 * StudyHub — MembershipPlan Model
 * Read-only queries for the `membership_plans` table.
 * Plans are managed by admin; students only read them.
 */
'use strict';

const { pool } = require('../config/database');

const MembershipPlan = {
  /**
   * Get all active membership plans joined with their time_slot details.
   * @returns {Promise<Array>}
   */
  async findAll() {
    const [rows] = await pool.execute(`
      SELECT
        p.id,
        p.name,
        p.type,
        p.price,
        p.duration_days,
        p.description,
        p.features,
        p.is_active,
        t.slot_key,
        t.start_hour,
        t.end_hour,
        t.label  AS slot_label,
        t.name   AS slot_name
      FROM membership_plans p
      LEFT JOIN time_slots t ON t.id = p.slot_id
      WHERE p.is_active = 1
      ORDER BY p.price ASC
    `);
    // Parse JSON features field
    return rows.map(r => ({
      ...r,
      features: r.features ? (typeof r.features === 'string' ? JSON.parse(r.features) : r.features) : []
    }));
  },

  /**
   * Find a single plan by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(`
      SELECT
        p.*,
        t.slot_key, t.start_hour, t.end_hour, t.label AS slot_label
      FROM membership_plans p
      LEFT JOIN time_slots t ON t.id = p.slot_id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      features: r.features ? (typeof r.features === 'string' ? JSON.parse(r.features) : r.features) : []
    };
  }
};

module.exports = MembershipPlan;
