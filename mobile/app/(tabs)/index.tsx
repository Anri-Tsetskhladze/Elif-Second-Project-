import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserSync } from "@/hooks/useUserSync";
import { useCategories, useFeed, useForumActions } from "@/hooks/useForum";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ForumPost from "@/components/ForumPost";
import SignOutButton from "@/components/SignOutButton";
import { ForumPost as ForumPostType, Category } from "@/types";
import { EmptyState, ErrorDisplay, PostCardSkeletonList } from "@/components/common";

type SortOption = "hot" | "new" | "top";

const STORAGE_KEYS = {
  LAST_CATEGORY: "home_last_category",
  LAST_SORT: "home_last_sort",
};

const DEFAULT_CATEGORIES = [
  { id: "all", name: "All", icon: "grid-outline" },
  { id: "my-university", name: "My University", icon: "school-outline" },
  { id: "academics", name: "Academics", icon: "book-outline" },
  { id: "campus-life", name: "Campus Life", icon: "people-outline" },
  { id: "career", name: "Career", icon: "briefcase-outline" },
  { id: "housing", name: "Housing", icon: "home-outline" },
  { id: "events", name: "Events", icon: "calendar-outline" },
  { id: "help", name: "Help", icon: "help-circle-outline" },
];

const CategoryTab = ({
  category,
  isSelected,
  onPress,
}: {
  category: { id: string; name: string; icon?: string };
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
      isSelected ? "bg-indigo-600" : "bg-gray-100"
    }`}
    onPress={onPress}
  >
    {category.icon && (
      <Ionicons
        name={category.icon as any}
        size={16}
        color={isSelected ? "#fff" : "#6B7280"}
        style={{ marginRight: 4 }}
      />
    )}
    <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-600"}`}>
      {category.name}
    </Text>
  </TouchableOpacity>
);

const SortButton = ({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className={`px-3 py-1.5 rounded-lg mr-2 ${isSelected ? "bg-gray-900" : "bg-gray-100"}`}
    onPress={onPress}
  >
    <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-600"}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const [questionsOnly, setQuestionsOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useUserSync();

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { currentUser } = useCurrentUser();
  const { toggleLike, toggleBookmark, deletePost } = useForumActions();

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedCategory, savedSort] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LAST_CATEGORY),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_SORT),
        ]);
        if (savedCategory) setSelectedCategory(savedCategory);
        if (savedSort) setSortBy(savedSort as SortOption);
      } catch (error) {
        // Ignore errors
      } finally {
        setIsInitialized(true);
      }
    };
    loadPreferences();
  }, []);

  // Save category preference
  const handleCategoryChange = useCallback(async (categoryId: string) => {
    setSelectedCategory(categoryId);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, categoryId);
    } catch (error) {
      // Ignore errors
    }
  }, []);

  // Save sort preference
  const handleSortChange = useCallback(async (sort: SortOption) => {
    setSortBy(sort);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SORT, sort);
    } catch (error) {
      // Ignore errors
    }
  }, []);

  // Determine category for API call
  const getCategoryForApi = useCallback(() => {
    if (selectedCategory === "all") return undefined;
    if (selectedCategory === "my-university") {
      return currentUser?.university?._id ? `university:${currentUser.university._id}` : undefined;
    }
    return selectedCategory;
  }, [selectedCategory, currentUser?.university?._id]);

  const {
    posts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    isError,
  } = useFeed({
    category: getCategoryForApi(),
    sortBy: sortBy === "hot" ? "popular" : sortBy === "new" ? "newest" : "popular",
    questionsOnly,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Merge default categories with API categories
  const allCategories = [
    ...DEFAULT_CATEGORIES.slice(0, 2),
    ...(categories || []).map((cat: Category) => ({
      id: cat._id || cat.id,
      name: cat.name,
      icon: undefined,
    })),
    ...DEFAULT_CATEGORIES.slice(2).filter(
      (def) => !(categories || []).some((cat: Category) => cat.name.toLowerCase() === def.name.toLowerCase())
    ),
  ];

  // Check if post is from user's university
  const isFromMyUniversity = useCallback(
    (post: ForumPostType) => {
      if (!currentUser?.university?._id) return false;
      return post.university?._id === currentUser.university._id;
    },
    [currentUser?.university?._id]
  );

  const renderPost = useCallback(
    ({ item }: { item: ForumPostType }) => (
      <View className={isFromMyUniversity(item) ? "border-l-4 border-indigo-500" : ""}>
        <ForumPost
          post={item}
          currentUser={currentUser}
          onLike={toggleLike}
          onBookmark={toggleBookmark}
          onDelete={deletePost}
        />
      </View>
    ),
    [currentUser, toggleLike, toggleBookmark, deletePost, isFromMyUniversity]
  );

  const renderHeader = () => (
    <View className="bg-white">
      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 border-b border-gray-100"
      >
        {allCategories.map((cat) => (
          <CategoryTab
            key={cat.id}
            category={cat}
            isSelected={selectedCategory === cat.id}
            onPress={() => handleCategoryChange(cat.id)}
          />
        ))}
      </ScrollView>

      {/* Sort and filter row */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50">
        <View className="flex-row items-center">
          <SortButton
            label="Hot"
            isSelected={sortBy === "hot"}
            onPress={() => handleSortChange("hot")}
          />
          <SortButton
            label="New"
            isSelected={sortBy === "new"}
            onPress={() => handleSortChange("new")}
          />
          <SortButton
            label="Top"
            isSelected={sortBy === "top"}
            onPress={() => handleSortChange("top")}
          />
        </View>

        <View className="flex-row items-center">
          <Text className="text-gray-500 text-sm mr-2">Questions</Text>
          <Switch
            value={questionsOnly}
            onValueChange={setQuestionsOnly}
            trackColor={{ false: "#D1D5DB", true: "#A5B4FC" }}
            thumbColor={questionsOnly ? "#6366F1" : "#9CA3AF"}
            ios_backgroundColor="#D1D5DB"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* My University indicator */}
      {selectedCategory === "my-university" && currentUser?.university && (
        <View className="mx-4 mt-3 bg-indigo-50 rounded-xl p-3 flex-row items-center">
          <Ionicons name="school" size={18} color="#6366F1" />
          <Text className="text-indigo-700 ml-2 flex-1">
            Showing posts from {currentUser.university.name}
          </Text>
        </View>
      )}

      {selectedCategory === "my-university" && !currentUser?.university && (
        <View className="mx-4 mt-3 bg-amber-50 rounded-xl p-3 flex-row items-center">
          <Ionicons name="warning" size={18} color="#F59E0B" />
          <Text className="text-amber-700 ml-2 flex-1">
            Set your university in profile to see posts from your school
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isError) {
      return (
        <ErrorDisplay
          title="Connection Error"
          message="Unable to load posts. Check your connection and try again."
          onRetry={() => refetch()}
          icon="cloud-offline-outline"
        />
      );
    }

    if (selectedCategory !== "all") {
      return (
        <EmptyState
          icon="folder-open-outline"
          title="No posts in this category"
          message="Be the first to start a discussion here!"
          actionText="Create Post"
          onAction={() => router.push("/new-post")}
        />
      );
    }

    return (
      <EmptyState
        variant="posts"
        actionText="Create Post"
        onAction={() => router.push("/new-post")}
      />
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View className="h-24" />;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  };

  const renderLoadingSkeletons = () => <PostCardSkeletonList count={4} />;

  if (!isInitialized) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="school" size={28} color="#6366F1" />
          <Text className="text-xl font-bold text-gray-900 ml-2">Academy Hub</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-3" onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <SignOutButton />
        </View>
      </View>

      {/* Content */}
      {isLoading && !isRefetching ? (
        <View>
          {renderHeader()}
          {renderLoadingSkeletons()}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
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
          ItemSeparatorComponent={() => <View className="h-2" />}
          stickyHeaderIndices={[0]}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;
