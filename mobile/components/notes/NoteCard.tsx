import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { Note, FileType } from "@/types";

interface NoteCardProps {
  note: Note;
  onLike?: (noteId: string) => void;
  onSave?: (noteId: string) => void;
  showUniversity?: boolean;
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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const NoteCard = ({
  note,
  onLike,
  onSave,
  showUniversity = false,
}: NoteCardProps) => {
  const router = useRouter();
  const primaryFile = note.files[0];
  const fileIcon = primaryFile ? FILE_TYPE_ICONS[primaryFile.fileType] : FILE_TYPE_ICONS.pdf;
  const timeAgo = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });

  const handlePress = () => {
    router.push(`/universities/${note.university._id}/notes/${note._id}`);
  };

  return (
    <TouchableOpacity
      className="bg-white p-4 border-b border-gray-100"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="flex-row">
        {/* File Icon / Thumbnail */}
        <View className="mr-3">
          {note.thumbnail ? (
            <Image
              source={{ uri: note.thumbnail }}
              className="w-16 h-20 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View
              className="w-16 h-20 rounded-lg items-center justify-center"
              style={{ backgroundColor: `${fileIcon.color}15` }}
            >
              <Ionicons name={fileIcon.name} size={32} color={fileIcon.color} />
              {primaryFile && (
                <Text
                  className="text-xs font-medium mt-1"
                  style={{ color: fileIcon.color }}
                >
                  {primaryFile.fileType.toUpperCase()}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Title */}
          <Text className="font-semibold text-gray-900 text-base" numberOfLines={2}>
            {note.title}
          </Text>

          {/* Description */}
          {note.description && (
            <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
              {note.description}
            </Text>
          )}

          {/* Badges */}
          <View className="flex-row flex-wrap mt-2 gap-1">
            <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
              <Text className="text-indigo-700 text-xs font-medium">
                {note.subject}
              </Text>
            </View>
            {note.course && (
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-gray-600 text-xs font-medium">
                  {note.course}
                </Text>
              </View>
            )}
            <View className="bg-amber-100 px-2 py-0.5 rounded-full">
              <Text className="text-amber-700 text-xs font-medium">
                {NOTE_TYPE_LABELS[note.noteType] || note.noteType}
              </Text>
            </View>
          </View>

          {/* Author */}
          <View className="flex-row items-center mt-2">
            {note.author.profilePicture || note.author.profileImg ? (
              <Image
                source={{ uri: note.author.profilePicture || note.author.profileImg }}
                className="w-5 h-5 rounded-full mr-1.5"
              />
            ) : (
              <View className="w-5 h-5 rounded-full bg-gray-200 items-center justify-center mr-1.5">
                <Ionicons name="person" size={10} color="#9CA3AF" />
              </View>
            )}
            <Text className="text-gray-600 text-xs">
              {note.author.fullName || note.author.username}
            </Text>
            {note.author.isVerifiedStudent && (
              <Ionicons name="checkmark-circle" size={12} color="#6366F1" style={{ marginLeft: 2 }} />
            )}
            <Text className="text-gray-400 text-xs ml-2">{timeAgo}</Text>
          </View>

          {/* University (optional) */}
          {showUniversity && note.university && (
            <View className="flex-row items-center mt-2">
              {note.university.images?.logo && (
                <Image
                  source={{ uri: note.university.images.logo }}
                  className="w-4 h-4 rounded mr-1"
                />
              )}
              <Text className="text-gray-500 text-xs" numberOfLines={1}>
                {note.university.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats and Actions */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
        {/* Stats */}
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-4">
            <Ionicons name="download-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{note.downloadCount}</Text>
          </View>
          <View className="flex-row items-center mr-4">
            <Ionicons name="heart-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{note.likesCount}</Text>
          </View>
          {note.files.length > 1 && (
            <View className="flex-row items-center">
              <Ionicons name="documents-outline" size={16} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">{note.files.length} files</Text>
            </View>
          )}
          {primaryFile && (
            <Text className="text-gray-400 text-xs ml-2">
              {formatFileSize(primaryFile.fileSize)}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row items-center">
          <TouchableOpacity
            className="p-2"
            onPress={() => onLike?.(note._id)}
          >
            <Ionicons
              name={note.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={note.isLiked ? "#EF4444" : "#6B7280"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => onSave?.(note._id)}
          >
            <Ionicons
              name={note.isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={note.isSaved ? "#6366F1" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NoteCard;
