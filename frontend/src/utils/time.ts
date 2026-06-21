export const DEFAULT_WORK_DAY_START_MINUTES = 9 * 60;
export const DEFAULT_WORK_DAY_END_MINUTES = 18 * 60;

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function formatWeekday(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "Сегодня";
  const weekday = date.toLocaleDateString("ru-RU", {
    weekday: "long",
  });

  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}

export function isPastDate(date: Date): boolean {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

export function isBookingInPast(date: Date, startMinutes: number): boolean {
  const bookingStart = new Date(date);
  bookingStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  return bookingStart.getTime() <= Date.now();
}

export function getEarliestBookableMinutes(
  date: Date,
  workStart: number,
  workEnd: number,
  step = 30
): number {
  if (!isToday(date)) return workStart;

  for (let minutes = workStart; minutes + step <= workEnd; minutes += step) {
    if (!isBookingInPast(date, minutes)) return minutes;
  }

  return workEnd;
}

export function isDateUnavailableForBooking(
  date: Date,
  workStart: number,
  workEnd: number,
  step = 30
): boolean {
  if (isPastDate(date)) return true;
  return getEarliestBookableMinutes(date, workStart, workEnd, step) >= workEnd;
}

export function getNextBookableDate(
  workStart = DEFAULT_WORK_DAY_START_MINUTES,
  workEnd = DEFAULT_WORK_DAY_END_MINUTES
): Date {
  const today = startOfDay(new Date());
  if (!isDateUnavailableForBooking(today, workStart, workEnd)) return today;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatBookingDateTime(
  date: string,
  start: number,
  end: number
): string {
  const d = parseDateOnly(date);
  return `${d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}, ${formatMinutes(start)}–${formatMinutes(end)}`;
}
