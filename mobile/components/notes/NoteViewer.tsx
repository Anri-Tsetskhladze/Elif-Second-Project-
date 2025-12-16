import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { Note, NoteFile, FileType } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface NoteViewerProps {
  note: Note;
  onLike?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
}

const FILE_TYPE_ICONS: Record<FileType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  pdf: { name: "document-text", color: "#DC2626" },
  doc: { name: "document", color: "#2563EB" },
  docx: { name: "document", color: "#2563EB" },
  ppt: { name: "easel", color: "#EA580C" },
  pptx: { name: "easel", color: "#EA580C" },
  xls: { name: "grid", color: "#16A34A" },
  xlsx: { name: "grid", color: "#16A34A" },
  image: { name: "image", color: "#8B5CF6" },
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  lecture: "Lecture Notes",
  exam: "Exam/Quiz",
  summary: "Summary",
  assignment: "Assignment",
  lab: "Lab Report",
  other: "Other",
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const NoteViewer = ({
  note,
  onLike,
  onSave,
  onDownload,
  isDownloading = false,
}: NoteViewerProps) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageZoom, setImageZoom] = useState(false);

  const selectedFile = note.files[selectedFileIndex];
  const isImage = selectedFile?.fileType === "image";
  const timeAgo = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });

  const getViewerUrl = (file: NoteFile): string => {
    if (file.fileType === "image") {
      return file.url;
    }
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(file.url)}`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${note.title}" on Academy Hub`,
        url: selectedFile?.url,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleOpenExternal = () => {
    if (selectedFile?.url) {
      Linking.openURL(selectedFile.url);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* File Tabs (if multiple files) */}
      {note.files.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-100"
          contentContainerStyle={{ padding: 8 }}
        >
          {note.files.map((file, idx) => {
            const icon = FILE_TYPE_ICONS[file.fileType];
            const isSelected = idx === selectedFileIndex;

            return (
              <TouchableOpacity
                key={idx}
                className={`flex-row items-center px-3 py-2 rounded-lg mr-2 ${
                  isSelected ? "bg-indigo-100" : "bg-gray-100"
                }`}
                onPress={() => {
                  setSelectedFileIndex(idx);
                  setIsLoading(true);
                }}
              >
                <Ionicons
                  name={icon.name}
                  size={16}
                  color={isSelected ? "#6366F1" : icon.color}
                />
                <Text
                  className={`ml-2 text-sm ${
                    isSelected ? "text-indigo-700 font-medium" : "text-gray-600"
                  }`}
                  numberOfLines={1}
                  style={{ maxWidth: 120 }}
                >
                  {file.fileName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Viewer */}
      <View className="flex-1">
        {isLoading && (
          <View className="absolute inset-0 items-center justify-center bg-white z-10">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-gray-500 mt-2">Loading document...</Text>
          </View>
        )}

        {isImage ? (
          <TouchableOpacity
            className="flex-1 items-center justify-center bg-black"
            activeOpacity={0.9}
            onPress={() => setImageZoom(!imageZoom)}
          >
            <Image
              source={{ uri: selectedFile.url }}
              style={{
                width: SCREEN_WIDTH,
                height: imageZoom ? SCREEN_HEIGHT * 0.8 : SCREEN_HEIGHT * 0.5,
              }}
              resizeMode={imageZoom ? "contain" : "cover"}
              onLoad={() => setIsLoading(false)}
            />
            <View className="absolute bottom-4 bg-black/50 px-3 py-1 rounded-full">
              <Text className="text-white text-xs">Tap to {imageZoom ? "fit" : "zoom"}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <WebView
            source={{ uri: getViewerUrl(selectedFile) }}
            style={{ flex: 1 }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            startInLoadingState={false}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
          />
        )}
      </View>

      {/* Note Info */}
      <View className="p-4 border-t border-gray-100">
        {/* Title and Type */}
        <View className="flex-row items-start justify-between mb-2">
          <Text className="font-semibold text-gray-900 text-lg flex-1 mr-2">
            {note.title}
          </Text>
          <View className="bg-amber-100 px-2 py-1 rounded-full">
            <Text className="text-amber-700 text-xs font-medium">
              {NOTE_TYPE_LABELS[note.noteType]}
            </Text>
          </View>
        </View>

        {/* Subject and Course */}
        <View className="flex-row flex-wrap gap-1 mb-3">
          <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
            <Text className="text-indigo-700 text-xs font-medium">{note.subject}</Text>
          </View>
          {note.course && (
            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-gray-600 text-xs font-medium">{note.course}</Text>
            </View>
          )}
          {note.professor && (
            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-gray-600 text-xs font-medium">Prof. {note.professor}</Text>
            </View>
          )}
          {note.semester && (
            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-gray-600 text-xs font-medium">{note.semester}</Text>
            </View>
          )}
        </View>

        {/* Author */}
        <View className="flex-row items-center mb-3">
          {note.author.profilePicture || note.author.profileImg ? (
            <Image
              source={{ uri: note.author.profilePicture || note.author.profileImg }}
              className="w-6 h-6 rounded-full mr-2"
            />
          ) : (
            <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-2">
              <Ionicons name="person" size={12} color="#9CA3AF" />
            </View>
          )}
          <Text className="text-gray-600 text-sm">
            {note.author.fullName || note.author.username}
          </Text>
          {note.author.isVerifiedStudent && (
            <Ionicons name="checkmark-circle" size={14} color="#6366F1" style={{ marginLeft: 4 }} />
          )}
          <Text className="text-gray-400 text-sm ml-2">{timeAgo}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center mr-4">
            <Ionicons name="download-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{note.downloadCount}</Text>
          </View>
          <View className="flex-row items-center mr-4">
            <Ionicons name="heart-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{note.likesCount}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="bookmark-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{note.savesCount}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="flex-row items-center mr-4"
              onPress={onLike}
            >
              <Ionicons
                name={note.isLiked ? "heart" : "heart-outline"}
                size={24}
                color={note.isLiked ? "#EF4444" : "#6B7280"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center mr-4"
              onPress={onSave}
            >
              <Ionicons
                name={note.isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color={note.isSaved ? "#6366F1" : "#6B7280"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center mr-4"
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={handleOpenExternal}
            >
              <Ionicons name="open-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-lg ${
              isDownloading ? "bg-gray-200" : "bg-indigo-600"
            }`}
            onPress={onDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Ionicons name="download" size={18} color="white" />
            )}
            <Text className={`ml-2 font-medium ${isDownloading ? "text-gray-600" : "text-white"}`}>
              {isDownloading ? "Downloading..." : "Download"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default NoteViewer;
