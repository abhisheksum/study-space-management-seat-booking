'use strict';

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../config/auth');
const { sendError } = require('../utils/responseHelper');

async function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 'Authentication required.', 401);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (payload.type !== 'admin' || !Number.isInteger(payload.sub)) {
      return sendError(res, 'Invalid authentication token.', 401);
    }
    const admin = await Admin.findById(payload.sub);
    if (!admin || !admin.is_active) return sendError(res, 'Admin account is inactive.', 401);
    req.admin = admin;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid or expired authentication token.', 401);
    }
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return sendError(res, 'You are not authorized to perform this action.', 403);
    }
    return next();
  };
}

module.exports = { requireAdmin, requireRole };
