import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SearchSuggestion } from "@/types";

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  popularSearches: string[];
  isLoading?: boolean;
  onSelectSuggestion: (text: string) => void;
  onClearRecent?: () => void;
  showRecent?: boolean;
}

const SUGGESTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  university: "school-outline",
  subject: "book-outline",
  tag: "pricetag-outline",
};

const SearchSuggestions = ({
  suggestions,
  recentSearches,
  popularSearches,
  isLoading = false,
  onSelectSuggestion,
  onClearRecent,
  showRecent = true,
}: SearchSuggestionsProps) => {
  const hasContent =
    suggestions.length > 0 ||
    (showRecent && recentSearches.length > 0) ||
    popularSearches.length > 0;

  if (isLoading) {
    return (
      <View className="bg-white flex-1 items-center pt-16">
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  if (!hasContent) {
    return (
      <View className="bg-white flex-1 items-center pt-16">
        <Ionicons name="search-outline" size={56} color="#E5E7EB" />
        <Text className="text-gray-400 text-base mt-4">Start typing to search</Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-white flex-1" keyboardShouldPersistTaps="handled">
      {/* Suggestions (while typing) */}
      {suggestions.length > 0 && (
        <View className="py-2">
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion.type}-${suggestion.text}-${index}`}
              className="flex-row items-center px-4 py-3 active:bg-gray-50"
              onPress={() => onSelectSuggestion(suggestion.text)}
            >
              <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                <Ionicons
                  name={SUGGESTION_ICONS[suggestion.type] || "search-outline"}
                  size={18}
                  color="#6B7280"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 text-base">{suggestion.text}</Text>
                <Text className="text-gray-400 text-xs capitalize">{suggestion.type}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent searches */}
      {showRecent && recentSearches.length > 0 && suggestions.length === 0 && (
        <View className="py-2">
          <View className="flex-row items-center justify-between px-4 py-2">
            <Text className="text-gray-500 font-semibold text-sm">Recent Searches</Text>
            {onClearRecent && (
              <TouchableOpacity onPress={onClearRecent}>
                <Text className="text-indigo-600 text-sm">Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={`recent-${search}-${index}`}
              className="flex-row items-center px-4 py-3 active:bg-gray-50"
              onPress={() => onSelectSuggestion(search)}
            >
              <Ionicons name="time-outline" size={20} color="#9CA3AF" />
              <Text className="text-gray-700 text-base ml-3 flex-1">{search}</Text>
              <Ionicons name="arrow-up-outline" size={16} color="#D1D5DB" style={{ transform: [{ rotate: "-45deg" }] }} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Popular searches */}
      {popularSearches.length > 0 && suggestions.length === 0 && (
        <View className="py-3 border-t border-gray-100">
          <View className="px-4 pb-2">
            <Text className="text-gray-500 font-semibold text-sm">Trending Searches</Text>
          </View>
          <View className="flex-row flex-wrap px-4 gap-2 pb-2">
            {popularSearches.map((search, index) => (
              <TouchableOpacity
                key={`popular-${search}-${index}`}
                className="bg-gray-100 px-3 py-2 rounded-full flex-row items-center"
                onPress={() => onSelectSuggestion(search)}
              >
                <Ionicons name="trending-up" size={14} color="#6366F1" />
                <Text className="text-gray-700 text-sm ml-1.5">{search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default SearchSuggestions;
