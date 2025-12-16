import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { PostSearchResult as PostResult } from "@/types";

interface PostSearchResultProps {
  post: PostResult;
  searchQuery?: string;
  onPress?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  general: { bg: "bg-gray-100", text: "text-gray-700" },
  academics: { bg: "bg-blue-100", text: "text-blue-700" },
  social: { bg: "bg-pink-100", text: "text-pink-700" },
  career: { bg: "bg-green-100", text: "text-green-700" },
  housing: { bg: "bg-amber-100", text: "text-amber-700" },
  events: { bg: "bg-purple-100", text: "text-purple-700" },
  marketplace: { bg: "bg-teal-100", text: "text-teal-700" },
};

const highlightText = (text: string, query?: string): string => {
  if (!query || query.length < 2) return text;
  return text;
};

const PostSearchResult = ({ post, searchQuery, onPress }: PostSearchResultProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/post/${post._id}`);
    }
  };

  const categoryStyle = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const contentPreview = post.content.length > 150
    ? post.content.substring(0, 150) + "..."
    : post.content;

  return (
    <TouchableOpacity
      className="p-4 bg-white border-b border-gray-100 active:bg-gray-50"
      onPress={handlePress}
    >
      {/* Header */}
      <View className="flex-row items-center mb-2">
        <View className={`px-2 py-0.5 rounded-full ${categoryStyle.bg} mr-2`}>
          <Text className={`text-xs font-medium ${categoryStyle.text} capitalize`}>
            {post.category}
          </Text>
        </View>

        {post.isQuestion && (
          <View className="flex-row items-center mr-2">
            <Ionicons
              name={post.isAnswered ? "checkmark-circle" : "help-circle"}
              size={14}
              color={post.isAnswered ? "#10B981" : "#F59E0B"}
            />
            <Text
              className={`text-xs ml-1 ${
                post.isAnswered ? "text-green-600" : "text-amber-600"
              }`}
            >
              {post.isAnswered ? "Answered" : "Question"}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text className="font-semibold text-gray-900 text-base mb-1" numberOfLines={2}>
        {post.title}
      </Text>

      {/* Content preview */}
      <Text className="text-gray-600 text-sm" numberOfLines={2}>
        {contentPreview}
      </Text>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap mt-2 gap-1">
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} className="bg-gray-100 px-2 py-0.5 rounded">
              <Text className="text-gray-500 text-xs">#{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <Text className="text-gray-400 text-xs">+{post.tags.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-3">
        {/* Author */}
        <View className="flex-row items-center">
          {post.user.profilePicture || post.user.profileImg ? (
            <Image
              source={{ uri: post.user.profilePicture || post.user.profileImg }}
              className="w-5 h-5 rounded-full mr-1.5"
            />
          ) : (
            <View className="w-5 h-5 rounded-full bg-gray-200 items-center justify-center mr-1.5">
              <Ionicons name="person" size={10} color="#9CA3AF" />
            </View>
          )}
          <Text className="text-gray-600 text-xs">
            {post.user.fullName || post.user.username}
          </Text>
          {post.user.isVerifiedStudent && (
            <Ionicons name="checkmark-circle" size={12} color="#6366F1" style={{ marginLeft: 2 }} />
          )}
          <Text className="text-gray-400 text-xs ml-2">{timeAgo}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3">
            <Ionicons name="heart-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">{post.likesCount}</Text>
          </View>
          <View className="flex-row items-center mr-3">
            <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">{post.replyCount}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">{post.viewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PostSearchResult;
