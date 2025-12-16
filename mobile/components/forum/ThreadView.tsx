import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ForumPost, User } from "@/types";
import { formatDate, formatNumber } from "@/utils/formatters";
import ReplyCard from "./ReplyCard";
import ReplyComposer from "../ReplyComposer";

interface ThreadViewProps {
  post: ForumPost;
  replies: ForumPost[];
  currentUser?: User | null;
  isLoading?: boolean;
  isLoadingReplies?: boolean;
  onRefresh: () => void;
  onLoadMoreReplies?: () => void;
  hasMoreReplies?: boolean;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onReply: (content: string, image?: string, replyToId?: string) => Promise<void>;
  onAcceptAnswer?: (replyId: string) => void;
  isCreatingReply?: boolean;
  sortBy: "oldest" | "newest" | "popular";
  onSortChange: (sort: "oldest" | "newest" | "popular") => void;
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

const ThreadView = ({
  post,
  replies,
  currentUser,
  isLoading = false,
  isLoadingReplies = false,
  onRefresh,
  onLoadMoreReplies,
  hasMoreReplies = false,
  onLike,
  onBookmark,
  onReply,
  onAcceptAnswer,
  isCreatingReply = false,
  sortBy,
  onSortChange,
}: ThreadViewProps) => {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"threaded" | "flat">("threaded");

  const categoryColor = CATEGORY_COLORS[post.category] || "#6366F1";
  const isOwner = currentUser?._id?.toString() === post.user?._id?.toString();
  const canAcceptAnswer = isOwner && post.isQuestion && !post.isAnswered;

  const authorName = post.isAnonymous
    ? "Anonymous"
    : post.user?.fullName || post.user?.username || "Unknown";
  const authorImg = post.isAnonymous ? null : post.user?.profileImg;

  const handleReplyTo = (replyId: string, username: string) => {
    setReplyingToId(replyId);
    setReplyingToUsername(username);
  };

  const handleSubmitReply = async (content: string, image?: string) => {
    await onReply(content, image, replyingToId || undefined);
    setReplyingToId(null);
    setReplyingToUsername(null);
  };

  const handleAcceptAnswer = (replyId: string) => {
    Alert.alert(
      "Accept Answer",
      "Mark this reply as the best answer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => onAcceptAnswer?.(replyId),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
      >
        {/* Original post */}
        <View className="p-4 border-b border-gray-200">
          {/* Author */}
          <View className="flex-row items-center mb-3">
            {authorImg && authorImg.length > 0 ? (
              <Image source={{ uri: authorImg }} className="w-12 h-12 rounded-full mr-3" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Ionicons name="person" size={24} color="#9CA3AF" />
              </View>
            )}

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900">{authorName}</Text>
                {post.user?.isVerifiedStudent && (
                  <Ionicons name="checkmark-circle" size={14} color="#6366F1" className="ml-1" />
                )}
              </View>
              <Text className="text-gray-500 text-sm">
                {formatDate(post.createdAt)}
                {post.university && ` · ${post.university.name}`}
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={() => onBookmark(post._id)}>
                <Ionicons
                  name={post.isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={post.isBookmarked ? "#6366F1" : "#6B7280"}
                />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="share-outline" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badges */}
          <View className="flex-row items-center flex-wrap gap-2 mb-3">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${categoryColor}15` }}
            >
              <Text style={{ color: categoryColor }} className="text-sm font-medium capitalize">
                {post.category.replace("-", " ")}
              </Text>
            </View>

            {post.isQuestion && (
              <View
                className={`flex-row items-center px-3 py-1 rounded-full ${
                  post.isAnswered ? "bg-green-100" : "bg-amber-100"
                }`}
              >
                <Ionicons
                  name={post.isAnswered ? "checkmark-circle" : "help-circle"}
                  size={14}
                  color={post.isAnswered ? "#16A34A" : "#F59E0B"}
                />
                <Text
                  className={`text-sm font-medium ml-1 ${
                    post.isAnswered ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {post.isAnswered ? "Answered" : "Question"}
                </Text>
              </View>
            )}

            {post.isLocked && (
              <View className="flex-row items-center bg-gray-200 px-3 py-1 rounded-full">
                <Ionicons name="lock-closed" size={14} color="#6B7280" />
                <Text className="text-gray-700 text-sm ml-1">Locked</Text>
              </View>
            )}

            {post.isPinned && (
              <View className="flex-row items-center bg-indigo-100 px-3 py-1 rounded-full">
                <Ionicons name="pin" size={14} color="#6366F1" />
                <Text className="text-indigo-700 text-sm ml-1">Pinned</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 mb-2">{post.title}</Text>

          {/* Content */}
          {post.content && (
            <Text className="text-gray-700 text-base leading-6 mb-3">{post.content}</Text>
          )}

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <View className="mb-3">
              {post.images.filter(img => img && img.length > 0).map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img }}
                  className="w-full h-48 rounded-lg mb-2"
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <View key={tag} className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-gray-600 text-sm">#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View className="flex-row items-center gap-5">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onLike(post._id)}
              >
                <Ionicons
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={22}
                  color={post.isLiked ? "#EF4444" : "#6B7280"}
                />
                <Text className={`ml-1 ${post.isLiked ? "text-red-500" : "text-gray-500"}`}>
                  {formatNumber(post.likesCount || 0)}
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                <Text className="text-gray-500 ml-1">{formatNumber(post.replyCount || 0)}</Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={20} color="#6B7280" />
                <Text className="text-gray-500 ml-1">{formatNumber(post.viewCount || 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Replies header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50">
          <Text className="font-semibold text-gray-900">
            {post.replyCount || 0} {post.replyCount === 1 ? "Reply" : "Replies"}
          </Text>

          <View className="flex-row items-center">
            {/* View mode toggle */}
            <View className="flex-row items-center mr-3 bg-white rounded-full p-0.5">
              <TouchableOpacity
                className={`px-2 py-1 rounded-full ${viewMode === "threaded" ? "bg-gray-200" : ""}`}
                onPress={() => setViewMode("threaded")}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={14}
                  color={viewMode === "threaded" ? "#374151" : "#9CA3AF"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-2 py-1 rounded-full ${viewMode === "flat" ? "bg-gray-200" : ""}`}
                onPress={() => setViewMode("flat")}
              >
                <Ionicons
                  name="list-outline"
                  size={14}
                  color={viewMode === "flat" ? "#374151" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>

            {/* Sort options */}
            {(["oldest", "newest", "popular"] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                className={`px-2 py-1 rounded-full ${sortBy === sort ? "bg-indigo-100" : ""}`}
                onPress={() => onSortChange(sort)}
              >
                <Text
                  className={`text-xs capitalize ${
                    sortBy === sort ? "text-indigo-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {sort}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Replies list */}
        {isLoadingReplies ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : replies.length === 0 ? (
          <View className="py-12 items-center">
            <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-2 text-lg">No replies yet</Text>
            <Text className="text-gray-400 text-sm">Be the first to reply!</Text>
          </View>
        ) : (
          <>
            {replies.map((reply) => (
              <ReplyCard
                key={reply._id}
                reply={reply}
                isAcceptedAnswer={post.acceptedAnswer?._id === reply._id}
                onLike={onLike}
                onAccept={canAcceptAnswer ? handleAcceptAnswer : undefined}
                onReply={viewMode === "threaded" ? handleReplyTo : undefined}
                canAccept={canAcceptAnswer}
                currentUserId={currentUser?._id}
              />
            ))}

            {hasMoreReplies && (
              <TouchableOpacity
                className="py-4 items-center"
                onPress={onLoadMoreReplies}
              >
                <Text className="text-indigo-600 font-medium">Load more replies</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bottom padding for composer */}
        <View className="h-20" />
      </ScrollView>

      {/* Reply composer */}
      {!post.isLocked && (
        <ReplyComposer
          onSubmit={handleSubmitReply}
          isLoading={isCreatingReply}
          placeholder={replyingToUsername ? `Reply to @${replyingToUsername}...` : "Write a reply..."}
          replyingTo={replyingToUsername || undefined}
          onCancel={replyingToId ? () => {
            setReplyingToId(null);
            setReplyingToUsername(null);
          } : undefined}
        />
      )}
    </View>
  );
};

export default ThreadView;
