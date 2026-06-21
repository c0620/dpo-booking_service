import type {
  AdminBooking,
  AdminUser,
  AuthResponse,
  Booking,
  Notification,
  Profile,
  RoomAvailability,
} from '../types';
import { delay, MockApiError } from './errors';
import { getMockStore, getRooms, persistMockStore } from './store';
import type { MockUser } from './seed';

const WORK_DAY_START = 9 * 60;
const WORK_DAY_END = 18 * 60;
const ALLOWED_DOMAINS = ['edu.ru', 'mirea.ru'];

interface AuthState {
  userId: number | null;
}

function getAuthState(): AuthState {
  const raw = localStorage.getItem('auth');
  if (!raw) return { userId: null };
  try {
    const parsed = JSON.parse(raw) as { userId?: number | null };
    return { userId: parsed.userId ?? null };
  } catch {
    return { userId: null };
  }
}

function requireUser(): MockUser {
  const { userId } = getAuthState();
  if (!userId) throw new MockApiError('Требуется авторизация', 401);
  const user = getMockStore().users.find((u) => u.id === userId);
  if (!user) throw new MockApiError('Пользователь не найден', 401);
  if (user.status === 'Blocked') throw new MockApiError('Аккаунт заблокирован', 401);
  return user;
}

function requireAdmin(): MockUser {
  const user = requireUser();
  if (user.role !== 'Admin') throw new MockApiError('Доступ запрещён', 403);
  return user;
}

function toAuthResponse(user: MockUser): AuthResponse {
  return {
    token: `mock-token-${user.id}`,
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
}

function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

function addNotification(userId: number, sender: string, title: string, body: string) {
  const data = getMockStore();
  data.notifications.push({
    id: data.nextNotificationId++,
    userId,
    sender,
    title,
    body,
    createdAt: new Date().toISOString(),
  });
  persistMockStore();
}

function sortUsers(users: MockUser[], sort?: string): AdminUser[] {
  const mapped = users.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    status: u.status,
    registeredAt: u.registeredAt,
  }));

  if (sort === 'date') {
    return mapped.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  }
  if (sort === 'status') {
    return mapped.sort((a, b) => a.status.localeCompare(b.status) || a.email.localeCompare(b.email));
  }
  return mapped.sort((a, b) => a.email.localeCompare(b.email));
}

export const mockAuthApi = {
  async register(data: { email: string; password: string; displayName: string }): Promise<AuthResponse> {
    await delay();
    const email = data.email.trim().toLowerCase();
    if (!isAllowedEmail(email)) {
      throw new MockApiError('Регистрация доступна только для @edu.ru и @mirea.ru');
    }
    if (data.password.length < 5) {
      throw new MockApiError('Пароль должен содержать не менее 5 символов');
    }
    const store = getMockStore();
    if (store.users.some((u) => u.email === email)) {
      throw new MockApiError('Пользователь с таким email уже зарегистрирован');
    }
    const user: MockUser = {
      id: store.nextUserId++,
      email,
      password: data.password,
      displayName: data.displayName.trim(),
      role: 'User',
      status: 'Pending',
      registeredAt: new Date().toISOString().slice(0, 10),
    };
    store.users.push(user);
    addNotification(
      user.id,
      'Система',
      'Регистрация',
      'Заявка на регистрацию отправлена. Ожидайте подтверждения от администратора.',
    );
    persistMockStore();
    return toAuthResponse(user);
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    await delay();
    const email = data.email.trim().toLowerCase();
    const user = getMockStore().users.find((u) => u.email === email);
    if (!user || user.password !== data.password) {
      throw new MockApiError('Неверный email или пароль', 401);
    }
    if (user.status === 'Blocked') {
      throw new MockApiError('Аккаунт заблокирован', 401);
    }
    return toAuthResponse(user);
  },
};

export const mockRoomsApi = {
  async getAll() {
    await delay();
    return getRooms();
  },

  async getAvailability(id: number, date: string): Promise<RoomAvailability> {
    await delay();
    requireUser();
    const room = getRooms().find((r) => r.id === id);
    if (!room) throw new MockApiError('Комната не найдена', 404);

    const currentUserId = getAuthState().userId;
    const activeBookings = getMockStore().bookings.filter(
      (b) => b.roomId === id && b.date === date && b.status === 'Active',
    );

    const slots = activeBookings.map((b) => {
      const user = getMockStore().users.find((u) => u.id === b.userId);
      return {
        id: b.id,
        startMinutes: b.startMinutes,
        endMinutes: b.endMinutes,
        userEmail: user?.email ?? '',
        userDisplayName: user?.displayName ?? '',
        isOwn: b.userId === currentUserId,
      };
    });

    return {
      roomId: id,
      date,
      workDayStartMinutes: WORK_DAY_START,
      workDayEndMinutes: WORK_DAY_END,
      slots,
    };
  },
};

export const mockBookingsApi = {
  async getMy(): Promise<Booking[]> {
    await delay();
    const user = requireUser();
    const rooms = getRooms();
    return getMockStore()
      .bookings
      .filter((b) => b.userId === user.id)
      .map((b) => {
        const room = rooms.find((r) => r.id === b.roomId)!;
        return {
          id: b.id,
          roomId: b.roomId,
          roomCode: room.code,
          roomName: room.name,
          floor: room.floor,
          date: b.date,
          startMinutes: b.startMinutes,
          endMinutes: b.endMinutes,
          status: b.status,
          userEmail: user.email,
          userDisplayName: user.displayName,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.startMinutes - a.startMinutes);
  },

  async create(data: {
    roomId: number;
    date: string;
    startMinutes: number;
    endMinutes: number;
  }): Promise<Booking> {
    await delay();
    const user = requireUser();
    if (user.status !== 'Approved') throw new MockApiError('Аккаунт не подтверждён', 403);

    const room = getRooms().find((r) => r.id === data.roomId);
    if (!room) throw new MockApiError('Комната не найдена', 404);

    if (data.startMinutes < WORK_DAY_START || data.endMinutes > WORK_DAY_END) {
      throw new MockApiError('Бронирование возможно только в рабочие часы 9:00–18:00');
    }
    if (data.startMinutes >= data.endMinutes) {
      throw new MockApiError('Время окончания должно быть позже времени начала');
    }

    const conflict = getMockStore().bookings.some(
      (b) =>
        b.roomId === data.roomId
        && b.date === data.date
        && b.status === 'Active'
        && data.startMinutes < b.endMinutes
        && data.endMinutes > b.startMinutes,
    );
    if (conflict) {
      throw new MockApiError('Выбранный интервал пересекается с существующим бронированием');
    }

    const store = getMockStore();
    const booking = {
      id: store.nextBookingId++,
      roomId: data.roomId,
      userId: user.id,
      date: data.date,
      startMinutes: data.startMinutes,
      endMinutes: data.endMinutes,
      status: 'Active' as const,
    };
    store.bookings.push(booking);
    persistMockStore();

    return {
      id: booking.id,
      roomId: booking.roomId,
      roomCode: room.code,
      roomName: room.name,
      floor: room.floor,
      date: booking.date,
      startMinutes: booking.startMinutes,
      endMinutes: booking.endMinutes,
      status: booking.status,
      userEmail: user.email,
      userDisplayName: user.displayName,
    };
  },

  async cancel(id: number): Promise<void> {
    await delay();
    const user = requireUser();
    const store = getMockStore();
    const booking = store.bookings.find((b) => b.id === id && b.userId === user.id);
    if (!booking) throw new MockApiError('Бронирование не найдено', 404);
    booking.status = 'Cancelled';
    persistMockStore();
  },
};

export const mockProfileApi = {
  async get(): Promise<Profile> {
    await delay();
    const user = requireUser();
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
    };
  },

  async update(data: {
    displayName: string;
    newPassword?: string;
    confirmPassword?: string;
  }): Promise<Profile> {
    await delay();
    const user = requireUser();
    if (data.newPassword) {
      if (data.newPassword.length < 5) {
        throw new MockApiError('Пароль должен содержать не менее 5 символов');
      }
      if (data.newPassword !== data.confirmPassword) {
        throw new MockApiError('Пароли не совпадают');
      }
      user.password = data.newPassword;
    }
    user.displayName = data.displayName.trim();
    persistMockStore();
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
    };
  },

  async getNotifications(): Promise<Notification[]> {
    await delay();
    const user = requireUser();
    return getMockStore()
      .notifications
      .filter((n) => n.userId === user.id)
      .map(({ id, sender, title, body, createdAt }) => ({ id, sender, title, body, createdAt }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

export const mockAdminApi = {
  async getUsers(sort?: string, status?: string): Promise<AdminUser[]> {
    await delay();
    requireAdmin();
    let users = getMockStore().users.filter((u) => u.role !== 'Admin');
    if (status) {
      users = users.filter((u) => u.status === status);
    } else {
      users = users.filter((u) => u.status !== 'Blocked');
    }
    return sortUsers(users, sort);
  },

  async approveUser(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const user = getMockStore().users.find((u) => u.id === id);
    if (!user) throw new MockApiError('Пользователь не найден', 404);
    user.status = 'Approved';
    addNotification(user.id, 'Администратор', 'Регистрация подтверждена', 'Ваша заявка одобрена. Теперь вы можете бронировать переговорные.');
    persistMockStore();
  },

  async deleteUser(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const store = getMockStore();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new MockApiError('Пользователь не найден', 404);
    store.users.splice(idx, 1);
    store.bookings = store.bookings.filter((b) => b.userId !== id);
    store.notifications = store.notifications.filter((n) => n.userId !== id);
    persistMockStore();
  },

  async blockUser(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const store = getMockStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) throw new MockApiError('Пользователь не найден', 404);
    if (user.status === 'Blocked') throw new MockApiError('Пользователь уже заблокирован');

    user.statusBeforeBlock = user.status === 'Approved' ? 'Approved' : 'Pending';
    user.status = 'Blocked';

    store.bookings
      .filter((b) => b.userId === id && b.status === 'Active')
      .forEach((b) => { b.status = 'Cancelled'; });

    addNotification(user.id, 'Администратор', 'Аккаунт заблокирован', 'Ваш аккаунт заблокирован администратором.');
    persistMockStore();
  },

  async unblockUser(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const user = getMockStore().users.find((u) => u.id === id);
    if (!user) throw new MockApiError('Пользователь не найден', 404);
    if (user.status !== 'Blocked') throw new MockApiError('Пользователь не заблокирован');

    user.status = user.statusBeforeBlock ?? 'Approved';
    user.statusBeforeBlock = undefined;
    addNotification(user.id, 'Администратор', 'Разблокировка аккаунта', 'Ваш аккаунт разблокирован. Доступ к системе восстановлен.');
    persistMockStore();
  },

  async getBookings(params: {
    roomId?: number;
    sort?: string;
    from?: string;
    to?: string;
  }): Promise<AdminBooking[]> {
    await delay();
    requireAdmin();
    const rooms = getRooms();
    let bookings = getMockStore().bookings.filter((b) => {
      if (b.status !== 'Active') return false;
      const user = getMockStore().users.find((u) => u.id === b.userId);
      return user?.status !== 'Blocked';
    });
    if (params.roomId) bookings = bookings.filter((b) => b.roomId === params.roomId);
    if (params.from) bookings = bookings.filter((b) => b.date >= params.from!);
    if (params.to) bookings = bookings.filter((b) => b.date <= params.to!);

    const result: AdminBooking[] = bookings.map((b) => {
      const room = rooms.find((r) => r.id === b.roomId)!;
      const user = getMockStore().users.find((u) => u.id === b.userId);
      return {
        id: b.id,
        roomId: b.roomId,
        roomName: room.name,
        date: b.date,
        startMinutes: b.startMinutes,
        endMinutes: b.endMinutes,
        userEmail: user?.email ?? '',
        userDisplayName: user?.displayName ?? '',
        status: b.status,
      };
    });

    if (params.sort === 'user') {
      return result.sort((a, b) => a.userEmail.localeCompare(b.userEmail));
    }
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.startMinutes - a.startMinutes);
  },

  async cancelBooking(id: number, reason?: string): Promise<void> {
    await delay();
    requireAdmin();
    const store = getMockStore();
    const booking = store.bookings.find((b) => b.id === id);
    if (!booking) throw new MockApiError('Бронирование не найдено', 404);
    booking.status = 'Cancelled';
    const room = getRooms().find((r) => r.id === booking.roomId);
    addNotification(
      booking.userId,
      'Администратор',
      'Бронирование отменено',
      reason
        ? `Ваше бронирование ${room?.name ?? ''} отменено. Причина: ${reason}`
        : `Ваше бронирование ${room?.name ?? ''} отменено администратором.`,
    );
    persistMockStore();
  },
};
