import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UniversitySearchResult as UniversityResult } from "@/types";

interface UniversitySearchResultProps {
  university: UniversityResult;
  onPress?: () => void;
}

const UniversitySearchResult = ({ university, onPress }: UniversitySearchResultProps) => {
  const router = useRouter();

  // Handle both API format (id) and database format (_id)
  const universityId = university.id || university._id;
  const studentCount = university.stats?.studentSize || university.studentCount;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/universities/${universityId}`);
    }
  };

  const location = [university.city, university.state, university.country]
    .filter(Boolean)
    .join(", ");

  return (
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white border-b border-gray-100 active:bg-gray-50"
      onPress={handlePress}
    >
      {/* Logo */}
      <View className="mr-3">
        {university.images?.logo ? (
          <Image
            source={{ uri: university.images.logo }}
            className="w-14 h-14 rounded-lg"
            resizeMode="contain"
          />
        ) : (
          <View className="w-14 h-14 rounded-lg bg-indigo-100 items-center justify-center">
            <Ionicons name="school" size={28} color="#6366F1" />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
          {university.name}
        </Text>

        {location && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1" numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        {/* Stats row */}
        <View className="flex-row items-center mt-2">
          {university.rating !== undefined && university.rating > 0 && (
            <View className="flex-row items-center mr-4">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="text-gray-600 text-sm ml-1">
                {university.rating.toFixed(1)}
              </Text>
              {university.reviewCount !== undefined && (
                <Text className="text-gray-400 text-xs ml-1">
                  ({university.reviewCount})
                </Text>
              )}
            </View>
          )}

          {studentCount !== undefined && studentCount > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">
                {studentCount.toLocaleString()} students
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );
};

export default UniversitySearchResult;
