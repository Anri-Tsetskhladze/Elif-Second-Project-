import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApiClient, universityApi } from "@/utils/api";
import { useNoteActions } from "@/hooks/useNotes";
import NoteUploadForm from "@/components/notes/NoteUploadForm";

const UploadNoteScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();

  const { data: university, isLoading: universityLoading } = useQuery({
    queryKey: ["university", id],
    queryFn: () => universityApi.getById(api, id),
    select: (response) => response.data.university,
    enabled: !!id,
  });

  const { createNote, isCreating } = useNoteActions(id);

  const handleSubmit = async (formData: FormData) => {
    try {
      await createNote(formData);
      Alert.alert("Success", "Your notes have been uploaded!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to upload notes. Please try again."
      );
    }
  };

  if (universityLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!university) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-600 mt-2">University not found</Text>
        <TouchableOpacity
          className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          className="p-1"
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={26} color="#374151" />
        </TouchableOpacity>

        <Text className="font-semibold text-gray-900 text-lg">Upload Notes</Text>

        <View className="w-8" />
      </View>

      {/* Form */}
      <NoteUploadForm
        university={university}
        onSubmit={handleSubmit}
        isLoading={isCreating}
      />
    </SafeAreaView>
  );
};

export default UploadNoteScreen;
