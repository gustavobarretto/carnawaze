import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3001;

let _cachedApiBase: string | null = null;

function getApiBase(): string {
  if (_cachedApiBase) return _cachedApiBase;

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    _cachedApiBase = envUrl;
    if (__DEV__) console.log('[API] base URL:', envUrl, '(from EXPO_PUBLIC_API_URL)');
    return _cachedApiBase;
  }

  if (Platform.OS === 'android') {
    _cachedApiBase = `http://10.0.2.2:${API_PORT}`;
    if (__DEV__) console.log('[API] base URL:', _cachedApiBase, '(Android emulator)');
    return _cachedApiBase;
  }

  if (Platform.OS === 'ios' && __DEV__) {
    const hostUri =
      (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
      (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) {
        _cachedApiBase = `http://${host}:${API_PORT}`;
        console.log('[API] base URL:', _cachedApiBase, '(iPhone → mesmo host do Expo)');
        return _cachedApiBase;
      }
    }
    console.warn('[API] No hostUri on iPhone. Set EXPO_PUBLIC_API_URL=http://SEU_IP:3001 no .env');
  }

  _cachedApiBase = `http://localhost:${API_PORT}`;
  return _cachedApiBase;
}

class ApiError extends Error {
  constructor(
    public status: string,
    public code: string,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  opts: {
    method?: string;
    body?: object;
    token?: string | null;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${getApiBase()}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data.status ?? 'ERROR',
      data.code ?? 'UNKNOWN',
      data.message ?? res.statusText,
      data.details
    );
  }
  return data as T;
}

const __DEV_LOGS = true; // set false to remove debug logs

/** Like request() but logs raw response body for /me to debug empty user. */
async function requestWithRawLog<T>(
  path: string,
  opts: { method?: string; body?: object; token?: string | null } = {},
  label: string
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${getApiBase()}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const rawText = await res.clone().text();
  if (__DEV_LOGS && path === '/v1/users/me') {
    console.log(`[API] ${label} raw status:`, res.status, 'body length:', rawText.length, 'body:', rawText.slice(0, 500));
  }
  let data: T;
  try {
    data = rawText ? (JSON.parse(rawText) as T) : ({} as T);
  } catch {
    data = {} as T;
  }
  if (!res.ok) {
    throw new ApiError(
      (data as any)?.status ?? 'ERROR',
      (data as any)?.code ?? 'UNKNOWN',
      (data as any)?.message ?? res.statusText,
      (data as any)?.details
    );
  }
  if (__DEV_LOGS) console.log(`[API] ${label} parsed:`, JSON.stringify(data, null, 2));
  return data;
}

export const api = {
  auth: {
    async login(body: { email: string; password: string }) {
      const res = await request<{ user: any; token: string }>('/v1/auth/login', { method: 'POST', body });
      if (__DEV_LOGS) console.log('[API] POST /v1/auth/login response:', JSON.stringify(res, null, 2));
      return res;
    },
    async register(body: { email: string; name: string; password: string }) {
      return request<{ user: any; token: string }>('/v1/users', { method: 'POST', body });
    },
    async confirmEmail(body: { token: string }) {
      return request<{ ok: boolean }>('/v1/auth/confirm-email', { method: 'POST', body });
    },
    async resendConfirmation(body: { email: string }) {
      return request<{ ok: boolean }>('/v1/auth/resend-confirmation', { method: 'POST', body });
    },
  },
  users: {
    async me(token: string) {
      // Usar request() (uma leitura do body com res.json()) para evitar clone() que em alguns ambientes pode devolver body vazio.
      const out = await request<{ user: any }>('/v1/users/me', { token });
      if (__DEV_LOGS) console.log('[API] GET /v1/users/me response:', JSON.stringify(out, null, 2));
      return out;
    },
    async updateMe(token: string, body: { name?: string; email?: string; password?: string; currentPassword?: string }) {
      return request<{ user: any }>('/v1/users/me', { method: 'PATCH', body, token });
    },
  },
  artists: {
    async search(token: string, q: string) {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      return request<{ artists: Array<{ id: string; name: string }> }>(`/v1/artists?${params}`, { token });
    },
    async list(token: string, page = 1, limit = 20) {
      return request<{ items: any[]; page: number; limit: number; total: number; totalPages: number }>(
        `/v1/artists?page=${page}&limit=${limit}`,
        { token }
      );
    },
    async create(token: string, name: string) {
      return request<{ artist: any }>('/v1/artists', { method: 'POST', body: { name }, token });
    },
    async delete(token: string, id: string) {
      return request<{ ok: boolean }>(`/v1/artists/${id}`, { method: 'DELETE', token });
    },
  },
  pins: {
    async list(token: string) {
      return request<{ pins: Array<{ id: string; artistId: string; artist: { id: string; name: string }; lat: number; lng: number; reportCount: number }> }>('/v1/pins', { token });
    },
    async createOrConfirm(token: string, body: { artistId: string; lat: number; lng: number; type: 'create' | 'confirm' }) {
      return request<{ pin: any }>('/v1/pins', { method: 'POST', body, token });
    },
    async reportIncorrect(token: string, body: { artistId: string; lat: number; lng: number }) {
      return request<{ pin: any }>('/v1/pins/report-incorrect', { method: 'POST', body, token });
    },
    async getCount(token: string, pinId: string) {
      return request<{ pinId: string; reportCount: number }>(`/v1/pins/${pinId}/count`, { token });
    },
    async delete(token: string, pinId: string) {
      return request<{ ok: boolean }>(`/v1/pins/${pinId}`, { method: 'DELETE', token });
    },
  },
  stats: {
    async usersCount(token: string) {
      return request<{ total: number }>('/v1/stats/users-count', { token });
    },
    async pinsByMinute(token: string) {
      return request<{ data: Array<{ minute: string; count: number }> }>('/v1/stats/pins-by-minute', { token });
    },
  },
};
