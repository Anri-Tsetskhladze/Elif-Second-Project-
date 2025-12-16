import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useApiClient, universityApi } from "@/utils/api";
import { UniversityCard } from "@/components/universities";

type TabId = "popular" | "top-rated" | "all";
type ViewMode = "list" | "grid";

interface Tab {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: Tab[] = [
  { id: "popular", label: "Popular", icon: "flame-outline" },
  { id: "top-rated", label: "Top Rated", icon: "star-outline" },
  { id: "all", label: "All", icon: "school-outline" },
];

interface UniversityItem {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  images?: { logo?: string };
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
}

const UniversitiesScreen = () => {
  const router = useRouter();
  const api = useApiClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    country: "",
    state: "",
    minRating: 0,
  });

  // Popular universities
  const { data: popularData, isLoading: popularLoading, refetch: refetchPopular } = useQuery({
    queryKey: ["universities", "popular"],
    queryFn: () => universityApi.getPopular(api, 20),
    select: (res) => res.data.universities as UniversityItem[],
    enabled: activeTab === "popular" && !search,
  });

  // Top rated universities
  const { data: topRatedData, isLoading: topRatedLoading, refetch: refetchTopRated } = useQuery({
    queryKey: ["universities", "top-rated"],
    queryFn: () => universityApi.getTopRated(api, 20),
    select: (res) => res.data.universities as UniversityItem[],
    enabled: activeTab === "top-rated" && !search,
  });

  // All universities with pagination
  const {
    data: allData,
    isLoading: allLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchAll,
  } = useInfiniteQuery({
    queryKey: ["universities", "all", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await universityApi.search(api, {
        page: pageParam,
        limit: 20,
        ...filters,
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
    enabled: activeTab === "all" && !search,
  });

  // Search universities
  const { data: searchData, isLoading: searchLoading, refetch: refetchSearch } = useQuery({
    queryKey: ["universities", "search", search],
    queryFn: () => universityApi.search(api, { q: search, limit: 50 }),
    select: (res) => res.data.universities as UniversityItem[],
    enabled: search.length >= 2,
  });

  // Compute displayed data
  const displayedData = useMemo(() => {
    if (search.length >= 2) return searchData || [];
    switch (activeTab) {
      case "popular":
        return popularData || [];
      case "top-rated":
        return topRatedData || [];
      case "all":
        return allData?.pages.flatMap((page) => page.universities) || [];
      default:
        return [];
    }
  }, [search, activeTab, searchData, popularData, topRatedData, allData]);

  const isLoading = search
    ? searchLoading
    : activeTab === "popular"
    ? popularLoading
    : activeTab === "top-rated"
    ? topRatedLoading
    : allLoading;

  const handleRefresh = useCallback(() => {
    if (search) {
      refetchSearch();
    } else {
      switch (activeTab) {
        case "popular":
          refetchPopular();
          break;
        case "top-rated":
          refetchTopRated();
          break;
        case "all":
          refetchAll();
          break;
      }
    }
  }, [search, activeTab, refetchSearch, refetchPopular, refetchTopRated, refetchAll]);

  const handleLoadMore = useCallback(() => {
    if (activeTab === "all" && !search && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [activeTab, search, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: UniversityItem; index: number }) => {
      if (viewMode === "grid") {
        return (
          <View style={{ width: "50%" }}>
            <UniversityCard
              university={item}
              variant="grid"
              onPress={() => router.push(`/(tabs)/universities/${item._id}`)}
            />
          </View>
        );
      }
      return (
        <UniversityCard
          university={item}
          variant="list"
          onPress={() => router.push(`/(tabs)/universities/${item._id}`)}
        />
      );
    },
    [viewMode, router]
  );

  const renderEmpty = () => (
    <View className="py-16 items-center">
      <Ionicons name="school-outline" size={64} color="#E5E7EB" />
      <Text className="text-gray-400 text-lg mt-4">No universities found</Text>
      <Text className="text-gray-400 text-sm mt-1">Try a different search or filter</Text>
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
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">Universities</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className={`w-9 h-9 rounded-full items-center justify-center ${
              viewMode === "list" ? "bg-indigo-100" : "bg-gray-100"
            }`}
            onPress={() => setViewMode("list")}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === "list" ? "#6366F1" : "#6B7280"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-9 h-9 rounded-full items-center justify-center ${
              viewMode === "grid" ? "bg-indigo-100" : "bg-gray-100"
            }`}
            onPress={() => setViewMode("grid")}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === "grid" ? "#6366F1" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Search universities..."
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
          <TouchableOpacity
            className="ml-2 p-1"
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filters.country || filters.state || filters.minRating ? "#6366F1" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      {!search && (
        <View className="border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  className={`flex-row items-center px-4 py-3 mr-1 border-b-2 ${
                    isActive ? "border-indigo-600" : "border-transparent"
                  }`}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={18}
                    color={isActive ? "#4F46E5" : "#6B7280"}
                  />
                  <Text
                    className={`ml-1.5 font-medium ${
                      isActive ? "text-indigo-600" : "text-gray-600"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={displayedData}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          numColumns={viewMode === "grid" ? 2 : 1}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingHorizontal: viewMode === "grid" ? 4 : 0,
          }}
        />
      )}

      {/* Filter Modal */}
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
                setFilters({ country: "", state: "", minRating: 0 });
              }}
            >
              <Text className="text-indigo-600">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Country Filter */}
            <View className="mb-6">
              <Text className="font-semibold text-gray-900 mb-2">Country</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Enter country..."
                placeholderTextColor="#9CA3AF"
                value={filters.country}
                onChangeText={(text) => setFilters((f) => ({ ...f, country: text }))}
              />
            </View>

            {/* State Filter */}
            <View className="mb-6">
              <Text className="font-semibold text-gray-900 mb-2">State/Province</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="Enter state..."
                placeholderTextColor="#9CA3AF"
                value={filters.state}
                onChangeText={(text) => setFilters((f) => ({ ...f, state: text }))}
              />
            </View>

            {/* Minimum Rating */}
            <View className="mb-6">
              <Text className="font-semibold text-gray-900 mb-2">Minimum Rating</Text>
              <View className="flex-row gap-2">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    className={`flex-1 py-3 rounded-xl items-center ${
                      filters.minRating === rating ? "bg-indigo-600" : "bg-gray-100"
                    }`}
                    onPress={() => setFilters((f) => ({ ...f, minRating: rating }))}
                  >
                    <Text
                      className={`font-medium ${
                        filters.minRating === rating ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {rating === 0 ? "Any" : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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

export default UniversitiesScreen;
