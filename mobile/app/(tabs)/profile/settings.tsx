import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useApiClient, userApi } from "@/utils/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingItem = ({
  icon,
  iconColor = "#6366F1",
  iconBg = "bg-indigo-50",
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
}: SettingItemProps) => (
  <TouchableOpacity
    className="flex-row items-center px-4 py-3"
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View className={`w-10 h-10 rounded-xl ${iconBg} items-center justify-center mr-3`}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View className="flex-1">
      <Text className={`font-medium ${danger ? "text-red-600" : "text-gray-900"}`}>{title}</Text>
      {subtitle && <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>}
    </View>
    {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />)}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <View className="px-4 pt-6 pb-2">
    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</Text>
  </View>
);

const SettingsScreen = () => {
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const { currentUser } = useCurrentUser();

  const [isPrivate, setIsPrivate] = useState(currentUser?.isPrivate || false);
  const [showEmail, setShowEmail] = useState(currentUser?.showEmail || false);

  // Privacy mutation
  const privacyMutation = useMutation({
    mutationFn: (settings: { isPrivate?: boolean; showEmail?: boolean }) =>
      userApi.updatePrivacy(api, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to update privacy settings");
    },
  });

  const handlePrivateToggle = useCallback(
    (value: boolean) => {
      setIsPrivate(value);
      privacyMutation.mutate({ isPrivate: value });
    },
    [privacyMutation]
  );

  const handleEmailToggle = useCallback(
    (value: boolean) => {
      setShowEmail(value);
      privacyMutation.mutate({ showEmail: value });
    },
    [privacyMutation]
  );

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)");
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data including posts, reviews, and notes will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Type DELETE to confirm account deletion",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "I understand, delete my account",
                  style: "destructive",
                  onPress: () => {
                    // Would call delete API here
                    Alert.alert("Contact Support", "Please contact support to delete your account.");
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Settings",
          headerBackTitle: "Back",
          headerTintColor: "#111827",
          headerStyle: { backgroundColor: "#F9FAFB" },
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SectionHeader title="Account" />
        <View className="bg-white border-y border-gray-100">
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Name, username, bio"
            onPress={() => router.push("/(tabs)/profile/edit")}
          />
          <View className="h-px bg-gray-100 ml-16" />
          <SettingItem
            icon="school-outline"
            iconColor="#8B5CF6"
            iconBg="bg-purple-50"
            title="Verification"
            subtitle={currentUser?.isVerified ? "Verified student" : "Verify your student status"}
            onPress={() => router.push("/(onboarding)/verification")}
            rightElement={
              currentUser?.isVerified ? (
                <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-full">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-emerald-600 text-sm font-medium ml-1">Verified</Text>
                </View>
              ) : undefined
            }
          />
        </View>

        {/* Privacy Section */}
        <SectionHeader title="Privacy" />
        <View className="bg-white border-y border-gray-100">
          <SettingItem
            icon="lock-closed-outline"
            iconColor="#F59E0B"
            iconBg="bg-amber-50"
            title="Private Account"
            subtitle="Only followers can see your posts"
            rightElement={
              <Switch
                value={isPrivate}
                onValueChange={handlePrivateToggle}
                trackColor={{ false: "#D1D5DB", true: "#A5B4FC" }}
                thumbColor={isPrivate ? "#6366F1" : "#fff"}
              />
            }
          />
          <View className="h-px bg-gray-100 ml-16" />
          <SettingItem
            icon="mail-outline"
            iconColor="#10B981"
            iconBg="bg-emerald-50"
            title="Show Email"
            subtitle="Display email on your profile"
            rightElement={
              <Switch
                value={showEmail}
                onValueChange={handleEmailToggle}
                trackColor={{ false: "#D1D5DB", true: "#A5B4FC" }}
                thumbColor={showEmail ? "#6366F1" : "#fff"}
              />
            }
          />
          <View className="h-px bg-gray-100 ml-16" />
          <SettingItem
            icon="eye-off-outline"
            iconColor="#6B7280"
            iconBg="bg-gray-100"
            title="Blocked Users"
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <View className="bg-white border-y border-gray-100">
          <SettingItem
            icon="notifications-outline"
            iconColor="#EF4444"
            iconBg="bg-red-50"
            title="Push Notifications"
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          />
          <View className="h-px bg-gray-100 ml-16" />
          <SettingItem
            icon="mail-unread-outline"
            iconColor="#3B82F6"
            iconBg="bg-blue-50"
            title="Email Notifications"
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          />
        </View>

        {/* Support Section */}
        <SectionHeader title="Support" />
        <View className="bg-white border-y border-gray-100">
          <SettingItem
            icon="help-circle-outline"
            iconColor="#6366F1"
            iconBg="bg-indigo-50"
            title="Help Center"
            onPress={() => Alert.alert("Help", "Contact us at support@academyhub.com")}
          />
          <View className="h-px bg-gray-100 ml-16" />
          <SettingItem
            icon="document-text-outline"
            iconColor="#6B7280"
            iconBg="bg-gray-100"
            title="Terms of Service"
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          />
          <View className="h-px bg-gray-100 ml-16" />
          <SettingItem
            icon="shield-checkmark-outline"
            iconColor="#6B7280"
            iconBg="bg-gray-100"
            title="Privacy Policy"
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          />
        </View>

        {/* App Info */}
        <SectionHeader title="About" />
        <View className="bg-white border-y border-gray-100">
          <SettingItem
            icon="information-circle-outline"
            iconColor="#6B7280"
            iconBg="bg-gray-100"
            title="App Version"
            rightElement={<Text className="text-gray-500">1.0.0</Text>}
          />
        </View>

        {/* Sign Out */}
        <View className="mt-6 bg-white border-y border-gray-100">
          <SettingItem
            icon="log-out-outline"
            iconColor="#EF4444"
            iconBg="bg-red-50"
            title="Sign Out"
            onPress={handleSignOut}
            danger
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <View className="bg-white border-y border-gray-100">
          <SettingItem
            icon="trash-outline"
            iconColor="#EF4444"
            iconBg="bg-red-50"
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
