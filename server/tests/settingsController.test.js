'use strict';

jest.mock('../models/AdminSettings', () => ({
  get: jest.fn(),
  save: jest.fn()
}));

const AdminSettings = require('../models/AdminSettings');
const { saveSettings } = require('../controllers/settingsController');

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('settings controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid setting types and unsupported keys', async () => {
    const res = response();
    await saveSettings({ body: { strict_overlap: 'yes', unsupported: true } }, res);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(AdminSettings.save).not.toHaveBeenCalled();
  });

  it('validates and persists the complete settings payload', async () => {
    const res = response();
    AdminSettings.save.mockResolvedValue({ branch_name: 'Updated StudyHub' });
    await saveSettings({
      body: {
        branch_name: ' Updated StudyHub ',
        helpline_phone: '+91 98765 43210',
        whatsapp_phone: '+91 98765 43211',
        admissions_email: 'desk@example.com',
        strict_overlap: true,
        handover_buffer_minutes: '20',
        auto_release_expired: false,
        gate_ip: '192.168.1.120:8080',
        sync_frequency: '1min'
      }
    }, res);
    expect(AdminSettings.save).toHaveBeenCalledWith(expect.objectContaining({
      branch_name: 'Updated StudyHub',
      handover_buffer_minutes: 20,
      auto_release_expired: false
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
