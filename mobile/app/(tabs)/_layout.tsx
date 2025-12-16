import { useState, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Text } from "react-native";
import { Redirect, Tabs, useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { BlurView } from "expo-blur";

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  nameOutline: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size: number;
  badge?: number;
}

const TabIcon = ({ name, nameOutline, focused, color, size, badge }: TabIconProps) => (
  <View>
    <Ionicons name={focused ? name : nameOutline} size={size} color={color} />
    {badge !== undefined && badge > 0 && (
      <View className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
        <Text className="text-white text-xs font-bold">{badge > 99 ? "99+" : badge}</Text>
      </View>
    )}
  </View>
);

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  const [fabOpen, setFabOpen] = useState(false);
  const [fabAnimation] = useState(new Animated.Value(0));

  const toggleFab = useCallback(() => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnimation, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setFabOpen(!fabOpen);
  }, [fabOpen, fabAnimation]);

  const handleFabAction = useCallback(
    (action: string) => {
      toggleFab();
      switch (action) {
        case "post":
          router.push("/new-post");
          break;
        case "note":
          router.push("/(tabs)/notes/upload");
          break;
        case "review":
          router.push("/(tabs)/universities");
          break;
      }
    },
    [toggleFab, router]
  );

  if (!isSignedIn) return <Redirect href="/(auth)" />;

  // Hide FAB on certain screens
  const showFab = !pathname.includes("/edit") && !pathname.includes("/upload");

  const fabRotation = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const fabScale = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const fabOpacity = fabAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#6366F1",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 0,
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                name="home"
                nameOutline="home-outline"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="universities"
          options={{
            title: "Universities",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                name="school"
                nameOutline="school-outline"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                name="search"
                nameOutline="search-outline"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: "Notes",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                name="document-text"
                nameOutline="document-text-outline"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                name="person"
                nameOutline="person-outline"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />

        {/* Hidden screens */}
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="messages" options={{ href: null }} />
      </Tabs>

      {/* Floating Action Button */}
      {showFab && (
        <>
          {/* Backdrop */}
          {fabOpen && (
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={toggleFab}
            >
              <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
            </TouchableOpacity>
          )}

          {/* FAB Menu Items */}
          <Animated.View
            style={[
              styles.fabMenuItem,
              {
                bottom: 160 + insets.bottom,
                opacity: fabOpacity,
                transform: [{ scale: fabScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.fabMenuButton}
              onPress={() => handleFabAction("post")}
            >
              <Ionicons name="chatbubbles" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fabMenuLabel}>New Post</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.fabMenuItem,
              {
                bottom: 220 + insets.bottom,
                opacity: fabOpacity,
                transform: [{ scale: fabScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.fabMenuButton, { backgroundColor: "#8B5CF6" }]}
              onPress={() => handleFabAction("note")}
            >
              <Ionicons name="document-text" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fabMenuLabel}>Upload Note</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.fabMenuItem,
              {
                bottom: 280 + insets.bottom,
                opacity: fabOpacity,
                transform: [{ scale: fabScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.fabMenuButton, { backgroundColor: "#F59E0B" }]}
              onPress={() => handleFabAction("review")}
            >
              <Ionicons name="star" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fabMenuLabel}>Write Review</Text>
          </Animated.View>

          {/* Main FAB */}
          <Animated.View
            style={[
              styles.fab,
              {
                bottom: 80 + insets.bottom,
                transform: [{ rotate: fabRotation }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.fabButton}
              onPress={toggleFab}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    zIndex: 100,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabMenuItem: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 99,
  },
  fabMenuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabMenuLabel: {
    position: "absolute",
    right: 60,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});

export default TabsLayout;
