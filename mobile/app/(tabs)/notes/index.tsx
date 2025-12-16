import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useApiClient, noteApi } from "@/utils/api";
import { EmptyState, NoteCardSkeletonList } from "@/components/common";

type SortOption = "newest" | "popular" | "mostDownloaded";
type NoteType = "lecture" | "exam" | "summary" | "assignment" | "other";

interface Note {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  course?: string;
  noteType?: NoteType;
  fileType?: string;
  university?: {
    _id: string;
    name: string;
    images?: { logo?: string };
  };
  author?: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
    isVerified?: boolean;
  };
  downloadCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
}

const NOTE_TYPES: { id: NoteType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lecture", label: "Lectures" },
  { id: "exam", label: "Exams" },
  { id: "summary", label: "Summaries" },
  { id: "assignment", label: "Assignments" },
  { id: "other", label: "Other" },
];

const NotesScreen = () => {
  const router = useRouter();
  const api = useApiClient();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [noteType, setNoteType] = useState<NoteType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");

  // Fetch popular subjects
  const { data: popularSubjects } = useQuery({
    queryKey: ["popular-subjects"],
    queryFn: () => noteApi.getPopularSubjects(api, undefined, 10),
    select: (res) => res.data.subjects || [],
  });

  // Fetch notes
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["notes", search, sortBy, noteType, subjectFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = {
        page: pageParam,
        limit: 20,
        sortBy,
      };
      if (search) params.search = search;
      if (noteType !== "all") params.noteType = noteType;
      if (subjectFilter) params.subject = subjectFilter;

      const res = await noteApi.getAll(api, params);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const notes = useMemo(
    () => data?.pages.flatMap((page) => page.notes || []) || [],
    [data]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        note={item}
        onPress={() => router.push(`/(tabs)/notes/${item._id}`)}
      />
    ),
    [router]
  );

  const renderHeader = () => (
    <View className="bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Notes</Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Search notes..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity className="ml-2" onPress={() => setShowFilters(true)}>
            <Ionicons
              name="options-outline"
              size={20}
              color={subjectFilter ? "#6366F1" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Note Type Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}
      >
        {NOTE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            className={`px-4 py-2 rounded-full mr-2 ${
              noteType === type.id ? "bg-indigo-600" : "bg-gray-100"
            }`}
            onPress={() => setNoteType(type.id)}
          >
            <Text
              className={`font-medium ${
                noteType === type.id ? "text-white" : "text-gray-600"
              }`}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View className="flex-row px-4 pb-3 gap-2">
        <SortChip
          label="Newest"
          isActive={sortBy === "newest"}
          onPress={() => setSortBy("newest")}
        />
        <SortChip
          label="Popular"
          isActive={sortBy === "popular"}
          onPress={() => setSortBy("popular")}
        />
        <SortChip
          label="Most Downloaded"
          isActive={sortBy === "mostDownloaded"}
          onPress={() => setSortBy("mostDownloaded")}
        />
      </View>

      {/* Popular Subjects */}
      {!search && popularSubjects && popularSubjects.length > 0 && (
        <View className="px-4 pb-3">
          <Text className="text-sm font-medium text-gray-500 mb-2">Popular Subjects</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularSubjects.map((subject: any, index: number) => (
              <TouchableOpacity
                key={index}
                className={`px-3 py-1.5 rounded-lg mr-2 ${
                  subjectFilter === subject.name ? "bg-purple-100" : "bg-gray-50"
                }`}
                onPress={() =>
                  setSubjectFilter(subjectFilter === subject.name ? "" : subject.name)
                }
              >
                <Text
                  className={`text-sm ${
                    subjectFilter === subject.name ? "text-purple-700 font-medium" : "text-gray-600"
                  }`}
                >
                  {subject.name} ({subject.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      variant="notes"
      title={search ? "No notes found" : "No notes yet"}
      message={search ? "Try different keywords or filters" : "Upload your first note to help others learn"}
      actionText="Upload Note"
      onAction={() => router.push("/(tabs)/notes/upload")}
    />
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {isLoading ? (
        <View className="flex-1">
          {renderHeader()}
          <NoteCardSkeletonList count={4} />
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          stickyHeaderIndices={[0]}
          ItemSeparatorComponent={() => <View className="h-2" />}
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text className="text-gray-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="font-semibold text-gray-900">Filters</Text>
            <TouchableOpacity
              onPress={() => {
                setSubjectFilter("");
                setSortBy("newest");
                setNoteType("all");
              }}
            >
              <Text className="text-indigo-600">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            <Text className="font-semibold text-gray-900 mb-3">Subject</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 mb-6"
              placeholder="Filter by subject..."
              placeholderTextColor="#9CA3AF"
              value={subjectFilter}
              onChangeText={setSubjectFilter}
            />

            <Text className="font-semibold text-gray-900 mb-3">Note Type</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {NOTE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  className={`px-4 py-2 rounded-xl ${
                    noteType === type.id ? "bg-indigo-600" : "bg-gray-100"
                  }`}
                  onPress={() => setNoteType(type.id)}
                >
                  <Text
                    className={`font-medium ${
                      noteType === type.id ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-semibold text-gray-900 mb-3">Sort By</Text>
            <View className="gap-2">
              {[
                { id: "newest", label: "Newest First" },
                { id: "popular", label: "Most Popular" },
                { id: "mostDownloaded", label: "Most Downloaded" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className={`flex-row items-center justify-between px-4 py-3 rounded-xl ${
                    sortBy === option.id ? "bg-indigo-50" : "bg-gray-50"
                  }`}
                  onPress={() => setSortBy(option.id as SortOption)}
                >
                  <Text
                    className={`font-medium ${
                      sortBy === option.id ? "text-indigo-700" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View className="px-4 py-4 border-t border-gray-100">
            <TouchableOpacity
              className="bg-indigo-600 py-4 rounded-xl items-center"
              onPress={() => setShowFilters(false)}
            >
              <Text className="text-white font-semibold">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Sort Chip Component
const SortChip = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className={`px-3 py-1.5 rounded-lg ${isActive ? "bg-gray-900" : "bg-gray-100"}`}
    onPress={onPress}
  >
    <Text className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-600"}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Note Card Component
const NoteCard = ({ note, onPress }: { note: Note; onPress: () => void }) => {
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
      case "xls":
      case "xlsx":
        return { icon: "grid", color: "#10B981", bg: "bg-emerald-50" };
      case "jpg":
      case "jpeg":
      case "png":
        return { icon: "image", color: "#8B5CF6", bg: "bg-purple-50" };
      default:
        return { icon: "document-text", color: "#6366F1", bg: "bg-indigo-50" };
    }
  };

  const fileStyle = getFileIcon(note.fileType);

  return (
    <TouchableOpacity
      className="bg-white mx-4 rounded-xl overflow-hidden"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row">
          {/* File Icon */}
          <View className={`w-12 h-12 rounded-xl ${fileStyle.bg} items-center justify-center mr-3`}>
            <Ionicons name={fileStyle.icon as any} size={24} color={fileStyle.color} />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="font-semibold text-gray-900" numberOfLines={2}>
              {note.title}
            </Text>
            {note.subject && (
              <View className="flex-row items-center mt-1">
                <View className="bg-purple-100 px-2 py-0.5 rounded">
                  <Text className="text-purple-700 text-xs font-medium">{note.subject}</Text>
                </View>
                {note.course && (
                  <Text className="text-gray-400 text-xs ml-2">{note.course}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {note.description && (
          <Text className="text-gray-500 text-sm mt-2" numberOfLines={2}>
            {note.description}
          </Text>
        )}

        {/* Author & University */}
        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
          <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center overflow-hidden mr-2">
            {note.author?.profileImage ? (
              <Image
                source={{ uri: note.author.profileImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={12} color="#9CA3AF" />
            )}
          </View>
          <Text className="text-gray-600 text-sm flex-1" numberOfLines={1}>
            {note.author?.fullName || note.author?.username || "Anonymous"}
            {note.author?.isVerified && (
              <Text className="text-indigo-600"> ✓</Text>
            )}
          </Text>

          {/* Stats */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Ionicons name="download-outline" size={14} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1">{note.downloadCount || 0}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={14} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1">{note.likeCount || 0}</Text>
            </View>
          </View>
        </View>

        {/* University Badge */}
        {note.university && (
          <View className="flex-row items-center mt-2 bg-gray-50 px-2 py-1 rounded self-start">
            <Ionicons name="school-outline" size={12} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">{note.university.name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default NotesScreen;
