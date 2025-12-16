import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

interface ReplyComposerProps {
  onSubmit: (content: string, image?: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  replyingTo?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const ReplyComposer = ({
  onSubmit,
  isLoading = false,
  placeholder = "Write a reply...",
  replyingTo,
  onCancel,
  autoFocus = false,
}: ReplyComposerProps) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;

    try {
      await onSubmit(content.trim(), image || undefined);
      setContent("");
      setImage(null);
    } catch (err) {
      console.error("Failed to submit reply:", err);
    }
  };

  const canSubmit = (content.trim().length > 0 || image) && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View className="border-t border-gray-200 bg-white">
        {/* Replying to indicator */}
        {replyingTo && (
          <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <Text className="text-gray-500 text-sm">
              Replying to <Text className="font-medium">@{replyingTo}</Text>
            </Text>
            {onCancel && (
              <TouchableOpacity onPress={onCancel}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Image preview */}
        {image && (
          <View className="px-4 pt-2">
            <View className="relative">
              <Image
                source={{ uri: image }}
                className="w-20 h-20 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
                onPress={() => setImage(null)}
              >
                <Ionicons name="close" size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input area */}
        <View
          className="flex-row items-end px-4 py-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TextInput
            ref={inputRef}
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-base max-h-24"
            placeholder={placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus={autoFocus}
            editable={!isLoading}
          />

          <View className="flex-row items-center ml-2">
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isLoading}
              className="p-2"
            >
              <Ionicons name="image-outline" size={22} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`ml-1 p-2 rounded-full ${canSubmit ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={18} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ReplyComposer;
