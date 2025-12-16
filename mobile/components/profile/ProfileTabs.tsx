import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ProfileTabId = "posts" | "reviews" | "notes" | "saved";

interface Tab {
  id: ProfileTabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
}

interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  counts?: {
    posts?: number;
    reviews?: number;
    notes?: number;
    saved?: number;
  };
  showSaved?: boolean;
}

const ProfileTabs = ({
  activeTab,
  onTabChange,
  counts = {},
  showSaved = true,
}: ProfileTabsProps) => {
  const tabs: Tab[] = [
    { id: "posts", label: "Posts", icon: "chatbubbles-outline", count: counts.posts },
    { id: "reviews", label: "Reviews", icon: "star-outline", count: counts.reviews },
    { id: "notes", label: "Notes", icon: "document-text-outline", count: counts.notes },
  ];

  if (showSaved) {
    tabs.push({ id: "saved", label: "Saved", icon: "bookmark-outline", count: counts.saved });
  }

  return (
    <View className="bg-white border-b border-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              className={`flex-row items-center px-4 py-3 mr-1 border-b-2 ${
                isActive ? "border-indigo-600" : "border-transparent"
              }`}
              onPress={() => onTabChange(tab.id)}
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
              {tab.count !== undefined && tab.count > 0 && (
                <View
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full min-w-[20px] items-center ${
                    isActive ? "bg-indigo-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isActive ? "text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    {tab.count > 99 ? "99+" : tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ProfileTabs;
