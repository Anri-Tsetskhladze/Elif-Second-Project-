import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  retryText?: string;
  showReportLink?: boolean;
  fullScreen?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const ErrorDisplay = ({
  title = "Something went wrong",
  message,
  error,
  onRetry,
  retryText = "Try Again",
  showReportLink = false,
  fullScreen = false,
  icon = "alert-circle-outline",
  iconColor = "#EF4444",
}: ErrorDisplayProps) => {
  const errorMessage = message || (error instanceof Error ? error.message : error) || "An unexpected error occurred";

  const handleReportIssue = () => {
    const subject = encodeURIComponent("App Error Report");
    const body = encodeURIComponent(`Error: ${title}\nMessage: ${errorMessage}\n\nPlease describe what you were doing when this error occurred:\n`);
    Linking.openURL(`mailto:support@academyhub.com?subject=${subject}&body=${body}`);
  };

  const content = (
    <>
      <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-4">
        <Ionicons name={icon} size={40} color={iconColor} />
      </View>

      <Text className="text-gray-900 text-xl font-bold text-center mb-2">
        {title}
      </Text>

      <Text className="text-gray-500 text-center px-8 mb-6">
        {errorMessage}
      </Text>

      {onRetry && (
        <TouchableOpacity
          className="bg-indigo-600 px-8 py-3 rounded-xl mb-3"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold">{retryText}</Text>
        </TouchableOpacity>
      )}

      {showReportLink && (
        <TouchableOpacity onPress={handleReportIssue} className="py-2">
          <Text className="text-indigo-600 text-sm">Report this issue</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        {content}
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-12 px-4">
      {content}
    </View>
  );
};

export default ErrorDisplay;
