import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useApiClient } from "@/utils/api";

interface SuggestedUser {
  _id: string;
  username: string;
  fullName: string;
  profileImg?: string;
  major?: string;
}

interface Topic {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TOPICS: Topic[] = [
  { id: "study-tips", name: "Study Tips", icon: "bulb", color: "#F59E0B" },
  { id: "career", name: "Career Advice", icon: "briefcase", color: "#6366F1" },
  { id: "campus-life", name: "Campus Life", icon: "school", color: "#10B981" },
  { id: "research", name: "Research", icon: "flask", color: "#8B5CF6" },
  { id: "tech", name: "Technology", icon: "laptop", color: "#3B82F6" },
  { id: "sports", name: "Sports", icon: "football", color: "#EF4444" },
  { id: "clubs", name: "Clubs & Orgs", icon: "people", color: "#EC4899" },
  { id: "events", name: "Events", icon: "calendar", color: "#14B8A6" },
];

export default function FollowSuggestionsScreen() {
  const { setFollowing, nextStep, prevStep, data } = useOnboarding();
  const api = useApiClient();

  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      // Load user suggestions based on university
      const universityId = data?.universityId;
      if (universityId) {
        const response = await api.get(
          `/users/suggestions?universityId=${universityId}&limit=10`
        );
        setSuggestedUsers(response.data.users || []);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleContinue = async () => {
    await setFollowing(selectedUsers, selectedTopics);
    nextStep();
  };

  const handleSkip = () => {
    nextStep();
  };

  const selectAllUsers = () => {
    setSelectedUsers(suggestedUsers.map((u) => u._id));
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-6 pt-4">
          <TouchableOpacity className="mb-6" onPress={prevStep}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Personalize your feed
          </Text>
          <Text className="text-gray-500 mb-6">
            Follow people and topics to see relevant content
          </Text>

          {/* Topics Section */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Topics you're interested in
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    className={`flex-row items-center px-4 py-2 rounded-full border ${
                      isSelected
                        ? "bg-indigo-100 border-indigo-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                    onPress={() => toggleTopic(topic.id)}
                  >
                    <Ionicons
                      name={topic.icon}
                      size={16}
                      color={isSelected ? "#6366F1" : topic.color}
                    />
                    <Text
                      className={`ml-2 text-sm ${
                        isSelected
                          ? "text-indigo-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {topic.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Users Section */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Suggested people
              </Text>
              {suggestedUsers.length > 0 && (
                <TouchableOpacity onPress={selectAllUsers}>
                  <Text className="text-indigo-600 font-medium">Follow all</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            ) : suggestedUsers.length === 0 ? (
              <View className="py-8 items-center bg-gray-50 rounded-xl">
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-400 mt-2">
                  No suggestions available yet
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {suggestedUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user._id);
                  return (
                    <TouchableOpacity
                      key={user._id}
                      className={`flex-row items-center p-3 rounded-xl border ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 bg-white"
                      }`}
                      onPress={() => toggleUser(user._id)}
                    >
                      <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-3">
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-medium">
                          {user.fullName}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          @{user.username}
                          {user.major ? ` · ${user.major}` : ""}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View className="bg-indigo-600 rounded-full px-3 py-1">
                          <Text className="text-white text-sm font-medium">
                            Following
                          </Text>
                        </View>
                      ) : (
                        <View className="border border-indigo-600 rounded-full px-3 py-1">
                          <Text className="text-indigo-600 text-sm font-medium">
                            Follow
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-white border-t border-gray-100">
        <TouchableOpacity className="mb-3" onPress={handleSkip}>
          <Text className="text-center text-gray-500">Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-xl py-4 bg-indigo-600"
          onPress={handleContinue}
        >
          <Text className="text-white text-center font-semibold text-base">
            Continue
            {(selectedUsers.length > 0 || selectedTopics.length > 0) &&
              ` (${selectedUsers.length + selectedTopics.length} selected)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
