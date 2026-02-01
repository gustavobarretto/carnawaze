import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

const memoryStore: Record<string, string> = {};
const fallbackStorage = {
  getItem: (k: string) => memoryStore[k] ?? null,
  setItem: (k: string, v: string) => { memoryStore[k] = v; },
  removeItem: (k: string) => { delete memoryStore[k]; },
};

function getStorage() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return createJSONStorage(() => localStorage as any);
  }
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return createJSONStorage(() => AsyncStorage);
  } catch {
    return createJSONStorage(() => fallbackStorage as any);
  }
}
const storage = getStorage();
const AUTH_STORAGE_KEY = 'carnawaze-auth';

/** Remove persisted auth data so next login starts fresh (fixes stale admin state). */
export async function clearAuthStorage(): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailConfirmedAt: string | null;
}

export const ADMIN_EMAIL = 'admin@carnawaze.local';

interface AuthState {
  user: User | null;
  token: string | null;
  isAdminUser: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

/** True if user is admin (flag, email or role from backend). Use this so already-logged-in users get admin access. */
export function selectIsAdmin(s: AuthState): boolean {
  if (s.isAdminUser === true) return true;
  const email = (s.user?.email ?? '').toLowerCase();
  const role = (s.user?.role ?? '').toLowerCase();
  return email === ADMIN_EMAIL || role === 'admin';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAdminUser: false,
      _hasHydrated: false,
      setAuth: (user, token) => {
        const isAdminUser =
          (user.email ?? '').toLowerCase() === ADMIN_EMAIL ||
          (user.role ?? '').toLowerCase() === 'admin';
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[Auth Store] setAuth chamado — user:', user, 'isAdminUser:', isAdminUser);
        }
        set({
          user,
          token,
          isAdminUser,
        });
      },
      logout: () => set({ user: null, token: null, isAdminUser: false }),
      setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage,
      partialize: (s) => ({ user: s.user, token: s.token, isAdminUser: s.isAdminUser }),
    }
  )
);

if (typeof window !== 'undefined') {
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.setState({ _hasHydrated: true });
  });
  // Fallback: ensure we never block forever if hydration doesn't fire (e.g. web)
  const fallbackMs = Platform.OS === 'web' ? 150 : 800;
  setTimeout(() => {
    useAuthStore.setState((s) => (s._hasHydrated ? {} : { _hasHydrated: true }));
  }, fallbackMs);
}
