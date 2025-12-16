import { useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Share, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, universityApi } from "@/utils/api";
import { UniversityHeader, UniversityTabs, UniversityStats } from "@/components/universities";
import type { UniversityTabId } from "@/components/universities";

interface UniversityDetail {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  website?: string;
  images?: { logo?: string; cover?: string };
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
  postCount?: number;
  noteCount?: number;
  admissionRate?: number;
  graduationRate?: number;
  tuitionInState?: number;
  tuitionOutState?: number;
  acceptanceRate?: number;
  foundedYear?: number;
  type?: string;
  isJoined?: boolean;
}

const UniversityDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<UniversityTabId>("overview");

  const { data: university, isLoading } = useQuery({
    queryKey: ["university", id],
    queryFn: () => universityApi.getById(api, id),
    select: (res) => res.data.university as UniversityDetail,
    enabled: !!id,
  });

  // Join/Leave mutation
  const joinMutation = useMutation({
    mutationFn: () => universityApi.join(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["university", id] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to join university. Please try again.");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => universityApi.leave(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["university", id] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to leave university. Please try again.");
    },
  });

  const handleJoin = useCallback(() => {
    joinMutation.mutate();
  }, [joinMutation]);

  const handleLeave = useCallback(() => {
    Alert.alert(
      "Leave University",
      "Are you sure you want to leave this university?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => leaveMutation.mutate(),
        },
      ]
    );
  }, [leaveMutation]);

  const handleShare = useCallback(async () => {
    if (!university) return;
    try {
      await Share.share({
        message: `Check out ${university.name} on Academy Hub!`,
        title: university.name,
      });
    } catch (error) {
      // User cancelled sharing
    }
  }, [university]);

  const handleTabChange = useCallback((tab: UniversityTabId) => {
    setActiveTab(tab);

    // Navigate to tab-specific screens
    switch (tab) {
      case "reviews":
        router.push(`/(tabs)/universities/${id}/reviews`);
        break;
      case "posts":
        router.push(`/(tabs)/universities/${id}/posts`);
        break;
      case "notes":
        router.push(`/(tabs)/universities/${id}/notes`);
        break;
      case "students":
        router.push(`/(tabs)/universities/${id}/students`);
        break;
      case "overview":
      default:
        // Stay on this screen
        break;
    }
  }, [router, id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!university) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="school-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-400 text-lg mt-4">University not found</Text>
      </SafeAreaView>
    );
  }

  const isJoining = joinMutation.isPending || leaveMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* University Header */}
        <UniversityHeader
          university={university}
          isJoined={university.isJoined}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onShare={handleShare}
          isJoining={isJoining}
        />

        {/* Tab Navigation */}
        <UniversityTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            reviews: university.reviewCount,
            posts: university.postCount,
            notes: university.noteCount,
            students: university.studentCount,
          }}
        />

        {/* Overview Content */}
        {activeTab === "overview" && (
          <View className="px-4 py-4">
            {/* About Section */}
            {university.description && (
              <View className="mb-6">
                <Text className="font-semibold text-gray-900 text-lg mb-2">About</Text>
                <Text className="text-gray-600 leading-6">{university.description}</Text>
              </View>
            )}

            {/* Statistics */}
            <View className="mb-6">
              <Text className="font-semibold text-gray-900 text-lg mb-3">Key Statistics</Text>
              <UniversityStats university={university} />
            </View>

            {/* Quick Actions */}
            <View className="mb-6">
              <Text className="font-semibold text-gray-900 text-lg mb-3">Quick Actions</Text>
              <View className="flex-row flex-wrap gap-2">
                <QuickActionButton
                  icon="star-outline"
                  label="Write Review"
                  onPress={() => router.push(`/(tabs)/universities/${id}/write-review`)}
                  color="#F59E0B"
                  bgColor="bg-amber-50"
                />
                <QuickActionButton
                  icon="document-text-outline"
                  label="Upload Notes"
                  onPress={() => router.push(`/(tabs)/universities/${id}/notes/upload`)}
                  color="#8B5CF6"
                  bgColor="bg-purple-50"
                />
                <QuickActionButton
                  icon="chatbubbles-outline"
                  label="Discussions"
                  onPress={() => handleTabChange("posts")}
                  color="#10B981"
                  bgColor="bg-emerald-50"
                />
                <QuickActionButton
                  icon="people-outline"
                  label="Students"
                  onPress={() => handleTabChange("students")}
                  color="#6366F1"
                  bgColor="bg-indigo-50"
                />
              </View>
            </View>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
}

const QuickActionButton = ({ icon, label, onPress, color, bgColor }: QuickActionButtonProps) => (
  <TouchableOpacity
    className={`${bgColor} rounded-xl p-4 flex-1 min-w-[140px]`}
    style={{ flexBasis: "45%" }}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View className="items-center">
      <Ionicons name={icon} size={24} color={color} />
      <Text className="text-gray-700 font-medium text-sm mt-2 text-center">{label}</Text>
    </View>
  </TouchableOpacity>
);

export default UniversityDetailScreen;
