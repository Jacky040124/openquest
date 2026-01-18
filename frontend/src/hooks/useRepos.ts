import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { RepoDTO, RepoRecommendQueryDTO } from '@/types/api';

// Local storage key for recommendations cache
const RECOMMENDATIONS_STORAGE_KEY = 'openquest_recommendations';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CachedRecommendations {
  data: RepoDTO[];
  timestamp: number;
  params: RepoRecommendQueryDTO | undefined;
}

// Generate storage key based on params
function getStorageKey(params?: RepoRecommendQueryDTO): string {
  const paramsKey = params
    ? JSON.stringify({
        limit: params.limit,
        min_stars: params.min_stars,
        max_stars: params.max_stars,
      })
    : 'default';
  return `${RECOMMENDATIONS_STORAGE_KEY}_${paramsKey}`;
}

// Load recommendations from localStorage
function loadFromStorage(params?: RepoRecommendQueryDTO): { data: RepoDTO[]; timestamp: number } | null {
  try {
    const key = getStorageKey(params);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedRecommendations = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    // Verify params match
    const paramsMatch = JSON.stringify(parsed.params) === JSON.stringify(params);
    if (!paramsMatch) {
      return null;
    }

    return { data: parsed.data, timestamp: parsed.timestamp };
  } catch (error) {
    console.warn('Failed to load recommendations from localStorage:', error);
    return null;
  }
}

// Save recommendations to localStorage
function saveToStorage(data: RepoDTO[], params?: RepoRecommendQueryDTO): void {
  try {
    const key = getStorageKey(params);
    const cache: CachedRecommendations = {
      data,
      timestamp: Date.now(),
      params,
    };
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save recommendations to localStorage:', error);
    // Handle quota exceeded error gracefully
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Clear old cache entries if storage is full
      clearOldCacheEntries();
    }
  }
}

// Clear old cache entries to free up space
function clearOldCacheEntries(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    keys.forEach((key) => {
      if (key.startsWith(RECOMMENDATIONS_STORAGE_KEY)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key) || '{}');
          if (now - cached.timestamp > CACHE_EXPIRY_MS) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to clear old cache entries:', error);
  }
}

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

  // Load cached data from localStorage
  const cached = loadFromStorage(params);

  return useQuery({
    queryKey: ['recommendations', params],
    queryFn: async () => {
      const data = await repoApi.getRecommendations(params);
      // Save to localStorage after successful fetch
      saveToStorage(data, params);
      return data;
    },
    enabled: isLoggedIn,
    // Use cached data as initial data for instant load
    // This shows cached data immediately while React Query manages freshness
    initialData: cached?.data,
    // Tell React Query when the initial data was created so it knows if it's stale
    initialDataUpdatedAt: cached ? cached.timestamp : undefined,
    staleTime: 30 * 60 * 1000, // 30 minutes - recommendations don't change often
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    // Only refetch if data is stale (older than staleTime)
    refetchOnMount: (query) => {
      // Refetch only if data is stale (older than staleTime)
      if (!query.state.dataUpdatedAt) return true; // No data yet, fetch it
      const age = Date.now() - query.state.dataUpdatedAt;
      return age > 30 * 60 * 1000; // Refetch if older than 30 minutes
    },
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnReconnect: false, // Don't refetch on reconnect
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
