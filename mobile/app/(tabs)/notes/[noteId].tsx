import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WebView } from "react-native-webview";
import { useApiClient, noteApi } from "@/utils/api";

const NoteDetailScreen = () => {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  // Fetch note details
  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => noteApi.getById(api, noteId),
    select: (res) => res.data.note,
    enabled: !!noteId,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => noteApi.toggleLike(api, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => noteApi.toggleSave(api, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    },
  });

  const handleDownload = useCallback(async () => {
    try {
      const res = await noteApi.getDownloadUrl(api, noteId);
      const downloadUrl = res.data.url;
      if (downloadUrl) {
        await Linking.openURL(downloadUrl);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get download link");
    }
  }, [api, noteId]);

  const handleShare = useCallback(async () => {
    if (!note) return;
    try {
      await Share.share({
        message: `Check out "${note.title}" on UniConnect!`,
        title: note.title,
      });
    } catch (error) {
      // User cancelled
    }
  }, [note]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType?.toLowerCase()) {
      case "pdf":
        return { icon: "document", color: "#EF4444", bg: "bg-red-50" };
      case "doc":
      case "docx":
        return { icon: "document-text", color: "#3B82F6", bg: "bg-blue-50" };
      case "ppt":
      case "pptx":
        return { icon: "easel", color: "#F59E0B", bg: "bg-amber-50" };
      default:
        return { icon: "document-text", color: "#6366F1", bg: "bg-indigo-50" };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Stack.Screen
          options={{
            headerTitle: "Note",
            headerBackTitle: "Back",
          }}
        />
        <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-400 text-lg mt-4">Note not found</Text>
      </SafeAreaView>
    );
  }

  const fileStyle = getFileIcon(note.fileType);

  // PDF Preview URL (using Google Docs viewer)
  const previewUrl = note.fileUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(note.fileUrl)}&embedded=true`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
          headerTintColor: "#111827",
          headerStyle: { backgroundColor: "#fff" },
          headerRight: () => (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="w-10 h-10 items-center justify-center"
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {showPreview && previewUrl ? (
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-2 bg-gray-100">
            <Text className="font-medium text-gray-700">Preview</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: previewUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <View className="flex-1 items-center justify-center absolute inset-0 bg-white">
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            )}
          />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-4 py-4">
            {/* File Type & Title */}
            <View className="flex-row items-start">
              <View className={`w-14 h-14 rounded-xl ${fileStyle.bg} items-center justify-center mr-3`}>
                <Ionicons name={fileStyle.icon as any} size={28} color={fileStyle.color} />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">{note.title}</Text>
                {note.noteType && (
                  <View className="bg-gray-100 self-start px-2 py-0.5 rounded mt-1">
                    <Text className="text-gray-600 text-xs capitalize">{note.noteType}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Subject & Course */}
            {(note.subject || note.course) && (
              <View className="flex-row items-center mt-4 flex-wrap gap-2">
                {note.subject && (
                  <View className="bg-purple-100 px-3 py-1 rounded-lg">
                    <Text className="text-purple-700 font-medium">{note.subject}</Text>
                  </View>
                )}
                {note.course && (
                  <View className="bg-blue-100 px-3 py-1 rounded-lg">
                    <Text className="text-blue-700 font-medium">{note.course}</Text>
                  </View>
                )}
                {note.professor && (
                  <View className="bg-gray-100 px-3 py-1 rounded-lg">
                    <Text className="text-gray-600">{note.professor}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Description */}
            {note.description && (
              <Text className="text-gray-600 mt-4 leading-6">{note.description}</Text>
            )}

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-4">
                {note.tags.map((tag: string, index: number) => (
                  <View key={index} className="bg-gray-50 px-3 py-1 rounded-full">
                    <Text className="text-gray-500 text-sm">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Author */}
          <View className="px-4 py-4 border-t border-gray-100">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push(`/(tabs)/profile/${note.author?.username}`)}
            >
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center overflow-hidden mr-3">
                {note.author?.profileImage ? (
                  <Image
                    source={{ uri: note.author.profileImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={24} color="#9CA3AF" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900">
                    {note.author?.fullName || note.author?.username || "Anonymous"}
                  </Text>
                  {note.author?.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color="#6366F1" className="ml-1" />
                  )}
                </View>
                <Text className="text-gray-500 text-sm">
                  Uploaded {formatDate(note.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* University */}
          {note.university && (
            <TouchableOpacity
              className="mx-4 mb-4 bg-indigo-50 rounded-xl p-4 flex-row items-center"
              onPress={() => router.push(`/(tabs)/universities/${note.university._id}`)}
            >
              <View className="w-10 h-10 rounded-lg bg-white items-center justify-center mr-3">
                {note.university.images?.logo ? (
                  <Image
                    source={{ uri: note.university.images.logo }}
                    className="w-full h-full rounded-lg"
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="school" size={20} color="#6366F1" />
                )}
              </View>
              <Text className="text-indigo-700 font-medium flex-1">{note.university.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6366F1" />
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View className="flex-row px-4 py-4 border-t border-gray-100">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-900">{note.downloadCount || 0}</Text>
              <Text className="text-gray-500 text-sm">Downloads</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-900">{note.likeCount || 0}</Text>
              <Text className="text-gray-500 text-sm">Likes</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-900">{note.viewCount || 0}</Text>
              <Text className="text-gray-500 text-sm">Views</Text>
            </View>
          </View>

          {/* Semester Info */}
          {note.semester && (
            <View className="px-4 py-3 bg-gray-50 flex-row items-center">
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text className="text-gray-600 ml-2">{note.semester}</Text>
            </View>
          )}

          <View className="h-32" />
        </ScrollView>
      )}

      {/* Bottom Actions */}
      {!showPreview && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
          <View className="flex-row items-center gap-3">
            {/* Like Button */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3 rounded-xl ${
                note.isLiked ? "bg-red-50" : "bg-gray-100"
              }`}
              onPress={() => likeMutation.mutate()}
            >
              <Ionicons
                name={note.isLiked ? "heart" : "heart-outline"}
                size={22}
                color={note.isLiked ? "#EF4444" : "#6B7280"}
              />
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-3 rounded-xl ${
                note.isSaved ? "bg-indigo-50" : "bg-gray-100"
              }`}
              onPress={() => saveMutation.mutate()}
            >
              <Ionicons
                name={note.isSaved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={note.isSaved ? "#6366F1" : "#6B7280"}
              />
            </TouchableOpacity>

            {/* Preview Button */}
            {note.fileType?.toLowerCase() === "pdf" && previewUrl && (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 rounded-xl bg-gray-100"
                onPress={() => setShowPreview(true)}
              >
                <Ionicons name="eye-outline" size={22} color="#6B7280" />
              </TouchableOpacity>
            )}

            {/* Download Button */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-indigo-600"
              onPress={handleDownload}
            >
              <Ionicons name="download-outline" size={22} color="#fff" />
              <Text className="text-white font-semibold ml-2">Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NoteDetailScreen;
