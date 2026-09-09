'use strict';

const { pool } = require('../config/database');

/**
 * Expire memberships at the start of each day. A membership's end date is
 * exclusive, matching bookingController's booking-date validation.
 */
async function expireMemberships(now = new Date()) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [memberships] = await connection.execute(`
      SELECT id
      FROM memberships
      WHERE status = 'active'
        AND end_date <= CURDATE()
      FOR UPDATE
    `);

    let cancelledBookings = 0;
    for (const membership of memberships) {
      const [bookingResult] = await connection.execute(`
        UPDATE bookings
        SET status = 'cancelled'
        WHERE membership_id = ?
          AND status = 'active'
          AND booking_date >= CURDATE()
      `, [membership.id]);
      cancelledBookings += bookingResult.affectedRows;

      await connection.execute(
        `UPDATE memberships
         SET status = 'expired'
         WHERE id = ? AND status = 'active'`,
        [membership.id]
      );
    }

    await connection.commit();
    const result = {
      expiredMemberships: memberships.length,
      cancelledBookings,
      ranAt: now.toISOString()
    };
    if (memberships.length || cancelledBookings) {
      console.info('[MembershipExpiry] Expired memberships and released active seat bookings.', result);
    }
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('[MembershipExpiry] Failed to expire memberships; transaction rolled back.', error);
    throw error;
  } finally {
    connection.release();
  }
}

function startMembershipExpiryScheduler() {
  const run = () => expireMemberships().catch(error => {
    console.error('[MembershipExpiry] Scheduled run failed.', error);
  });
  run();
  return setInterval(run, 24 * 60 * 60 * 1000);
}

module.exports = { expireMemberships, startMembershipExpiryScheduler };
