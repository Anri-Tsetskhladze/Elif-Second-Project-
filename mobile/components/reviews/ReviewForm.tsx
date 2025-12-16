import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { University, CategoryRatings } from "@/types";
import StarRating from "./StarRating";

interface ReviewFormProps {
  university: University & { city?: string; state?: string };
  onSubmit: (data: ReviewFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<ReviewFormData>;
}

export interface ReviewFormData {
  overallRating: number;
  categoryRatings: CategoryRatings;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  isAnonymous: boolean;
}

const CATEGORY_LABELS: Record<keyof CategoryRatings, string> = {
  academics: "Academics",
  campusLife: "Campus Life",
  facilities: "Facilities",
  value: "Value for Money",
  location: "Location",
  safety: "Safety",
};

const ReviewForm = ({
  university,
  onSubmit,
  isLoading = false,
  initialData,
}: ReviewFormProps) => {
  const [overallRating, setOverallRating] = useState(initialData?.overallRating || 0);
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>(
    initialData?.categoryRatings || {}
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [pros, setPros] = useState<string[]>(initialData?.pros || []);
  const [cons, setCons] = useState<string[]>(initialData?.cons || []);
  const [isAnonymous, setIsAnonymous] = useState(initialData?.isAnonymous || false);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  const handleCategoryRating = (key: keyof CategoryRatings, value: number) => {
    setCategoryRatings(prev => ({ ...prev, [key]: value }));
  };

  const addPro = () => {
    if (newPro.trim() && pros.length < 5) {
      setPros([...pros, newPro.trim()]);
      setNewPro("");
    }
  };

  const removePro = (index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  };

  const addCon = () => {
    if (newCon.trim() && cons.length < 5) {
      setCons([...cons, newCon.trim()]);
      setNewCon("");
    }
  };

  const removeCon = (index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert("Error", "Please provide an overall rating");
      return;
    }

    if (content.length < 100) {
      Alert.alert("Error", "Review must be at least 100 characters");
      return;
    }

    await onSubmit({
      overallRating,
      categoryRatings,
      title,
      content,
      pros,
      cons,
      isAnonymous,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        {/* University Header */}
        <View className="p-4 border-b border-gray-100 bg-gray-50">
          <View className="flex-row items-center">
            {university.images?.logo && (
              <Image
                source={{ uri: university.images.logo }}
                className="w-12 h-12 rounded-lg mr-3"
              />
            )}
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-lg">
                {university.name}
              </Text>
              {(university.city || university.state) && (
                <Text className="text-gray-500 text-sm">
                  {[university.city, university.state].filter(Boolean).join(", ")}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className="p-4">
          {/* Overall Rating */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">Overall Rating *</Text>
            <View className="flex-row items-center">
              <StarRating value={overallRating} onChange={setOverallRating} size={32} />
              {overallRating > 0 && (
                <Text className="ml-3 text-amber-600 font-semibold text-lg">
                  {overallRating}.0
                </Text>
              )}
            </View>
          </View>

          {/* Category Ratings */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-3">Category Ratings</Text>
            <View className="bg-gray-50 p-3 rounded-lg">
              {(Object.keys(CATEGORY_LABELS) as Array<keyof CategoryRatings>).map((key) => (
                <View key={key} className="flex-row items-center justify-between mb-3 last:mb-0">
                  <Text className="text-gray-700 text-sm flex-1">{CATEGORY_LABELS[key]}</Text>
                  <StarRating
                    value={categoryRatings[key] || 0}
                    onChange={(v) => handleCategoryRating(key, v)}
                    size={20}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Title */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Title</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholder="Summarize your experience"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Content */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Your Review *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[120px]"
              placeholder="Share your experience (minimum 100 characters)"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text className={`text-xs mt-1 ${content.length < 100 ? "text-red-500" : "text-gray-400"}`}>
              {content.length}/2000 (min 100)
            </Text>
          </View>

          {/* Pros */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">
              Pros <Text className="text-gray-400 font-normal">({pros.length}/5)</Text>
            </Text>
            {pros.map((pro, idx) => (
              <View key={idx} className="flex-row items-center bg-green-50 rounded-lg px-3 py-2 mb-2">
                <Ionicons name="add-circle" size={16} color="#16A34A" />
                <Text className="flex-1 text-gray-700 ml-2">{pro}</Text>
                <TouchableOpacity onPress={() => removePro(idx)}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
            {pros.length < 5 && (
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Add a pro"
                  value={newPro}
                  onChangeText={setNewPro}
                  maxLength={150}
                  onSubmitEditing={addPro}
                />
                <TouchableOpacity
                  className="ml-2 bg-green-600 rounded-lg px-3 py-2"
                  onPress={addPro}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Cons */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">
              Cons <Text className="text-gray-400 font-normal">({cons.length}/5)</Text>
            </Text>
            {cons.map((con, idx) => (
              <View key={idx} className="flex-row items-center bg-red-50 rounded-lg px-3 py-2 mb-2">
                <Ionicons name="remove-circle" size={16} color="#DC2626" />
                <Text className="flex-1 text-gray-700 ml-2">{con}</Text>
                <TouchableOpacity onPress={() => removeCon(idx)}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
            {cons.length < 5 && (
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Add a con"
                  value={newCon}
                  onChangeText={setNewCon}
                  maxLength={150}
                  onSubmitEditing={addCon}
                />
                <TouchableOpacity
                  className="ml-2 bg-red-600 rounded-lg px-3 py-2"
                  onPress={addCon}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Anonymous Toggle */}
          <View className="flex-row items-center justify-between mb-6 bg-gray-50 p-3 rounded-lg">
            <View className="flex-1 mr-3">
              <Text className="font-medium text-gray-900">Post Anonymously</Text>
              <Text className="text-gray-500 text-sm">
                Your name won't be shown with this review
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: "#D1D5DB", true: "#A5B4FC" }}
              thumbColor={isAnonymous ? "#6366F1" : "#F3F4F6"}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`py-4 rounded-xl items-center ${
              isLoading ? "bg-gray-300" : "bg-indigo-600"
            }`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text className="text-white font-semibold text-base">
              {isLoading ? "Submitting..." : "Submit Review"}
            </Text>
          </TouchableOpacity>

          <View className="h-8" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ReviewForm;
