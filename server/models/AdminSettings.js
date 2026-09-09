'use strict';

const { pool } = require('../config/database');

const AdminSettings = {
  async ensureTable() {
    await pool.execute(`CREATE TABLE IF NOT EXISTS admin_settings (
      setting_key VARCHAR(80) NOT NULL,
      setting_value JSON NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  },

  async get() {
    const [rows] = await pool.execute('SELECT setting_key, setting_value FROM admin_settings ORDER BY setting_key');
    return rows.reduce((settings, row) => {
      settings[row.setting_key] = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value;
      return settings;
    }, {});
  },

  async save(settings) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const [key, value] of Object.entries(settings)) {
        await connection.execute(
        'INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [key, JSON.stringify(value)]
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return this.get();
  }
};

module.exports = AdminSettings;
