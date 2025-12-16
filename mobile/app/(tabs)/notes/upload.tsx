import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useApiClient, noteApi } from "@/utils/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const NOTE_TYPES = [
  { id: "lecture", label: "Lecture Notes", icon: "book-outline" },
  { id: "exam", label: "Exam/Quiz", icon: "document-text-outline" },
  { id: "summary", label: "Summary", icon: "list-outline" },
  { id: "assignment", label: "Assignment", icon: "clipboard-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

const SEMESTERS = [
  "Fall 2024",
  "Spring 2024",
  "Fall 2023",
  "Spring 2023",
  "Summer 2024",
  "Summer 2023",
];

const UploadNoteScreen = () => {
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    course: "",
    professor: "",
    semester: "",
    noteType: "lecture",
    tags: "",
  });
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Subject suggestions
  const { data: subjectSuggestions } = useQuery({
    queryKey: ["subject-suggestions", formData.subject],
    queryFn: () =>
      noteApi.getSubjectSuggestions(api, formData.subject, currentUser?.university?._id),
    select: (res) => res.data.suggestions || [],
    enabled: formData.subject.length >= 2,
  });

  // Course suggestions
  const { data: courseSuggestions } = useQuery({
    queryKey: ["course-suggestions", formData.course],
    queryFn: () =>
      noteApi.getCourseSuggestions(api, formData.course, currentUser?.university?._id),
    select: (res) => res.data.suggestions || [],
    enabled: formData.course.length >= 2,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await noteApi.create(api, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["user-notes"] });
      Alert.alert("Success", "Note uploaded successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.response?.data?.error || "Failed to upload note");
    },
  });

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "image/*",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!selectedFile) {
      Alert.alert("Error", "Please select a file to upload");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("title", formData.title.trim());
    if (formData.description) uploadData.append("description", formData.description.trim());
    if (formData.subject) uploadData.append("subject", formData.subject.trim());
    if (formData.course) uploadData.append("course", formData.course.trim());
    if (formData.professor) uploadData.append("professor", formData.professor.trim());
    if (formData.semester) uploadData.append("semester", formData.semester);
    uploadData.append("noteType", formData.noteType);
    if (formData.tags) {
      uploadData.append(
        "tags",
        JSON.stringify(formData.tags.split(",").map((t) => t.trim()).filter(Boolean))
      );
    }
    if (currentUser?.university?._id) {
      uploadData.append("universityId", currentUser.university._id);
    }

    uploadData.append("file", {
      uri: selectedFile.uri,
      type: selectedFile.mimeType || "application/octet-stream",
      name: selectedFile.name,
    } as any);

    uploadMutation.mutate(uploadData);
  }, [formData, selectedFile, currentUser, uploadMutation]);

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.includes("pdf")) return "document";
    if (mimeType?.includes("word")) return "document-text";
    if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint")) return "easel";
    if (mimeType?.includes("image")) return "image";
    return "document-text";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/(tabs)/notes")}>
              <Text className="text-gray-600 text-base">Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Text className="text-indigo-600 font-semibold text-base">Upload</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* File Selection */}
          <View className="px-4 py-4 border-b border-gray-100">
            <Text className="font-semibold text-gray-900 mb-3">Select File *</Text>
            {selectedFile ? (
              <View className="bg-indigo-50 rounded-xl p-4 flex-row items-center">
                <View className="w-12 h-12 bg-indigo-100 rounded-xl items-center justify-center mr-3">
                  <Ionicons
                    name={getFileIcon(selectedFile.mimeType) as any}
                    size={24}
                    color="#6366F1"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center"
                onPress={pickDocument}
              >
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="cloud-upload-outline" size={32} color="#6B7280" />
                </View>
                <Text className="text-gray-900 font-medium">Tap to select a file</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  PDF, DOC, PPT, or images up to 25MB
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form Fields */}
          <View className="px-4 py-4">
            {/* Title */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-1">Title *</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g. CS101 Midterm Review Notes"
                placeholderTextColor="#9CA3AF"
                value={formData.title}
                onChangeText={(text) => updateField("title", text)}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-1">Description</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 min-h-[100px]"
                placeholder="Describe what's in these notes..."
                placeholderTextColor="#9CA3AF"
                value={formData.description}
                onChangeText={(text) => updateField("description", text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Note Type */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-2">Note Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {NOTE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    className={`flex-row items-center px-4 py-2 rounded-xl ${
                      formData.noteType === type.id ? "bg-indigo-600" : "bg-gray-100"
                    }`}
                    onPress={() => updateField("noteType", type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={formData.noteType === type.id ? "#fff" : "#6B7280"}
                    />
                    <Text
                      className={`ml-1 font-medium ${
                        formData.noteType === type.id ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-1">Subject</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g. Computer Science"
                placeholderTextColor="#9CA3AF"
                value={formData.subject}
                onChangeText={(text) => updateField("subject", text)}
              />
              {subjectSuggestions && subjectSuggestions.length > 0 && formData.subject.length >= 2 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-2"
                >
                  {subjectSuggestions.map((suggestion: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      className="bg-gray-50 px-3 py-1 rounded-full mr-2"
                      onPress={() => updateField("subject", suggestion)}
                    >
                      <Text className="text-gray-600 text-sm">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Course */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-1">Course Code</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g. CS101"
                placeholderTextColor="#9CA3AF"
                value={formData.course}
                onChangeText={(text) => updateField("course", text)}
                autoCapitalize="characters"
              />
            </View>

            {/* Professor */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-1">Professor (optional)</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g. Prof. Smith"
                placeholderTextColor="#9CA3AF"
                value={formData.professor}
                onChangeText={(text) => updateField("professor", text)}
                autoCapitalize="words"
              />
            </View>

            {/* Semester */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-2">Semester</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {SEMESTERS.map((semester) => (
                  <TouchableOpacity
                    key={semester}
                    className={`px-4 py-2 rounded-xl mr-2 ${
                      formData.semester === semester ? "bg-indigo-600" : "bg-gray-100"
                    }`}
                    onPress={() => updateField("semester", semester)}
                  >
                    <Text
                      className={`font-medium ${
                        formData.semester === semester ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {semester}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tags */}
            <View className="mb-4">
              <Text className="font-medium text-gray-700 mb-1">Tags</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g. midterm, review, algorithms"
                placeholderTextColor="#9CA3AF"
                value={formData.tags}
                onChangeText={(text) => updateField("tags", text)}
              />
              <Text className="text-gray-400 text-xs mt-1">Separate tags with commas</Text>
            </View>

            {/* University Info */}
            {currentUser?.university && (
              <View className="bg-indigo-50 rounded-xl p-4 flex-row items-center">
                <Ionicons name="school" size={20} color="#6366F1" />
                <Text className="text-indigo-700 ml-2 flex-1">
                  This note will be tagged with {currentUser.university.name}
                </Text>
              </View>
            )}
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UploadNoteScreen;
