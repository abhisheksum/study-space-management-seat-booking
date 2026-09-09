/**
 * StudyHub — Payment Model
 * Fee collection records for memberships.
 */
'use strict';

const { pool } = require('../config/database');

const Payment = {
  /**
   * Record a new payment.
   * @param {object} data - { student_id, membership_id?, amount, payment_method, status?, transaction_id?, notes? }
   * @returns {Promise<number>} Inserted payment ID
   */
  async create(data) {
    const [result] = await pool.execute(`
      INSERT INTO payments
        (student_id, membership_id, amount, payment_method, status, transaction_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.student_id,
      data.membership_id    || null,
      data.amount,
      data.payment_method   || 'cash',
      data.status           || 'pending',
      data.transaction_id   || null,
      data.notes            || null
    ]);
    return result.insertId;
  },

  async createGatewayPending(data) {
    const [result] = await pool.execute(`
      INSERT INTO payments
        (student_id, membership_id, amount, payment_method, status, transaction_id, gateway_order_id, notes)
      VALUES (?, ?, ?, 'online', 'pending', NULL, ?, ?)
    `, [data.student_id, data.membership_id, data.amount, data.gateway_order_id, data.notes || null]);
    return result.insertId;
  },

  async findByGatewayOrderId(orderId) {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE gateway_order_id = ? LIMIT 1', [orderId]);
    return rows[0] || null;
  },

  async findByGatewayPaymentId(paymentId) {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE transaction_id = ? LIMIT 1', [paymentId]);
    return rows[0] || null;
  },

  async completeGatewayPayment(id, paymentId, signature) {
    const [result] = await pool.execute(`
      UPDATE payments
      SET status = 'completed', transaction_id = ?, gateway_signature = ?
      WHERE id = ? AND status = 'pending' AND transaction_id IS NULL
    `, [paymentId, signature, id]);
    return result.affectedRows > 0;
  },

  async failGatewayPayment(id, reason) {
    const [result] = await pool.execute(
      "UPDATE payments SET status = 'failed', notes = ? WHERE id = ? AND status = 'pending'",
      [reason || 'Gateway payment failed.', id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Find all payments with optional filters.
   * @param {object} [filters] - { student_id, status, from_date, to_date }
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let sql = `
      SELECT
        p.id, p.amount, p.payment_method, p.status,
        p.transaction_id, p.gateway_order_id, p.payment_date, p.notes,
        s.full_name  AS student_name,
        s.mobile     AS student_mobile
      FROM payments p
      JOIN students s ON s.id = p.student_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.student_id) {
      sql += ' AND p.student_id = ?';
      params.push(filters.student_id);
    }
    if (filters.status) {
      sql += ' AND p.status = ?';
      params.push(filters.status);
    }
    if (filters.from_date) {
      sql += ' AND DATE(p.payment_date) >= ?';
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      sql += ' AND DATE(p.payment_date) <= ?';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY p.payment_date DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Find a payment by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Update payment status (e.g. confirm after cash receipt).
   * @param {number} id
   * @param {string} status
   * @param {string|null} [transactionId]
   * @returns {Promise<boolean>}
   */
  async updateStatus(id, status, transactionId = null) {
    const [result] = await pool.execute(
      'UPDATE payments SET status = ?, transaction_id = COALESCE(?, transaction_id) WHERE id = ?',
      [status, transactionId, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Sum of today's completed payments (for dashboard revenue card).
   * @returns {Promise<number>}
   */
  async todayRevenue() {
    const [rows] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE status = 'completed'
        AND DATE(payment_date) = CURDATE()
    `);
    return parseFloat(rows[0].total);
  }
};

module.exports = Payment;
