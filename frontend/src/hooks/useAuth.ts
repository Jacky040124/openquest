import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type {
  LoginDTO,
  RegisterDTO,
  TokenDTO,
  UserResponseDTO,
  UserPreferenceDTO,
  UserPreferenceCreateDTO,
  UserPreferenceUpdateDTO,
  UpdateUserDTO,
} from '@/types/api';

// API functions
const authApi = {
  login: (data: LoginDTO) =>
    api.post<TokenDTO>('/auth/login', data, { skipAuth: true }),

  register: (data: RegisterDTO) =>
    api.post<UserResponseDTO>('/auth/register', data, { skipAuth: true }),

  logout: () => api.post<void>('/auth/logout'),

  getMe: () => api.get<UserResponseDTO>('/auth/me'),

  updateMe: (data: UpdateUserDTO) => api.put<UserResponseDTO>('/auth/me', data),

  getPreferences: () => api.get<UserPreferenceDTO>('/auth/me/preferences'),

  createPreferences: (data: UserPreferenceCreateDTO) =>
    api.post<UserPreferenceDTO>('/auth/me/preferences', data),

  updatePreferences: (data: UserPreferenceUpdateDTO) =>
    api.put<UserPreferenceDTO>('/auth/me/preferences', data),
};

// Login hook
// Note: Does NOT auto-navigate to allow for post-login actions (like creating preferences)
// Caller should handle navigation after login completes
export function useLogin() {
  const { setTokens, setUser, setLoading, setError } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginDTO) => {
      setLoading(true);
      const tokens = await authApi.login(data);
      setTokens(tokens);
      const user = await authApi.getMe();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      setLoading(false);
      // Note: Navigation removed - caller handles it after any post-login actions
    },
    onError: (error: ApiError) => {
      const message =
        error.status === 401
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      setError(message);
    },
  });
}

// Register hook
export function useRegister() {
  const { setLoading, setError } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterDTO) => {
      setLoading(true);
      return authApi.register(data);
    },
    onSuccess: () => {
      setLoading(false);
    },
    onError: (error: ApiError) => {
      const message =
        error.status === 409
          ? 'Email already exists'
          : 'Registration failed. Please try again.';
      setError(message);
    },
  });
}

// Logout hook
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Ignore logout API errors, still clear local state
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
  });
}

// Get current user hook
export function useCurrentUser() {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getMe,
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update user hook
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['currentUser'], data);
    },
  });
}

// User preferences hooks
export function useUserPreferences() {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['userPreferences'],
    queryFn: authApi.getPreferences,
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404 (preferences not created yet)
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCreatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.createPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['userPreferences'], data);
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updatePreferences,
    onMutate: async (newPrefs) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userPreferences'] });
      
      // Snapshot the previous value
      const previousPrefs = queryClient.getQueryData(['userPreferences']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['userPreferences'], (old: UserPreferenceDTO | undefined) => ({
        ...old,
        ...newPrefs,
      }));
      
      return { previousPrefs };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['userPreferences'], data);
    },
    onError: (_err, _newPrefs, context) => {
      // Keep the optimistic update even on error (for demo/offline mode)
      // If you want to rollback: queryClient.setQueryData(['userPreferences'], context?.previousPrefs);
    },
  });
}
