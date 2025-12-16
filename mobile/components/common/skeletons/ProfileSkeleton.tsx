import { View } from "react-native";

interface ProfileSkeletonProps {
  showBanner?: boolean;
  showTabs?: boolean;
}

const ProfileSkeleton = ({ showBanner = true, showTabs = true }: ProfileSkeletonProps) => {
  return (
    <View className="bg-white">
      {/* Banner */}
      {showBanner && (
        <View className="h-32 bg-gray-200 animate-pulse" />
      )}

      {/* Profile header */}
      <View className="px-4 pb-4">
        {/* Avatar */}
        <View className={`w-24 h-24 rounded-full bg-gray-300 border-4 border-white ${showBanner ? "-mt-12" : "mt-4"} animate-pulse`} />

        {/* Name & Username */}
        <View className="mt-3">
          <View className="flex-row items-center">
            <View className="w-40 h-6 bg-gray-200 rounded animate-pulse" />
            <View className="w-5 h-5 bg-gray-200 rounded-full ml-2 animate-pulse" />
          </View>
          <View className="w-24 h-4 bg-gray-100 rounded mt-1.5 animate-pulse" />
        </View>

        {/* University badge */}
        <View className="flex-row items-center mt-3 bg-indigo-50 px-3 py-2 rounded-lg self-start">
          <View className="w-6 h-6 rounded-md bg-indigo-100 animate-pulse" />
          <View className="w-32 h-4 bg-indigo-100 rounded ml-2 animate-pulse" />
        </View>

        {/* Major & Year badges */}
        <View className="flex-row mt-3 gap-2">
          <View className="w-28 h-7 bg-gray-100 rounded-lg animate-pulse" />
          <View className="w-20 h-7 bg-gray-100 rounded-lg animate-pulse" />
        </View>

        {/* Bio */}
        <View className="mt-4">
          <View className="w-full h-4 bg-gray-100 rounded animate-pulse" />
          <View className="w-3/4 h-4 bg-gray-100 rounded mt-1.5 animate-pulse" />
        </View>

        {/* Stats row */}
        <View className="flex-row mt-4 pt-4 border-t border-gray-100">
          <View className="flex-1 items-center">
            <View className="w-8 h-6 bg-gray-200 rounded mb-1 animate-pulse" />
            <View className="w-14 h-3 bg-gray-100 rounded animate-pulse" />
          </View>
          <View className="flex-1 items-center">
            <View className="w-8 h-6 bg-gray-200 rounded mb-1 animate-pulse" />
            <View className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
          </View>
          <View className="flex-1 items-center">
            <View className="w-8 h-6 bg-gray-200 rounded mb-1 animate-pulse" />
            <View className="w-14 h-3 bg-gray-100 rounded animate-pulse" />
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row mt-4 gap-3">
          <View className="flex-1 h-11 bg-gray-200 rounded-xl animate-pulse" />
          <View className="w-11 h-11 bg-gray-100 rounded-xl animate-pulse" />
        </View>
      </View>

      {/* Tabs */}
      {showTabs && (
        <View className="flex-row border-t border-gray-100">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-1 py-4 items-center">
              <View className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
            </View>
          ))}
        </View>
      )}

      {/* Tab content skeleton */}
      <View className="p-4">
        {[1, 2].map((i) => (
          <View key={i} className="bg-gray-50 rounded-xl p-4 mb-3">
            <View className="w-full h-4 bg-gray-200 rounded mb-2 animate-pulse" />
            <View className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProfileSkeleton;
