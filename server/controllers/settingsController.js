'use strict';

const AdminSettings = require('../models/AdminSettings');
const { sendSuccess, sendError } = require('../utils/responseHelper');

async function getSettings(req, res) {
  return sendSuccess(res, await AdminSettings.get(), 'Settings retrieved.');
}

async function saveSettings(req, res) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Settings must be an object.', 422);
  }
  const allowed = ['branch_name', 'helpline_phone', 'whatsapp_phone', 'admissions_email', 'strict_overlap', 'handover_buffer_minutes', 'auto_release_expired', 'gate_ip', 'sync_frequency'];
  const settings = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (settings.admissions_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.admissions_email)) {
    return sendError(res, 'Admissions email is invalid.', 422);
  }
  if (settings.handover_buffer_minutes !== undefined && ![15, 20, 30].includes(Number(settings.handover_buffer_minutes))) {
    return sendError(res, 'Invalid handover buffer.', 422);
  }
  return sendSuccess(res, await AdminSettings.save(settings), 'Settings saved.');
}

module.exports = { getSettings, saveSettings };
