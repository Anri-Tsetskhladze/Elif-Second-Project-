import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StarRating } from "@/components/reviews";

interface UniversityCardProps {
  university: {
    _id: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    images?: { logo?: string };
    rating?: number;
    reviewCount?: number;
    studentCount?: number;
  };
  variant?: "list" | "grid";
  onPress?: () => void;
}

const UniversityCard = ({ university, variant = "list", onPress }: UniversityCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/universities/${university._id}`);
    }
  };

  const location = [university.city, university.state].filter(Boolean).join(", ");

  if (variant === "grid") {
    return (
      <TouchableOpacity
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 m-1.5"
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View className="p-4 items-center">
          <View className="w-16 h-16 rounded-xl bg-indigo-50 items-center justify-center overflow-hidden mb-3">
            {university.images?.logo ? (
              <Image
                source={{ uri: university.images.logo }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="school" size={32} color="#6366F1" />
            )}
          </View>
          <Text className="font-semibold text-gray-900 text-center" numberOfLines={2}>
            {university.name}
          </Text>
          {location && (
            <Text className="text-gray-500 text-xs text-center mt-1" numberOfLines={1}>
              {location}
            </Text>
          )}
          <View className="flex-row items-center mt-2">
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text className="text-gray-600 text-xs ml-1">
              {(university.rating || 0).toFixed(1)}
            </Text>
            <Text className="text-gray-400 text-xs ml-1">
              ({university.reviewCount || 0})
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="bg-white p-4 border-b border-gray-100 flex-row items-center"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="w-14 h-14 rounded-xl bg-indigo-50 items-center justify-center overflow-hidden mr-3">
        {university.images?.logo ? (
          <Image
            source={{ uri: university.images.logo }}
            className="w-full h-full"
            resizeMode="contain"
          />
        ) : (
          <Ionicons name="school" size={28} color="#6366F1" />
        )}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900" numberOfLines={1}>
          {university.name}
        </Text>
        {location && (
          <View className="flex-row items-center mt-0.5">
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm ml-1" numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}
        <View className="flex-row items-center mt-1.5">
          <StarRating value={university.rating || 0} size={12} readonly />
          <Text className="text-gray-500 text-xs ml-2">
            ({university.reviewCount || 0} reviews)
          </Text>
        </View>
      </View>
      <View className="items-end">
        {university.studentCount !== undefined && university.studentCount > 0 && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="people-outline" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1">
              {university.studentCount.toLocaleString()}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
};

export default UniversityCard;
