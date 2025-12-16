import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UserSearchResult as UserResult } from "@/types";

interface UserSearchResultProps {
  user: UserResult;
  onPress?: () => void;
  showFollowButton?: boolean;
  onFollow?: (userId: string) => void;
  isFollowing?: boolean;
}

const UserSearchResult = ({
  user,
  onPress,
  showFollowButton = false,
  onFollow,
  isFollowing = false,
}: UserSearchResultProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/profile/${user.username}`);
    }
  };

  const displayName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

  return (
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white border-b border-gray-100 active:bg-gray-50"
      onPress={handlePress}
    >
      {/* Avatar */}
      {user.profilePicture ? (
        <Image
          source={{ uri: user.profilePicture }}
          className="w-12 h-12 rounded-full mr-3"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
          <Ionicons name="person" size={24} color="#9CA3AF" />
        </View>
      )}

      {/* Info */}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
            {displayName}
          </Text>
          {user.isVerifiedStudent && (
            <Ionicons name="checkmark-circle" size={16} color="#6366F1" style={{ marginLeft: 4 }} />
          )}
        </View>

        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          @{user.username}
        </Text>

        {user.university && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="school-outline" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
              {typeof user.university === "string" ? user.university : "University"}
            </Text>
          </View>
        )}
      </View>

      {/* Follow button */}
      {showFollowButton && onFollow && (
        <TouchableOpacity
          className={`px-4 py-1.5 rounded-full ${
            isFollowing ? "bg-gray-100" : "bg-indigo-600"
          }`}
          onPress={(e) => {
            e.stopPropagation();
            onFollow(user._id);
          }}
        >
          <Text
            className={`text-sm font-medium ${
              isFollowing ? "text-gray-700" : "text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default UserSearchResult;
