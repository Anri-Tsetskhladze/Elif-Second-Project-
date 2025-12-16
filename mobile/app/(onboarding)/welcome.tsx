import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function WelcomeScreen() {
  const router = useRouter();
  const { nextStep } = useOnboarding();

  const handleGetStarted = () => {
    nextStep();
  };

  return (
    <View className="flex-1 bg-white px-6">
      <View className="flex-1 justify-center items-center">
        <View className="w-32 h-32 bg-indigo-100 rounded-full items-center justify-center mb-8">
          <Ionicons name="school" size={64} color="#6366F1" />
        </View>

        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          Welcome to{"\n"}Academy Hub
        </Text>

        <Text className="text-gray-500 text-center text-lg leading-7 px-4">
          Connect with your university community, share study materials, and make the most of your academic journey.
        </Text>

        <View className="mt-12 w-full gap-4">
          <View className="flex-row items-center bg-indigo-50 rounded-xl p-4">
            <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="people" size={20} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Connect</Text>
              <Text className="text-gray-500 text-sm">Meet students from your university</Text>
            </View>
          </View>

          <View className="flex-row items-center bg-green-50 rounded-xl p-4">
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="document-text" size={20} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Share</Text>
              <Text className="text-gray-500 text-sm">Exchange notes and study materials</Text>
            </View>
          </View>

          <View className="flex-row items-center bg-amber-50 rounded-xl p-4">
            <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="chatbubbles" size={20} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Discuss</Text>
              <Text className="text-gray-500 text-sm">Join forums and get help</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="pb-8">
        <TouchableOpacity
          className="bg-indigo-600 rounded-xl py-4"
          onPress={handleGetStarted}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
