// Types aligned EXACTLY with server Mongoose models

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  likes: number;
  likedBy: string[];
  author: User | string;
  createdAt: string;
}

export interface Mix {
  _id: string;
  name: string;
  manufacturer: string;
  description?: string;
  flavors: string[];
  strength: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Promo {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  discountPercent?: number;
  badgeColor: string;
  priority: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Story {
  _id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  durationSeconds: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Invitation {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  location?: string;
  imageUrl?: string;
  maxParticipants?: number;
  currentParticipants: number;
  status: 'draft' | 'published';
  createdAt: string;
}

export interface Booking {
  _id: string;
  user: User | string;
  seatId: string;
  seatLabel: string;
  seatZone: string;
  date: string;
  time: string;
  guestsCount: number;
  phone: string;
  comment?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Seat {
  id: string;
  label: string;
  zone: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  status: number;
}

