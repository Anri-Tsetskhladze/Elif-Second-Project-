import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApiClient, universityApi } from "@/utils/api";
import { useUniversityNotes, useNoteActions, useSubjectSuggestions, useCourseSuggestions } from "@/hooks/useNotes";
import { Note, NoteType } from "@/types";
import NoteCard from "@/components/notes/NoteCard";
import NoteFilters from "@/components/notes/NoteFilters";

type SortOption = "newest" | "popular" | "mostDownloaded";

const UniversityNotesScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();

  const [subject, setSubject] = useState<string | undefined>();
  const [course, setCourse] = useState<string | undefined>();
  const [noteType, setNoteType] = useState<NoteType | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: university, isLoading: universityLoading } = useQuery({
    queryKey: ["university", id],
    queryFn: () => universityApi.getById(api, id),
    select: (response) => response.data.university,
    enabled: !!id,
  });

  const {
    notes,
    stats,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useUniversityNotes(id, {
    subject,
    course,
    noteType,
    sortBy,
    search: searchQuery || undefined,
  });

  const { toggleLike, toggleSave } = useNoteActions(id);

  const { data: subjectSuggestions } = useSubjectSuggestions(subject || "", id);
  const { data: courseSuggestions } = useCourseSuggestions(course || "", id);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const renderNote = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onLike={toggleLike}
      onSave={toggleSave}
    />
  );

  const renderHeader = () => (
    <View>
      <NoteFilters
        subject={subject}
        course={course}
        noteType={noteType}
        sortBy={sortBy}
        onSubjectChange={setSubject}
        onCourseChange={setCourse}
        onNoteTypeChange={setNoteType}
        onSortChange={setSortBy}
        onSearch={handleSearch}
        subjectSuggestions={subjectSuggestions || []}
        courseSuggestions={courseSuggestions || []}
      />

      {/* Stats */}
      {stats && (
        <View className="flex-row items-center justify-around py-3 bg-gray-50 border-b border-gray-100">
          <View className="items-center">
            <Text className="font-semibold text-gray-900">{stats.totalNotes || 0}</Text>
            <Text className="text-gray-500 text-xs">Notes</Text>
          </View>
          <View className="items-center">
            <Text className="font-semibold text-gray-900">{stats.totalDownloads || 0}</Text>
            <Text className="text-gray-500 text-xs">Downloads</Text>
          </View>
          <View className="items-center">
            <Text className="font-semibold text-gray-900">
              {stats.popularSubjects?.length || 0}
            </Text>
            <Text className="text-gray-500 text-xs">Subjects</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View className="py-16 items-center">
      <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
      <Text className="text-gray-400 text-lg mt-4">No notes yet</Text>
      <Text className="text-gray-400 text-sm mt-1 text-center px-8">
        Be the first to share study materials for this university!
      </Text>
      <TouchableOpacity
        className="bg-indigo-600 px-6 py-3 rounded-full mt-6"
        onPress={() => router.push(`/universities/${id}/notes/upload`)}
      >
        <Text className="text-white font-medium">Upload Note</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  };

  if (universityLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
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

        <View className="flex-1 flex-row items-center justify-center mx-4">
          {university?.images?.logo && (
            <Image
              source={{ uri: university.images.logo }}
              className="w-6 h-6 rounded mr-2"
            />
          )}
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            Notes
          </Text>
        </View>

        <TouchableOpacity
          className="p-1"
          onPress={() => router.push(`/universities/${id}/notes/upload`)}
        >
          <Ionicons name="add-circle-outline" size={26} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNote}
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
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* FAB for upload */}
      <TouchableOpacity
        className="absolute bottom-6 right-4 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push(`/universities/${id}/notes/upload`)}
        style={{
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="cloud-upload" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default UniversityNotesScreen;
