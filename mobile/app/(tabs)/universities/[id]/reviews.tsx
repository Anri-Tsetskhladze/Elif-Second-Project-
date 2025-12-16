import { useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUniversityReviews, useMyReview, useReviewActions } from "@/hooks/useReviews";
import { ReviewsList } from "@/components/reviews";

const UniversityReviewsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [sortBy, setSortBy] = useState("newest");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const {
    reviews,
    stats,
    isLoading,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useUniversityReviews(id, { sortBy, rating: ratingFilter || undefined });

  const { data: myReviewData } = useMyReview(id);
  const { markHelpful, reportReview } = useReviewActions(id);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  const handleWriteReview = () => {
    router.push(`/(tabs)/universities/${id}/write-review`);
  };

  const handleHelpful = (reviewId: string) => {
    markHelpful(reviewId);
  };

  const handleReport = (reviewId: string) => {
    reportReview({ reviewId, reason: "Inappropriate content" });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleWriteReview}>
              <Ionicons name="create-outline" size={24} color="#6366F1" />
            </TouchableOpacity>
          ),
        }}
      />

      <ReviewsList
        reviews={reviews}
        stats={stats}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        hasNextPage={hasNextPage}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        onHelpful={handleHelpful}
        onReport={handleReport}
        onWriteReview={handleWriteReview}
        hasReviewed={myReviewData?.hasReviewed}
        sortBy={sortBy}
        onSortChange={setSortBy}
        ratingFilter={ratingFilter}
        onRatingFilter={setRatingFilter}
      />
    </SafeAreaView>
  );
};

export default UniversityReviewsScreen;
