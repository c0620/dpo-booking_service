import { useEffect, useState } from "react";
import { adminApi, roomsApi } from "../api/client";
import type { AdminBooking, AdminUser, Room } from "../api/types";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { formatBookingDateTime } from "../utils/time";

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userSort, setUserSort] = useState("alphabet");
  const [userStatus, setUserStatus] = useState("");
  const [bookingSort, setBookingSort] = useState("date");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [blockUserId, setBlockUserId] = useState<number | null>(null);
  const [unblockUserId, setUnblockUserId] = useState<number | null>(null);

  const loadUsers = () => {
    adminApi.getUsers(userSort, userStatus || undefined).then(setUsers);
  };

  const loadBookings = () => {
    adminApi
      .getBookings({ roomId: selectedRoomId ?? undefined, sort: bookingSort })
      .then(setBookings);
  };

  useEffect(() => {
    roomsApi.getAll().then(setRooms);
  }, []);
  useEffect(() => {
    loadUsers();
  }, [userSort, userStatus]);
  useEffect(() => {
    loadBookings();
  }, [bookingSort, selectedRoomId]);

  const handleApprove = async (id: number) => {
    await adminApi.approveUser(id);
    loadUsers();
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    await adminApi.deleteUser(deleteUserId);
    setDeleteUserId(null);
    loadUsers();
  };

  const handleBlock = async () => {
    if (!blockUserId) return;
    await adminApi.blockUser(blockUserId);
    setBlockUserId(null);
    loadUsers();
    loadBookings();
  };

  const handleUnblock = async () => {
    if (!unblockUserId) return;
    await adminApi.unblockUser(unblockUserId);
    setUnblockUserId(null);
    loadUsers();
  };

  const deleteUser = users.find((u) => u.id === deleteUserId);
  const blockUser = users.find((u) => u.id === blockUserId);
  const unblockUser = users.find((u) => u.id === unblockUserId);

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    await adminApi.cancelBooking(cancelBookingId, cancelReason || undefined);
    setCancelBookingId(null);
    setCancelReason("");
    loadBookings();
  };

  return (
    <div className="main-area admin-page">
      <div className="control-panel">
        <h1 className="panel-title h1">Админ-панель</h1>

        <div className="admin-grid">
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Пользователи</h3>
              <select
                className="form-select form-select-sm"
                style={{ width: 200 }}
                value={userSort}
                onChange={(e) => setUserSort(e.target.value)}
              >
                <option value="alphabet">По алфавиту</option>
                <option value="date">По дате регистрации</option>
                <option value="status">По статусу</option>
              </select>
            </div>
            <select
              className="form-select form-select-sm mb-3"
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value)}
            >
              <option value="">Все статусы</option>
              <option value="Pending">Ожидают</option>
              <option value="Approved">Подтверждённые</option>
              <option value="Blocked">Заблокированные</option>
            </select>

            {users.map((u) => (
              <div key={u.id} className="user-card">
                <div>
                  <div style={{ fontWeight: 700 }}>{u.email}</div>
                  <div style={{ fontSize: 13 }}>{u.displayName}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Дата регистрации: {u.registeredAt}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    Статус:{" "}
                    {u.status == "Approved"
                      ? "Подтверждён"
                      : u.status == "Pending"
                      ? "Ожидает"
                      : "Заблокирован"}
                  </div>
                </div>
                <div className="actions">
                  {u.status === "Blocked" ? (
                    <button
                      type="button"
                      className="btn-primary-custom b2"
                      onClick={() => setUnblockUserId(u.id)}
                    >
                      Разблокировать
                    </button>
                  ) : (
                    <>
                      {u.status === "Pending" ? (
                        <button
                          type="button"
                          className="btn-primary-custom b2"
                          onClick={() => handleApprove(u.id)}
                        >
                          Одобрить
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-outline-custom admin-btn-dark b2"
                          onClick={() => setDeleteUserId(u.id)}
                        >
                          Удалить
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-danger-custom b2"
                        onClick={() => setBlockUserId(u.id)}
                      >
                        Заблокировать
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>
                Бронирование комнат
              </h3>
              <select
                className="form-select form-select-sm"
                style={{ width: 200 }}
                value={bookingSort}
                onChange={(e) => setBookingSort(e.target.value)}
              >
                <option value="date">По датам бронирования</option>
                <option value="user">По аккаунтам</option>
              </select>
            </div>

            <div className="room-tabs">
              <button
                type="button"
                className={`room-tab ${
                  selectedRoomId === null ? "active" : ""
                }`}
                onClick={() => setSelectedRoomId(null)}
              >
                Все
              </button>
              {rooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`room-tab ${
                    selectedRoomId === r.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedRoomId(r.id)}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <div className="bookings-grid">
              {bookings.map((b) => (
                <div key={b.id} className="booking-card">
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {formatBookingDateTime(
                        b.date,
                        b.startMinutes,
                        b.endMinutes
                      )}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      {b.userDisplayName} / {b.userEmail}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {b.roomName}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-danger-custom b2"
                    onClick={() => setCancelBookingId(b.id)}
                  >
                    Отменить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={deleteUserId !== null}
        title="Удаление пользователя"
        body={`Удалить аккаунт ${
          deleteUser?.email ?? ""
        }? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onHide={() => setDeleteUserId(null)}
      />

      <ConfirmModal
        show={blockUserId !== null}
        title="Блокировка пользователя"
        body={`Заблокировать аккаунт ${
          blockUser?.email ?? ""
        }? Пользователь не сможет войти в систему.`}
        confirmLabel="Заблокировать"
        onConfirm={handleBlock}
        onHide={() => setBlockUserId(null)}
      />

      <ConfirmModal
        show={unblockUserId !== null}
        title="Разблокировка пользователя"
        body={`Разблокировать аккаунт ${
          unblockUser?.email ?? ""
        }? Пользователь снова получит доступ к системе.`}
        confirmLabel="Разблокировать"
        onConfirm={handleUnblock}
        onHide={() => setUnblockUserId(null)}
      />

      <ConfirmModal
        show={cancelBookingId !== null}
        title="Отмена бронирования"
        body="Отменить бронирование? Пользователь получит уведомление."
        confirmLabel="Отменить"
        showReason
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirm={handleCancelBooking}
        onHide={() => {
          setCancelBookingId(null);
          setCancelReason("");
        }}
      />
    </div>
  );
}
