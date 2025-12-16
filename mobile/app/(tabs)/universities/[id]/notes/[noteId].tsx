import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNote, useNoteActions } from "@/hooks/useNotes";
import NoteViewer from "@/components/notes/NoteViewer";

const NoteDetailScreen = () => {
  const { id, noteId } = useLocalSearchParams<{ id: string; noteId: string }>();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: note, isLoading, error } = useNote(noteId);
  const { toggleLike, toggleSave, getDownloadUrl } = useNoteActions(id);

  const handleDownload = async () => {
    if (!note) return;

    setIsDownloading(true);
    try {
      const response = await getDownloadUrl(noteId);
      const downloadUrl = response.data.downloadUrl;

      await Linking.openURL(downloadUrl);
    } catch (error: any) {
      Alert.alert(
        "Download Error",
        error.response?.data?.error || "Failed to download file. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-gray-500 mt-2">Loading note...</Text>
      </SafeAreaView>
    );
  }

  if (error || !note) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-600 mt-2">Note not found</Text>
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
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="font-semibold text-gray-900" numberOfLines={1}>
          {note.files.length} {note.files.length === 1 ? "File" : "Files"}
        </Text>

        <TouchableOpacity
          className="p-1"
          onPress={() => {
            Alert.alert(
              "Options",
              "",
              [
                {
                  text: "Report",
                  onPress: () => {
                    Alert.alert("Reported", "Thank you for your feedback");
                  },
                  style: "destructive",
                },
                note.isOwn
                  ? {
                      text: "Delete",
                      onPress: () => {
                        Alert.alert(
                          "Delete Note",
                          "Are you sure you want to delete this note?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => {
                                router.back();
                              },
                            },
                          ]
                        );
                      },
                      style: "destructive",
                    }
                  : null,
                { text: "Cancel", style: "cancel" },
              ].filter(Boolean) as any
            );
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Viewer */}
      <NoteViewer
        note={note}
        onLike={() => toggleLike(noteId)}
        onSave={() => toggleSave(noteId)}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />
    </SafeAreaView>
  );
};

export default NoteDetailScreen;
