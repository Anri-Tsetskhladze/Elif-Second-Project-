import { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface GlobalSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const GlobalSearchBar = ({
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = "Search universities, users, posts...",
  autoFocus = false,
  showBackButton = false,
  onBackPress,
}: GlobalSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const animatedWidth = useRef(new Animated.Value(showBackButton ? 0.85 : 1)).current;

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText("");
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (value.trim().length >= 2) {
      Keyboard.dismiss();
      onSubmit(value.trim());
    }
  };

  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
      {showBackButton && (
        <TouchableOpacity
          onPress={onBackPress}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      )}

      <View
        className={`flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2.5 ${
          isFocused ? "border border-indigo-400" : "border border-transparent"
        }`}
      >
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? "#6366F1" : "#9CA3AF"}
        />

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 ml-3 text-base text-gray-900"
          style={{ paddingVertical: 0 }}
        />

        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} className="p-1 ml-1">
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {isFocused && value.length === 0 && (
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            handleBlur();
          }}
          className="ml-3 p-1"
        >
          <Ionicons name="close" size={22} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default GlobalSearchBar;
