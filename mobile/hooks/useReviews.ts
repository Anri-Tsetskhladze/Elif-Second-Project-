import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient, reviewApi } from "../utils/api";
import { Review, ReviewStats } from "../types";

export const useUniversityReviews = (
  universityId: string,
  params?: { rating?: number; sortBy?: string }
) => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["reviews", "university", universityId, params],
    queryFn: ({ pageParam = 1 }) =>
      reviewApi.getByUniversity(api, universityId, {
        ...params,
        page: pageParam,
        limit: 10,
      }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!universityId,
  });

  const reviews = query.data?.pages.flatMap((page) => page.data.reviews) || [];
  const stats = query.data?.pages[0]?.data.stats as ReviewStats | null;

  return {
    reviews: reviews as Review[],
    stats,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};

export const useUserReviews = (userId: string) => {
  const api = useApiClient();

  const query = useInfiniteQuery({
    queryKey: ["reviews", "user", userId],
    queryFn: ({ pageParam = 1 }) =>
      reviewApi.getByUser(api, userId, { page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
  });

  const reviews = query.data?.pages.flatMap((page) => page.data.reviews) || [];

  return {
    reviews: reviews as Review[],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
};

export const useReview = (reviewId: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["review", reviewId],
    queryFn: () => reviewApi.getById(api, reviewId),
    select: (response) => response.data.review as Review,
    enabled: !!reviewId,
  });
};

export const useMyReview = (universityId: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["myReview", universityId],
    queryFn: () => reviewApi.getMyReview(api, universityId),
    select: (response) => ({
      review: response.data.review as Review | null,
      hasReviewed: response.data.hasReviewed as boolean,
    }),
    enabled: !!universityId,
  });
};

export const useReviewActions = (universityId?: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const createReview = useMutation({
    mutationFn: (data: {
      universityId: string;
      overallRating: number;
      title?: string;
      content?: string;
      categoryRatings?: Record<string, number>;
      pros?: string[];
      cons?: string[];
      isAnonymous?: boolean;
    }) => reviewApi.create(api, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "university", variables.universityId] });
      queryClient.invalidateQueries({ queryKey: ["myReview", variables.universityId] });
      queryClient.invalidateQueries({ queryKey: ["university", variables.universityId] });
    },
  });

  const updateReview = useMutation({
    mutationFn: ({ reviewId, data }: {
      reviewId: string;
      data: {
        overallRating?: number;
        title?: string;
        content?: string;
        categoryRatings?: Record<string, number>;
        pros?: string[];
        cons?: string[];
        isAnonymous?: boolean;
      };
    }) => reviewApi.update(api, reviewId, data),
    onSuccess: () => {
      if (universityId) {
        queryClient.invalidateQueries({ queryKey: ["reviews", "university", universityId] });
        queryClient.invalidateQueries({ queryKey: ["myReview", universityId] });
      }
    },
  });

  const deleteReview = useMutation({
    mutationFn: (reviewId: string) => reviewApi.delete(api, reviewId),
    onSuccess: () => {
      if (universityId) {
        queryClient.invalidateQueries({ queryKey: ["reviews", "university", universityId] });
        queryClient.invalidateQueries({ queryKey: ["myReview", universityId] });
        queryClient.invalidateQueries({ queryKey: ["university", universityId] });
      }
    },
  });

  const markHelpful = useMutation({
    mutationFn: (reviewId: string) => reviewApi.markHelpful(api, reviewId),
    onSuccess: () => {
      if (universityId) {
        queryClient.invalidateQueries({ queryKey: ["reviews", "university", universityId] });
      }
    },
  });

  const reportReview = useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason?: string }) =>
      reviewApi.report(api, reviewId, reason),
  });

  return {
    createReview: createReview.mutateAsync,
    updateReview: updateReview.mutateAsync,
    deleteReview: deleteReview.mutate,
    markHelpful: markHelpful.mutate,
    reportReview: reportReview.mutate,
    isCreating: createReview.isPending,
    isUpdating: updateReview.isPending,
  };
};
