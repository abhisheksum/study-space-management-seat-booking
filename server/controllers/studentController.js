/**
 * StudyHub — Student Controller
 * Handles: POST /api/students, GET /api/students, GET /api/students/:id
 */
'use strict';

const Student                      = require('../models/Student');
const { validateStudent }          = require('../middleware/validate');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');
const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');

/**
 * POST /api/students
 * Register a new student.
 */
async function createStudent(req, res) {
  const profilePhotoPath = req.uploadedPhotoPath;
  const removeUploadedPhoto = async () => {
    if (profilePhotoPath) {
      await fs.unlink(path.join(__dirname, '..', '..', profilePhotoPath));
    }
  };
  req.body.profile_photo_path = profilePhotoPath || null;
  delete req.body.password_hash;
  const password = req.body.password;
  const errors = validateStudent(req.body);
  if (typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }
  if (errors.length) {
    await removeUploadedPhoto().catch(() => {});
    return sendError(res, 'Validation failed', 422, errors);
  }
  req.body.password_hash = await bcrypt.hash(password, 12);

  // Check both unique identifiers before attempting the insert.
  const existingMobile = await Student.findByMobile(req.body.mobile);
  if (existingMobile) {
    await removeUploadedPhoto().catch(() => {});
    return sendError(res, `A student with mobile ${req.body.mobile} is already registered.`, 409);
  }
  const existingEmail = await Student.findByEmail(req.body.email);
  if (existingEmail) {
    await removeUploadedPhoto().catch(() => {});
    return sendError(res, `A student with email ${req.body.email} is already registered.`, 409);
  }

  let id;
  try {
    id = await Student.create(req.body);
  } catch (error) {
    // Keep duplicate protection correct if two requests race between the checks.
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'A student with that mobile number or email address is already registered.', 409);
    }
    await removeUploadedPhoto().catch(() => {});
    throw error;
  }
  const student = await Student.findById(id);

  return sendSuccess(res, student, 'Student registered successfully.', 201);
}

/**
 * GET /api/students
 * List all students. Supports ?search=, ?city=, ?active=
 */
async function getAllStudents(req, res) {
  const filters = {
    search:    req.query.search    || null,
    city:      req.query.city      || null,
    is_active: req.query.active !== undefined ? (req.query.active === '1' || req.query.active === 'true') : undefined
  };
  const students = await Student.findAll(filters);
  return sendSuccess(res, students, 'Students retrieved.', 200, { count: students.length });
}

/**
 * GET /api/students/:id
 * Get a single student by ID.
 */
async function getStudentById(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) return sendNotFound(res, 'Student');
  return sendSuccess(res, student);
}

/**
 * PATCH /api/students/:id
 * Update student profile fields.
 */
async function updateStudent(req, res) {
  const updated = await Student.update(req.params.id, req.body);
  if (!updated) return sendNotFound(res, 'Student');
  const student = await Student.findById(req.params.id);
  return sendSuccess(res, student, 'Student updated.');
}

/**
 * DELETE /api/students/:id
 * Soft-deactivate a student.
 */
async function deactivateStudent(req, res) {
  const done = await Student.deactivate(req.params.id);
  if (!done) return sendNotFound(res, 'Student');
  return sendSuccess(res, null, 'Student deactivated.');
}

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deactivateStudent };
