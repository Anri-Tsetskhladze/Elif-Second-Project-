import { useState, useCallback } from "react";
import { View, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GlobalSearchBar, SearchSuggestions, SearchResults } from "@/components/search";
import {
  useGlobalSearch,
  useSearchSuggestions,
  useRecentSearches,
  usePopularSearches,
  useClearSearchHistory,
} from "@/hooks/useSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SearchScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const { data: suggestions = [], isLoading: suggestionsLoading } = useSearchSuggestions(debouncedQuery);
  const { data: recentSearches = [] } = useRecentSearches();
  const { data: popularSearches = [] } = usePopularSearches();
  const { data: searchResults, isLoading: resultsLoading } = useGlobalSearch(submittedQuery);
  const clearHistory = useClearSearchHistory();

  const handleSearch = useCallback((query: string) => {
    if (query.trim().length >= 2) {
      setSubmittedQuery(query.trim());
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  }, []);

  const handleSelectSuggestion = useCallback((text: string) => {
    setSearchQuery(text);
    handleSearch(text);
  }, [handleSearch]);

  const handleFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory.mutate();
  }, [clearHistory]);

  const hasResults = submittedQuery.length >= 2 && !showSuggestions;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <GlobalSearchBar
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          if (text.length < 2) {
            setShowSuggestions(true);
          }
        }}
        onSubmit={handleSearch}
        onFocus={handleFocus}
        autoFocus={false}
      />

      {showSuggestions || !hasResults ? (
        <SearchSuggestions
          suggestions={searchQuery.length >= 2 ? suggestions : []}
          recentSearches={recentSearches}
          popularSearches={popularSearches}
          isLoading={suggestionsLoading && searchQuery.length >= 2}
          onSelectSuggestion={handleSelectSuggestion}
          onClearRecent={handleClearHistory}
          showRecent={searchQuery.length < 2}
        />
      ) : (
        <SearchResults
          results={searchResults || null}
          isLoading={resultsLoading}
        />
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
