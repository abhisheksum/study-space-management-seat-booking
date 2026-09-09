/**
 * StudyHub — Database Config Re-export
 * Provides the shared pool to models via a clean config import path.
 */
'use strict';

const { pool, testConnection, ensurePaymentGatewayColumns } = require('../database/db');
module.exports = { pool, testConnection, ensurePaymentGatewayColumns };
