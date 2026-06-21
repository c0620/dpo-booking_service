import axios from 'axios';
import type {
  AdminBooking,
  AdminUser,
  AuthResponse,
  Booking,
  Notification,
  Profile,
  Room,
  RoomAvailability,
} from './types';
import {
  mockAdminApi,
  mockAuthApi,
  mockBookingsApi,
  mockProfileApi,
  mockRoomsApi,
} from './mock/api';

const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const realAuthApi = {
  register: (data: { email: string; password: string; displayName: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
};

const realRoomsApi = {
  getAll: () => api.get<Room[]>('/rooms').then((r) => r.data),
  getAvailability: (id: number, date: string) =>
    api.get<RoomAvailability>(`/rooms/${id}/availability`, { params: { date } }).then((r) => r.data),
};

const realBookingsApi = {
  getMy: () => api.get<Booking[]>('/bookings/my').then((r) => r.data),
  create: (data: { roomId: number; date: string; startMinutes: number; endMinutes: number }) =>
    api.post<Booking>('/bookings', data).then((r) => r.data),
  cancel: (id: number) => api.delete(`/bookings/${id}`),
};

const realProfileApi = {
  get: () => api.get<Profile>('/profile').then((r) => r.data),
  update: (data: { displayName: string; newPassword?: string; confirmPassword?: string }) =>
    api.put<Profile>('/profile', data).then((r) => r.data),
  getNotifications: () => api.get<Notification[]>('/profile/notifications').then((r) => r.data),
};

const realAdminApi = {
  getUsers: (sort?: string, status?: string) =>
    api.get<AdminUser[]>('/admin/users', { params: { sort, status } }).then((r) => r.data),
  approveUser: (id: number) => api.post(`/admin/users/${id}/approve`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  blockUser: (id: number) => api.post(`/admin/users/${id}/block`),
  unblockUser: (id: number) => api.post(`/admin/users/${id}/unblock`),
  getBookings: (params: { roomId?: number; sort?: string; from?: string; to?: string }) =>
    api.get<AdminBooking[]>('/admin/bookings', { params }).then((r) => r.data),
  cancelBooking: (id: number, reason?: string) =>
    api.delete(`/admin/bookings/${id}`, { data: { reason } }),
};

export const authApi = useMockApi ? mockAuthApi : realAuthApi;
export const roomsApi = useMockApi ? mockRoomsApi : realRoomsApi;
export const bookingsApi = useMockApi ? mockBookingsApi : realBookingsApi;
export const profileApi = useMockApi ? mockProfileApi : realProfileApi;
export const adminApi = useMockApi ? mockAdminApi : realAdminApi;

export const isMockApiEnabled = useMockApi;

export default api;
