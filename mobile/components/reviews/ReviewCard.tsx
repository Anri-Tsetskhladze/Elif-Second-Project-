import { useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Review } from "@/types";
import { formatDistanceToNow } from "date-fns";
import StarRating from "./StarRating";
import RatingBreakdown from "./RatingBreakdown";

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  showUniversity?: boolean;
}

const ReviewCard = ({
  review,
  onHelpful,
  onReport,
  showUniversity = false,
}: ReviewCardProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const authorName = "isAnonymous" in review.author && review.author.isAnonymous
    ? "Anonymous Student"
    : "fullName" in review.author
      ? review.author.fullName || review.author.username
      : review.author.username;

  const authorImg = "isAnonymous" in review.author && review.author.isAnonymous
    ? null
    : "profilePicture" in review.author
      ? review.author.profilePicture || review.author.profileImg
      : null;

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  const handleReport = () => {
    Alert.alert(
      "Report Review",
      "Are you sure you want to report this review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => onReport?.(review._id),
        },
      ]
    );
  };

  const hasCategoryRatings = review.categoryRatings &&
    Object.values(review.categoryRatings).some(v => v != null);

  return (
    <View className="bg-white p-4 border-b border-gray-100">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          {authorImg && authorImg.length > 0 ? (
            <Image
              source={{ uri: authorImg }}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900">{authorName}</Text>
              {"isVerifiedStudent" in review.author && review.author.isVerifiedStudent && (
                <Ionicons name="checkmark-circle" size={14} color="#6366F1" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text className="text-gray-500 text-sm">{timeAgo}</Text>
          </View>
        </View>

        {/* Rating */}
        <View className="items-end">
          <StarRating value={review.overallRating} size={16} readonly />
          <Text className="text-amber-600 font-semibold mt-1">
            {review.overallRating.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* University (optional) */}
      {showUniversity && review.university && (
        <View className="flex-row items-center mb-3 bg-gray-50 p-2 rounded-lg">
          {review.university.images?.logo && (
            <Image
              source={{ uri: review.university.images.logo }}
              className="w-8 h-8 rounded mr-2"
            />
          )}
          <View className="flex-1">
            <Text className="font-medium text-gray-900" numberOfLines={1}>
              {review.university.name}
            </Text>
            {(review.university.city || review.university.state) && (
              <Text className="text-gray-500 text-xs">
                {[review.university.city, review.university.state].filter(Boolean).join(", ")}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Title */}
      {review.title && (
        <Text className="font-semibold text-gray-900 text-base mb-2">
          {review.title}
        </Text>
      )}

      {/* Content */}
      {review.content && (
        <Text className="text-gray-700 leading-5 mb-3">{review.content}</Text>
      )}

      {/* Category Ratings Toggle */}
      {hasCategoryRatings && (
        <TouchableOpacity
          className="flex-row items-center mb-3"
          onPress={() => setShowBreakdown(!showBreakdown)}
        >
          <Ionicons
            name={showBreakdown ? "chevron-up" : "chevron-down"}
            size={16}
            color="#6366F1"
          />
          <Text className="text-indigo-600 text-sm ml-1">
            {showBreakdown ? "Hide" : "Show"} category ratings
          </Text>
        </TouchableOpacity>
      )}

      {showBreakdown && review.categoryRatings && (
        <RatingBreakdown ratings={review.categoryRatings} />
      )}

      {/* Pros */}
      {review.pros && review.pros.length > 0 && (
        <View className="mb-3">
          <Text className="text-green-700 font-medium text-sm mb-1">Pros</Text>
          {review.pros.map((pro, idx) => (
            <View key={idx} className="flex-row items-start mb-1">
              <Ionicons name="add-circle" size={14} color="#16A34A" style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm ml-2 flex-1">{pro}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cons */}
      {review.cons && review.cons.length > 0 && (
        <View className="mb-3">
          <Text className="text-red-700 font-medium text-sm mb-1">Cons</Text>
          {review.cons.map((con, idx) => (
            <View key={idx} className="flex-row items-start mb-1">
              <Ionicons name="remove-circle" size={14} color="#DC2626" style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm ml-2 flex-1">{con}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => onHelpful?.(review._id)}
        >
          <Ionicons
            name={review.isHelpful ? "thumbs-up" : "thumbs-up-outline"}
            size={18}
            color={review.isHelpful ? "#6366F1" : "#6B7280"}
          />
          <Text className={`ml-2 text-sm ${review.isHelpful ? "text-indigo-600" : "text-gray-500"}`}>
            Helpful ({review.helpfulCount})
          </Text>
        </TouchableOpacity>

        {!review.isOwn && onReport && (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleReport}
          >
            <Ionicons name="flag-outline" size={16} color="#9CA3AF" />
            <Text className="text-gray-400 text-sm ml-1">Report</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ReviewCard;
