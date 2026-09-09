'use strict';

jest.mock('../models/Attendance', () => ({
  checkInValidated: jest.fn(),
  findById: jest.fn(),
  checkOut: jest.fn()
}));

const Attendance = require('../models/Attendance');
const controller = require('../controllers/attendanceController');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

const validRequest = {
  body: {
    student_id: 4,
    booking_id: 12,
    seat_id: 3,
    slot_key: 'morning',
    booking_date: '2026-09-09'
  }
};

beforeEach(() => jest.clearAllMocks());

test('valid check-in stores and returns the database record', async () => {
  Attendance.checkInValidated.mockResolvedValue(8);
  Attendance.findById.mockResolvedValue({ id: 8, check_in_time: '2026-09-09 06:05:00', check_out_time: null });
  const res = response();
  await controller.checkIn(validRequest, res);
  expect(Attendance.checkInValidated).toHaveBeenCalledWith(validRequest.body);
  expect(res.statusCode).toBe(201);
  expect(res.body.data.id).toBe(8);
});

test('duplicate check-in returns conflict', async () => {
  const error = Object.assign(new Error('The student already has an active check-in for this date.'), { statusCode: 409 });
  Attendance.checkInValidated.mockRejectedValue(error);
  const res = response();
  await controller.checkIn(validRequest, res);
  expect(res.statusCode).toBe(409);
});

test('student without valid membership is rejected', async () => {
  const error = Object.assign(new Error('The student does not have a valid active membership for this booking.'), { statusCode: 422 });
  Attendance.checkInValidated.mockRejectedValue(error);
  const res = response();
  await controller.checkIn(validRequest, res);
  expect(res.statusCode).toBe(422);
});

test('valid checkout returns the completed attendance record', async () => {
  Attendance.checkOut.mockResolvedValue(true);
  Attendance.findById.mockResolvedValue({ id: 8, check_out_time: '2026-09-09 12:01:00' });
  const res = response();
  await controller.checkOut({ params: { id: '8' } }, res);
  expect(res.statusCode).toBe(200);
  expect(res.body.data.check_out_time).toBeTruthy();
});

test('invalid or already completed checkout returns not found', async () => {
  Attendance.checkOut.mockResolvedValue(false);
  const res = response();
  await controller.checkOut({ params: { id: '999' } }, res);
  expect(res.statusCode).toBe(404);
});
