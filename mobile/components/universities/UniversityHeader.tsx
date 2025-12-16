import { View, Text, Image, TouchableOpacity, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StarRating } from "@/components/reviews";

interface UniversityHeaderProps {
  university: {
    _id: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    images?: { logo?: string; cover?: string };
    rating?: number;
    reviewCount?: number;
    studentCount?: number;
  };
  isJoined?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onShare?: () => void;
  isJoining?: boolean;
}

const UniversityHeader = ({
  university,
  isJoined = false,
  onJoin,
  onLeave,
  onShare,
  isJoining = false,
}: UniversityHeaderProps) => {
  const router = useRouter();

  const location = [university.city, university.state, university.country]
    .filter(Boolean)
    .join(", ");

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    try {
      await Share.share({
        message: `Check out ${university.name} on Academy Hub!`,
        title: university.name,
      });
    } catch (error) {
      // User cancelled
    }
  };

  return (
    <View>
      {/* Cover Image */}
      <View className="h-44 relative">
        {university.images?.cover ? (
          <Image
            source={{ uri: university.images.cover }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={["#6366F1", "#4F46E5", "#4338CA"]}
            className="w-full h-full"
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)"]}
          className="absolute bottom-0 left-0 right-0 h-20"
        />
      </View>

      {/* Content */}
      <View className="px-4 -mt-14">
        <View className="flex-row items-end justify-between">
          {/* Logo */}
          <View className="w-24 h-24 rounded-2xl bg-white shadow-lg items-center justify-center overflow-hidden border-4 border-white">
            {university.images?.logo ? (
              <Image
                source={{ uri: university.images.logo }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="school" size={44} color="#6366F1" />
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center mb-2 gap-2">
            <TouchableOpacity
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View className="mt-3">
          <Text className="text-2xl font-bold text-gray-900">{university.name}</Text>

          {location && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text className="text-gray-500 ml-1 flex-1" numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}

          {/* Quick Stats */}
          <View className="flex-row items-center mt-3 flex-wrap gap-3">
            <TouchableOpacity
              className="flex-row items-center bg-amber-50 px-3 py-2 rounded-lg"
              onPress={() => router.push(`/(tabs)/universities/${university._id}/reviews`)}
            >
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text className="text-amber-700 font-semibold ml-1">
                {(university.rating || 0).toFixed(1)}
              </Text>
              <Text className="text-amber-600 text-sm ml-1">
                ({university.reviewCount || 0})
              </Text>
            </TouchableOpacity>

            {university.studentCount !== undefined && university.studentCount > 0 && (
              <View className="flex-row items-center bg-indigo-50 px-3 py-2 rounded-lg">
                <Ionicons name="people" size={16} color="#6366F1" />
                <Text className="text-indigo-700 font-medium ml-1">
                  {university.studentCount.toLocaleString()} students
                </Text>
              </View>
            )}
          </View>

          {/* Join Button */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                isJoined ? "bg-gray-100" : "bg-indigo-600"
              }`}
              onPress={isJoined ? onLeave : onJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <Text className="text-gray-500 font-semibold">...</Text>
              ) : (
                <>
                  <Ionicons
                    name={isJoined ? "checkmark-circle" : "school-outline"}
                    size={20}
                    color={isJoined ? "#6B7280" : "white"}
                  />
                  <Text
                    className={`font-semibold ml-2 ${
                      isJoined ? "text-gray-700" : "text-white"
                    }`}
                  >
                    {isJoined ? "My University" : "This is my university"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 px-4 rounded-xl bg-amber-500 flex-row items-center justify-center"
              onPress={() => router.push(`/(tabs)/universities/${university._id}/write-review`)}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default UniversityHeader;
