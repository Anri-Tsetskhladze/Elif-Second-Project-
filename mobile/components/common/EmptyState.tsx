import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type EmptyStateVariant =
  | "posts"
  | "notes"
  | "reviews"
  | "universities"
  | "search"
  | "notifications"
  | "messages"
  | "saved"
  | "followers"
  | "following"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  message: string;
}> = {
  posts: {
    icon: "chatbubbles-outline",
    iconColor: "#6366F1",
    title: "No posts yet",
    message: "Be the first to start a discussion!",
  },
  notes: {
    icon: "document-text-outline",
    iconColor: "#8B5CF6",
    title: "No notes found",
    message: "Upload your first note to help others learn",
  },
  reviews: {
    icon: "star-outline",
    iconColor: "#F59E0B",
    title: "No reviews yet",
    message: "Share your experience with this university",
  },
  universities: {
    icon: "school-outline",
    iconColor: "#6366F1",
    title: "No universities found",
    message: "Try adjusting your search criteria",
  },
  search: {
    icon: "search-outline",
    iconColor: "#9CA3AF",
    title: "No results found",
    message: "Try different keywords or filters",
  },
  notifications: {
    icon: "notifications-outline",
    iconColor: "#6366F1",
    title: "No notifications",
    message: "You're all caught up!",
  },
  messages: {
    icon: "chatbubble-outline",
    iconColor: "#6366F1",
    title: "No messages",
    message: "Start a conversation with someone",
  },
  saved: {
    icon: "bookmark-outline",
    iconColor: "#6366F1",
    title: "Nothing saved yet",
    message: "Save posts and notes to find them here",
  },
  followers: {
    icon: "people-outline",
    iconColor: "#6366F1",
    title: "No followers yet",
    message: "Share content to grow your audience",
  },
  following: {
    icon: "person-add-outline",
    iconColor: "#6366F1",
    title: "Not following anyone",
    message: "Find people to follow and see their content",
  },
  generic: {
    icon: "folder-open-outline",
    iconColor: "#9CA3AF",
    title: "Nothing here",
    message: "There's nothing to display at the moment",
  },
};

const EmptyState = ({
  variant = "generic",
  icon,
  iconColor,
  title,
  message,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}: EmptyStateProps) => {
  const config = VARIANT_CONFIG[variant];

  const displayIcon = icon || config.icon;
  const displayIconColor = iconColor || config.iconColor;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <View className="items-center justify-center py-16 px-8">
      <View
        className="w-24 h-24 rounded-full items-center justify-center mb-5"
        style={{ backgroundColor: `${displayIconColor}15` }}
      >
        <Ionicons name={displayIcon} size={48} color={displayIconColor} />
      </View>

      <Text className="text-gray-900 text-xl font-bold text-center mb-2">
        {displayTitle}
      </Text>

      <Text className="text-gray-500 text-center mb-6">
        {displayMessage}
      </Text>

      {onAction && actionText && (
        <TouchableOpacity
          className="bg-indigo-600 px-6 py-3 rounded-xl mb-3"
          onPress={onAction}
        >
          <Text className="text-white font-semibold">{actionText}</Text>
        </TouchableOpacity>
      )}

      {onSecondaryAction && secondaryActionText && (
        <TouchableOpacity onPress={onSecondaryAction} className="py-2">
          <Text className="text-indigo-600">{secondaryActionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
