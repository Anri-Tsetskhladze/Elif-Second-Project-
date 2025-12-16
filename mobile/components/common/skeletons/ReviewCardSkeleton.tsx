import { View } from "react-native";

interface ReviewCardSkeletonProps {
  showUniversity?: boolean;
}

const ReviewCardSkeleton = ({ showUniversity = false }: ReviewCardSkeletonProps) => {
  return (
    <View className="bg-white mx-4 rounded-xl p-4 mb-3">
      {/* Author & Rating row */}
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <View className="ml-3 flex-1">
          <View className="w-24 h-4 bg-gray-200 rounded mb-1.5 animate-pulse" />
          <View className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
        </View>
        {/* Star rating */}
        <View className="flex-row">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="w-4 h-4 bg-gray-200 rounded mr-0.5 animate-pulse" />
          ))}
        </View>
      </View>

      {/* University badge */}
      {showUniversity && (
        <View className="flex-row items-center mb-3 bg-gray-50 p-2 rounded-lg">
          <View className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
          <View className="w-28 h-4 bg-gray-200 rounded ml-2 animate-pulse" />
        </View>
      )}

      {/* Title */}
      <View className="w-3/4 h-5 bg-gray-200 rounded mb-3 animate-pulse" />

      {/* Content */}
      <View className="w-full h-4 bg-gray-100 rounded mb-2 animate-pulse" />
      <View className="w-11/12 h-4 bg-gray-100 rounded mb-2 animate-pulse" />
      <View className="w-2/3 h-4 bg-gray-100 rounded mb-3 animate-pulse" />

      {/* Rating categories */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row items-center bg-gray-50 px-2 py-1 rounded">
            <View className="w-14 h-3 bg-gray-200 rounded animate-pulse" />
            <View className="w-6 h-3 bg-gray-100 rounded ml-1 animate-pulse" />
          </View>
        ))}
      </View>

      {/* Actions row */}
      <View className="flex-row pt-3 border-t border-gray-50">
        <View className="flex-row items-center mr-4">
          <View className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
          <View className="w-8 h-4 bg-gray-100 rounded ml-1.5 animate-pulse" />
        </View>
        <View className="flex-row items-center">
          <View className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
          <View className="w-8 h-4 bg-gray-100 rounded ml-1.5 animate-pulse" />
        </View>
      </View>
    </View>
  );
};

export const ReviewCardSkeletonList = ({ count = 3, showUniversity = false }: { count?: number; showUniversity?: boolean }) => (
  <View className="pt-2">
    {Array.from({ length: count }).map((_, i) => (
      <ReviewCardSkeleton key={i} showUniversity={showUniversity} />
    ))}
  </View>
);

export default ReviewCardSkeleton;
