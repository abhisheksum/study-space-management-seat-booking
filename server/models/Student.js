/**
 * StudyHub — Student Model
 * Raw SQL queries for the `students` table.
 */
'use strict';

const { pool } = require('../config/database');

const Student = {
  /**
   * Insert a new student record.
   * @param {object} data
   * @returns {Promise<number>} Inserted student ID
   */
  async create(data) {
    const sql = `
      INSERT INTO students
        (full_name, mobile, email, date_of_birth, gender,
         address, city, state, pincode, student_id_no,
         emergency_contact_name, emergency_contact_mobile, emergency_contact_rel,
         profile_photo_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      data.full_name,
      data.mobile,
      data.email                    || null,
      data.date_of_birth            || null,
      data.gender                   || null,
      data.address                  || null,
      data.city                     || null,
      data.state                    || null,
      data.pincode                  || null,
      data.student_id_no            || null,
      data.emergency_contact_name   || null,
      data.emergency_contact_mobile || null,
      data.emergency_contact_rel    || null,
      data.profile_photo_path       || null
    ]);
    return result.insertId;
  },

  /**
   * Find all students with optional search.
   * @param {object} [filters] - { search, city, state, is_active }
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let sql = `
      SELECT id, full_name, mobile, email, gender, city, state,
             is_active, registered_at
      FROM students
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ' AND (full_name LIKE ? OR mobile LIKE ? OR email LIKE ?)';
      const like = `%${filters.search}%`;
      params.push(like, like, like);
    }
    if (filters.city) {
      sql += ' AND city = ?';
      params.push(filters.city);
    }
    if (filters.is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    sql += ' ORDER BY registered_at DESC';

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Find a single student by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find a student by mobile number.
   * @param {string} mobile
   * @returns {Promise<object|null>}
   */
  async findByMobile(mobile) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE mobile = ? LIMIT 1',
      [mobile]
    );
    return rows[0] || null;
  },

  /**
   * Find a student by email address.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Update a student record.
   * @param {number} id
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  async update(id, data) {
    const allowed = [
      'full_name','email','date_of_birth','gender',
      'address','city','state','pincode',
      'student_id_no','emergency_contact_name',
      'emergency_contact_mobile','emergency_contact_rel',
      'profile_photo_path','is_active'
    ];
    const sets = [];
    const params = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (sets.length === 0) return false;
    params.push(id);
    const [result] = await pool.execute(
      `UPDATE students SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  /**
   * Deactivate (soft-delete) a student.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deactivate(id) {
    const [result] = await pool.execute(
      'UPDATE students SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Student;
