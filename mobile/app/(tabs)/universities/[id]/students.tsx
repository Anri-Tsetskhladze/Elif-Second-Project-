import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, universityApi } from "@/utils/api";

interface Student {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
  major?: string;
  year?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
}

const StudentsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified">("all");

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["university-students", id, search, filter],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await universityApi.getStudents(api, id, {
        page: pageParam,
        limit: 20,
        q: search || undefined,
        verified: filter === "verified" ? true : undefined,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: !!id,
  });

  const students = data?.pages.flatMap((page) => page.students || page.users || []) || [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Student }) => (
      <StudentCard
        student={item}
        onPress={() => router.push(`/(tabs)/profile/${item.username}`)}
      />
    ),
    [router]
  );

  const renderHeader = () => (
    <View className="px-4 py-3 bg-white">
      {/* Search Bar */}
      <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5 mb-3">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-900"
          placeholder="Search students..."
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
      </View>

      {/* Filter Chips */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          className={`px-4 py-2 rounded-full ${
            filter === "all" ? "bg-indigo-600" : "bg-gray-100"
          }`}
          onPress={() => setFilter("all")}
        >
          <Text
            className={`font-medium ${
              filter === "all" ? "text-white" : "text-gray-600"
            }`}
          >
            All Students
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 rounded-full flex-row items-center ${
            filter === "verified" ? "bg-indigo-600" : "bg-gray-100"
          }`}
          onPress={() => setFilter("verified")}
        >
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={filter === "verified" ? "#fff" : "#6B7280"}
          />
          <Text
            className={`font-medium ml-1 ${
              filter === "verified" ? "text-white" : "text-gray-600"
            }`}
          >
            Verified
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="py-16 items-center">
      <Ionicons name="people-outline" size={64} color="#E5E7EB" />
      <Text className="text-gray-400 text-lg mt-4">No students found</Text>
      <Text className="text-gray-400 text-sm mt-1">
        {search ? "Try a different search term" : "Be the first to join!"}
      </Text>
    </View>
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
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Students",
          headerBackTitle: "Back",
          headerTintColor: "#111827",
          headerStyle: { backgroundColor: "#fff" },
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={students}
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
        />
      )}
    </SafeAreaView>
  );
};

// Student Card Component
interface StudentCardProps {
  student: Student;
  onPress: () => void;
}

const StudentCard = ({ student, onPress }: StudentCardProps) => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(student.isFollowing);

  const followMutation = useMutation({
    mutationFn: () => api.post(`/users/${student._id}/follow`),
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ["university-students"] });
    },
  });

  const handleFollow = () => {
    followMutation.mutate();
  };

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center overflow-hidden mr-3">
        {student.profileImage ? (
          <Image
            source={{ uri: student.profileImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="person" size={24} color="#6366F1" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {student.fullName || student.username}
          </Text>
          {student.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#6366F1" className="ml-1" />
          )}
        </View>
        <Text className="text-gray-500 text-sm">@{student.username}</Text>
        {(student.major || student.year) && (
          <View className="flex-row items-center mt-0.5">
            {student.major && (
              <Text className="text-gray-400 text-xs">{student.major}</Text>
            )}
            {student.major && student.year && (
              <Text className="text-gray-400 text-xs mx-1">•</Text>
            )}
            {student.year && (
              <Text className="text-gray-400 text-xs">{student.year}</Text>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${
          isFollowing ? "bg-gray-100" : "bg-indigo-600"
        }`}
        onPress={handleFollow}
        disabled={followMutation.isPending}
      >
        {followMutation.isPending ? (
          <ActivityIndicator size="small" color={isFollowing ? "#6B7280" : "#fff"} />
        ) : (
          <Text
            className={`font-medium text-sm ${
              isFollowing ? "text-gray-700" : "text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default StudentsScreen;
