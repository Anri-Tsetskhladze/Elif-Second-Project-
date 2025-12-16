import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDistanceToNow } from "date-fns";
import { usePost, useReplies, useForumActions } from "@/hooks/useForum";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ReplyComposer from "@/components/ReplyComposer";
import { ForumPost } from "@/types";

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

const ReplyCard = ({
  reply,
  isAccepted,
  onLike,
  onAccept,
  canAccept,
  currentUserId,
}: {
  reply: ForumPost;
  isAccepted: boolean;
  onLike: () => void;
  onAccept?: () => void;
  canAccept: boolean;
  currentUserId?: string;
}) => {
  const userName = reply.isAnonymous
    ? "Anonymous"
    : reply.user?.fullName || reply.user?.username;
  const userImg = reply.isAnonymous ? null : reply.user?.profileImg;

  return (
    <View className={`p-4 border-b border-gray-100 ${isAccepted ? "bg-green-50" : ""}`}>
      {isAccepted && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text className="text-green-600 text-xs font-medium ml-1">Accepted Answer</Text>
        </View>
      )}

      <View className="flex-row items-start">
        {userImg ? (
          <Image source={{ uri: userImg }} className="w-8 h-8 rounded-full mr-3" />
        ) : (
          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3">
            <Ionicons name="person" size={16} color="#9CA3AF" />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-medium text-gray-900 mr-1">{userName}</Text>
            {reply.user?.isVerifiedStudent && (
              <Ionicons name="checkmark-circle" size={12} color="#6366F1" />
            )}
            <Text className="text-gray-500 text-xs ml-1">
              · {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </Text>
          </View>

          <Text className="text-gray-800 mt-1">{reply.content}</Text>

          {reply.images && reply.images.length > 0 && (
            <Image
              source={{ uri: reply.images[0] }}
              className="w-full h-40 rounded-lg mt-2"
              resizeMode="cover"
            />
          )}

          <View className="flex-row items-center mt-2">
            <TouchableOpacity className="flex-row items-center mr-4" onPress={onLike}>
              <Ionicons
                name={reply.isLiked ? "heart" : "heart-outline"}
                size={16}
                color={reply.isLiked ? "#EF4444" : "#6B7280"}
              />
              <Text className={`ml-1 text-sm ${reply.isLiked ? "text-red-500" : "text-gray-500"}`}>
                {reply.likesCount || 0}
              </Text>
            </TouchableOpacity>

            {canAccept && !isAccepted && onAccept && (
              <TouchableOpacity
                className="flex-row items-center"
                onPress={onAccept}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
                <Text className="text-green-600 text-sm ml-1">Accept</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nested replies */}
          {reply.nestedReplies && reply.nestedReplies.length > 0 && (
            <View className="mt-3 pl-4 border-l-2 border-gray-200">
              {reply.nestedReplies.map((nested) => (
                <View key={nested._id} className="py-2">
                  <View className="flex-row items-center">
                    <Text className="font-medium text-gray-900 text-sm">
                      {nested.user?.fullName || nested.user?.username}
                    </Text>
                    <Text className="text-gray-500 text-xs ml-1">
                      · {formatDistanceToNow(new Date(nested.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                  <Text className="text-gray-700 text-sm mt-0.5">{nested.content}</Text>
                </View>
              ))}
              {reply.hasMoreNested && (
                <TouchableOpacity className="py-1">
                  <Text className="text-indigo-600 text-sm">
                    View {reply.nestedCount! - reply.nestedReplies.length} more replies
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<"oldest" | "newest" | "popular">("oldest");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const { data: post, isLoading: postLoading, refetch: refetchPost } = usePost(id);
  const { replies, isLoading: repliesLoading, refetch: refetchReplies, fetchNextPage, hasNextPage } = useReplies(id, sortBy);
  const { toggleLike, toggleBookmark, createReply, acceptAnswer, isCreatingReply } = useForumActions();
  const { currentUser } = useCurrentUser();

  const handleReply = async (content: string, image?: string) => {
    const formData = new FormData();
    formData.append("content", content);
    if (image) {
      formData.append("images", {
        uri: image,
        type: "image/jpeg",
        name: "reply.jpg",
      } as any);
    }

    await createReply({ postId: replyingToId || id, data: formData });
    setReplyingToId(null);
    refetchReplies();
  };

  const handleAcceptAnswer = (replyId: string) => {
    Alert.alert("Accept Answer", "Mark this as the accepted answer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => {
          acceptAnswer({ postId: id, replyId });
        },
      },
    ]);
  };

  if (postLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="text-gray-600 mt-2">Post not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-indigo-600">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categoryColor = CATEGORY_COLORS[post.category] || "#6366F1";
  const userName = post.isAnonymous
    ? "Anonymous"
    : post.user?.fullName || post.user?.username;
  const userImg = post.isAnonymous ? null : post.user?.profileImg;
  const isOwner = currentUser?._id === post.user?._id;
  const canAcceptAnswer = isOwner && post.isQuestion && !post.isAnswered;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-2">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => toggleBookmark(post._id)}>
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
          ),
        }}
      />

      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={postLoading}
              onRefresh={() => {
                refetchPost();
                refetchReplies();
              }}
            />
          }
        >
          {/* Post content */}
          <View className="p-4 border-b border-gray-200">
            {/* Author */}
            <View className="flex-row items-center">
              {userImg ? (
                <Image source={{ uri: userImg }} className="w-12 h-12 rounded-full mr-3" />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Ionicons name="person" size={24} color="#9CA3AF" />
                </View>
              )}

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900">{userName}</Text>
                  {post.user?.isVerifiedStudent && (
                    <Ionicons name="checkmark-circle" size={14} color="#6366F1" className="ml-1" />
                  )}
                </View>
                <Text className="text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  {post.university && ` · ${post.university.name}`}
                </Text>
              </View>
            </View>

            {/* Badges */}
            <View className="flex-row items-center mt-3 flex-wrap gap-2">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <Text style={{ color: categoryColor }} className="text-sm font-medium capitalize">
                  {post.category.replace("-", " ")}
                </Text>
              </View>

              {post.isQuestion && (
                <View className="flex-row items-center bg-amber-100 px-3 py-1 rounded-full">
                  <Ionicons name="help-circle" size={14} color="#F59E0B" />
                  <Text className="text-amber-700 text-sm font-medium ml-1">
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
            </View>

            {/* Title & Content */}
            <Text className="text-xl font-bold text-gray-900 mt-4">{post.title}</Text>
            {post.content && (
              <Text className="text-gray-700 text-base mt-2 leading-6">{post.content}</Text>
            )}

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <View className="mt-3">
                {post.images.map((img, idx) => (
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
              <View className="flex-row flex-wrap gap-2 mt-3">
                {post.tags.map((tag) => (
                  <View key={tag} className="bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-gray-600 text-sm">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Stats & Actions */}
            <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => toggleLike(post._id)}
                >
                  <Ionicons
                    name={post.isLiked ? "heart" : "heart-outline"}
                    size={22}
                    color={post.isLiked ? "#EF4444" : "#6B7280"}
                  />
                  <Text className={`ml-1 ${post.isLiked ? "text-red-500" : "text-gray-500"}`}>
                    {post.likesCount || 0}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row items-center">
                  <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-500 ml-1">{post.replyCount || 0}</Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="eye-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-500 ml-1">{post.viewCount || 0}</Text>
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
              {(["oldest", "newest", "popular"] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  className={`px-3 py-1 rounded-full mr-1 ${sortBy === sort ? "bg-indigo-100" : ""}`}
                  onPress={() => setSortBy(sort)}
                >
                  <Text
                    className={`text-sm capitalize ${sortBy === sort ? "text-indigo-600 font-medium" : "text-gray-500"}`}
                  >
                    {sort}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Replies list */}
          {repliesLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : replies.length === 0 ? (
            <View className="py-12 items-center">
              <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">No replies yet</Text>
              <Text className="text-gray-400 text-sm">Be the first to reply!</Text>
            </View>
          ) : (
            <>
              {replies.map((reply) => (
                <ReplyCard
                  key={reply._id}
                  reply={reply}
                  isAccepted={post.acceptedAnswer?._id === reply._id}
                  onLike={() => toggleLike(reply._id)}
                  onAccept={canAcceptAnswer ? () => handleAcceptAnswer(reply._id) : undefined}
                  canAccept={canAcceptAnswer}
                  currentUserId={currentUser?._id}
                />
              ))}

              {hasNextPage && (
                <TouchableOpacity
                  className="py-4 items-center"
                  onPress={() => fetchNextPage()}
                >
                  <Text className="text-indigo-600">Load more replies</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>

        {/* Reply composer */}
        {!post.isLocked && (
          <ReplyComposer
            onSubmit={handleReply}
            isLoading={isCreatingReply}
            placeholder={replyingToId ? "Write your reply..." : "Add a reply..."}
            replyingTo={replyingToId ? replies.find((r) => r._id === replyingToId)?.user?.username : undefined}
            onCancel={replyingToId ? () => setReplyingToId(null) : undefined}
          />
        )}
      </View>
    </>
  );
}
