import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { GitHubStatusDTO, GitHubAuthorizeResponse } from '@/types/api';

/**
 * Hook to check GitHub connection status
 */
export const useGitHubStatus = () => {
  return useQuery<GitHubStatusDTO>({
    queryKey: ['github-status'],
    queryFn: () => api.get<GitHubStatusDTO>('/auth/me/github/status'),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to initiate GitHub OAuth authorization
 */
export const useGitHubAuthorize = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<GitHubAuthorizeResponse>('/auth/github/authorize');
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
        '/auth/github/callback',
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
      await api.delete('/auth/me/github/disconnect');
    },
    onSuccess: () => {
      // Invalidate GitHub status to refetch
      queryClient.invalidateQueries({ queryKey: ['github-status'] });
    },
  });
};
