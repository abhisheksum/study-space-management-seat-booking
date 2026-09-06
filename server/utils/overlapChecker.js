/**
 * StudyHub — Seat Overlap Checker (Server-Side)
 * 
 * This is the critical anti-double-booking enforcement layer.
 * Called from bookingController BEFORE any INSERT into bookings.
 * 
 * The overlap detection uses the half-open interval intersection formula:
 *   Two intervals [s1, e1) and [s2, e2) overlap iff: s1 < e2 AND e1 > s2
 * 
 * This is enforced at the APPLICATION level (not database constraint) so we can
 * return clear, descriptive error messages with the conflicting booking details.
 */
'use strict';

/**
 * Checks whether the requested seat is available for the given date and hour window.
 * 
 * @param {import('mysql2/promise').Pool} pool   - The shared DB connection pool
 * @param {number}  seatId                       - seats.id (numeric PK)
 * @param {string}  bookingDate                  - 'YYYY-MM-DD'
 * @param {number}  startHour                    - Requested start hour (0-23)
 * @param {number}  endHour                      - Requested end hour (0-24)
 * @param {number|null} [excludeBookingId=null]  - Booking id to ignore (for updates/edits)
 * @returns {Promise<{available: boolean, conflict: object|null}>}
 */
async function checkSeatOverlap(pool, seatId, bookingDate, startHour, endHour, excludeBookingId = null) {
  /*
   * SQL overlap check:
   *   An existing booking [existing.start_hour, existing.end_hour) overlaps
   *   with the requested window [startHour, endHour) when:
   *     existing.start_hour < endHour   (existing starts before request ends)
   *   AND
   *     existing.end_hour > startHour   (existing ends after request starts)
   *
   * We only check ACTIVE bookings. Cancelled bookings free the slot.
   */
  let sql = `
    SELECT
      b.id,
      b.slot_key,
      b.start_hour,
      b.end_hour,
      b.status,
      b.booking_date,
      s.full_name  AS student_name,
      s.mobile     AS student_mobile
    FROM bookings b
    JOIN students s ON s.id = b.student_id
    WHERE b.seat_id      = ?
      AND b.booking_date = ?
      AND b.status       = 'active'
      AND b.start_hour   < ?
      AND b.end_hour     > ?
  `;

  const params = [seatId, bookingDate, endHour, startHour];

  if (excludeBookingId) {
    sql += ' AND b.id != ?';
    params.push(excludeBookingId);
  }

  const [rows] = await pool.execute(sql, params);

  if (rows.length > 0) {
    return {
      available: false,
      conflict: {
        bookingId:     rows[0].id,
        slotKey:       rows[0].slot_key,
        startHour:     rows[0].start_hour,
        endHour:       rows[0].end_hour,
        studentName:   rows[0].student_name,
        studentMobile: rows[0].student_mobile
      }
    };
  }

  return { available: true, conflict: null };
}

module.exports = { checkSeatOverlap };
