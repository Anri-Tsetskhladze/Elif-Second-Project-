import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { NoteSearchResult as NoteResult, FileType } from "@/types";

interface NoteSearchResultProps {
  note: NoteResult;
  onPress?: () => void;
}

const FILE_TYPE_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
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
  lecture: "Lecture",
  exam: "Exam",
  summary: "Summary",
  assignment: "Assignment",
  lab: "Lab",
  other: "Other",
};

const NoteSearchResult = ({ note, onPress }: NoteSearchResultProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/universities/${note.university._id}/notes/${note._id}`);
    }
  };

  const fileIcon = FILE_TYPE_ICONS.pdf;
  const timeAgo = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });

  return (
    <TouchableOpacity
      className="flex-row p-4 bg-white border-b border-gray-100 active:bg-gray-50"
      onPress={handlePress}
    >
      {/* Thumbnail / Icon */}
      <View className="mr-3">
        {note.thumbnail ? (
          <Image
            source={{ uri: note.thumbnail }}
            className="w-14 h-18 rounded-lg"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-14 h-18 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${fileIcon.color}15` }}
          >
            <Ionicons name={fileIcon.name} size={28} color={fileIcon.color} />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 text-base" numberOfLines={2}>
          {note.title}
        </Text>

        {note.description && (
          <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
            {note.description}
          </Text>
        )}

        {/* Badges */}
        <View className="flex-row flex-wrap mt-2 gap-1">
          <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
            <Text className="text-indigo-700 text-xs font-medium">{note.subject}</Text>
          </View>
          {note.course && (
            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-gray-600 text-xs">{note.course}</Text>
            </View>
          )}
          <View className="bg-amber-100 px-2 py-0.5 rounded-full">
            <Text className="text-amber-700 text-xs font-medium">
              {NOTE_TYPE_LABELS[note.noteType] || note.noteType}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between mt-2">
          {/* Author */}
          <View className="flex-row items-center">
            {note.author.profilePicture || note.author.profileImg ? (
              <Image
                source={{ uri: note.author.profilePicture || note.author.profileImg }}
                className="w-4 h-4 rounded-full mr-1"
              />
            ) : (
              <View className="w-4 h-4 rounded-full bg-gray-200 items-center justify-center mr-1">
                <Ionicons name="person" size={8} color="#9CA3AF" />
              </View>
            )}
            <Text className="text-gray-500 text-xs">
              {note.author.fullName || note.author.username}
            </Text>
          </View>

          {/* Stats */}
          <View className="flex-row items-center">
            <View className="flex-row items-center mr-3">
              <Ionicons name="download-outline" size={12} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1">{note.downloadCount}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={12} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1">{note.likesCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NoteSearchResult;
