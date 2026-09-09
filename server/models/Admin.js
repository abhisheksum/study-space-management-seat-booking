/**
 * StudyHub — Admin Model
 * Authentication and admin user lookup.
 * NOTE: Password hashing (bcrypt) belongs in the controller/service layer.
 */
'use strict';

const { pool } = require('../config/database');

const Admin = {
  /**
   * Find an admin by username (used for login).
   * @param {string} username
   * @returns {Promise<object|null>}
   */
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE username = ? AND is_active = 1 LIMIT 1',
      [username]
    );
    return rows[0] || null;
  },

  async findByLogin(login) {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1',
      [login, login]
    );
    return rows[0] || null;
  },

  /**
   * Find an admin by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, full_name, email, role, is_active FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ username, passwordHash, fullName, email, role = 'staff' }) {
    const [result] = await pool.execute(
      'INSERT INTO admins (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, fullName, email || null, role]
    );
    return result.insertId;
  }
};

module.exports = Admin;
