import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient, forumApi } from "../utils/api";
import { ForumPost, Category } from "../types";

export const useCategories = () => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["categories"],
    queryFn: () => forumApi.getCategories(api),
    select: (response) => response.data.categories as Category[],
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useFeed = (params?: {
  category?: string;
  university?: string;
  sortBy?: "newest" | "popular" | "unanswered";
  following?: boolean;
}) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["feed", params],
    queryFn: ({ pageParam = 1 }) =>
      forumApi.getFeed(api, { ...params, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const posts = query.data?.pages.flatMap((page) => page.data.posts) || [];

  return {
    posts,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

export const usePost = (postId: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => forumApi.getPost(api, postId),
    select: (response) => response.data.post as ForumPost,
    enabled: !!postId,
  });
};

export const useReplies = (postId: string, sortBy?: "oldest" | "newest" | "popular") => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["replies", postId, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      forumApi.getReplies(api, postId, { page: pageParam, limit: 20, sortBy }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!postId,
  });

  const replies = query.data?.pages.flatMap((page) => page.data.replies) || [];

  return {
    replies,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
};

export const useForumActions = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const toggleLike = useMutation({
    mutationFn: (postId: string) => forumApi.toggleLike(api, postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
  });

  const toggleBookmark = useMutation({
    mutationFn: (postId: string) => forumApi.toggleBookmark(api, postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const createPost = useMutation({
    mutationFn: (data: FormData) => forumApi.createPost(api, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const createReply = useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: FormData }) =>
      forumApi.createReply(api, postId, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const deletePost = useMutation({
    mutationFn: (postId: string) => forumApi.deletePost(api, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const acceptAnswer = useMutation({
    mutationFn: ({ postId, replyId }: { postId: string; replyId: string }) =>
      forumApi.acceptAnswer(api, postId, replyId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["replies", postId] });
    },
  });

  return {
    toggleLike: toggleLike.mutate,
    toggleBookmark: toggleBookmark.mutate,
    createPost: createPost.mutateAsync,
    createReply: createReply.mutateAsync,
    deletePost: deletePost.mutate,
    acceptAnswer: acceptAnswer.mutate,
    isCreatingPost: createPost.isPending,
    isCreatingReply: createReply.isPending,
  };
};

export const useTrending = (university?: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["trending", university],
    queryFn: () => forumApi.getTrending(api, { university, limit: 10 }),
    select: (response) => response.data.posts as ForumPost[],
  });
};

export const useUnanswered = (university?: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["unanswered", university],
    queryFn: () => forumApi.getUnanswered(api, { university, limit: 10 }),
    select: (response) => response.data.posts as ForumPost[],
  });
};

export const usePopularTags = (university?: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["popularTags", university],
    queryFn: () => forumApi.getPopularTags(api, { university, limit: 20 }),
    select: (response) => response.data.tags as { _id: string; count: number }[],
  });
};

export const useSearch = (query: string, params?: { category?: string; university?: string }) => {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: ["search", query, params],
    queryFn: ({ pageParam = 1 }) =>
      forumApi.search(api, { q: query, ...params, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: query.length >= 2,
  });
};
