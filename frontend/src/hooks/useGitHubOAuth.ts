import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type {
  GitHubAuthorizeResponse,
  GitHubTokenResponse,
  GitHubCallbackRequest,
  GitHubUserResponse,
  GitHubConnectDTO,
  GitHubStatusDTO,
} from '@/types/api';

// Session storage keys
const OAUTH_STATE_KEY = 'github_oauth_state';
const OAUTH_TOKEN_KEY = 'github_oauth_token';

// API functions
const githubApi = {
  // Get authorization URL
  getAuthorizeUrl: (scope: string = 'repo,user') =>
    api.get<GitHubAuthorizeResponse>(`/oauth/github/authorize?scope=${scope}`),

  // Exchange code for token
  exchangeCode: (data: GitHubCallbackRequest) =>
    api.post<GitHubTokenResponse>('/oauth/github/callback', data),

  // Get GitHub user info
  getGitHubUser: (accessToken: string) =>
    api.get<GitHubUserResponse>(`/oauth/github/user?access_token=${accessToken}`),

  // Save GitHub token to user profile
  connectGitHub: (data: GitHubConnectDTO) =>
    api.post<GitHubStatusDTO>('/auth/me/github', data),

  // Get GitHub connection status
  getGitHubStatus: () =>
    api.get<GitHubStatusDTO>('/auth/me/github'),

  // Disconnect GitHub
  disconnectGitHub: () =>
    api.delete<void>('/auth/me/github'),
};

// Store OAuth state in session storage
export function storeOAuthState(state: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
}

// Verify and clear OAuth state
export function verifyOAuthState(state: string): boolean {
  const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  return storedState === state;
}

// Store OAuth token temporarily in session storage (survives page reload but not browser close)
export function storeOAuthToken(token: string): void {
  sessionStorage.setItem(OAUTH_TOKEN_KEY, token);
}

// Get and clear OAuth token from session storage
export function getAndClearOAuthToken(): string | null {
  const token = sessionStorage.getItem(OAUTH_TOKEN_KEY);
  sessionStorage.removeItem(OAUTH_TOKEN_KEY);
  return token;
}

// Get OAuth token without clearing (for checking)
export function getOAuthToken(): string | null {
  return sessionStorage.getItem(OAUTH_TOKEN_KEY);
}

// Hook to initiate GitHub OAuth
export function useGitHubAuthorize() {
  return useMutation({
    mutationFn: async () => {
      const response = await githubApi.getAuthorizeUrl();
      // Store state for verification
      storeOAuthState(response.state);
      return response;
    },
    onSuccess: (data) => {
      // Redirect to GitHub
      window.location.href = data.authorize_url;
    },
  });
}

// Hook to exchange code for token (used in callback page)
export function useGitHubCallback() {
  const queryClient = useQueryClient();
  const { isLoggedIn, setGitHubConnected } = useAuthStore();

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      // Verify state
      if (!verifyOAuthState(state)) {
        throw new Error('Invalid OAuth state. Please try again.');
      }

      // Exchange code for token
      const tokenResponse = await githubApi.exchangeCode({ code, state });

      // Get GitHub user info
      const userInfo = await githubApi.getGitHubUser(tokenResponse.access_token);

      // If user is logged in, save to backend immediately
      if (isLoggedIn) {
        await githubApi.connectGitHub({
          access_token: tokenResponse.access_token,
          username: userInfo.login,
        });
      }

      return {
        username: userInfo.login,
        avatarUrl: userInfo.avatar_url,
        accessToken: tokenResponse.access_token,
        isLoggedIn,
      };
    },
    onSuccess: (data) => {
      // Store in authStore
      setGitHubConnected(true, data.username, data.isLoggedIn ? undefined : data.accessToken);

      // If not logged in, also store token in sessionStorage to survive page reload
      if (!data.isLoggedIn) {
        storeOAuthToken(data.accessToken);
      }

      if (data.isLoggedIn) {
        queryClient.invalidateQueries({ queryKey: ['githubStatus'] });
        queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      }
    },
  });
}

// Hook to get GitHub connection status
export function useGitHubStatus() {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['githubStatus'],
    queryFn: githubApi.getGitHubStatus,
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to disconnect GitHub
export function useDisconnectGitHub() {
  const queryClient = useQueryClient();
  const { setGitHubConnected } = useAuthStore();

  return useMutation({
    mutationFn: githubApi.disconnectGitHub,
    onSuccess: () => {
      setGitHubConnected(false, null);
      queryClient.invalidateQueries({ queryKey: ['githubStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}
