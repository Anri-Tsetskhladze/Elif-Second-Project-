import { ForumPost as ForumPostType, User } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";

interface ForumPostProps {
  post: ForumPostType;
  currentUser?: User | null;
  onLike: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "#6366F1",
  academics: "#10B981",
  "campus-life": "#F59E0B",
  housing: "#8B5CF6",
  career: "#3B82F6",
  social: "#EC4899",
  help: "#EF4444",
  announcements: "#14B8A6",
};

const ForumPost = ({
  post,
  currentUser,
  onLike,
  onBookmark,
  onDelete,
  compact = false,
}: ForumPostProps) => {
  const router = useRouter();
  const isOwn = currentUser?._id?.toString() === post.user?._id?.toString();

  const handlePress = () => {
    router.push(`/thread/${post._id}`);
  };

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete?.(post._id) },
    ]);
  };

  const categoryColor = CATEGORY_COLORS[post.category] || "#6366F1";
  const userName = post.isAnonymous
    ? "Anonymous"
    : post.user?.fullName || `${post.user?.firstName || ""} ${post.user?.lastName || ""}`.trim() || post.user?.username;
  const userImg = post.isAnonymous ? null : (post.user?.profileImg || post.user?.profilePicture);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <TouchableOpacity
      className="bg-white border-b border-gray-100 p-4"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Pinned indicator */}
      {post.isPinned && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="pin" size={14} color="#6366F1" />
          <Text className="text-indigo-600 text-xs ml-1 font-medium">Pinned</Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row items-start">
        {userImg && userImg.length > 0 ? (
          <Image source={{ uri: userImg }} className="w-10 h-10 rounded-full mr-3" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
            <Ionicons name="person" size={20} color="#9CA3AF" />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center flex-wrap">
            <Text className="font-semibold text-gray-900 mr-1">{userName}</Text>
            {post.user?.isVerifiedStudent && (
              <Ionicons name="checkmark-circle" size={14} color="#6366F1" />
            )}
            <Text className="text-gray-500 text-sm ml-1">· {timeAgo}</Text>
          </View>

          {post.university && (
            <Text className="text-gray-500 text-xs">{post.university.name}</Text>
          )}
        </View>

        {/* Actions menu */}
        {isOwn && onDelete && (
          <TouchableOpacity onPress={handleDelete} className="p-1">
            <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category & Question badge */}
      <View className="flex-row items-center mt-2 mb-1 flex-wrap gap-2">
        <View
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${categoryColor}15` }}
        >
          <Text style={{ color: categoryColor }} className="text-xs font-medium capitalize">
            {post.category.replace("-", " ")}
          </Text>
        </View>

        {post.isQuestion && (
          <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-full">
            <Ionicons name="help-circle" size={12} color="#F59E0B" />
            <Text className="text-amber-600 text-xs font-medium ml-1">
              {post.isAnswered ? "Answered" : "Question"}
            </Text>
          </View>
        )}

        {post.isLocked && (
          <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded-full">
            <Ionicons name="lock-closed" size={12} color="#6B7280" />
            <Text className="text-gray-600 text-xs ml-1">Locked</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text className="text-gray-900 font-semibold text-base mt-1" numberOfLines={2}>
        {post.title}
      </Text>

      {/* Content preview */}
      {!compact && post.content && (
        <Text className="text-gray-600 text-sm mt-1" numberOfLines={3}>
          {post.content}
        </Text>
      )}

      {/* Images */}
      {!compact && post.images && post.images.length > 0 && post.images[0] && (
        <View className="mt-2">
          {post.images.length === 1 ? (
            <Image
              source={{ uri: post.images[0] }}
              className="w-full h-40 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-row gap-1">
              {post.images.slice(0, 2).filter(img => img && img.length > 0).map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img }}
                  className="flex-1 h-32 rounded-lg"
                  resizeMode="cover"
                />
              ))}
              {post.images.length > 2 && (
                <View className="absolute right-1 bottom-1 bg-black/60 px-2 py-1 rounded">
                  <Text className="text-white text-xs">+{post.images.length - 2}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Tags */}
      {!compact && post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-2">
          {post.tags.slice(0, 3).map((tag) => (
            <View key={tag} className="bg-gray-100 px-2 py-0.5 rounded">
              <Text className="text-gray-600 text-xs">#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer stats */}
      <View className="flex-row items-center mt-3 justify-between">
        <View className="flex-row items-center gap-4">
          {/* Like */}
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => onLike(post._id)}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={18}
              color={post.isLiked ? "#EF4444" : "#6B7280"}
            />
            <Text className={`ml-1 text-sm ${post.isLiked ? "text-red-500" : "text-gray-500"}`}>
              {post.likesCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Replies */}
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{post.replyCount || 0}</Text>
          </View>

          {/* Views */}
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{post.viewCount || 0}</Text>
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

export default ForumPost;
