'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Student = require('../models/Student');
const { getJwtSecret, tokenTtl } = require('../config/auth');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const loginRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.', errors: [] } });
async function login(req, res) {
  const loginValue = typeof req.body.login === 'string' ? req.body.login.trim() :
    typeof req.body.mobile === 'string' ? req.body.mobile.trim() :
    typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!loginValue || !password) return sendError(res, 'Mobile/email and password are required.', 422);
  const student = await Student.findByLogin(loginValue);
  const valid = student && student.password_hash && await bcrypt.compare(password, student.password_hash);
  if (!valid || !student.is_active) return sendError(res, 'Invalid student credentials.', 401);
  const token = jwt.sign({ sub: student.id, type: 'student' }, getJwtSecret(), { algorithm: 'HS256', expiresIn: tokenTtl });
  return sendSuccess(res, { token, expiresIn: tokenTtl, student: {
    id: student.id, fullName: student.full_name, mobile: student.mobile, email: student.email
  } }, 'Student login successful.');
}
module.exports = { login, loginRateLimiter };
