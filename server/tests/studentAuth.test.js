'use strict';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
const bcrypt = require('bcryptjs');
const request = require('supertest');
jest.mock('../config/database', () => ({
  pool: { execute: jest.fn().mockResolvedValue([[]]) },
  testConnection: jest.fn().mockResolvedValue(true)
}));
jest.mock('../models/Admin', () => ({ findById: jest.fn() }));
jest.mock('../models/Student', () => ({
  findByLogin: jest.fn(), findById: jest.fn(), ensureAuthColumn: jest.fn()
}));
jest.mock('../controllers/bookingController', () => ({
  createBooking: jest.fn((req, res) => res.status(201).json({ student_id: req.body.student_id }))
}));
const bookingController = require('../controllers/bookingController');
const Student = require('../models/Student');
const app = require('../server');
const student = { id: 3, full_name: 'A Student', mobile: '9876543210', email: 'a@example.com',
  password_hash: bcrypt.hashSync('correct-password', 10), is_active: 1 };
beforeEach(() => { Student.findByLogin.mockResolvedValue(student); Student.findById.mockResolvedValue(student); });
describe('student authentication', () => {
  test('returns a student token for valid credentials', async () => {
    const response = await request(app).post('/api/student/login')
      .send({ login: student.mobile, password: 'correct-password' });
    expect(response.status).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
  });
  test('rejects invalid credentials', async () => {
    const response = await request(app).post('/api/student-auth/login')
      .send({ login: student.mobile, password: 'wrong-password' });
    expect(response.status).toBe(401);
  });
  test('requires authentication for portal data', async () => {
    const response = await request(app).get('/api/student/dashboard');
    expect(response.status).toBe(401);
  });
  test('scopes portal bookings to the authenticated student', async () => {
    const token = (await request(app).post('/api/student/login')
      .send({ login: student.mobile, password: 'correct-password' })).body.data.token;
    const response = await request(app).post('/api/student/bookings').set('Authorization', `Bearer ${token}`)
      .send({ student_id: 999, membership_id: 1, seat_id: 2, slot_key: 'morning', booking_date: '2026-09-10' });
    expect(response.status).toBe(201);
    expect(bookingController.createBooking).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({ student_id: student.id })
    }), expect.anything());
  });
  test('student tokens cannot access admin APIs', async () => {
    const token = (await request(app).post('/api/student/login')
      .send({ login: student.mobile, password: 'correct-password' })).body.data.token;
    const response = await request(app).get('/api/students').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });
});
