import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { University } from "@/types";

type SortOption = "newest" | "popular" | "unanswered";

interface PostFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedUniversity?: string;
  onUniversityChange?: (universityId: string | undefined) => void;
  universities?: University[];
  unansweredOnly?: boolean;
  onUnansweredToggle?: (value: boolean) => void;
  showUnansweredFilter?: boolean;
  compact?: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "newest", label: "Newest", icon: "time-outline" },
  { value: "popular", label: "Popular", icon: "trending-up" },
  { value: "unanswered", label: "Unanswered", icon: "help-circle-outline" },
];

const PostFilters = ({
  sortBy,
  onSortChange,
  selectedUniversity,
  onUniversityChange,
  universities,
  unansweredOnly = false,
  onUnansweredToggle,
  showUnansweredFilter = true,
  compact = false,
}: PostFiltersProps) => {
  const [showSortModal, setShowSortModal] = useState(false);
  const [showUniversityModal, setShowUniversityModal] = useState(false);

  const selectedSort = SORT_OPTIONS.find((s) => s.value === sortBy);
  const selectedUni = universities?.find((u) => u._id === selectedUniversity);

  if (compact) {
    return (
      <View className="flex-row items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
        {/* Sort pills */}
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-sm mr-2">Sort:</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`px-3 py-1 rounded-full mr-1 ${
                sortBy === option.value ? "bg-indigo-100" : ""
              }`}
              onPress={() => onSortChange(option.value)}
            >
              <Text
                className={`text-sm ${
                  sortBy === option.value ? "text-indigo-600 font-medium" : "text-gray-500"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Unanswered toggle */}
        {showUnansweredFilter && onUnansweredToggle && sortBy !== "unanswered" && (
          <TouchableOpacity
            className={`flex-row items-center ml-auto px-3 py-1 rounded-full ${
              unansweredOnly ? "bg-amber-100" : "bg-gray-100"
            }`}
            onPress={() => onUnansweredToggle(!unansweredOnly)}
          >
            <Ionicons
              name={unansweredOnly ? "help-circle" : "help-circle-outline"}
              size={14}
              color={unansweredOnly ? "#F59E0B" : "#6B7280"}
            />
            <Text
              className={`text-xs ml-1 ${
                unansweredOnly ? "text-amber-600 font-medium" : "text-gray-500"
              }`}
            >
              Unanswered
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
      <View className="flex-row items-center justify-between">
        {/* Sort dropdown */}
        <TouchableOpacity
          className="flex-row items-center bg-white px-3 py-2 rounded-lg shadow-sm"
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name={selectedSort?.icon || "swap-vertical"} size={16} color="#6366F1" />
          <Text className="text-gray-700 font-medium ml-2">{selectedSort?.label || "Sort"}</Text>
          <Ionicons name="chevron-down" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          {/* University filter */}
          {universities && universities.length > 0 && onUniversityChange && (
            <TouchableOpacity
              className={`flex-row items-center px-3 py-2 rounded-lg ${
                selectedUniversity ? "bg-indigo-100" : "bg-white shadow-sm"
              }`}
              onPress={() => setShowUniversityModal(true)}
            >
              <Ionicons
                name="school-outline"
                size={16}
                color={selectedUniversity ? "#6366F1" : "#6B7280"}
              />
              <Text
                className={`ml-1 text-sm ${
                  selectedUniversity ? "text-indigo-600 font-medium" : "text-gray-600"
                }`}
                numberOfLines={1}
              >
                {selectedUni?.name || "University"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Unanswered toggle */}
          {showUnansweredFilter && onUnansweredToggle && (
            <TouchableOpacity
              className={`flex-row items-center px-3 py-2 rounded-lg ${
                unansweredOnly ? "bg-amber-100" : "bg-white shadow-sm"
              }`}
              onPress={() => onUnansweredToggle(!unansweredOnly)}
            >
              <Ionicons
                name={unansweredOnly ? "help-circle" : "help-circle-outline"}
                size={16}
                color={unansweredOnly ? "#F59E0B" : "#6B7280"}
              />
              <Text
                className={`ml-1 text-sm ${
                  unansweredOnly ? "text-amber-600 font-medium" : "text-gray-600"
                }`}
              >
                Unanswered
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowSortModal(false)}
        >
          <Pressable className="bg-white rounded-t-3xl">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-3" />
            <Text className="text-lg font-semibold text-gray-900 px-4 mb-2">Sort by</Text>

            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row items-center px-4 py-4 border-b border-gray-100 ${
                  sortBy === option.value ? "bg-indigo-50" : ""
                }`}
                onPress={() => {
                  onSortChange(option.value);
                  setShowSortModal(false);
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={sortBy === option.value ? "#6366F1" : "#6B7280"}
                />
                <Text
                  className={`ml-3 text-base ${
                    sortBy === option.value ? "text-indigo-600 font-medium" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#6366F1"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </TouchableOpacity>
            ))}

            <View className="h-8" />
          </Pressable>
        </Pressable>
      </Modal>

      {/* University Modal */}
      <Modal
        visible={showUniversityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUniversityModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowUniversityModal(false)}
        >
          <Pressable className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-3" />
            <Text className="text-lg font-semibold text-gray-900 px-4 mb-2">Filter by University</Text>

            <ScrollView>
              {/* All universities option */}
              <TouchableOpacity
                className={`flex-row items-center px-4 py-4 border-b border-gray-100 ${
                  !selectedUniversity ? "bg-indigo-50" : ""
                }`}
                onPress={() => {
                  onUniversityChange?.(undefined);
                  setShowUniversityModal(false);
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={!selectedUniversity ? "#6366F1" : "#6B7280"}
                />
                <Text
                  className={`ml-3 text-base ${
                    !selectedUniversity ? "text-indigo-600 font-medium" : "text-gray-700"
                  }`}
                >
                  All Universities
                </Text>
                {!selectedUniversity && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#6366F1"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </TouchableOpacity>

              {universities?.map((uni) => (
                <TouchableOpacity
                  key={uni._id}
                  className={`flex-row items-center px-4 py-4 border-b border-gray-100 ${
                    selectedUniversity === uni._id ? "bg-indigo-50" : ""
                  }`}
                  onPress={() => {
                    onUniversityChange?.(uni._id);
                    setShowUniversityModal(false);
                  }}
                >
                  <Ionicons
                    name="school-outline"
                    size={20}
                    color={selectedUniversity === uni._id ? "#6366F1" : "#6B7280"}
                  />
                  <Text
                    className={`ml-3 text-base flex-1 ${
                      selectedUniversity === uni._id ? "text-indigo-600 font-medium" : "text-gray-700"
                    }`}
                    numberOfLines={1}
                  >
                    {uni.name}
                  </Text>
                  {selectedUniversity === uni._id && (
                    <Ionicons name="checkmark" size={20} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="h-8" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default PostFilters;
