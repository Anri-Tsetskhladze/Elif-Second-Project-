import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ForumPost, User } from "@/types";
import { formatDate, formatNumber } from "@/utils/formatters";

interface ForumPostCardProps {
  post: ForumPost;
  currentUser?: User | null;
  onLike: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  compact?: boolean;
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  general: { color: "#6366F1", icon: "chatbubbles" },
  academics: { color: "#10B981", icon: "school" },
  "campus-life": { color: "#F59E0B", icon: "people" },
  housing: { color: "#8B5CF6", icon: "home" },
  career: { color: "#3B82F6", icon: "briefcase" },
  social: { color: "#EC4899", icon: "heart" },
  help: { color: "#EF4444", icon: "help-circle" },
  announcements: { color: "#14B8A6", icon: "megaphone" },
};

const ForumPostCard = ({
  post,
  currentUser,
  onLike,
  onBookmark,
  onDelete,
  compact = false,
}: ForumPostCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/thread/${post._id}`);
  };

  const categoryConfig = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.general;
  const isOwn = currentUser?._id?.toString() === post.user?._id?.toString();

  // Author display
  const authorName = post.isAnonymous
    ? "Anonymous"
    : post.user?.fullName || `${post.user?.firstName || ""} ${post.user?.lastName || ""}`.trim() || post.user?.username;
  const authorImg = post.isAnonymous ? null : (post.user?.profileImg || post.user?.profilePicture);

  return (
    <TouchableOpacity
      className="bg-white border-b border-gray-100 p-4"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Pinned badge */}
      {post.isPinned && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="pin" size={12} color="#6366F1" />
          <Text className="text-indigo-600 text-xs font-medium ml-1">Pinned</Text>
        </View>
      )}

      {/* Header row */}
      <View className="flex-row items-start mb-2">
        {/* Avatar */}
        {authorImg && authorImg.length > 0 ? (
          <Image source={{ uri: authorImg }} className="w-10 h-10 rounded-full mr-3" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
            <Ionicons name="person" size={18} color="#9CA3AF" />
          </View>
        )}

        <View className="flex-1">
          {/* Author name and verification */}
          <View className="flex-row items-center flex-wrap">
            <Text className="font-semibold text-gray-900 mr-1">{authorName}</Text>
            {post.user?.isVerifiedStudent && (
              <Ionicons name="checkmark-circle" size={14} color="#6366F1" />
            )}
            <Text className="text-gray-500 text-sm ml-1">· {formatDate(post.createdAt)}</Text>
          </View>

          {/* University badge */}
          {post.university && (
            <View className="flex-row items-center mt-0.5">
              <Ionicons name="school-outline" size={12} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                {post.university.name}
              </Text>
            </View>
          )}
        </View>

        {/* Delete option for own posts */}
        {isOwn && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(post._id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category and question badges */}
      <View className="flex-row items-center flex-wrap gap-2 mb-2">
        {/* Category badge */}
        <View
          className="flex-row items-center px-2 py-1 rounded-full"
          style={{ backgroundColor: `${categoryConfig.color}15` }}
        >
          <Ionicons name={categoryConfig.icon} size={12} color={categoryConfig.color} />
          <Text
            style={{ color: categoryConfig.color }}
            className="text-xs font-medium ml-1 capitalize"
          >
            {post.category.replace("-", " ")}
          </Text>
        </View>

        {/* Question badge */}
        {post.isQuestion && (
          <View
            className={`flex-row items-center px-2 py-1 rounded-full ${
              post.isAnswered ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            <Ionicons
              name={post.isAnswered ? "checkmark-circle" : "help-circle"}
              size={12}
              color={post.isAnswered ? "#16A34A" : "#F59E0B"}
            />
            <Text
              className={`text-xs font-medium ml-1 ${
                post.isAnswered ? "text-green-600" : "text-amber-600"
              }`}
            >
              {post.isAnswered ? "Answered" : "Question"}
            </Text>
          </View>
        )}

        {/* Locked badge */}
        {post.isLocked && (
          <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
            <Ionicons name="lock-closed" size={12} color="#6B7280" />
            <Text className="text-gray-600 text-xs ml-1">Locked</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text className="text-gray-900 font-semibold text-base mb-1" numberOfLines={2}>
        {post.title}
      </Text>

      {/* Preview text */}
      {!compact && post.content && (
        <Text className="text-gray-600 text-sm leading-5 mb-2" numberOfLines={2}>
          {post.content}
        </Text>
      )}

      {/* Image preview */}
      {!compact && post.images && post.images.length > 0 && post.images[0] && (
        <View className="mb-2">
          {post.images.length === 1 ? (
            <Image
              source={{ uri: post.images[0] }}
              className="w-full h-36 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-row gap-1">
              <Image
                source={{ uri: post.images[0] }}
                className="flex-1 h-28 rounded-lg"
                resizeMode="cover"
              />
              {post.images[1] && (
                <View className="flex-1 relative">
                  <Image
                    source={{ uri: post.images[1] }}
                    className="w-full h-28 rounded-lg"
                    resizeMode="cover"
                  />
                  {post.images.length > 2 && (
                    <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                      <Text className="text-white font-medium">+{post.images.length - 2}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Tags */}
      {!compact && post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {post.tags.slice(0, 3).map((tag) => (
            <View key={tag} className="bg-gray-100 px-2 py-0.5 rounded">
              <Text className="text-gray-500 text-xs">#{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <Text className="text-gray-400 text-xs">+{post.tags.length - 3}</Text>
          )}
        </View>
      )}

      {/* Stats row */}
      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center gap-4">
          {/* Likes */}
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => onLike(post._id)}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={18}
              color={post.isLiked ? "#EF4444" : "#6B7280"}
            />
            <Text
              className={`text-sm ml-1 ${post.isLiked ? "text-red-500" : "text-gray-500"}`}
            >
              {formatNumber(post.likesCount || 0)}
            </Text>
          </TouchableOpacity>

          {/* Comments */}
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">
              {formatNumber(post.replyCount || 0)}
            </Text>
          </View>

          {/* Views */}
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">
              {formatNumber(post.viewCount || 0)}
            </Text>
          </View>
        </View>

        {/* Bookmark */}
        {onBookmark && (
          <TouchableOpacity onPress={() => onBookmark(post._id)}>
            <Ionicons
              name={post.isBookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={post.isBookmarked ? "#6366F1" : "#6B7280"}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ForumPostCard;
