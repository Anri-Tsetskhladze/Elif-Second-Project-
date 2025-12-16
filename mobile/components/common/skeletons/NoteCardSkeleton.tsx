import { View } from "react-native";

interface NoteCardSkeletonProps {
  variant?: "card" | "list" | "compact";
}

const NoteCardSkeleton = ({ variant = "card" }: NoteCardSkeletonProps) => {
  if (variant === "compact") {
    return (
      <View className="flex-row items-center p-3 bg-white rounded-xl mb-2 mx-4">
        <View className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
        <View className="ml-3 flex-1">
          <View className="w-32 h-4 bg-gray-200 rounded mb-1.5 animate-pulse" />
          <View className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
        </View>
        <View className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
      </View>
    );
  }

  if (variant === "list") {
    return (
      <View className="flex-row p-4 bg-white border-b border-gray-100">
        <View className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
        <View className="ml-3 flex-1">
          <View className="w-40 h-4 bg-gray-200 rounded mb-2 animate-pulse" />
          <View className="flex-row mb-2">
            <View className="w-16 h-4 bg-purple-100 rounded animate-pulse" />
            <View className="w-12 h-4 bg-gray-100 rounded ml-2 animate-pulse" />
          </View>
          <View className="flex-row items-center">
            <View className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
            <View className="w-20 h-3 bg-gray-100 rounded ml-2 animate-pulse" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white mx-4 rounded-xl p-4 mb-3">
      {/* File icon & Title */}
      <View className="flex-row">
        <View className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
        <View className="ml-3 flex-1">
          <View className="w-40 h-5 bg-gray-200 rounded mb-2 animate-pulse" />
          <View className="flex-row">
            <View className="w-20 h-5 bg-purple-100 rounded animate-pulse" />
            <View className="w-14 h-5 bg-gray-100 rounded ml-2 animate-pulse" />
          </View>
        </View>
      </View>

      {/* Description */}
      <View className="w-full h-4 bg-gray-100 rounded mt-3 animate-pulse" />
      <View className="w-3/4 h-4 bg-gray-100 rounded mt-1.5 animate-pulse" />

      {/* Author row */}
      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
        <View className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
        <View className="w-24 h-3 bg-gray-100 rounded ml-2 flex-1 animate-pulse" />
        <View className="flex-row">
          <View className="w-10 h-4 bg-gray-100 rounded mr-3 animate-pulse" />
          <View className="w-10 h-4 bg-gray-100 rounded animate-pulse" />
        </View>
      </View>

      {/* University badge */}
      <View className="flex-row items-center mt-2 bg-gray-50 px-2 py-1 rounded self-start">
        <View className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
        <View className="w-24 h-3 bg-gray-200 rounded ml-1 animate-pulse" />
      </View>
    </View>
  );
};

export const NoteCardSkeletonList = ({ count = 3, variant = "card" }: { count?: number; variant?: "card" | "list" | "compact" }) => (
  <View className="pt-2">
    {Array.from({ length: count }).map((_, i) => (
      <NoteCardSkeleton key={i} variant={variant} />
    ))}
  </View>
);

export default NoteCardSkeleton;
