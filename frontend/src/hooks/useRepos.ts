import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { RepoDTO, RepoRecommendQueryDTO } from '@/types/api';

// API functions
const repoApi = {
  getRecommendations: (params?: RepoRecommendQueryDTO) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.min_stars) searchParams.append('min_stars', params.min_stars.toString());
    if (params?.max_stars) searchParams.append('max_stars', params.max_stars.toString());

    const query = searchParams.toString();
    return api.get<RepoDTO[]>(`/repos/recommend${query ? `?${query}` : ''}`);
  },

  getRepo: (owner: string, repo: string) =>
    api.get<RepoDTO>(`/repos/${owner}/${repo}`),
};

// Get recommended repositories
export function useRecommendations(params?: RepoRecommendQueryDTO) {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['recommendations', params],
    queryFn: () => repoApi.getRecommendations(params),
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get a specific repository
export function useRepo(owner: string, repo: string) {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['repo', owner, repo],
    queryFn: () => repoApi.getRepo(owner, repo),
    enabled: isLoggedIn && !!owner && !!repo,
  });
}
