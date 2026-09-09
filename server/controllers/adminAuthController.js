'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');
const { getJwtSecret, tokenTtl } = require('../config/auth');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.', errors: [] }
});

async function login(req, res) {
  const loginValue = typeof req.body.login === 'string'
    ? req.body.login.trim()
    : typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!loginValue || !password) return sendError(res, 'Login and password are required.', 422);

  const admin = await Admin.findByLogin(loginValue);
  const valid = admin && await bcrypt.compare(password, admin.password_hash);
  if (!valid) return sendError(res, 'Invalid admin credentials.', 401);

  const token = jwt.sign(
    { sub: admin.id, role: admin.role, type: 'admin' },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: tokenTtl }
  );
  return sendSuccess(res, {
    token,
    expiresIn: tokenTtl,
    admin: { id: admin.id, username: admin.username, fullName: admin.full_name, email: admin.email, role: admin.role }
  }, 'Admin login successful.');
}

module.exports = { login, loginRateLimiter };
