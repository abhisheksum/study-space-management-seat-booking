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
  const unknown = Object.keys(req.body).filter((key) => !allowed.includes(key));
  if (unknown.length) return sendError(res, `Unsupported setting: ${unknown[0]}.`, 422);
  const settings = { ...req.body };
  const errors = [];
  for (const key of ['branch_name', 'helpline_phone', 'whatsapp_phone', 'admissions_email', 'gate_ip']) {
    if (typeof settings[key] !== 'string' || settings[key].trim().length === 0 || settings[key].length > 160) {
      errors.push(`${key} must be a non-empty string of at most 160 characters.`);
    } else {
      settings[key] = settings[key].trim();
    }
  }
  if (settings.admissions_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.admissions_email)) {
    errors.push('Admissions email is invalid.');
  }
  for (const key of ['strict_overlap', 'auto_release_expired']) {
    if (typeof settings[key] !== 'boolean') errors.push(`${key} must be true or false.`);
  }
  if (settings.handover_buffer_minutes !== undefined && ![15, 20, 30].includes(Number(settings.handover_buffer_minutes))) {
    errors.push('Invalid handover buffer.');
  } else if (settings.handover_buffer_minutes !== undefined) {
    settings.handover_buffer_minutes = Number(settings.handover_buffer_minutes);
  }
  if (!['realtime', '1min'].includes(settings.sync_frequency)) errors.push('Invalid synchronization frequency.');
  if (errors.length) return sendError(res, 'Settings validation failed.', 422, errors);
  return sendSuccess(res, await AdminSettings.save(settings), 'Settings saved.');
}

module.exports = { getSettings, saveSettings };
