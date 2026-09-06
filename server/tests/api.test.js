/**
 * StudyHub — Basic API Integration Tests
 * Uses supertest to test the Express app WITHOUT a real DB connection.
 * 
 * Run: npm test
 * 
 * NOTE: These tests validate routes, validation middleware, and response shapes.
 * For full integration tests against MySQL, configure a test DB and set TEST_DB env var.
 */
'use strict';

const request = require('supertest');

// Mock the DB pool before importing server
jest.mock('../config/database', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
  },
  testConnection: jest.fn().mockResolvedValue(true)
}));

const app = require('../server');

describe('GET /api/health', () => {
  it('returns 200 with success true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('StudyHub API');
  });
});

describe('GET /api/seats/availability — validation', () => {
  it('returns 400 if date param is missing', async () => {
    const res = await request(app).get('/api/seats/availability?slot=morning');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 if slot param is missing', async () => {
    const res = await request(app).get('/api/seats/availability?date=2026-09-10');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for unknown slot key', async () => {
    const res = await request(app).get('/api/seats/availability?date=2026-09-10&slot=invalid_slot');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/students — validation', () => {
  it('returns 422 if full_name is missing', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ mobile: '9876543210' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toContain('Full name is required.');
  });

  it('returns 422 if mobile is missing', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ full_name: 'Test Student' });
    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.includes('Mobile number'))).toBe(true);
  });

  it('returns 422 for invalid mobile format', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ full_name: 'Test', mobile: '12345' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/bookings — validation', () => {
  it('returns 422 if slot_key is missing', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ student_id: 1, seat_id: 1, booking_date: '2026-09-10' });
    expect(res.status).toBe(422);
  });
});
