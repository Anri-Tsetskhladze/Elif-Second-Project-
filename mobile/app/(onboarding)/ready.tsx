import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function ReadyScreen() {
  const router = useRouter();
  const { completeOnboarding, data } = useOnboarding();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate on mount
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const getUserName = () => {
    if (data?.profile?.fullName) {
      return data.profile.fullName.split(" ")[0];
    }
    return "there";
  };

  return (
    <View className="flex-1 bg-white px-6">
      <View className="flex-1 justify-center items-center">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="w-32 h-32 bg-green-100 rounded-full items-center justify-center mb-8"
        >
          <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }} className="items-center">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            You're all set, {getUserName()}!
          </Text>

          <Text className="text-gray-500 text-center text-lg mb-8 px-4">
            Welcome to Academy Hub. Your personalized university experience
            awaits.
          </Text>

          {/* Summary */}
          <View className="w-full bg-gray-50 rounded-xl p-4 mb-6">
            {data?.universityName && (
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="school" size={16} color="#6366F1" />
                </View>
                <Text className="text-gray-700 flex-1" numberOfLines={1}>
                  {data.universityName}
                </Text>
              </View>
            )}

            {data?.role && (
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="person" size={16} color="#16A34A" />
                </View>
                <Text className="text-gray-700 capitalize">{data.role}</Text>
              </View>
            )}

            {data?.isEmailVerified && (
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="shield-checkmark" size={16} color="#3B82F6" />
                </View>
                <Text className="text-gray-700">Verified Student</Text>
              </View>
            )}
          </View>

          {/* What's next */}
          <View className="w-full">
            <Text className="text-gray-900 font-semibold mb-3">
              What you can do now:
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={20} color="#16A34A" />
                <Text className="text-gray-600 ml-2">
                  Browse posts from your university
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={20} color="#16A34A" />
                <Text className="text-gray-600 ml-2">
                  Share notes and study materials
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={20} color="#16A34A" />
                <Text className="text-gray-600 ml-2">
                  Connect with fellow students
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <View className="pb-8">
        <TouchableOpacity
          className="bg-indigo-600 rounded-xl py-4"
          onPress={handleGetStarted}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Start Exploring
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
