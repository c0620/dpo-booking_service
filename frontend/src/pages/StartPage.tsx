import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingsApi, roomsApi } from "../api/client";
import type { Booking, Room, RoomAvailability } from "../api/types";
import { ActiveBookingCard } from "../components/booking/ActiveBookingCard";
import { DatePicker3Days } from "../components/booking/DatePicker3Days";
import { TimeRangeSlider } from "../components/booking/TimeRangeSlider";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { FloorMap, type AssetProps } from "../components/map/FloorMap";
import { MapZoomContainer } from "../components/map/MapZoomContainer";
import { RoomCardLarge } from "../components/rooms/RoomCardLarge";
import { RoomCardSmall } from "../components/rooms/RoomCardSmall";
import { useAuth } from "../context/AuthContext";
import { findFirstFreeWindow, hasBookingConflict } from "../utils/availability";
import {
  DEFAULT_WORK_DAY_END_MINUTES,
  DEFAULT_WORK_DAY_START_MINUTES,
  formatMinutes,
  getEarliestBookableMinutes,
  getNextBookableDate,
  isBookingInPast,
  isDateUnavailableForBooking,
  parseDateOnly,
  toDateOnlyString,
} from "../utils/time";

export function StartPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [featuredId, setFeaturedId] = useState<number | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [zoomRoomId, setZoomRoomId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(() => getNextBookableDate());
  const [selectedDate, setSelectedDate] = useState(() => getNextBookableDate());
  const [availability, setAvailability] = useState<RoomAvailability | null>(
    null
  );
  const [rangeStart, setRangeStart] = useState(9 * 60);
  const [rangeEnd, setRangeEnd] = useState(12 * 60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    roomsApi.getAll().then((data) => {
      setRooms(data);
      if (data.length > 0) setFeaturedId(data[0].id);
    });
  }, []);

  const reloadMyBookings = useCallback(() => {
    if (!auth.isAuthenticated) return Promise.resolve();
    return bookingsApi
      .getMy()
      .then(setMyBookings)
      .catch(() => setMyBookings([]));
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (bookingMode && auth.isAuthenticated) {
      reloadMyBookings();
    }
  }, [bookingMode, auth.isAuthenticated, reloadMyBookings]);

  const featured = useMemo(
    () => rooms.find((r) => r.id === featuredId) ?? rooms[0],
    [rooms, featuredId]
  );

  const smallRooms = useMemo(
    () => rooms.filter((r) => r.id !== featured?.id),
    [rooms, featured]
  );

  const nearestBooking = useMemo(() => {
    if (!featured) return undefined;
    return myBookings
      .filter(
        (b) =>
          b.roomId === featured.id &&
          b.status === "Active" &&
          !isBookingInPast(parseDateOnly(b.date), b.endMinutes)
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes
      )[0];
  }, [myBookings, featured]);

  const loadAvailability = useCallback(
    async (roomId: number, date: Date) => {
      if (!auth.isAuthenticated) return;
      try {
        const data = await roomsApi.getAvailability(
          roomId,
          toDateOnlyString(date)
        );
        setAvailability(data);
        const earliestStart = getEarliestBookableMinutes(
          date,
          data.workDayStartMinutes,
          data.workDayEndMinutes
        );
        const { start, end } = findFirstFreeWindow(
          data.workDayStartMinutes,
          data.workDayEndMinutes,
          data.slots,
          180,
          30,
          earliestStart
        );
        setRangeStart(start);
        setRangeEnd(end);
      } catch {
        setAvailability(null);
      }
    },
    [auth.isAuthenticated]
  );

  useEffect(() => {
    if (bookingMode && featured && auth.isAuthenticated) {
      loadAvailability(featured.id, selectedDate);
    }
  }, [
    bookingMode,
    featured,
    selectedDate,
    auth.isAuthenticated,
    loadAvailability,
  ]);

  const handleRoomSelect = (room: Room) => {
    setFeaturedId(room.id);
    setPanelOpen(true);
    if (bookingMode) {
      setZoomRoomId(room.id);
      loadAvailability(room.id, selectedDate);
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setBookingMode(false);
    setZoomRoomId(null);
    setError(null);
    setSuccess(null);
  };

  const handleSwap = (room: Room) => {
    if (!featured) return;
    setFeaturedId(room.id);
  };

  const handleMainAction = () => {
    if (!featured) return;
    if (!auth.isAuthenticated || !auth.isApproved) {
      navigate("/profile");
      return;
    }
    const initialDate = getNextBookableDate();
    setStartDate(initialDate);
    setSelectedDate(initialDate);
    setBookingMode(true);
    setZoomRoomId(featured.id);
    loadAvailability(featured.id, initialDate);
  };

  const handleBook = async () => {
    if (!featured || !availability) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await bookingsApi.create({
        roomId: featured.id,
        date: toDateOnlyString(selectedDate),
        startMinutes: rangeStart,
        endMinutes: rangeEnd,
      });
      await loadAvailability(featured.id, selectedDate);
      await reloadMyBookings();
      setSuccess(
        `Переговорная ${featured.name} забронирована на ${formatMinutes(
          rangeStart
        )} – ${formatMinutes(rangeEnd)}`
      );
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { title?: string } } })?.response
        ?.data?.title;
      setError(msg ?? "Не удалось создать бронирование");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelId) return;
    await bookingsApi.cancel(cancelId);
    setCancelId(null);
    await reloadMyBookings();
    if (featured) await loadAvailability(featured.id, selectedDate);
  };

  const actionLabel =
    auth.isAuthenticated && auth.isApproved
      ? "Забронировать"
      : auth.isAuthenticated
      ? "Ожидайте подтверждения"
      : "Зарегистрироваться";

  const workDayStartMinutes =
    availability?.workDayStartMinutes ?? DEFAULT_WORK_DAY_START_MINUTES;
  const workDayEndMinutes =
    availability?.workDayEndMinutes ?? DEFAULT_WORK_DAY_END_MINUTES;

  const minStartMinutes = availability
    ? getEarliestBookableMinutes(
        selectedDate,
        workDayStartMinutes,
        workDayEndMinutes
      )
    : 0;

  useEffect(() => {
    if (!bookingMode) return;

    if (
      isDateUnavailableForBooking(
        selectedDate,
        workDayStartMinutes,
        workDayEndMinutes
      )
    ) {
      const next = getNextBookableDate(workDayStartMinutes, workDayEndMinutes);
      setSelectedDate(next);
      if (
        isDateUnavailableForBooking(
          startDate,
          workDayStartMinutes,
          workDayEndMinutes
        )
      ) {
        setStartDate(next);
      }
    }
  }, [
    bookingMode,
    workDayStartMinutes,
    workDayEndMinutes,
    selectedDate,
    startDate,
  ]);

  const isPastBooking = isBookingInPast(selectedDate, rangeStart);

  const assets: AssetProps[] = [
    { x: 46, y: 42, type: "toilet", floor: 1 },
    { x: 46, y: 42, type: "toilet", floor: 6 },
    { x: 46, y: 42, type: "toilet", floor: 8 },
    { x: 308, y: 42, type: "stairs", floor: 1 },
    { x: 308, y: 42, type: "stairs", floor: 6 },
    { x: 308, y: 42, type: "stairs", floor: 8 },
    { x: 360, y: 35, type: "elevator", floor: 1 },
    { x: 360, y: 35, type: "elevator", floor: 6 },
    { x: 360, y: 35, type: "elevator", floor: 8 },
    { x: 308, y: 146, type: "checkpoint", floor: 1 },
    { x: 354, y: 146, type: "checkpoint", floor: 1 },
    { x: 402, y: 146, type: "checkpoint", floor: 1 },
    { x: 450, y: 146, type: "checkpoint", floor: 1 },
    { x: 498, y: 146, type: "checkpoint", floor: 1 },
  ];

  const nearestWindow = availability
    ? `Ближайшее свободное окно: Сегодня с ${formatMinutes(
        availability.workDayStartMinutes
      )} до ${formatMinutes(
        Math.min(
          availability.workDayStartMinutes + 180,
          availability.workDayEndMinutes
        )
      )}`
    : undefined;

  return (
    <div className={`main-area start-page${panelOpen ? " panel-open" : ""}`}>
      <div className="map-background" aria-hidden={false}>
        <MapZoomContainer
          zoomToRoomId={zoomRoomId}
          roomSelector={
            zoomRoomId
              ? `[data-room="${rooms.find((r) => r.id === zoomRoomId)?.code}"]`
              : undefined
          }
        >
          <FloorMap
            rooms={rooms}
            selectedRoomId={featured?.id}
            onRoomSelect={handleRoomSelect}
            detailMode={bookingMode}
            assets={assets}
          />
        </MapZoomContainer>
      </div>

      <div
        className="start-panel-backdrop"
        onClick={closePanel}
        aria-hidden="true"
      />

      <div className="control-panel start-page-panel">
        <div className="panel-content">
          <div className="panel-header">
            <h1 className="panel-title h1">
              {bookingMode ? "Бронирование переговорной" : "Доступно"}
            </h1>
            <div className="panel-header-actions">
              {bookingMode && (
              <button
                type="button"
                className="btn-secondary h2"
                style={{
                  backgroundColor: "var(--black)",
                  color: "var(--white)",
                }}
                onClick={() => {
                  setBookingMode(false);
                  setZoomRoomId(null);
                  setSuccess(null);
                  setError(null);
                }}
              >
                  <img
                    src="/assets/icons/icon-back.svg"
                    alt=""
                    width={16}
                    height={16}
                  />{" "}
                  Назад
                </button>
              )}
              <button
                type="button"
                className="panel-close-mobile"
                onClick={closePanel}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
          </div>

          {featured && !bookingMode && (
            <>
              <RoomCardLarge
                room={featured}
                actionLabel={actionLabel}
                onAction={handleMainAction}
              />
              <div className="small-cards-row">
                {smallRooms.map((room) => (
                  <RoomCardSmall
                    key={room.id}
                    room={room}
                    onDetails={() => {
                      handleSwap(room), setZoomRoomId(room.id);
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {featured && bookingMode && (
            <>
              <RoomCardLarge
                room={featured}
                actionLabel=""
                onAction={() => undefined}
                extraInfo={nearestWindow}
                compact
              />
              <div
                className={`booking-controls${
                  nearestBooking ? " has-active" : ""
                }`}
              >
                {nearestBooking && (
                  <ActiveBookingCard
                    booking={nearestBooking}
                    onCancel={() => setCancelId(nearestBooking.id)}
                  />
                )}
                <div className="booking-controls-main">
                  <DatePicker3Days
                    dayCount={nearestBooking ? 2 : 3}
                    startDate={startDate}
                    selectedDate={selectedDate}
                    workDayStartMinutes={workDayStartMinutes}
                    workDayEndMinutes={workDayEndMinutes}
                    onSelect={(d) => {
                      if (
                        isDateUnavailableForBooking(
                          d,
                          workDayStartMinutes,
                          workDayEndMinutes
                        )
                      )
                        return;
                      setSelectedDate(d);
                    }}
                    onCalendarChange={(d) => {
                      if (
                        isDateUnavailableForBooking(
                          d,
                          workDayStartMinutes,
                          workDayEndMinutes
                        )
                      )
                        return;
                      setStartDate(d);
                      setSelectedDate(d);
                    }}
                  />
                  {availability && (
                    <TimeRangeSlider
                      workStart={availability.workDayStartMinutes}
                      workEnd={availability.workDayEndMinutes}
                      minStart={minStartMinutes}
                      start={rangeStart}
                      end={rangeEnd}
                      slots={availability.slots}
                      onChange={(s, e) => {
                        setRangeStart(s);
                        setRangeEnd(e);
                      }}
                    />
                  )}
                  {error && (
                    <div className="booking-message booking-message--error">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="booking-message booking-message--success">
                      {success}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-primary-custom b1"
                    style={{ height: 40, width: "100%", marginTop: 16 }}
                    disabled={
                      loading ||
                      isPastBooking ||
                      minStartMinutes >=
                        (availability?.workDayEndMinutes ?? 0) ||
                      !!(
                        availability &&
                        hasBookingConflict(
                          rangeStart,
                          rangeEnd,
                          availability.slots
                        )
                      )
                    }
                    onClick={handleBook}
                  >
                    Забронировать
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        show={cancelId !== null}
        title="Отмена бронирования"
        body="Вы уверены, что хотите отменить это бронирование?"
        confirmLabel="Отменить бронирование"
        onConfirm={handleCancelBooking}
        onHide={() => setCancelId(null)}
      />
    </div>
  );
}
