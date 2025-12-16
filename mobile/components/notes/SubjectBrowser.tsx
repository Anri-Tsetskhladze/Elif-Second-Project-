import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SubjectItem {
  subject: string;
  count: number;
}

interface SubjectBrowserProps {
  subjects: SubjectItem[];
  isLoading?: boolean;
  onSelectSubject: (subject: string) => void;
  selectedSubject?: string;
}

const SUBJECT_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
];

const SubjectBrowser = ({
  subjects,
  isLoading = false,
  onSelectSubject,
  selectedSubject,
}: SubjectBrowserProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredSubjects = subjects.filter((s) =>
    s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubjectColor = (index: number) => {
    return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  };

  const renderGridItem = ({ item, index }: { item: SubjectItem; index: number }) => {
    const color = getSubjectColor(index);
    const isSelected = selectedSubject === item.subject;

    return (
      <TouchableOpacity
        className={`flex-1 m-1 p-3 rounded-xl ${isSelected ? "border-2" : ""}`}
        style={{
          backgroundColor: `${color}15`,
          borderColor: isSelected ? color : "transparent",
          minWidth: "45%",
          maxWidth: "48%",
        }}
        onPress={() => onSelectSubject(item.subject)}
      >
        <View className="flex-row items-center justify-between mb-1">
          <Ionicons name="book-outline" size={18} color={color} />
          {isSelected && (
            <Ionicons name="checkmark-circle" size={16} color={color} />
          )}
        </View>
        <Text
          className="font-medium text-gray-900 mt-1"
          numberOfLines={2}
          style={{ fontSize: 13 }}
        >
          {item.subject}
        </Text>
        <Text className="text-gray-500 text-xs mt-1">
          {item.count} {item.count === 1 ? "note" : "notes"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item, index }: { item: SubjectItem; index: number }) => {
    const color = getSubjectColor(index);
    const isSelected = selectedSubject === item.subject;

    return (
      <TouchableOpacity
        className={`flex-row items-center justify-between p-3 border-b border-gray-100 ${
          isSelected ? "bg-indigo-50" : "bg-white"
        }`}
        onPress={() => onSelectSubject(item.subject)}
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-10 h-10 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: `${color}15` }}
          >
            <Ionicons name="book-outline" size={20} color={color} />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900" numberOfLines={1}>
              {item.subject}
            </Text>
            <Text className="text-gray-500 text-sm">
              {item.count} {item.count === 1 ? "note" : "notes"}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isSelected ? "checkmark-circle" : "chevron-forward"}
          size={20}
          color={isSelected ? "#6366F1" : "#9CA3AF"}
        />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-gray-500 mt-2">Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-gray-900 text-lg">Browse by Subject</Text>
          <View className="flex-row items-center bg-gray-100 rounded-lg p-0.5">
            <TouchableOpacity
              className={`px-2 py-1 rounded ${viewMode === "grid" ? "bg-white" : ""}`}
              onPress={() => setViewMode("grid")}
            >
              <Ionicons
                name="grid-outline"
                size={18}
                color={viewMode === "grid" ? "#6366F1" : "#6B7280"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-2 py-1 rounded ${viewMode === "list" ? "bg-white" : ""}`}
              onPress={() => setViewMode("list")}
            >
              <Ionicons
                name="list-outline"
                size={18}
                color={viewMode === "list" ? "#6366F1" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-2 px-2 text-gray-900"
            placeholder="Search subjects..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subject List */}
      {filteredSubjects.length === 0 ? (
        <View className="flex-1 items-center justify-center py-8">
          <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-400 mt-2">
            {searchQuery ? "No subjects found" : "No subjects available"}
          </Text>
        </View>
      ) : viewMode === "grid" ? (
        <FlatList
          data={filteredSubjects}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.subject}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredSubjects}
          renderItem={renderListItem}
          keyExtractor={(item) => item.subject}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Selected Subject Clear */}
      {selectedSubject && (
        <View className="p-4 border-t border-gray-200">
          <View className="flex-row items-center justify-between bg-indigo-50 p-3 rounded-lg">
            <View className="flex-row items-center flex-1">
              <Ionicons name="book" size={18} color="#6366F1" />
              <Text className="text-indigo-700 font-medium ml-2" numberOfLines={1}>
                {selectedSubject}
              </Text>
            </View>
            <TouchableOpacity
              className="ml-2 p-1"
              onPress={() => onSelectSubject("")}
            >
              <Ionicons name="close-circle" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default SubjectBrowser;
