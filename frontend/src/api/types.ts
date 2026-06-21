export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  displayName: string;
  role: string;
  status: string;
}

export interface Room {
  id: number;
  code: string;
  name: string;
  floor: number;
  capacity: number;
  description: string;
  amenities: string[];
  imageUrls: string[];
  mapX: number;
  mapY: number;
  mapWidth: number;
  mapHeight: number;
}

export interface BookingSlot {
  id: number;
  startMinutes: number;
  endMinutes: number;
  userEmail: string;
  userDisplayName: string;
  isOwn: boolean;
}

export interface RoomAvailability {
  roomId: number;
  date: string;
  workDayStartMinutes: number;
  workDayEndMinutes: number;
  slots: BookingSlot[];
}

export interface Booking {
  id: number;
  roomId: number;
  roomCode: string;
  roomName: string;
  floor: number;
  date: string;
  startMinutes: number;
  endMinutes: number;
  status: string;
  userEmail: string;
  userDisplayName: string;
}

export interface Profile {
  id: number;
  email: string;
  displayName: string;
  role: string;
  status: string;
}

export interface Notification {
  id: number;
  sender: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  status: "Approved" | "Pending" | "Blocked";
  registeredAt: string;
}

export interface AdminBooking {
  id: number;
  roomId: number;
  roomName: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  userEmail: string;
  userDisplayName: string;
  status: string;
}
