/**
 * StudyHub — MembershipPlan Model
 * Read-only queries for the `membership_plans` table.
 * Plans are managed by admin; students only read them.
 */
'use strict';

const { pool } = require('../config/database');

const MembershipPlan = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO membership_plans (name, type, slot_id, price, duration_days, description, features, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.type, data.slot_id || null, data.price, data.duration_days, data.description || null, JSON.stringify(data.features || []), data.is_active === false ? 0 : 1]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const key of ['name', 'type', 'slot_id', 'price', 'duration_days', 'description', 'is_active']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (data.features !== undefined) {
      fields.push('features = ?');
      values.push(JSON.stringify(data.features));
    }
    if (!fields.length) return false;
    values.push(id);
    const [result] = await pool.execute(`UPDATE membership_plans SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.affectedRows > 0;
  },
  /**
   * Get all active membership plans joined with their time_slot details.
   * @returns {Promise<Array>}
   */
  async findAll(includeInactive = false) {
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
      ${includeInactive ? '' : 'WHERE p.is_active = 1'}
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
