/**
 * StudyHub — Shared Constants
 * 
 * These slot definitions MUST stay in sync with:
 *   - js/seats.js  SLOT_TIME_WINDOWS  (frontend)
 *   - seed.sql     time_slots rows     (database)
 * 
 * start_hour / end_hour use 24-hour integers for fast arithmetic overlap detection.
 */
'use strict';

/** @type {Record<string, {id: string, name: string, startHour: number, endHour: number, label: string}>} */
const SLOT_TIME_WINDOWS = {
  morning: {
    id: 'morning',
    name: 'Morning Shift',
    startHour: 6,
    endHour: 12,
    label: '06:00 AM – 12:00 PM'
  },
  afternoon: {
    id: 'afternoon',
    name: 'Afternoon Shift',
    startHour: 12,
    endHour: 18,
    label: '12:00 PM – 06:00 PM'
  },
  evening: {
    id: 'evening',
    name: 'Evening Shift',
    startHour: 18,
    endHour: 22,
    label: '06:00 PM – 10:00 PM'
  },
  'half-day-am': {
    id: 'half-day-am',
    name: 'Half Day (Morning + Afternoon)',
    startHour: 6,
    endHour: 18,
    label: '06:00 AM – 06:00 PM'
  },
  'half-day-pm': {
    id: 'half-day-pm',
    name: 'Half Day (Afternoon + Evening)',
    startHour: 12,
    endHour: 23,
    label: '12:00 PM – 11:00 PM'
  },
  'full-day': {
    id: 'full-day',
    name: 'Full Day Pass',
    startHour: 6,
    endHour: 23,
    label: '06:00 AM – 11:00 PM'
  }
};

const SEAT_ZONES = ['A', 'B', 'C'];
const SEATS_PER_ZONE = 10;

/** All valid seat numbers as a flat array */
const ALL_SEAT_NUMBERS = SEAT_ZONES.flatMap(zone =>
  Array.from({ length: SEATS_PER_ZONE }, (_, i) => `${zone}${String(i + 1).padStart(2, '0')}`)
);

const BOOKING_STATUS = Object.freeze({
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

const MEMBERSHIP_STATUS = Object.freeze({
  PENDING:   'pending',
  ACTIVE:    'active',
  EXPIRED:   'expired',
  CANCELLED: 'cancelled'
});

const PAYMENT_STATUS = Object.freeze({
  PENDING:   'pending',
  COMPLETED: 'completed',
  FAILED:    'failed',
  REFUNDED:  'refunded'
});

module.exports = {
  SLOT_TIME_WINDOWS,
  SEAT_ZONES,
  SEATS_PER_ZONE,
  ALL_SEAT_NUMBERS,
  BOOKING_STATUS,
  MEMBERSHIP_STATUS,
  PAYMENT_STATUS
};
