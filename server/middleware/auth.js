'use strict';

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
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

async function requireAdminOrStudent(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) return sendError(res, 'Authentication required.', 401);
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (!Number.isInteger(payload.sub)) return sendError(res, 'Invalid authentication token.', 401);
    if (payload.type === 'admin') {
      const admin = await Admin.findById(payload.sub);
      if (!admin || !admin.is_active) return sendError(res, 'Admin account is inactive.', 401);
      req.admin = admin;
    } else if (payload.type === 'student') {
      const student = await Student.findById(payload.sub);
      if (!student || !student.is_active) return sendError(res, 'Student account is inactive.', 401);
      req.student = student;
    } else {
      return sendError(res, 'Invalid authentication token.', 401);
    }
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid or expired authentication token.', 401);
    }
    return next(error);
  }
}

async function requireStudent(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) return sendError(res, 'Authentication required.', 401);
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (payload.type !== 'student' || !Number.isInteger(payload.sub)) {
      return sendError(res, 'Invalid student authentication token.', 401);
    }
    const student = await Student.findById(payload.sub);
    if (!student || !student.is_active) return sendError(res, 'Student account is inactive.', 401);
    req.student = student;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid or expired authentication token.', 401);
    }
    return next(error);
  }
}

module.exports = { requireAdmin, requireStudent, requireAdminOrStudent, requireRole };
