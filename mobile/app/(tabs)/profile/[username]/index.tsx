import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, userApi, forumApi, reviewApi, noteApi } from "@/utils/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ProfileHeader, ProfileTabs } from "@/components/profile";
import type { ProfileTabId } from "@/components/profile";

const UserProfileScreen = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<ProfileTabId>("posts");

  // Fetch user profile
  const {
    data: user,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () => userApi.getByUsername(api, username),
    select: (res) => res.data.user,
    enabled: !!username,
  });

  // Check if current user is following this user
  const isFollowing = useMemo(() => {
    if (!currentUser || !user) return false;
    return currentUser.following?.includes(user._id);
  }, [currentUser, user]);

  // Check if this is own profile
  const isOwnProfile = currentUser?.username === username;

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: () =>
      isFollowing ? userApi.unfollow(api, user._id) : userApi.follow(api, user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", username] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to update follow status");
    },
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ["user-stats", user?._id],
    queryFn: () => userApi.getUserStats(api, user?._id),
    select: (res) => res.data.stats,
    enabled: !!user?._id,
  });

  // Fetch posts
  const {
    data: postsData,
    fetchNextPage: fetchMorePosts,
    hasNextPage: hasMorePosts,
    isFetchingNextPage: fetchingMorePosts,
    refetch: refetchPosts,
  } = useInfiniteQuery({
    queryKey: ["user-posts", username],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await forumApi.getUserPosts(api, username, {
        page: pageParam,
        limit: 20,
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
    enabled: !!username && activeTab === "posts",
  });

  // Fetch reviews
  const {
    data: reviewsData,
    fetchNextPage: fetchMoreReviews,
    hasNextPage: hasMoreReviews,
    isFetchingNextPage: fetchingMoreReviews,
    refetch: refetchReviews,
  } = useInfiniteQuery({
    queryKey: ["user-reviews", user?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await reviewApi.getByUser(api, user?._id || "", {
        page: pageParam,
        limit: 20,
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
    enabled: !!user?._id && activeTab === "reviews",
  });

  // Fetch notes
  const {
    data: notesData,
    fetchNextPage: fetchMoreNotes,
    hasNextPage: hasMoreNotes,
    isFetchingNextPage: fetchingMoreNotes,
    refetch: refetchNotes,
  } = useInfiniteQuery({
    queryKey: ["user-notes", user?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await noteApi.getByUser(api, user?._id || "", {
        page: pageParam,
        limit: 20,
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
    enabled: !!user?._id && activeTab === "notes",
  });

  const currentData = useMemo(() => {
    switch (activeTab) {
      case "posts":
        return postsData?.pages.flatMap((p) => p.posts || []) || [];
      case "reviews":
        return reviewsData?.pages.flatMap((p) => p.reviews || []) || [];
      case "notes":
        return notesData?.pages.flatMap((p) => p.notes || []) || [];
      default:
        return [];
    }
  }, [activeTab, postsData, reviewsData, notesData]);

  const handleRefresh = useCallback(() => {
    refetchUser();
    switch (activeTab) {
      case "posts":
        refetchPosts();
        break;
      case "reviews":
        refetchReviews();
        break;
      case "notes":
        refetchNotes();
        break;
    }
  }, [activeTab, refetchUser, refetchPosts, refetchReviews, refetchNotes]);

  const handleLoadMore = useCallback(() => {
    switch (activeTab) {
      case "posts":
        if (hasMorePosts && !fetchingMorePosts) fetchMorePosts();
        break;
      case "reviews":
        if (hasMoreReviews && !fetchingMoreReviews) fetchMoreReviews();
        break;
      case "notes":
        if (hasMoreNotes && !fetchingMoreNotes) fetchMoreNotes();
        break;
    }
  }, [
    activeTab,
    hasMorePosts,
    fetchingMorePosts,
    fetchMorePosts,
    hasMoreReviews,
    fetchingMoreReviews,
    fetchMoreReviews,
    hasMoreNotes,
    fetchingMoreNotes,
    fetchMoreNotes,
  ]);

  const handleFollow = useCallback(() => {
    followMutation.mutate();
  }, [followMutation]);

  const handleMessage = useCallback(() => {
    // Navigate to messages with this user
    router.push(`/(tabs)/messages/${user?._id}`);
  }, [router, user]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      switch (activeTab) {
        case "posts":
          return <PostItem post={item} onPress={() => {}} />;
        case "reviews":
          return (
            <ReviewItem
              review={item}
              onPress={() => router.push(`/(tabs)/universities/${item.university?._id}/reviews`)}
            />
          );
        case "notes":
          return (
            <NoteItem
              note={item}
              onPress={() =>
                router.push(`/(tabs)/universities/${item.university?._id}/notes/${item._id}`)
              }
            />
          );
        default:
          return null;
      }
    },
    [activeTab, router]
  );

  const renderHeader = useCallback(() => {
    if (!user) return null;

    const userWithStats = {
      ...user,
      stats: stats || { posts: 0, reviews: 0, notes: 0 },
    };

    return (
      <>
        <ProfileHeader
          user={userWithStats}
          isOwnProfile={false}
          isFollowing={isFollowing}
          isFollowLoading={followMutation.isPending}
          onFollowPress={handleFollow}
          onMessagePress={handleMessage}
        />
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            posts: stats?.posts,
            reviews: stats?.reviews,
            notes: stats?.notes,
          }}
          showSaved={false}
        />
      </>
    );
  }, [user, stats, activeTab, isFollowing, followMutation.isPending, handleFollow, handleMessage]);

  const renderEmpty = useCallback(() => {
    const emptyConfig = {
      posts: { icon: "chatbubbles-outline", message: "No posts yet" },
      reviews: { icon: "star-outline", message: "No reviews yet" },
      notes: { icon: "document-text-outline", message: "No notes uploaded" },
      saved: { icon: "bookmark-outline", message: "No saved items" },
    };

    const config = emptyConfig[activeTab];

    return (
      <View className="py-16 items-center">
        <Ionicons name={config.icon as any} size={64} color="#E5E7EB" />
        <Text className="text-gray-400 text-lg mt-4">{config.message}</Text>
      </View>
    );
  }, [activeTab]);

  const renderFooter = useCallback(() => {
    const isLoading = fetchingMorePosts || fetchingMoreReviews || fetchingMoreNotes;
    if (isLoading) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      );
    }
    return null;
  }, [fetchingMorePosts, fetchingMoreReviews, fetchingMoreNotes]);

  if (userLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Profile",
            headerBackTitle: "Back",
          }}
        />
        <Ionicons name="person-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-400 text-lg mt-4">User not found</Text>
      </SafeAreaView>
    );
  }

  // Redirect to own profile if viewing self
  if (isOwnProfile) {
    router.replace("/(tabs)/profile");
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerTransparent: true,
          headerBackTitle: "Back",
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={currentData}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor="#6366F1" />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};

// Post Item Component
const PostItem = ({ post, onPress }: { post: any; onPress: () => void }) => (
  <TouchableOpacity className="p-4 border-b border-gray-100" onPress={onPress} activeOpacity={0.7}>
    <Text className="font-semibold text-gray-900" numberOfLines={2}>
      {post.title}
    </Text>
    {post.content && (
      <Text className="text-gray-500 mt-1" numberOfLines={2}>
        {post.content}
      </Text>
    )}
    <View className="flex-row items-center mt-2 gap-4">
      <View className="flex-row items-center">
        <Ionicons name="heart-outline" size={16} color="#6B7280" />
        <Text className="text-gray-500 text-sm ml-1">{post.likeCount || 0}</Text>
      </View>
      <View className="flex-row items-center">
        <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
        <Text className="text-gray-500 text-sm ml-1">{post.commentCount || 0}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Review Item Component
const ReviewItem = ({ review, onPress }: { review: any; onPress: () => void }) => (
  <TouchableOpacity className="p-4 border-b border-gray-100" onPress={onPress} activeOpacity={0.7}>
    <View className="flex-row items-center mb-2">
      <View className="w-8 h-8 rounded bg-indigo-50 items-center justify-center mr-2">
        {review.university?.images?.logo ? (
          <Image
            source={{ uri: review.university.images.logo }}
            className="w-full h-full rounded"
            resizeMode="contain"
          />
        ) : (
          <Ionicons name="school" size={16} color="#6366F1" />
        )}
      </View>
      <Text className="text-gray-700 font-medium flex-1" numberOfLines={1}>
        {review.university?.name || "University"}
      </Text>
      <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded">
        <Ionicons name="star" size={14} color="#F59E0B" />
        <Text className="text-amber-700 font-semibold ml-1">{review.overallRating}</Text>
      </View>
    </View>
    {review.title && (
      <Text className="font-semibold text-gray-900" numberOfLines={1}>
        {review.title}
      </Text>
    )}
    {review.content && (
      <Text className="text-gray-500 mt-1" numberOfLines={2}>
        {review.content}
      </Text>
    )}
  </TouchableOpacity>
);

// Note Item Component
const NoteItem = ({ note, onPress }: { note: any; onPress: () => void }) => (
  <TouchableOpacity className="p-4 border-b border-gray-100" onPress={onPress} activeOpacity={0.7}>
    <View className="flex-row items-start">
      <View className="w-10 h-10 rounded-lg bg-purple-50 items-center justify-center mr-3">
        <Ionicons name="document-text" size={20} color="#8B5CF6" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900" numberOfLines={1}>
          {note.title}
        </Text>
        {note.subject && <Text className="text-gray-500 text-sm">{note.subject}</Text>}
        <View className="flex-row items-center mt-1 gap-3">
          <View className="flex-row items-center">
            <Ionicons name="download-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">{note.downloadCount || 0}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="heart-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">{note.likeCount || 0}</Text>
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

export default UserProfileScreen;
