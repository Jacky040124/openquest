import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { GitHubStatusDTO, GitHubAuthorizeResponse } from '@/types/api';

/**
 * Hook to check GitHub connection status
 */
export const useGitHubStatus = () => {
  return useQuery<GitHubStatusDTO>({
    queryKey: ['github-status'],
    queryFn: () => api.get<GitHubStatusDTO>('/auth/me/github'),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to initiate GitHub OAuth authorization
 * Stores the current URL so we can redirect back after OAuth completes
 */
export const useGitHubAuthorize = () => {
  return useMutation({
    mutationFn: async () => {
      // Store current location to redirect back after OAuth
      const returnUrl = window.location.pathname + window.location.search;
      localStorage.setItem('github_oauth_return_url', returnUrl);

      const response = await api.get<GitHubAuthorizeResponse>('/oauth/github/authorize');
      // Redirect to GitHub OAuth page
      window.location.href = response.authorize_url;
      return response;
    },
  });
};

/**
 * Hook to handle GitHub OAuth callback
 */
export const useGitHubCallback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      const response = await api.post<{ username: string; isLoggedIn: boolean }>(
        '/oauth/github/callback',
        { code, state }
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate GitHub status to refetch
      queryClient.invalidateQueries({ queryKey: ['github-status'] });
    },
  });
};

/**
 * Hook to disconnect GitHub account
 */
export const useDisconnectGitHub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete('/auth/me/github');
    },
    onSuccess: () => {
      // Invalidate GitHub status to refetch
      queryClient.invalidateQueries({ queryKey: ['github-status'] });
    },
  });
};
