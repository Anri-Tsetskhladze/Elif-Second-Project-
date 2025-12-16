import { View } from "react-native";

interface UniversityCardSkeletonProps {
  variant?: "card" | "list" | "compact";
}

const UniversityCardSkeleton = ({ variant = "card" }: UniversityCardSkeletonProps) => {
  if (variant === "compact") {
    return (
      <View className="flex-row items-center p-3 bg-white rounded-xl mb-2 mx-4">
        <View className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
        <View className="ml-3 flex-1">
          <View className="w-32 h-4 bg-gray-200 rounded mb-1.5 animate-pulse" />
          <View className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
        </View>
        <View className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
      </View>
    );
  }

  if (variant === "list") {
    return (
      <View className="flex-row p-4 bg-white border-b border-gray-100">
        <View className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse" />
        <View className="ml-4 flex-1">
          <View className="w-40 h-5 bg-gray-200 rounded mb-2 animate-pulse" />
          <View className="w-32 h-3 bg-gray-100 rounded mb-2 animate-pulse" />
          <View className="flex-row">
            <View className="w-12 h-4 bg-gray-100 rounded mr-2 animate-pulse" />
            <View className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl overflow-hidden mx-4 mb-4 shadow-sm">
      {/* Banner */}
      <View className="h-32 bg-gray-200 animate-pulse" />

      {/* Content */}
      <View className="p-4">
        {/* Logo & Name */}
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-xl bg-gray-200 -mt-10 border-2 border-white animate-pulse" />
          <View className="ml-3 flex-1">
            <View className="w-40 h-5 bg-gray-200 rounded mb-1.5 animate-pulse" />
            <View className="w-32 h-3 bg-gray-100 rounded animate-pulse" />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row mt-4 pt-3 border-t border-gray-100">
          <View className="flex-1 items-center">
            <View className="w-8 h-5 bg-gray-200 rounded mb-1 animate-pulse" />
            <View className="w-12 h-3 bg-gray-100 rounded animate-pulse" />
          </View>
          <View className="flex-1 items-center">
            <View className="w-10 h-5 bg-gray-200 rounded mb-1 animate-pulse" />
            <View className="w-14 h-3 bg-gray-100 rounded animate-pulse" />
          </View>
          <View className="flex-1 items-center">
            <View className="w-8 h-5 bg-gray-200 rounded mb-1 animate-pulse" />
            <View className="w-10 h-3 bg-gray-100 rounded animate-pulse" />
          </View>
        </View>
      </View>
    </View>
  );
};

export const UniversityCardSkeletonList = ({ count = 3, variant = "card" }: { count?: number; variant?: "card" | "list" | "compact" }) => (
  <View className="pt-2">
    {Array.from({ length: count }).map((_, i) => (
      <UniversityCardSkeleton key={i} variant={variant} />
    ))}
  </View>
);

export default UniversityCardSkeleton;
