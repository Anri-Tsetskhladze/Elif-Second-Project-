import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "@/types";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
  isLoading?: boolean;
  showAllOption?: boolean;
  showIcons?: boolean;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: "apps",
  general: "chatbubbles",
  academics: "school",
  "campus-life": "people",
  housing: "home",
  career: "briefcase",
  social: "heart",
  help: "help-circle",
  announcements: "megaphone",
};

const CATEGORY_COLORS: Record<string, string> = {
  all: "#6366F1",
  general: "#6366F1",
  academics: "#10B981",
  "campus-life": "#F59E0B",
  housing: "#8B5CF6",
  career: "#3B82F6",
  social: "#EC4899",
  help: "#EF4444",
  announcements: "#14B8A6",
};

const CategoryPill = ({
  category,
  isSelected,
  onPress,
  showIcon = true,
}: {
  category: { id: string; name: string; color?: string };
  isSelected: boolean;
  onPress: () => void;
  showIcon?: boolean;
}) => {
  const color = category.color || CATEGORY_COLORS[category.id] || "#6366F1";
  const icon = CATEGORY_ICONS[category.id] || "pricetag";

  return (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
        isSelected ? "" : "bg-gray-100"
      }`}
      style={isSelected ? { backgroundColor: color } : undefined}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showIcon && (
        <Ionicons
          name={icon}
          size={14}
          color={isSelected ? "white" : color}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        className={`text-sm font-medium ${isSelected ? "text-white" : ""}`}
        style={!isSelected ? { color: "#4B5563" } : undefined}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const CategorySelector = ({
  categories,
  selectedCategory,
  onSelect,
  isLoading = false,
  showAllOption = true,
  showIcons = true,
}: CategorySelectorProps) => {
  const allCategories = showAllOption
    ? [{ id: "all", name: "All", color: "#6366F1" }, ...categories]
    : categories;

  if (isLoading) {
    return (
      <View className="px-4 py-4">
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  return (
    <View className="border-b border-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {allCategories.map((category) => (
          <CategoryPill
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            onPress={() => onSelect(category.id)}
            showIcon={showIcons}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default CategorySelector;
