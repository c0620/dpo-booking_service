import type { BookingSlot } from '../api/types';

export function hasBookingConflict(
  start: number,
  end: number,
  slots: BookingSlot[],
): boolean {
  return slots
    .filter((s) => !s.isOwn)
    .some((s) => start < s.endMinutes && end > s.startMinutes);
}

export function findFirstFreeWindow(
  workStart: number,
  workEnd: number,
  slots: BookingSlot[],
  preferredDuration = 180,
  step = 30,
  earliestStart = workStart,
): { start: number; end: number } {
  const occupied = slots
    .filter((s) => !s.isOwn)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const from = Math.max(workStart, earliestStart);

  for (let start = from; start + step <= workEnd; start += step) {
    const end = Math.min(start + preferredDuration, workEnd);
    if (!hasBookingConflict(start, end, occupied)) {
      return { start, end };
    }
  }

  return {
    start: from,
    end: Math.min(from + preferredDuration, workEnd),
  };
}
