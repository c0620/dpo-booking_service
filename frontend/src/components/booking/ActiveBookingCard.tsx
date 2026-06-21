import type { Booking } from "../../api/types";
import { formatMinutes, formatWeekday, parseDateOnly } from "../../utils/time";

interface Props {
  booking: Booking;
  onCancel: () => void;
}

export function ActiveBookingCard({ booking, onCancel }: Props) {
  const date = parseDateOnly(booking.date);
  return (
    <div className="active-booking-card">
      <img
        className="active-booking-clock"
        src="/assets/icons/icon-time.svg"
        alt=""
      />
      <div className="active-booking-info b2">
        <div>{formatWeekday(date)}</div>
        <div>
          {date.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          ,
        </div>
        <div>
          {formatMinutes(booking.startMinutes)}–
          {formatMinutes(booking.endMinutes)}
        </div>
      </div>
      <button
        type="button"
        className="btn-danger-custom b2"
        onClick={onCancel}
      >
        Отменить
      </button>
    </div>
  );
}
