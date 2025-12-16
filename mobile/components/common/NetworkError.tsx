import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
  fullScreen?: boolean;
  compact?: boolean;
}

const NetworkError = ({
  onRetry,
  message = "No internet connection",
  fullScreen = false,
  compact = false,
}: NetworkErrorProps) => {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  const isOnline = isConnected && isInternetReachable !== false;

  if (compact) {
    return (
      <View className="bg-red-50 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="cloud-offline-outline" size={20} color="#EF4444" />
          <Text className="text-red-700 ml-2 flex-1">{message}</Text>
        </View>
        {isOnline && onRetry && (
          <TouchableOpacity onPress={onRetry} className="ml-2">
            <Text className="text-red-700 font-semibold">Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const content = (
    <>
      <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-5">
        <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
      </View>

      <Text className="text-gray-900 text-xl font-bold text-center mb-2">
        {isOnline ? "Connection Error" : "You're Offline"}
      </Text>

      <Text className="text-gray-500 text-center px-8 mb-6">
        {isOnline
          ? "Unable to connect to the server. Please try again."
          : "Check your internet connection and try again."}
      </Text>

      {isOnline && onRetry && (
        <TouchableOpacity
          className="bg-indigo-600 px-8 py-3 rounded-xl"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      )}

      {!isOnline && (
        <View className="flex-row items-center bg-amber-50 px-4 py-3 rounded-xl">
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text className="text-amber-700 ml-2 text-sm">
            Waiting for connection...
          </Text>
        </View>
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
    <View className="items-center justify-center py-16 px-4">
      {content}
    </View>
  );
};

export default NetworkError;
