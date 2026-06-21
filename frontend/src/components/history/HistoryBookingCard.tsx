import type { Booking, Room } from "../../api/types";
import { RoomAmenityTags } from "../rooms/RoomAmenityTags";
import { formatBookingDateTime } from "../../utils/time";

export type BookingCardState = "future" | "past" | "cancelled";

interface Props {
  booking: Booking;
  room?: Room;
  state: BookingCardState;
  onCancel: () => void;
}

export function HistoryBookingCard({ booking, room, state, onCancel }: Props) {
  const image = room?.imageUrls?.[0] ?? "/assets/rooms/room-106.jpg";
  const capacity = room?.capacity ?? 0;
  const amenities = room?.amenities ?? [];
  const description = room?.description ?? "";

  const muted = state === "cancelled";
  const timeTagClass =
    state === "future" ? "tag--blue" : muted ? "tag--muted" : "";
  const tagClass = muted ? "tag--muted" : "";

  return (
    <div className={`history-booking-card${muted ? " is-cancelled" : ""}`}>
      <div className="card-image">
        <img src={image} alt={booking.roomName} />
      </div>
      <div className="card-body">
        <div className="card-content">
          <h3 className="room-card-title h2">{booking.roomName}</h3>
          <div className="d-flex gap-2 flex-wrap card-tags">
            <span className={`tag b3 ${timeTagClass}`}>
              <img src="/assets/icons/icon-time.svg" alt="" />
              {formatBookingDateTime(
                booking.date,
                booking.startMinutes,
                booking.endMinutes
              )}
            </span>
            <span className={`tag b3 ${tagClass}`}>
              <img src="/assets/icons/icon-location.svg" alt="" />
              {booking.roomCode}, {booking.floor} этаж
            </span>
            {capacity > 0 && (
              <span className={`tag b3 ${tagClass}`}>
                <img src="/assets/icons/icon-capacity.svg" alt="" />
                {capacity} мест
              </span>
            )}
          </div>
          {description && <p className="room-card-desc t1">{description}</p>}
          <RoomAmenityTags amenities={amenities} />
        </div>
        {state === "future" && (
          <button
            type="button"
            className="history-cancel-btn b1"
            onClick={onCancel}
          >
            Отменить бронирование
          </button>
        )}
      </div>
    </div>
  );
}
