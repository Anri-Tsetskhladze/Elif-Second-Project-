import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, searchApi } from "@/utils/api";
import {
  GlobalSearchResults,
  SearchSuggestion,
  UniversitySearchResult,
  UserSearchResult,
  PostSearchResult,
  NoteSearchResult,
  ReviewSearchResult,
  PaginationInfo,
} from "@/types";

// Global search hook
export const useGlobalSearch = (query: string, type?: string, limit?: number) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["search", "global", query, type, limit],
    queryFn: async () => {
      const response = await searchApi.globalSearch(api, {
        q: query,
        type: type as any,
        limit,
      });
      return response.data as GlobalSearchResults;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

// Search universities with pagination
export const useSearchUniversities = (query: string, sortBy?: string) => {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: ["search", "universities", query, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchApi.searchUniversities(api, {
        q: query,
        page: pageParam,
        limit: 20,
        sortBy: sortBy as any,
      });
      return response.data as {
        query: string;
        universities: UniversitySearchResult[];
        pagination: PaginationInfo;
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

// Search users with pagination
export const useSearchUsers = (query: string) => {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: ["search", "users", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchApi.searchUsers(api, {
        q: query,
        page: pageParam,
        limit: 20,
      });
      return response.data as {
        query: string;
        users: UserSearchResult[];
        pagination: PaginationInfo;
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

// Search posts with pagination
export const useSearchPosts = (
  query: string,
  options?: { category?: string; universityId?: string; sortBy?: string }
) => {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: ["search", "posts", query, options],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchApi.searchPosts(api, {
        q: query,
        page: pageParam,
        limit: 20,
        ...options,
      } as any);
      return response.data as {
        query: string;
        posts: PostSearchResult[];
        pagination: PaginationInfo;
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

// Search notes with pagination
export const useSearchNotes = (
  query: string,
  options?: { universityId?: string; subject?: string; noteType?: string; sortBy?: string }
) => {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: ["search", "notes", query, options],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchApi.searchNotes(api, {
        q: query,
        page: pageParam,
        limit: 20,
        ...options,
      } as any);
      return response.data as {
        query: string;
        notes: NoteSearchResult[];
        pagination: PaginationInfo;
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

// Search reviews with pagination
export const useSearchReviews = (
  query: string,
  options?: { universityId?: string; minRating?: number }
) => {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: ["search", "reviews", query, options],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchApi.searchReviews(api, {
        q: query,
        page: pageParam,
        limit: 20,
        ...options,
      });
      return response.data as {
        query: string;
        reviews: ReviewSearchResult[];
        pagination: PaginationInfo;
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

// Search suggestions hook
export const useSearchSuggestions = (query: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["search", "suggestions", query],
    queryFn: async () => {
      const response = await searchApi.getSuggestions(api, query);
      return response.data.suggestions as SearchSuggestion[];
    },
    enabled: query.length >= 2,
    staleTime: 60000,
  });
};

// Recent searches hook
export const useRecentSearches = (limit?: number) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["search", "recent", limit],
    queryFn: async () => {
      const response = await searchApi.getRecentSearches(api, limit);
      return response.data.searches as string[];
    },
    staleTime: 30000,
  });
};

// Popular searches hook
export const usePopularSearches = (limit?: number) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["search", "popular", limit],
    queryFn: async () => {
      const response = await searchApi.getPopularSearches(api, limit);
      return response.data.searches as string[];
    },
    staleTime: 300000,
  });
};

// Clear search history mutation
export const useClearSearchHistory = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => searchApi.clearSearchHistory(api),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "recent"] });
    },
  });
};
