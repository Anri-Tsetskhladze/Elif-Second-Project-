import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useCategories, useForumActions } from "@/hooks/useForum";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Category } from "@/types";

const NewPostScreen = () => {
  const router = useRouter();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { createPost, isCreatingPost } = useForumActions();
  const { currentUser } = useCurrentUser();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handlePickImage = async () => {
    if (images.length >= 4) {
      Alert.alert("Limit reached", "You can only add up to 4 images");
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("category", selectedCategory);
      formData.append("isQuestion", String(isQuestion));

      if (tags.trim()) {
        formData.append("tags", tags.trim());
      }

      images.forEach((uri, index) => {
        formData.append("images", {
          uri,
          type: "image/jpeg",
          name: `image_${index}.jpg`,
        } as any);
      });

      await createPost(formData);
      router.back();
    } catch (err) {
      console.error("Failed to create post:", err);
      Alert.alert("Error", "Failed to create post. Please try again.");
    }
  };

  const canSubmit = title.trim().length > 0 && !isCreatingPost;

  const getCategoryInfo = (id: string): Category | undefined => {
    return categories?.find((c) => c.id === id);
  };

  const selectedCategoryInfo = getCategoryInfo(selectedCategory);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "New Post",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-2">
              <Text className="text-gray-500">Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`px-4 py-1.5 rounded-full ${canSubmit ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              {isCreatingPost ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-medium">Post</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4">
            {/* Title */}
            <TextInput
              className="text-xl font-semibold text-gray-900 mb-3"
              placeholder="Post title"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              multiline
            />

            {/* Category selector */}
            <TouchableOpacity
              className="flex-row items-center mb-4"
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full mr-2"
                style={{ backgroundColor: `${selectedCategoryInfo?.color || "#6366F1"}15` }}
              >
                <Text
                  style={{ color: selectedCategoryInfo?.color || "#6366F1" }}
                  className="text-sm font-medium capitalize"
                >
                  {selectedCategory.replace("-", " ")}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={selectedCategoryInfo?.color || "#6366F1"}
                  style={{ marginLeft: 4 }}
                />
              </View>

              {/* Question toggle */}
              <TouchableOpacity
                className={`flex-row items-center px-3 py-1.5 rounded-full ${
                  isQuestion ? "bg-amber-100" : "bg-gray-100"
                }`}
                onPress={() => setIsQuestion(!isQuestion)}
              >
                <Ionicons
                  name={isQuestion ? "help-circle" : "help-circle-outline"}
                  size={16}
                  color={isQuestion ? "#F59E0B" : "#6B7280"}
                />
                <Text
                  className={`ml-1 text-sm ${isQuestion ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Question
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Category picker dropdown */}
            {showCategoryPicker && (
              <View className="bg-gray-50 rounded-xl p-2 mb-4">
                {categoriesLoading ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {categories?.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        className={`px-3 py-2 rounded-lg ${
                          selectedCategory === cat.id ? "bg-white shadow-sm" : ""
                        }`}
                        onPress={() => {
                          setSelectedCategory(cat.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text
                          style={{ color: cat.color }}
                          className={`text-sm ${selectedCategory === cat.id ? "font-medium" : ""}`}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Content */}
            <TextInput
              className="text-base text-gray-700 min-h-[150px]"
              placeholder="Write your post content..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />

            {/* Images */}
            {images.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-4">
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
              </View>
            )}

            {/* Tags */}
            <View className="mt-4">
              <Text className="text-gray-500 text-sm mb-1">Tags (comma separated)</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                placeholder="study, exam, help..."
                value={tags}
                onChangeText={setTags}
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom toolbar */}
        <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
          <TouchableOpacity
            className="flex-row items-center mr-4"
            onPress={handlePickImage}
          >
            <Ionicons name="image-outline" size={24} color="#6B7280" />
            <Text className="text-gray-500 ml-1">{images.length}/4</Text>
          </TouchableOpacity>

          <View className="flex-1" />

          <Text className="text-gray-400 text-sm">
            {content.length}/5000
          </Text>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

export default NewPostScreen;
