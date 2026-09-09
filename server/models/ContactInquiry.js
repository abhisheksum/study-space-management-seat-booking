'use strict';

const { pool } = require('../config/database');

const ContactInquiry = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO contact_inquiries (name, email, mobile, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.email, data.mobile, data.subject, data.message]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, name, email, mobile, subject, message, status, submitted_at
       FROM contact_inquiries WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = ContactInquiry;
