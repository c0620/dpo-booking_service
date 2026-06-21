import { useEffect, useMemo, useRef, useState } from "react";
import { bookingsApi, roomsApi } from "../api/client";
import type { Booking, Room } from "../api/types";
import { ConfirmModal } from "../components/common/ConfirmModal";
import {
  HistoryBookingCard,
  type BookingCardState,
} from "../components/history/HistoryBookingCard";
import { isBookingInPast, parseDateOnly } from "../utils/time";

export function HistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const load = () => {
    bookingsApi
      .getMy()
      .then(setBookings)
      .catch(() => setBookings([]));
  };

  useEffect(() => {
    load();
    roomsApi
      .getAll()
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  useEffect(() => {
    const el = cardsRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [bookings.length]);

  const handleCancel = async () => {
    if (!cancelId) return;
    await bookingsApi.cancel(cancelId);
    setCancelId(null);
    load();
  };

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const getState = (b: Booking): BookingCardState => {
    if (b.status === "Cancelled") return "cancelled";
    const ended = isBookingInPast(parseDateOnly(b.date), b.endMinutes);
    return ended ? "past" : "future";
  };

  const isOverflow = bookings.length > 2;

  return (
    <div
      className={`main-area history-page${isOverflow ? " is-overflow" : ""}`}
    >
      <div className="control-panel">
        <h1 className="panel-title h1">История бронирований</h1>
        {bookings.length === 0 ? (
          <p>Нет бронирований</p>
        ) : (
          <div className="history-cards" ref={cardsRef}>
            {bookings.map((b) => (
              <HistoryBookingCard
                key={b.id}
                booking={b}
                room={roomById.get(b.roomId)}
                state={getState(b)}
                onCancel={() => setCancelId(b.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        show={cancelId !== null}
        title="Отмена бронирования"
        body="Вы уверены, что хотите отменить это бронирование?"
        confirmLabel="Отменить бронирование"
        onConfirm={handleCancel}
        onHide={() => setCancelId(null)}
      />
    </div>
  );
}
