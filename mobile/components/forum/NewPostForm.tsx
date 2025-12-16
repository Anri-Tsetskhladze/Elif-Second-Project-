import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Category, University } from "@/types";

interface NewPostFormProps {
  categories: Category[];
  universities?: University[];
  userUniversity?: University | null;
  popularTags?: string[];
  onSubmit: (data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    universityId?: string;
    isQuestion: boolean;
    images: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
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
  general: "#6366F1",
  academics: "#10B981",
  "campus-life": "#F59E0B",
  housing: "#8B5CF6",
  career: "#3B82F6",
  social: "#EC4899",
  help: "#EF4444",
  announcements: "#14B8A6",
};

const NewPostForm = ({
  categories,
  universities,
  userUniversity,
  popularTags = [],
  onSubmit,
  isSubmitting = false,
  onCancel,
}: NewPostFormProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>(
    userUniversity?._id
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isQuestion, setIsQuestion] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUniversityPicker, setShowUniversityPicker] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const filteredTags = popularTags.filter(
    (tag) =>
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !tags.includes(tag)
  );

  const handlePickImage = async () => {
    if (images.length >= 4) {
      Alert.alert("Limit Reached", "You can only add up to 4 images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleanTag && tags.length < 5 && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput("");
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagInputChange = (text: string) => {
    setTagInput(text);
    setShowTagSuggestions(text.length > 0);

    // Add tag on comma or space
    if (text.includes(",") || text.includes(" ")) {
      const newTag = text.replace(/[, ]/g, "");
      if (newTag) addTag(newTag);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
        tags,
        universityId: selectedUniversity,
        isQuestion,
        images,
      });
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const getCategoryColor = (id: string) => CATEGORY_COLORS[id] || "#6366F1";
  const getCategoryIcon = (id: string) => CATEGORY_ICONS[id] || "pricetag";

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="p-4">
          {/* Title input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Title *</Text>
            <TextInput
              className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl px-4 py-3"
              placeholder="What's your post about?"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              multiline
            />
            <Text className="text-gray-400 text-xs text-right mt-1">
              {title.length}/200
            </Text>
          </View>

          {/* Category and Question toggle row */}
          <View className="flex-row items-center mb-4 gap-2">
            {/* Category selector */}
            <TouchableOpacity
              className="flex-row items-center px-3 py-2 rounded-xl bg-gray-50"
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Ionicons
                name={getCategoryIcon(selectedCategory)}
                size={16}
                color={getCategoryColor(selectedCategory)}
              />
              <Text
                style={{ color: getCategoryColor(selectedCategory) }}
                className="font-medium ml-2 capitalize"
              >
                {selectedCategory.replace("-", " ")}
              </Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color="#9CA3AF"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            {/* Question toggle */}
            <TouchableOpacity
              className={`flex-row items-center px-3 py-2 rounded-xl ${
                isQuestion ? "bg-amber-100" : "bg-gray-50"
              }`}
              onPress={() => setIsQuestion(!isQuestion)}
            >
              <Ionicons
                name={isQuestion ? "help-circle" : "help-circle-outline"}
                size={16}
                color={isQuestion ? "#F59E0B" : "#9CA3AF"}
              />
              <Text
                className={`ml-2 font-medium ${
                  isQuestion ? "text-amber-600" : "text-gray-500"
                }`}
              >
                Question
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category picker dropdown */}
          {showCategoryPicker && (
            <View className="bg-gray-50 rounded-xl p-3 mb-4">
              <View className="flex-row flex-wrap gap-2">
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`flex-row items-center px-3 py-2 rounded-lg ${
                      selectedCategory === cat.id ? "bg-white shadow-sm" : ""
                    }`}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat.id)}
                      size={14}
                      color={cat.color || getCategoryColor(cat.id)}
                    />
                    <Text
                      style={{ color: cat.color || getCategoryColor(cat.id) }}
                      className={`ml-1 text-sm ${
                        selectedCategory === cat.id ? "font-medium" : ""
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* University selector */}
          {universities && universities.length > 0 && (
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">University (optional)</Text>
              <TouchableOpacity
                className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                onPress={() => setShowUniversityPicker(!showUniversityPicker)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="school-outline" size={18} color="#6B7280" />
                  <Text className="text-gray-700 ml-2">
                    {selectedUniversity
                      ? universities.find((u) => u._id === selectedUniversity)?.name || "Select university"
                      : "All universities (public)"}
                  </Text>
                </View>
                <Ionicons
                  name={showUniversityPicker ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

              {showUniversityPicker && (
                <View className="bg-gray-50 rounded-xl mt-2 max-h-48">
                  <ScrollView nestedScrollEnabled>
                    <TouchableOpacity
                      className={`px-4 py-3 border-b border-gray-100 ${
                        !selectedUniversity ? "bg-indigo-50" : ""
                      }`}
                      onPress={() => {
                        setSelectedUniversity(undefined);
                        setShowUniversityPicker(false);
                      }}
                    >
                      <Text
                        className={`${
                          !selectedUniversity ? "text-indigo-600 font-medium" : "text-gray-700"
                        }`}
                      >
                        All universities (public)
                      </Text>
                    </TouchableOpacity>
                    {universities.map((uni) => (
                      <TouchableOpacity
                        key={uni._id}
                        className={`px-4 py-3 border-b border-gray-100 ${
                          selectedUniversity === uni._id ? "bg-indigo-50" : ""
                        }`}
                        onPress={() => {
                          setSelectedUniversity(uni._id);
                          setShowUniversityPicker(false);
                        }}
                      >
                        <Text
                          className={`${
                            selectedUniversity === uni._id
                              ? "text-indigo-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {uni.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Content input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Content</Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-700 min-h-[150px]"
              placeholder="Share more details..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />
            <Text className="text-gray-400 text-xs text-right mt-1">
              {content.length}/5000
            </Text>
          </View>

          {/* Tags input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Tags (up to 5)</Text>
            <View className="flex-row flex-wrap items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              {tags.map((tag) => (
                <View
                  key={tag}
                  className="flex-row items-center bg-indigo-100 px-2 py-1 rounded-full"
                >
                  <Text className="text-indigo-600 text-sm">#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => removeTag(tag)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={14} color="#6366F1" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ))}

              {tags.length < 5 && (
                <TextInput
                  className="flex-1 min-w-[100px] py-1 text-base"
                  placeholder={tags.length === 0 ? "Add tags..." : ""}
                  value={tagInput}
                  onChangeText={handleTagInputChange}
                  onSubmitEditing={() => addTag(tagInput)}
                />
              )}
            </View>

            {/* Tag suggestions */}
            {showTagSuggestions && filteredTags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-2">
                {filteredTags.slice(0, 5).map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    className="bg-gray-100 px-3 py-1 rounded-full"
                    onPress={() => addTag(tag)}
                  >
                    <Text className="text-gray-600 text-sm">#{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Images */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Images (up to 4)</Text>
            <View className="flex-row flex-wrap gap-2">
              {images.map((uri, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri }}
                    className="w-24 h-24 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 4 && (
                <TouchableOpacity
                  className="w-24 h-24 rounded-lg bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300"
                  onPress={handlePickImage}
                >
                  <Ionicons name="add" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit footer */}
      <View className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100">
        <View className="flex-row items-center gap-3">
          {onCancel && (
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl border border-gray-300"
              onPress={onCancel}
            >
              <Text className="text-gray-700 text-center font-medium">Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl ${canSubmit ? "bg-indigo-600" : "bg-gray-300"}`}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-medium">Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default NewPostForm;
