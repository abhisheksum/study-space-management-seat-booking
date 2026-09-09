'use strict';

const mockConnection = {
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
  execute: jest.fn()
};

jest.mock('../config/database', () => ({
  pool: { getConnection: jest.fn().mockResolvedValue(mockConnection) }
}));

const { expireMemberships } = require('../services/membershipExpiryService');

describe('membership expiry service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('expires due memberships and cancels their active current/future bookings transactionally', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 12 }]])
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockResolvedValueOnce([{}]);

    const result = await expireMemberships(new Date('2026-09-09T00:00:00.000Z'));

    expect(result.expiredMemberships).toBe(1);
    expect(result.cancelledBookings).toBe(2);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(mockConnection.execute.mock.calls[1][1]).toEqual([12]);
  });

  it('does nothing when no membership has reached its expiry date', async () => {
    mockConnection.execute.mockResolvedValueOnce([[]]);

    const result = await expireMemberships();

    expect(result).toMatchObject({ expiredMemberships: 0, cancelledBookings: 0 });
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    expect(mockConnection.commit).toHaveBeenCalled();
  });

  it('rolls back when expiry processing fails', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(expireMemberships()).rejects.toThrow('database unavailable');
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.commit).not.toHaveBeenCalled();
  });
});
