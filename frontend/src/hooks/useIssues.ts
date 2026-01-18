import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { IssueDTO, IssueFilterDTO } from '@/types/api';

// Local storage key for issues cache
const ISSUES_STORAGE_KEY = 'openquest_issues';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CachedIssues {
  data: IssueDTO[];
  timestamp: number;
  filter: IssueFilterDTO;
}

// Generate storage key based on filter params
function getStorageKey(filter: IssueFilterDTO): string {
  const filterKey = JSON.stringify({
    repo_url: filter.repo_url,
    tags: filter.tags?.sort() || [],
    languages: filter.languages?.sort() || [],
    exclude_assigned: filter.exclude_assigned ?? false,
    limit: filter.limit || 20,
  });
  return `${ISSUES_STORAGE_KEY}_${btoa(filterKey)}`;
}

// Load issues from localStorage
function loadFromStorage(filter: IssueFilterDTO): { data: IssueDTO[]; timestamp: number } | null {
  try {
    const key = getStorageKey(filter);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedIssues = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    // Verify filter matches
    const filterMatch = JSON.stringify(parsed.filter) === JSON.stringify(filter);
    if (!filterMatch) {
      return null;
    }

    return { data: parsed.data, timestamp: parsed.timestamp };
  } catch (error) {
    console.warn('Failed to load issues from localStorage:', error);
    return null;
  }
}

// Save issues to localStorage
function saveToStorage(data: IssueDTO[], filter: IssueFilterDTO): void {
  try {
    const key = getStorageKey(filter);
    const cache: CachedIssues = {
      data,
      timestamp: Date.now(),
      filter,
    };
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save issues to localStorage:', error);
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
      if (key.startsWith(ISSUES_STORAGE_KEY)) {
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

// Get issues for a repository
export function useIssues(filter: IssueFilterDTO) {
  // Load cached data from localStorage
  const cached = loadFromStorage(filter);

  return useQuery({
    queryKey: ['issues', filter.repo_url, filter],
    queryFn: async () => {
      const data = await api.post<IssueDTO[]>('/issues/search', filter);
      // Save to localStorage after successful fetch
      saveToStorage(data, filter);
      return data;
    },
    enabled: !!filter.repo_url,
    // Use cached data as initial data for instant load
    initialData: cached?.data,
    // Tell React Query when the initial data was created so it knows if it's stale
    initialDataUpdatedAt: cached ? cached.timestamp : undefined,
    staleTime: 30 * 60 * 1000, // 30 minutes - issues don't change often
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

