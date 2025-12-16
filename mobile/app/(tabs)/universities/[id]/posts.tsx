import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, universityApi, forumApi } from "@/utils/api";

type SortOption = "newest" | "popular" | "unanswered";

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
    isVerified?: boolean;
  };
  category?: string;
  tags?: string[];
  likeCount: number;
  commentCount: number;
  viewCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
  hasAcceptedAnswer?: boolean;
  createdAt: string;
  images?: string[];
}

const PostsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["university-posts", id, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await universityApi.getPosts(api, id, {
        page: pageParam,
        limit: 20,
        sortBy,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: !!id,
  });

  const posts = data?.pages.flatMap((page) => page.posts || []) || [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreatePost = useCallback(() => {
    router.push({
      pathname: "/(tabs)/forum/create",
      params: { universityId: id },
    });
  }, [router, id]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onPress={() => router.push(`/(tabs)/forum/${item._id}`)}
      />
    ),
    [router]
  );

  const renderHeader = () => (
    <View className="px-4 py-3 bg-white border-b border-gray-100">
      {/* Sort Options */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-2">
          <SortChip
            label="Newest"
            isActive={sortBy === "newest"}
            onPress={() => setSortBy("newest")}
          />
          <SortChip
            label="Popular"
            isActive={sortBy === "popular"}
            onPress={() => setSortBy("popular")}
          />
          <SortChip
            label="Unanswered"
            isActive={sortBy === "unanswered"}
            onPress={() => setSortBy("unanswered")}
          />
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="py-16 items-center px-4">
      <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
      <Text className="text-gray-400 text-lg mt-4 text-center">
        No discussions yet
      </Text>
      <Text className="text-gray-400 text-sm mt-1 text-center">
        Be the first to start a conversation!
      </Text>
      <TouchableOpacity
        className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl"
        onPress={handleCreatePost}
      >
        <Text className="text-white font-semibold">Create Post</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Discussions",
          headerBackTitle: "Back",
          headerTintColor: "#111827",
          headerStyle: { backgroundColor: "#fff" },
          headerRight: () => (
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center"
              onPress={handleCreatePost}
            >
              <Ionicons name="add-circle-outline" size={26} color="#6366F1" />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          stickyHeaderIndices={[0]}
          ItemSeparatorComponent={() => <View className="h-2" />}
        />
      )}
    </SafeAreaView>
  );
};

// Sort Chip Component
interface SortChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const SortChip = ({ label, isActive, onPress }: SortChipProps) => (
  <TouchableOpacity
    className={`px-3 py-1.5 rounded-full ${
      isActive ? "bg-indigo-600" : "bg-gray-100"
    }`}
    onPress={onPress}
  >
    <Text
      className={`text-sm font-medium ${
        isActive ? "text-white" : "text-gray-600"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// Post Card Component
interface PostCardProps {
  post: Post;
  onPress: () => void;
}

const PostCard = ({ post, onPress }: PostCardProps) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => forumApi.toggleLike(api, post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["university-posts"] });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      className="bg-white mx-2 rounded-xl overflow-hidden"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="px-4 pt-4 flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center overflow-hidden mr-3">
          {post.author?.profileImage ? (
            <Image
              source={{ uri: post.author.profileImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={20} color="#6366F1" />
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-medium text-gray-900">
              {post.author?.fullName || post.author?.username || "Anonymous"}
            </Text>
            {post.author?.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#6366F1" className="ml-1" />
            )}
          </View>
          <Text className="text-gray-400 text-xs">{formatDate(post.createdAt)}</Text>
        </View>
        {post.isPinned && (
          <View className="bg-amber-100 px-2 py-1 rounded-full">
            <Ionicons name="pin" size={14} color="#F59E0B" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="px-4 py-3">
        <Text className="font-semibold text-gray-900 text-base" numberOfLines={2}>
          {post.title}
        </Text>
        {post.content && (
          <Text className="text-gray-600 mt-1" numberOfLines={3}>
            {post.content}
          </Text>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mt-2">
            {post.tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-gray-100 px-2 py-0.5 rounded">
                <Text className="text-gray-500 text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Image Preview */}
      {post.images && post.images.length > 0 && (
        <View className="px-4 pb-3">
          <Image
            source={{ uri: post.images[0] }}
            className="w-full h-40 rounded-lg"
            resizeMode="cover"
          />
        </View>
      )}

      {/* Footer */}
      <View className="flex-row items-center px-4 pb-4 border-t border-gray-50 pt-3">
        <TouchableOpacity
          className="flex-row items-center mr-4"
          onPress={() => likeMutation.mutate()}
        >
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={post.isLiked ? "#EF4444" : "#6B7280"}
          />
          <Text className="text-gray-500 text-sm ml-1">{post.likeCount || 0}</Text>
        </TouchableOpacity>

        <View className="flex-row items-center mr-4">
          <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
          <Text className="text-gray-500 text-sm ml-1">{post.commentCount || 0}</Text>
        </View>

        {post.viewCount !== undefined && (
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={18} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{post.viewCount}</Text>
          </View>
        )}

        <View className="flex-1" />

        {post.hasAcceptedAnswer && (
          <View className="flex-row items-center bg-emerald-100 px-2 py-1 rounded-full">
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text className="text-emerald-600 text-xs ml-1 font-medium">Solved</Text>
          </View>
        )}

        {post.isLocked && (
          <Ionicons name="lock-closed" size={16} color="#9CA3AF" className="ml-2" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default PostsScreen;
