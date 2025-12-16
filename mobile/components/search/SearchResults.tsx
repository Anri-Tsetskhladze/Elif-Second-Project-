import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GlobalSearchResults,
  UniversitySearchResult as UniversityResult,
  UserSearchResult as UserResult,
  PostSearchResult as PostResult,
  NoteSearchResult as NoteResult,
} from "@/types";
import UniversitySearchResult from "./UniversitySearchResult";
import UserSearchResult from "./UserSearchResult";
import PostSearchResult from "./PostSearchResult";
import NoteSearchResult from "./NoteSearchResult";

type TabType = "all" | "universities" | "users" | "posts" | "notes";

interface SearchResultsProps {
  results: GlobalSearchResults | null;
  isLoading: boolean;
  onLoadMore?: (type: TabType) => void;
  hasMore?: Record<TabType, boolean>;
  isLoadingMore?: Record<TabType, boolean>;
}

interface Tab {
  id: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: Tab[] = [
  { id: "all", label: "All", icon: "search" },
  { id: "universities", label: "Universities", icon: "school-outline" },
  { id: "users", label: "Users", icon: "people-outline" },
  { id: "posts", label: "Posts", icon: "chatbubbles-outline" },
  { id: "notes", label: "Notes", icon: "document-text-outline" },
];

const EmptyState = ({ type }: { type: TabType }) => {
  const messages: Record<TabType, { title: string; subtitle: string }> = {
    all: { title: "No results found", subtitle: "Try different keywords" },
    universities: { title: "No universities found", subtitle: "Try a different search term" },
    users: { title: "No users found", subtitle: "Try searching by username or name" },
    posts: { title: "No posts found", subtitle: "Try different keywords or filters" },
    notes: { title: "No notes found", subtitle: "Try different subject or keywords" },
  };

  return (
    <View className="items-center pt-16 pb-8">
      <Ionicons name="search-outline" size={56} color="#E5E7EB" />
      <Text className="text-gray-500 font-medium text-base mt-4">{messages[type].title}</Text>
      <Text className="text-gray-400 text-sm mt-1">{messages[type].subtitle}</Text>
    </View>
  );
};

const SearchResults = ({
  results,
  isLoading,
  onLoadMore,
  hasMore = { all: false, universities: false, users: false, posts: false, notes: false },
  isLoadingMore = { all: false, universities: false, users: false, posts: false, notes: false },
}: SearchResultsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center pt-20">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-gray-500 mt-3">Searching...</Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View className="flex-1 bg-white">
        <EmptyState type="all" />
      </View>
    );
  }

  const { counts } = results;

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return renderAllResults();
      case "universities":
        return renderUniversities();
      case "users":
        return renderUsers();
      case "posts":
        return renderPosts();
      case "notes":
        return renderNotes();
      default:
        return null;
    }
  };

  const renderAllResults = () => {
    const { universities, users, posts, notes } = results.results;
    const hasAnyResults = universities.length > 0 || users.length > 0 || posts.length > 0 || notes.length > 0;

    if (!hasAnyResults) {
      return <EmptyState type="all" />;
    }

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Universities section */}
        {universities.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50">
              <Text className="font-semibold text-gray-700">Universities</Text>
              {counts.universities > 5 && (
                <TouchableOpacity onPress={() => setActiveTab("universities")}>
                  <Text className="text-indigo-600 text-sm">See all ({counts.universities})</Text>
                </TouchableOpacity>
              )}
            </View>
            {universities.slice(0, 3).map((university) => (
              <UniversitySearchResult key={university._id} university={university} />
            ))}
          </View>
        )}

        {/* Users section */}
        {users.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50">
              <Text className="font-semibold text-gray-700">Users</Text>
              {counts.users > 5 && (
                <TouchableOpacity onPress={() => setActiveTab("users")}>
                  <Text className="text-indigo-600 text-sm">See all ({counts.users})</Text>
                </TouchableOpacity>
              )}
            </View>
            {users.slice(0, 3).map((user) => (
              <UserSearchResult key={user._id} user={user} />
            ))}
          </View>
        )}

        {/* Posts section */}
        {posts.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50">
              <Text className="font-semibold text-gray-700">Posts</Text>
              {counts.posts > 5 && (
                <TouchableOpacity onPress={() => setActiveTab("posts")}>
                  <Text className="text-indigo-600 text-sm">See all ({counts.posts})</Text>
                </TouchableOpacity>
              )}
            </View>
            {posts.slice(0, 3).map((post) => (
              <PostSearchResult key={post._id} post={post} searchQuery={results.query} />
            ))}
          </View>
        )}

        {/* Notes section */}
        {notes.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50">
              <Text className="font-semibold text-gray-700">Notes</Text>
              {counts.notes > 5 && (
                <TouchableOpacity onPress={() => setActiveTab("notes")}>
                  <Text className="text-indigo-600 text-sm">See all ({counts.notes})</Text>
                </TouchableOpacity>
              )}
            </View>
            {notes.slice(0, 3).map((note) => (
              <NoteSearchResult key={note._id} note={note} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderUniversities = () => {
    const universities = results.results.universities;
    if (universities.length === 0) return <EmptyState type="universities" />;

    return (
      <FlatList
        data={universities}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <UniversitySearchResult university={item} />}
        onEndReached={() => hasMore.universities && onLoadMore?.("universities")}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore.universities ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ padding: 16 }} />
          ) : null
        }
      />
    );
  };

  const renderUsers = () => {
    const users = results.results.users;
    if (users.length === 0) return <EmptyState type="users" />;

    return (
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <UserSearchResult user={item} />}
        onEndReached={() => hasMore.users && onLoadMore?.("users")}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore.users ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ padding: 16 }} />
          ) : null
        }
      />
    );
  };

  const renderPosts = () => {
    const posts = results.results.posts;
    if (posts.length === 0) return <EmptyState type="posts" />;

    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostSearchResult post={item} searchQuery={results.query} />}
        onEndReached={() => hasMore.posts && onLoadMore?.("posts")}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore.posts ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ padding: 16 }} />
          ) : null
        }
      />
    );
  };

  const renderNotes = () => {
    const notes = results.results.notes;
    if (notes.length === 0) return <EmptyState type="notes" />;

    return (
      <FlatList
        data={notes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <NoteSearchResult note={item} />}
        onEndReached={() => hasMore.notes && onLoadMore?.("notes")}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore.notes ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ padding: 16 }} />
          ) : null
        }
      />
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Tabs */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {TABS.map((tab) => {
            const count = tab.id === "all" ? counts.total : counts[tab.id] || 0;
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                className={`flex-row items-center px-3 py-3 mr-2 border-b-2 ${
                  isActive ? "border-indigo-600" : "border-transparent"
                }`}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? "#4F46E5" : "#6B7280"}
                />
                <Text
                  className={`ml-1.5 text-sm font-medium ${
                    isActive ? "text-indigo-600" : "text-gray-600"
                  }`}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-indigo-100" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isActive ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      {count > 99 ? "99+" : count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results */}
      <View className="flex-1">{renderTabContent()}</View>
    </View>
  );
};

export default SearchResults;
