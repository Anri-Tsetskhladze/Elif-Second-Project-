import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { University, NoteType } from "@/types";
import { useSubjectSuggestions, useCourseSuggestions } from "@/hooks/useNotes";

interface NoteUploadFormProps {
  university: University & { city?: string; state?: string };
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading?: boolean;
}

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "lecture", label: "Lecture Notes" },
  { value: "exam", label: "Exam / Quiz" },
  { value: "summary", label: "Summary" },
  { value: "assignment", label: "Assignment" },
  { value: "lab", label: "Lab Report" },
  { value: "other", label: "Other" },
];

const SEMESTERS = [
  "Fall 2024",
  "Spring 2024",
  "Summer 2024",
  "Fall 2023",
  "Spring 2023",
];

const SUPPORTED_FORMATS = "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, Images";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 10;

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const NoteUploadForm = ({
  university,
  onSubmit,
  isLoading = false,
}: NoteUploadFormProps) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("");
  const [professor, setProfessor] = useState("");
  const [semester, setSemester] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("lecture");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: subjectSuggestions } = useSubjectSuggestions(subject, university._id);
  const { data: courseSuggestions } = useCourseSuggestions(course, university._id);

  const pickDocument = async () => {
    if (files.length >= MAX_FILES) {
      Alert.alert("Limit Reached", `Maximum ${MAX_FILES} files allowed`);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets
          .filter((asset) => {
            if (asset.size && asset.size > MAX_FILE_SIZE) {
              Alert.alert("File Too Large", `${asset.name} exceeds 25MB limit`);
              return false;
            }
            return true;
          })
          .map((asset) => ({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || "application/octet-stream",
            size: asset.size,
          }));

        setFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
      }
    } catch (error) {
      console.error("Document picker error:", error);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    if (files.length >= MAX_FILES) {
      Alert.alert("Limit Reached", `Maximum ${MAX_FILES} files allowed`);
      return;
    }

    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant access to continue");
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: MAX_FILES - files.length,
          });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
          size: asset.fileSize,
        }));

        setFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      Alert.alert("Error", "Please select at least one file");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (!subject.trim()) {
      Alert.alert("Error", "Please enter a subject");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("subject", subject.trim());
    formData.append("noteType", noteType);
    formData.append("universityId", university._id);

    if (description.trim()) formData.append("description", description.trim());
    if (course.trim()) formData.append("course", course.trim().toUpperCase());
    if (professor.trim()) formData.append("professor", professor.trim());
    if (semester) formData.append("semester", semester);
    if (tags.length > 0) formData.append("tags", JSON.stringify(tags));

    files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    await onSubmit(formData);
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
          {/* File Upload */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">
              Files * <Text className="font-normal text-gray-500">({files.length}/{MAX_FILES})</Text>
            </Text>
            <Text className="text-gray-500 text-xs mb-3">
              Supported: {SUPPORTED_FORMATS} (max 25MB each)
            </Text>

            {/* Upload Buttons */}
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-3 bg-indigo-50 rounded-lg border border-indigo-200"
                onPress={pickDocument}
              >
                <Ionicons name="document-attach" size={20} color="#6366F1" />
                <Text className="text-indigo-700 font-medium ml-2">Document</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-3 bg-purple-50 rounded-lg border border-purple-200"
                onPress={() => pickImage(false)}
              >
                <Ionicons name="images" size={20} color="#8B5CF6" />
                <Text className="text-purple-700 font-medium ml-2">Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-3 bg-green-50 rounded-lg border border-green-200"
                onPress={() => pickImage(true)}
              >
                <Ionicons name="camera" size={20} color="#22C55E" />
                <Text className="text-green-700 font-medium ml-2">Camera</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Files */}
            {files.map((file, idx) => (
              <View
                key={idx}
                className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 mb-2"
              >
                <Ionicons
                  name={file.type.includes("image") ? "image" : "document"}
                  size={20}
                  color="#6366F1"
                />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-700 text-sm" numberOfLines={1}>
                    {file.name}
                  </Text>
                  {file.size && (
                    <Text className="text-gray-400 text-xs">
                      {formatFileSize(file.size)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removeFile(idx)}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Title */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Title *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholder="Enter a descriptive title"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Description</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px]"
              placeholder="What's in these notes?"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>

          {/* Subject */}
          <View className="mb-4 relative">
            <Text className="font-semibold text-gray-900 mb-2">Subject *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholder="e.g., Computer Science, Biology"
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                setShowSubjectSuggestions(text.length >= 2);
              }}
              onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 200)}
            />
            {showSubjectSuggestions && subjectSuggestions && subjectSuggestions.length > 0 && (
              <View className="absolute top-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32">
                <ScrollView>
                  {subjectSuggestions.map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className="px-3 py-2 border-b border-gray-100"
                      onPress={() => {
                        setSubject(s);
                        setShowSubjectSuggestions(false);
                      }}
                    >
                      <Text className="text-gray-700">{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Course */}
          <View className="mb-4 relative">
            <Text className="font-semibold text-gray-900 mb-2">Course Code</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholder="e.g., CS101, BIO200"
              value={course}
              onChangeText={(text) => {
                setCourse(text);
                setShowCourseSuggestions(text.length >= 2);
              }}
              onBlur={() => setTimeout(() => setShowCourseSuggestions(false), 200)}
              autoCapitalize="characters"
            />
            {showCourseSuggestions && courseSuggestions && courseSuggestions.length > 0 && (
              <View className="absolute top-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32">
                <ScrollView>
                  {courseSuggestions.map((c, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className="px-3 py-2 border-b border-gray-100"
                      onPress={() => {
                        setCourse(c);
                        setShowCourseSuggestions(false);
                      }}
                    >
                      <Text className="text-gray-700">{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Professor */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Professor</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholder="Professor name (optional)"
              value={professor}
              onChangeText={setProfessor}
            />
          </View>

          {/* Semester */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Semester</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-3 py-2 flex-row items-center justify-between"
              onPress={() => setShowSemesterPicker(!showSemesterPicker)}
            >
              <Text className={semester ? "text-gray-900" : "text-gray-400"}>
                {semester || "Select semester"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {showSemesterPicker && (
              <View className="border border-gray-200 rounded-lg mt-1 bg-white">
                {SEMESTERS.map((sem) => (
                  <TouchableOpacity
                    key={sem}
                    className={`px-3 py-2 border-b border-gray-100 ${
                      semester === sem ? "bg-indigo-50" : ""
                    }`}
                    onPress={() => {
                      setSemester(sem);
                      setShowSemesterPicker(false);
                    }}
                  >
                    <Text
                      className={semester === sem ? "text-indigo-700 font-medium" : "text-gray-700"}
                    >
                      {sem}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Note Type */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Note Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {NOTE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  className={`px-3 py-2 rounded-lg border ${
                    noteType === type.value
                      ? "bg-indigo-100 border-indigo-300"
                      : "bg-white border-gray-300"
                  }`}
                  onPress={() => setNoteType(type.value)}
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

          {/* Tags */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">
              Tags <Text className="font-normal text-gray-500">({tags.length}/5)</Text>
            </Text>
            <View className="flex-row flex-wrap mb-2 gap-1">
              {tags.map((tag, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center bg-gray-100 rounded-full px-3 py-1"
                >
                  <Text className="text-gray-700 text-sm">{tag}</Text>
                  <TouchableOpacity className="ml-1" onPress={() => removeTag(idx)}>
                    <Ionicons name="close" size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {tags.length < 5 && (
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  maxLength={30}
                />
                <TouchableOpacity
                  className="ml-2 bg-gray-200 rounded-lg px-3 py-2"
                  onPress={addTag}
                >
                  <Ionicons name="add" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-600 text-sm">Uploading...</Text>
                <Text className="text-indigo-600 font-medium">{uploadProgress}%</Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className={`py-4 rounded-xl items-center flex-row justify-center ${
              isLoading ? "bg-gray-300" : "bg-indigo-600"
            }`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">
                  Uploading...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Upload Notes
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="h-8" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NoteUploadForm;
