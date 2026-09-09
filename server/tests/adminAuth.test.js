'use strict';

process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../config/database', () => ({
  pool: { execute: jest.fn().mockResolvedValue([[]]) },
  testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../models/Admin', () => ({
  findByLogin: jest.fn(),
  findById: jest.fn()
}));

const Admin = require('../models/Admin');
const app = require('../server');

const admin = {
  id: 7,
  username: 'admin',
  password_hash: bcrypt.hashSync('correct-password', 10),
  full_name: 'Admin User',
  email: 'admin@example.com',
  role: 'super',
  is_active: 1
};

beforeEach(() => {
  Admin.findByLogin.mockImplementation(async (login) => login === 'admin' ? admin : null);
  Admin.findById.mockResolvedValue(admin);
});

describe('admin authentication', () => {
  test('valid login returns a token', async () => {
    const response = await request(app).post('/api/admin/login')
      .send({ login: 'admin', password: 'correct-password' });
    expect(response.status).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  test.each([
    [{ login: 'admin', password: 'wrong-password' }, 'invalid password'],
    [{ login: 'missing', password: 'correct-password' }, 'nonexistent user']
  ])('$1 rejects with 401', async (credentials) => {
    const response = await request(app).post('/api/admin/login').send(credentials);
    expect(response.status).toBe(401);
  });

  test('missing token is rejected by admin API', async () => {
    const response = await request(app).get('/api/students');
    expect(response.status).toBe(401);
  });

  test('invalid token is rejected by admin API', async () => {
    const response = await request(app).get('/api/students')
      .set('Authorization', 'Bearer not-a-token');
    expect(response.status).toBe(401);
  });

  test('student token is rejected by admin API', async () => {
    const token = jwt.sign({ sub: 7, type: 'student' }, process.env.JWT_SECRET);
    const response = await request(app).get('/api/students')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  test('valid admin token accesses admin API', async () => {
    const token = jwt.sign({ sub: 7, role: 'super', type: 'admin' }, process.env.JWT_SECRET);
    const response = await request(app).get('/api/students')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
