import { describe, expect, it } from 'vitest';
import { mockBookingsApi } from './api';
import { MockApiError } from './errors';
import { getMockStore } from './store';
import { toDateOnlyString } from '../../utils/time';

function setMockAuth(userId: number) {
  localStorage.setItem('auth', JSON.stringify({ userId }));
}

describe('mockBookingsApi (integration)', () => {
  it('rejects booking for Pending user', async () => {
    setMockAuth(3); // student@edu.ru, status: Pending

    await expect(
      mockBookingsApi.create({
        roomId: 1,
        date: toDateOnlyString(new Date()),
        startMinutes: 10 * 60,
        endMinutes: 11 * 60,
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).response.status).toBe(403);
      expect((error as MockApiError).message).toContain('не подтверждён');
      return true;
    });
  });

  it('creates booking for Approved user and persists it in store', async () => {
    setMockAuth(2); // user@edu.ru, status: Approved

    const date = toDateOnlyString(new Date(Date.now() + 2 * 86_400_000));
    const booking = await mockBookingsApi.create({
      roomId: 2,
      date,
      startMinutes: 10 * 60,
      endMinutes: 12 * 60,
    });

    expect(booking).toMatchObject({
      roomId: 2,
      roomCode: 'П815',
      date,
      startMinutes: 10 * 60,
      endMinutes: 12 * 60,
      status: 'Active',
    });

    const stored = getMockStore().bookings.find((b) => b.id === booking.id);
    expect(stored).toBeDefined();
    expect(stored?.userId).toBe(2);
  });

  it('rejects overlapping interval on the same room', async () => {
    setMockAuth(2);

    const date = toDateOnlyString(new Date());
    await expect(
      mockBookingsApi.create({
        roomId: 1,
        date,
        startMinutes: 10 * 60,
        endMinutes: 13 * 60,
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).message).toContain('пересекается');
      return true;
    });
  });
});
