import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NoteType } from "@/types";

type SortOption = "newest" | "popular" | "mostDownloaded";

interface NoteFiltersProps {
  subject?: string;
  course?: string;
  noteType?: NoteType;
  sortBy: SortOption;
  onSubjectChange: (subject: string | undefined) => void;
  onCourseChange: (course: string | undefined) => void;
  onNoteTypeChange: (type: NoteType | undefined) => void;
  onSortChange: (sort: SortOption) => void;
  onSearch?: (query: string) => void;
  subjectSuggestions?: string[];
  courseSuggestions?: string[];
}

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "lecture", label: "Lecture" },
  { value: "exam", label: "Exam" },
  { value: "summary", label: "Summary" },
  { value: "assignment", label: "Assignment" },
  { value: "lab", label: "Lab" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "newest", label: "Newest", icon: "time-outline" },
  { value: "popular", label: "Popular", icon: "flame-outline" },
  { value: "mostDownloaded", label: "Downloads", icon: "download-outline" },
];

const NoteFilters = ({
  subject,
  course,
  noteType,
  sortBy,
  onSubjectChange,
  onCourseChange,
  onNoteTypeChange,
  onSortChange,
  onSearch,
  subjectSuggestions = [],
  courseSuggestions = [],
}: NoteFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectInput, setSubjectInput] = useState(subject || "");
  const [courseInput, setCourseInput] = useState(course || "");
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);

  const hasActiveFilters = subject || course || noteType;

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const clearFilters = () => {
    onSubjectChange(undefined);
    onCourseChange(undefined);
    onNoteTypeChange(undefined);
    setSubjectInput("");
    setCourseInput("");
  };

  const handleSubjectSelect = (selected: string) => {
    setSubjectInput(selected);
    onSubjectChange(selected);
    setShowSubjectSuggestions(false);
  };

  const handleCourseSelect = (selected: string) => {
    setCourseInput(selected);
    onCourseChange(selected);
    setShowCourseSuggestions(false);
  };

  return (
    <View className="bg-white border-b border-gray-100">
      {/* Search Bar */}
      {onSearch && (
        <View className="px-4 py-2 border-b border-gray-50">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-2 px-2 text-gray-900"
              placeholder="Search notes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2"
      >
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 ${
              sortBy === option.value ? "bg-indigo-100" : "bg-gray-100"
            }`}
            onPress={() => onSortChange(option.value)}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={sortBy === option.value ? "#6366F1" : "#6B7280"}
            />
            <Text
              className={`ml-1 text-sm ${
                sortBy === option.value ? "text-indigo-700 font-medium" : "text-gray-600"
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Filter Button */}
        <TouchableOpacity
          className={`flex-row items-center px-3 py-1.5 rounded-full ${
            hasActiveFilters ? "bg-indigo-600" : "bg-gray-100"
          }`}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={hasActiveFilters ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            className={`ml-1 text-sm ${
              hasActiveFilters ? "text-white font-medium" : "text-gray-600"
            }`}
          >
            Filters
            {hasActiveFilters && " (active)"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <View className="flex-row flex-wrap px-4 pb-2 gap-1">
          {subject && (
            <TouchableOpacity
              className="flex-row items-center bg-indigo-100 px-2 py-1 rounded-full"
              onPress={() => {
                onSubjectChange(undefined);
                setSubjectInput("");
              }}
            >
              <Text className="text-indigo-700 text-xs mr-1">{subject}</Text>
              <Ionicons name="close" size={12} color="#6366F1" />
            </TouchableOpacity>
          )}
          {course && (
            <TouchableOpacity
              className="flex-row items-center bg-gray-200 px-2 py-1 rounded-full"
              onPress={() => {
                onCourseChange(undefined);
                setCourseInput("");
              }}
            >
              <Text className="text-gray-700 text-xs mr-1">{course}</Text>
              <Ionicons name="close" size={12} color="#374151" />
            </TouchableOpacity>
          )}
          {noteType && (
            <TouchableOpacity
              className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full"
              onPress={() => onNoteTypeChange(undefined)}
            >
              <Text className="text-amber-700 text-xs mr-1">
                {NOTE_TYPES.find((t) => t.value === noteType)?.label}
              </Text>
              <Ionicons name="close" size={12} color="#B45309" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="px-2 py-1"
            onPress={clearFilters}
          >
            <Text className="text-red-500 text-xs">Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text className="text-gray-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="font-semibold text-gray-900">Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-indigo-600">Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Subject Filter */}
            <View className="mb-6">
              <Text className="font-medium text-gray-900 mb-2">Subject</Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter subject"
                  value={subjectInput}
                  onChangeText={(text) => {
                    setSubjectInput(text);
                    setShowSubjectSuggestions(text.length >= 2);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSubjectSuggestions(false), 200);
                    if (subjectInput) onSubjectChange(subjectInput);
                  }}
                />
                {showSubjectSuggestions && subjectSuggestions.length > 0 && (
                  <View className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40">
                    {subjectSuggestions.map((s, idx) => (
                      <TouchableOpacity
                        key={idx}
                        className="px-3 py-2 border-b border-gray-100"
                        onPress={() => handleSubjectSelect(s)}
                      >
                        <Text className="text-gray-700">{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Course Filter */}
            <View className="mb-6">
              <Text className="font-medium text-gray-900 mb-2">Course</Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter course code"
                  value={courseInput}
                  onChangeText={(text) => {
                    setCourseInput(text);
                    setShowCourseSuggestions(text.length >= 2);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowCourseSuggestions(false), 200);
                    if (courseInput) onCourseChange(courseInput);
                  }}
                />
                {showCourseSuggestions && courseSuggestions.length > 0 && (
                  <View className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40">
                    {courseSuggestions.map((c, idx) => (
                      <TouchableOpacity
                        key={idx}
                        className="px-3 py-2 border-b border-gray-100"
                        onPress={() => handleCourseSelect(c)}
                      >
                        <Text className="text-gray-700">{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Note Type Filter */}
            <View className="mb-6">
              <Text className="font-medium text-gray-900 mb-2">Note Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {NOTE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    className={`px-3 py-2 rounded-lg border ${
                      noteType === type.value
                        ? "bg-indigo-100 border-indigo-300"
                        : "bg-white border-gray-300"
                    }`}
                    onPress={() =>
                      onNoteTypeChange(noteType === type.value ? undefined : type.value)
                    }
                  >
                    <Text
                      className={
                        noteType === type.value ? "text-indigo-700 font-medium" : "text-gray-700"
                      }
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity
              className="bg-indigo-600 py-3 rounded-xl items-center"
              onPress={() => setShowFilters(false)}
            >
              <Text className="text-white font-semibold">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NoteFilters;
