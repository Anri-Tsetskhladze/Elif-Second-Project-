import { useState, useCallback, useEffect } from "react";
import { View, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { GlobalSearchBar, SearchResults } from "@/components/search";
import {
  useGlobalSearch,
  useSearchUniversities,
  useSearchUsers,
  useSearchPosts,
  useSearchNotes,
} from "@/hooks/useSearch";

type TabType = "all" | "universities" | "users" | "posts" | "notes";

const SearchResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; type?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.q || "");
  const [activeType, setActiveType] = useState<TabType>((params.type as TabType) || "all");

  const { data: globalResults, isLoading: globalLoading } = useGlobalSearch(
    searchQuery,
    activeType === "all" ? undefined : activeType
  );

  const universitiesQuery = useSearchUniversities(activeType === "universities" ? searchQuery : "");
  const usersQuery = useSearchUsers(activeType === "users" ? searchQuery : "");
  const postsQuery = useSearchPosts(activeType === "posts" ? searchQuery : "", {});
  const notesQuery = useSearchNotes(activeType === "notes" ? searchQuery : "", {});

  const handleSearch = useCallback((query: string) => {
    if (query.trim().length >= 2) {
      setSearchQuery(query.trim());
      Keyboard.dismiss();
    }
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleLoadMore = useCallback((type: TabType) => {
    switch (type) {
      case "universities":
        if (universitiesQuery.hasNextPage && !universitiesQuery.isFetchingNextPage) {
          universitiesQuery.fetchNextPage();
        }
        break;
      case "users":
        if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) {
          usersQuery.fetchNextPage();
        }
        break;
      case "posts":
        if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
          postsQuery.fetchNextPage();
        }
        break;
      case "notes":
        if (notesQuery.hasNextPage && !notesQuery.isFetchingNextPage) {
          notesQuery.fetchNextPage();
        }
        break;
    }
  }, [universitiesQuery, usersQuery, postsQuery, notesQuery]);

  const hasMore: Record<TabType, boolean> = {
    all: false,
    universities: !!universitiesQuery.hasNextPage,
    users: !!usersQuery.hasNextPage,
    posts: !!postsQuery.hasNextPage,
    notes: !!notesQuery.hasNextPage,
  };

  const isLoadingMore: Record<TabType, boolean> = {
    all: false,
    universities: universitiesQuery.isFetchingNextPage,
    users: usersQuery.isFetchingNextPage,
    posts: postsQuery.isFetchingNextPage,
    notes: notesQuery.isFetchingNextPage,
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <GlobalSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSearch}
        showBackButton
        onBackPress={handleBack}
        autoFocus={!params.q}
      />

      <SearchResults
        results={globalResults || null}
        isLoading={globalLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />
    </SafeAreaView>
  );
};

export default SearchResultsScreen;
