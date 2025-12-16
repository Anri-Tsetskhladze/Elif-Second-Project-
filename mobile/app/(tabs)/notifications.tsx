import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/utils/api";
import { EmptyState, ErrorDisplay } from "@/components/common";
import { formatDistanceToNow } from "date-fns";

type NotificationType =
  | "follow"
  | "like_post"
  | "like_comment"
  | "comment"
  | "reply"
  | "mention"
  | "share"
  | "post_reply"
  | "answer_accepted"
  | "note_liked"
  | "note_downloaded"
  | "note_comment"
  | "review_helpful"
  | "review_reply"
  | "review_comment"
  | "message"
  | "group_invite"
  | "university_update"
  | "university_announcement"
  | "new_student"
  | "event_reminder"
  | "system"
  | "welcome"
  | "achievement";

type NotificationCategory = "all" | "social" | "content" | "university" | "messaging" | "system";

interface Notification {
  _id: string;
  type: NotificationType;
  category: NotificationCategory;
  title?: string;
  body: string;
  sender?: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
    isVerified?: boolean;
  };
  data?: {
    postId?: string;
    noteId?: string;
    reviewId?: string;
    universityId?: string;
    commentId?: string;
  };
  actionUrl?: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}> = {
  follow: { icon: "person-add", color: "#6366F1", bgColor: "bg-indigo-50" },
  like_post: { icon: "heart", color: "#EF4444", bgColor: "bg-red-50" },
  like_comment: { icon: "heart", color: "#EF4444", bgColor: "bg-red-50" },
  comment: { icon: "chatbubble", color: "#3B82F6", bgColor: "bg-blue-50" },
  reply: { icon: "arrow-undo", color: "#3B82F6", bgColor: "bg-blue-50" },
  mention: { icon: "at", color: "#8B5CF6", bgColor: "bg-purple-50" },
  share: { icon: "share-social", color: "#10B981", bgColor: "bg-emerald-50" },
  post_reply: { icon: "chatbubbles", color: "#3B82F6", bgColor: "bg-blue-50" },
  answer_accepted: { icon: "checkmark-circle", color: "#10B981", bgColor: "bg-emerald-50" },
  note_liked: { icon: "heart", color: "#EF4444", bgColor: "bg-red-50" },
  note_downloaded: { icon: "download", color: "#6366F1", bgColor: "bg-indigo-50" },
  note_comment: { icon: "chatbubble", color: "#3B82F6", bgColor: "bg-blue-50" },
  review_helpful: { icon: "thumbs-up", color: "#F59E0B", bgColor: "bg-amber-50" },
  review_reply: { icon: "chatbubble", color: "#3B82F6", bgColor: "bg-blue-50" },
  review_comment: { icon: "chatbubble", color: "#3B82F6", bgColor: "bg-blue-50" },
  message: { icon: "mail", color: "#6366F1", bgColor: "bg-indigo-50" },
  group_invite: { icon: "people", color: "#8B5CF6", bgColor: "bg-purple-50" },
  university_update: { icon: "school", color: "#6366F1", bgColor: "bg-indigo-50" },
  university_announcement: { icon: "megaphone", color: "#F59E0B", bgColor: "bg-amber-50" },
  new_student: { icon: "person-add", color: "#10B981", bgColor: "bg-emerald-50" },
  event_reminder: { icon: "calendar", color: "#EF4444", bgColor: "bg-red-50" },
  system: { icon: "information-circle", color: "#6B7280", bgColor: "bg-gray-50" },
  welcome: { icon: "sparkles", color: "#F59E0B", bgColor: "bg-amber-50" },
  achievement: { icon: "trophy", color: "#F59E0B", bgColor: "bg-amber-50" },
};

const CATEGORY_TABS: { id: NotificationCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "social", label: "Social" },
  { id: "content", label: "Content" },
  { id: "university", label: "University" },
  { id: "system", label: "System" },
];

const NotificationsScreen = () => {
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("all");

  // Fetch notifications
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["notifications", selectedCategory],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (selectedCategory !== "all") params.category = selectedCategory;
      const res = await api.get("/notifications", { params });
      return res.data;
    },
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const res = await api.get("/notifications/unread-count");
      return res.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      api.put(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.put("/notifications/read-all", { category: selectedCategory === "all" ? null : selectedCategory }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      api.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const notifications = data?.notifications || [];

  // Handle notification press - deep link to content
  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }

    // Navigate based on type
    const { type, data: notifData, sender } = notification;

    switch (type) {
      case "follow":
      case "new_student":
        if (sender?.username) router.push(`/(tabs)/profile/${sender.username}`);
        break;
      case "like_post":
      case "comment":
      case "reply":
      case "post_reply":
      case "answer_accepted":
      case "mention":
        // Posts not implemented yet, just mark as read
        break;
      case "note_liked":
      case "note_downloaded":
      case "note_comment":
        if (notifData?.noteId) router.push(`/(tabs)/notes/${notifData.noteId}`);
        break;
      case "review_helpful":
      case "review_reply":
      case "review_comment":
        if (notifData?.universityId) router.push(`/(tabs)/universities/${notifData.universityId}`);
        break;
      case "university_update":
      case "university_announcement":
        if (notifData?.universityId) router.push(`/(tabs)/universities/${notifData.universityId}`);
        break;
      case "message":
        router.push("/(tabs)/messages");
        break;
      default:
        break;
    }
  }, [router, markAsReadMutation]);

  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const config = NOTIFICATION_CONFIG[item.type] || NOTIFICATION_CONFIG.system;

    return (
      <TouchableOpacity
        className={`flex-row p-4 border-b border-gray-100 ${!item.isRead ? "bg-indigo-50/50" : "bg-white"}`}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Icon or Avatar */}
        <View className="mr-3">
          {item.sender?.profileImage ? (
            <View className="relative">
              <Image
                source={{ uri: item.sender.profileImage }}
                className="w-12 h-12 rounded-full"
              />
              <View className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${config.bgColor} items-center justify-center border-2 border-white`}>
                <Ionicons name={config.icon} size={12} color={config.color} />
              </View>
            </View>
          ) : (
            <View className={`w-12 h-12 rounded-full ${config.bgColor} items-center justify-center`}>
              <Ionicons name={config.icon} size={24} color={config.color} />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          {item.title && (
            <Text className="font-bold text-gray-900 mb-0.5">{item.title}</Text>
          )}
          <Text className="text-gray-800" numberOfLines={2}>
            {item.sender && (
              <Text className="font-semibold">{item.sender.fullName || item.sender.username} </Text>
            )}
            {item.body}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>

        {/* Unread indicator */}
        {!item.isRead && (
          <View className="w-2.5 h-2.5 rounded-full bg-indigo-600 ml-2 mt-1" />
        )}

        {/* Priority indicator */}
        {item.priority === "high" && (
          <Ionicons name="alert-circle" size={16} color="#EF4444" className="ml-1" />
        )}
      </TouchableOpacity>
    );
  }, [handleNotificationPress]);

  const renderHeader = () => (
    <View className="bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        <View className="flex-row items-center">
          {(unreadData?.count || 0) > 0 && (
            <TouchableOpacity
              className="mr-3"
              onPress={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Text className="text-indigo-600 font-medium">Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile/settings")}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category tabs */}
      <View className="flex-row px-4 py-2 border-b border-gray-100">
        {CATEGORY_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === tab.id ? "bg-indigo-600" : "bg-gray-100"
            }`}
            onPress={() => setSelectedCategory(tab.id)}
          >
            <Text
              className={`font-medium text-sm ${
                selectedCategory === tab.id ? "text-white" : "text-gray-600"
              }`}
            >
              {tab.label}
              {unreadData?.byCategory?.[tab.id] > 0 && tab.id !== "all" && (
                <Text> ({unreadData.byCategory[tab.id]})</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      variant="notifications"
      title={selectedCategory !== "all" ? `No ${selectedCategory} notifications` : undefined}
      message={selectedCategory !== "all" ? "Check other categories for notifications" : undefined}
    />
  );

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {renderHeader()}
        <ErrorDisplay
          title="Failed to load notifications"
          message="Check your connection and try again"
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#6366F1"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickyHeaderIndices={[0]}
      />
      {isLoading && (
        <View className="absolute inset-0 bg-white items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
