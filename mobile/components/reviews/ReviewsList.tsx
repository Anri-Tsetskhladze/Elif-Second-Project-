import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Review, ReviewStats } from "@/types";
import ReviewCard from "./ReviewCard";
import StarRating from "./StarRating";

interface ReviewsListProps {
  reviews: Review[];
  stats?: ReviewStats | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasNextPage?: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onHelpful: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
  onWriteReview?: () => void;
  hasReviewed?: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  ratingFilter: number | null;
  onRatingFilter: (rating: number | null) => void;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "helpful", label: "Most Helpful" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

const RatingFilterTab = ({
  rating,
  count,
  isSelected,
  onPress,
}: {
  rating: number | null;
  count?: number;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className={`px-3 py-2 rounded-full mr-2 ${isSelected ? "bg-amber-100" : "bg-gray-100"}`}
    onPress={onPress}
  >
    <View className="flex-row items-center">
      {rating !== null ? (
        <>
          <Text className={`font-medium ${isSelected ? "text-amber-700" : "text-gray-600"}`}>
            {rating}
          </Text>
          <Ionicons
            name="star"
            size={12}
            color={isSelected ? "#B45309" : "#6B7280"}
            style={{ marginLeft: 2 }}
          />
        </>
      ) : (
        <Text className={`font-medium ${isSelected ? "text-amber-700" : "text-gray-600"}`}>
          All
        </Text>
      )}
      {count !== undefined && (
        <Text className={`ml-1 text-xs ${isSelected ? "text-amber-600" : "text-gray-400"}`}>
          ({count})
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

const StatsHeader = ({ stats }: { stats: ReviewStats }) => {
  const totalRatings = stats.rating1 + stats.rating2 + stats.rating3 + stats.rating4 + stats.rating5;

  return (
    <View className="bg-white p-4 border-b border-gray-100">
      <View className="flex-row items-center mb-4">
        <View className="items-center mr-6">
          <Text className="text-4xl font-bold text-gray-900">
            {stats.avgOverall?.toFixed(1) || "0.0"}
          </Text>
          <StarRating value={stats.avgOverall || 0} size={16} readonly />
          <Text className="text-gray-500 text-sm mt-1">
            {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
          </Text>
        </View>

        <View className="flex-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats[`rating${rating}` as keyof ReviewStats] as number;
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            return (
              <View key={rating} className="flex-row items-center mb-1">
                <Text className="text-gray-500 text-xs w-4">{rating}</Text>
                <Ionicons name="star" size={10} color="#F59E0B" style={{ marginLeft: 2 }} />
                <View className="flex-1 h-2 bg-gray-200 rounded-full mx-2 overflow-hidden">
                  <View
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </View>
                <Text className="text-gray-400 text-xs w-6">{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const ReviewsList = ({
  reviews,
  stats,
  isLoading,
  isRefreshing,
  hasNextPage,
  onRefresh,
  onLoadMore,
  onHelpful,
  onReport,
  onWriteReview,
  hasReviewed,
  sortBy,
  onSortChange,
  ratingFilter,
  onRatingFilter,
}: ReviewsListProps) => {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const renderHeader = useCallback(() => (
    <View>
      {stats && <StatsHeader stats={stats} />}

      {/* Write Review CTA */}
      {onWriteReview && !hasReviewed && (
        <TouchableOpacity
          className="mx-4 my-3 bg-indigo-600 py-3 rounded-xl flex-row items-center justify-center"
          onPress={onWriteReview}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Write a Review</Text>
        </TouchableOpacity>
      )}

      {/* Rating Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2 border-b border-gray-100"
      >
        <RatingFilterTab
          rating={null}
          count={stats?.totalReviews}
          isSelected={ratingFilter === null}
          onPress={() => onRatingFilter(null)}
        />
        {[5, 4, 3, 2, 1].map((rating) => (
          <RatingFilterTab
            key={rating}
            rating={rating}
            count={stats?.[`rating${rating}` as keyof ReviewStats] as number}
            isSelected={ratingFilter === rating}
            onPress={() => onRatingFilter(rating)}
          />
        ))}
      </ScrollView>

      {/* Sort */}
      <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50">
        <Text className="text-gray-500 text-sm">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </Text>
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text className="text-gray-700 text-sm mr-1">
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View className="absolute right-4 top-full z-10 bg-white rounded-lg shadow-lg border border-gray-200">
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`px-4 py-2 ${sortBy === option.value ? "bg-gray-100" : ""}`}
              onPress={() => {
                onSortChange(option.value);
                setShowSortMenu(false);
              }}
            >
              <Text className={sortBy === option.value ? "text-indigo-600 font-medium" : "text-gray-700"}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  ), [stats, hasReviewed, onWriteReview, ratingFilter, onRatingFilter, sortBy, showSortMenu, reviews.length, onSortChange]);

  const renderEmpty = useCallback(() => (
    <View className="py-16 items-center">
      <Ionicons name="chatbubble-ellipses-outline" size={64} color="#D1D5DB" />
      <Text className="text-gray-400 text-lg mt-4">No reviews yet</Text>
      <Text className="text-gray-400 text-sm mt-1">Be the first to share your experience!</Text>
      {onWriteReview && !hasReviewed && (
        <TouchableOpacity
          className="bg-indigo-600 px-6 py-3 rounded-full mt-6"
          onPress={onWriteReview}
        >
          <Text className="text-white font-medium">Write a Review</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [hasReviewed, onWriteReview]);

  const renderFooter = useCallback(() => {
    if (!hasNextPage) return <View className="h-20" />;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }, [hasNextPage]);

  const renderItem = useCallback(({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      onHelpful={onHelpful}
      onReport={onReport}
    />
  ), [onHelpful, onReport]);

  if (isLoading && reviews.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing || false}
          onRefresh={onRefresh}
          tintColor="#6366F1"
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ReviewsList;
