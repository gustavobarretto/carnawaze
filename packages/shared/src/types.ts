export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  createdAt: string;
}

export type PinReportType = 'create' | 'confirm' | 'incorrect';

export interface Pin {
  id: string;
  artistId: string;
  artist?: Artist;
  lat: number;
  lng: number;
  reportCount: number;
  updatedAt: string;
  expiresAt: string;
}

export interface ApiError {
  status: string;
  code: string;
  message: string;
  details?: unknown[];
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
