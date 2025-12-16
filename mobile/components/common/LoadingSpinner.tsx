import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
  inline?: boolean;
  overlay?: boolean;
}

const LoadingSpinner = ({
  size = "large",
  color = "#6366F1",
  message,
  fullScreen = false,
  inline = false,
  overlay = false,
}: LoadingSpinnerProps) => {
  if (inline) {
    return (
      <View className="flex-row items-center justify-center py-4">
        <ActivityIndicator size={size} color={color} />
        {message && (
          <Text className="text-gray-500 ml-2 text-sm">{message}</Text>
        )}
      </View>
    );
  }

  if (overlay) {
    return (
      <View style={StyleSheet.absoluteFill} className="bg-black/30 items-center justify-center z-50">
        <View className="bg-white rounded-2xl p-6 items-center shadow-lg">
          <ActivityIndicator size={size} color={color} />
          {message && (
            <Text className="text-gray-600 mt-3 text-center">{message}</Text>
          )}
        </View>
      </View>
    );
  }

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size={size} color={color} />
        {message && (
          <Text className="text-gray-500 mt-4 text-center px-8">{message}</Text>
        )}
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-gray-500 mt-3 text-center">{message}</Text>
      )}
    </View>
  );
};

export default LoadingSpinner;
