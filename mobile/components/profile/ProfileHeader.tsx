import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface UserProfile {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePicture?: string;
  bannerImage?: string;
  bio?: string;
  university?: {
    _id: string;
    name: string;
    images?: { logo?: string };
  };
  major?: string;
  graduationYear?: number;
  isVerified?: boolean;
  followers?: string[];
  following?: string[];
  stats?: {
    posts: number;
    reviews: number;
    notes: number;
  };
}

interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  isFollowLoading?: boolean;
  onEditPress?: () => void;
  onSettingsPress?: () => void;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

const ProfileHeader = ({
  user,
  isOwnProfile = false,
  isFollowing = false,
  isFollowLoading = false,
  onEditPress,
  onSettingsPress,
  onFollowPress,
  onMessagePress,
  onFollowersPress,
  onFollowingPress,
}: ProfileHeaderProps) => {
  const router = useRouter();

  const displayName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;
  const followersCount = user.followers?.length || 0;
  const followingCount = user.following?.length || 0;

  return (
    <View>
      {/* Banner Image */}
      <View className="h-36 relative">
        {user.bannerImage ? (
          <Image
            source={{ uri: user.bannerImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={["#6366F1", "#8B5CF6", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-full"
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)"]}
          className="absolute bottom-0 left-0 right-0 h-16"
        />

        {/* Settings Button (own profile only) */}
        {isOwnProfile && onSettingsPress && (
          <TouchableOpacity
            className="absolute top-3 right-3 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
            onPress={onSettingsPress}
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Content */}
      <View className="px-4 pb-4">
        {/* Profile Picture & Action Buttons */}
        <View className="flex-row justify-between items-end -mt-16 mb-3">
          <View className="w-28 h-28 rounded-full border-4 border-white bg-gray-100 items-center justify-center overflow-hidden">
            {user.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={48} color="#9CA3AF" />
            )}
          </View>

          <View className="flex-row gap-2 mb-2">
            {isOwnProfile ? (
              <TouchableOpacity
                className="border border-gray-300 px-5 py-2 rounded-full"
                onPress={onEditPress}
              >
                <Text className="font-semibold text-gray-900">Edit profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  className={`px-5 py-2 rounded-full ${
                    isFollowing ? "bg-gray-100" : "bg-indigo-600"
                  }`}
                  onPress={onFollowPress}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <ActivityIndicator size="small" color={isFollowing ? "#374151" : "#fff"} />
                  ) : (
                    <Text className={`font-semibold ${isFollowing ? "text-gray-900" : "text-white"}`}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </TouchableOpacity>
                {onMessagePress && (
                  <TouchableOpacity
                    className="w-10 h-10 border border-gray-300 rounded-full items-center justify-center"
                    onPress={onMessagePress}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="#374151" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Name & Username */}
        <View className="mb-2">
          <View className="flex-row items-center">
            <Text className="text-xl font-bold text-gray-900 mr-1">{displayName}</Text>
            {user.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
            )}
          </View>
          <Text className="text-gray-500">@{user.username}</Text>
        </View>

        {/* University Badge */}
        {user.university && (
          <TouchableOpacity
            className="flex-row items-center bg-indigo-50 self-start px-3 py-2 rounded-lg mb-3"
            onPress={() => router.push(`/(tabs)/universities/${user.university?._id}`)}
          >
            <View className="w-6 h-6 rounded bg-white items-center justify-center mr-2 overflow-hidden">
              {user.university.images?.logo ? (
                <Image
                  source={{ uri: user.university.images.logo }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="school" size={14} color="#6366F1" />
              )}
            </View>
            <Text className="text-indigo-700 font-medium text-sm" numberOfLines={1}>
              {user.university.name}
            </Text>
            {user.isVerified && (
              <View className="ml-2 bg-indigo-600 px-1.5 py-0.5 rounded">
                <Text className="text-white text-xs font-medium">Verified</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Major & Graduation Year */}
        {(user.major || user.graduationYear) && (
          <View className="flex-row items-center mb-3 flex-wrap gap-2">
            {user.major && (
              <View className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full">
                <Ionicons name="book-outline" size={14} color="#6B7280" />
                <Text className="text-gray-600 text-sm ml-1">{user.major}</Text>
              </View>
            )}
            {user.graduationYear && (
              <View className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full">
                <Ionicons name="school-outline" size={14} color="#6B7280" />
                <Text className="text-gray-600 text-sm ml-1">Class of {user.graduationYear}</Text>
              </View>
            )}
          </View>
        )}

        {/* Bio */}
        {user.bio && (
          <Text className="text-gray-700 mb-3 leading-5">{user.bio}</Text>
        )}

        {/* Stats */}
        <View className="flex-row items-center gap-4 mb-3">
          <TouchableOpacity onPress={onFollowingPress}>
            <Text className="text-gray-900">
              <Text className="font-bold">{followingCount}</Text>
              <Text className="text-gray-500"> Following</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onFollowersPress}>
            <Text className="text-gray-900">
              <Text className="font-bold">{followersCount}</Text>
              <Text className="text-gray-500"> Followers</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activity Stats */}
        {user.stats && (
          <View className="flex-row bg-gray-50 rounded-xl p-3 gap-2">
            <StatItem icon="chatbubbles-outline" label="Posts" value={user.stats.posts} color="#10B981" />
            <StatItem icon="star-outline" label="Reviews" value={user.stats.reviews} color="#F59E0B" />
            <StatItem icon="document-text-outline" label="Notes" value={user.stats.notes} color="#8B5CF6" />
          </View>
        )}
      </View>
    </View>
  );
};

// Stat Item Component
interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}

const StatItem = ({ icon, label, value, color }: StatItemProps) => (
  <View className="flex-1 items-center py-2">
    <Ionicons name={icon} size={20} color={color} />
    <Text className="font-bold text-gray-900 text-lg mt-1">{value}</Text>
    <Text className="text-gray-500 text-xs">{label}</Text>
  </View>
);

export default ProfileHeader;
