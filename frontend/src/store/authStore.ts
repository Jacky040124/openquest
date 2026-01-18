import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getToken, setToken, setRefreshToken, clearTokens } from '@/lib/api';
import type { UserResponseDTO, TokenDTO } from '@/types/api';

interface AuthState {
  isLoggedIn: boolean;
  user: UserResponseDTO | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: UserResponseDTO) => void;
  setTokens: (tokens: TokenDTO) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      isLoading: false,
      error: null,

      setUser: (user: UserResponseDTO) =>
        set({ user, isLoggedIn: true, error: null }),

      setTokens: (tokens: TokenDTO) => {
        setToken(tokens.access_token);
        if (tokens.refresh_token) {
          setRefreshToken(tokens.refresh_token);
        }
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error, isLoading: false }),

      logout: () => {
        clearTokens();
        set({ isLoggedIn: false, user: null, error: null });
      },

      checkAuth: () => {
        const token = getToken();
        const { user } = get();
        if (!token || !user) {
          get().logout();
          return false;
        }
        return true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
      }),
    }
  )
);
