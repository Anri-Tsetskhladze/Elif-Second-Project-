import { View } from "react-native";

interface PostCardSkeletonProps {
  showImage?: boolean;
}

const PostCardSkeleton = ({ showImage = false }: PostCardSkeletonProps) => {
  return (
    <View className="bg-white mx-4 rounded-xl p-4 mb-3">
      {/* Author row */}
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <View className="ml-3 flex-1">
          <View className="w-28 h-4 bg-gray-200 rounded mb-1.5 animate-pulse" />
          <View className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
        </View>
        <View className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
      </View>

      {/* Category badge */}
      <View className="w-16 h-5 bg-gray-100 rounded-full mb-3 animate-pulse" />

      {/* Content */}
      <View className="w-full h-5 bg-gray-200 rounded mb-2 animate-pulse" />
      <View className="w-11/12 h-4 bg-gray-200 rounded mb-2 animate-pulse" />
      <View className="w-3/4 h-4 bg-gray-100 rounded mb-2 animate-pulse" />

      {/* Image placeholder */}
      {showImage && (
        <View className="w-full h-48 bg-gray-200 rounded-xl mt-3 animate-pulse" />
      )}

      {/* Actions row */}
      <View className="flex-row mt-4 pt-3 border-t border-gray-50">
        <View className="flex-row items-center mr-4">
          <View className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
          <View className="w-6 h-4 bg-gray-100 rounded ml-1.5 animate-pulse" />
        </View>
        <View className="flex-row items-center mr-4">
          <View className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
          <View className="w-6 h-4 bg-gray-100 rounded ml-1.5 animate-pulse" />
        </View>
        <View className="flex-row items-center">
          <View className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
          <View className="w-6 h-4 bg-gray-100 rounded ml-1.5 animate-pulse" />
        </View>
        <View className="flex-1" />
        <View className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
      </View>
    </View>
  );
};

export const PostCardSkeletonList = ({ count = 3 }: { count?: number }) => (
  <View className="pt-2">
    {Array.from({ length: count }).map((_, i) => (
      <PostCardSkeleton key={i} showImage={i === 0} />
    ))}
  </View>
);

export default PostCardSkeleton;
