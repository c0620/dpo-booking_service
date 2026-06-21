import type { Room } from '../types';
import { toDateOnlyString } from '../../utils/time';

export interface MockUser {
  id: number;
  email: string;
  password: string;
  displayName: string;
  role: 'Admin' | 'User';
  status: 'Pending' | 'Approved' | 'Blocked';
  statusBeforeBlock?: 'Pending' | 'Approved';
  registeredAt: string;
}

export interface MockBooking {
  id: number;
  roomId: number;
  userId: number;
  date: string;
  startMinutes: number;
  endMinutes: number;
  status: 'Active' | 'Cancelled';
}

export interface MockNotification {
  id: number;
  userId: number;
  sender: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface MockStore {
  nextUserId: number;
  nextBookingId: number;
  nextNotificationId: number;
  users: MockUser[];
  bookings: MockBooking[];
  notifications: MockNotification[];
}

const today = toDateOnlyString(new Date());
const tomorrow = toDateOnlyString(new Date(Date.now() + 86_400_000));

export const SEED_ROOMS: Room[] = [
  {
    id: 1,
    code: 'П106',
    name: 'Проектная комната',
    floor: 1,
    capacity: 40,
    description: 'Вместимость до 40 человек, интерьер в фирменном стиле МИРЭА — идеально подходит для ответственных встреч в большой компании',
    amenities: ['проектор', 'микрофон', 'доска-трансформер', 'лаборатория', 'кондиционер'],
    imageUrls: ['/assets/rooms/room-106.jpg'],
    mapX: 547, mapY: 24, mapWidth: 122, mapHeight: 166,
  },
  {
    id: 2,
    code: 'П815',
    name: 'Комната встреч',
    floor: 8,
    capacity: 12,
    description: 'Уютная переговорная для небольших рабочих встреч и обсуждений проектов.',
    amenities: ['проектор', 'доска', 'кондиционер'],
    imageUrls: ['/assets/rooms/room-815.jpg'],
    mapX: 28, mapY: 132, mapWidth: 114, mapHeight: 58,
  },
  {
    id: 3,
    code: 'П807',
    name: 'Конференц-зал',
    floor: 8,
    capacity: 25,
    description: 'Просторный конференц-зал для презентаций и совещаний среднего масштаба.',
    amenities: ['проектор', 'микрофон', 'кондиционер'],
    imageUrls: ['/assets/rooms/room-807.jpg'],
    mapX: 616, mapY: 24, mapWidth: 53, mapHeight: 166,
  },
  {
    id: 4,
    code: 'П610',
    name: 'Компьютерная практика',
    floor: 6,
    capacity: 30,
    description: 'Компьютерный класс с рабочими местами для практических занятий и командной работы.',
    amenities: ['компьютеры', 'проектор', 'кондиционер'],
    imageUrls: ['/assets/rooms/room-610.jpg'],
    mapX: 220, mapY: 132, mapWidth: 265, mapHeight: 58,
  },
];

export function createSeedStore(): MockStore {
  return {
    nextUserId: 4,
    nextBookingId: 3,
    nextNotificationId: 2,
    users: [
      {
        id: 1,
        email: 'admin@edu.ru',
        password: 'admin123',
        displayName: 'Администратор',
        role: 'Admin',
        status: 'Approved',
        registeredAt: '2026-05-15',
      },
      {
        id: 2,
        email: 'user@edu.ru',
        password: 'user123',
        displayName: 'Пётр Пользователь',
        role: 'User',
        status: 'Approved',
        registeredAt: '2026-06-04',
      },
      {
        id: 3,
        email: 'student@edu.ru',
        password: 'student',
        displayName: 'Иван Студентов',
        role: 'User',
        status: 'Pending',
        registeredAt: '2026-06-12',
      },
    ],
    bookings: [
      {
        id: 1,
        roomId: 1,
        userId: 2,
        date: today,
        startMinutes: 9 * 60,
        endMinutes: 12 * 60,
        status: 'Active',
      },
      {
        id: 2,
        roomId: 3,
        userId: 2,
        date: tomorrow,
        startMinutes: 14 * 60,
        endMinutes: 16 * 60,
        status: 'Active',
      },
    ],
    notifications: [
      {
        id: 1,
        userId: 3,
        sender: 'Система',
        title: 'Регистрация',
        body: 'Заявка на регистрацию отправлена. Ожидайте подтверждения от администратора.',
        createdAt: '2026-06-12T10:00:00',
      },
    ],
  };
}
