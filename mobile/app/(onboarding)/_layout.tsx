import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import { OnboardingProvider } from "@/contexts/OnboardingContext";

const STEPS = [
  "welcome",
  "select-role",
  "select-university",
  "verify-email",
  "complete-profile",
  "follow-suggestions",
  "ready",
];

function ProgressBar() {
  const pathname = usePathname();
  const currentStep = pathname.split("/").pop() || "welcome";
  const currentIndex = STEPS.indexOf(currentStep);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / STEPS.length) * 100 : 0;

  // Hide on welcome and ready screens
  if (currentStep === "welcome" || currentStep === "ready") {
    return null;
  }

  return (
    <View className="px-6 pt-2 pb-4 bg-white">
      <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-indigo-600 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <View className="flex-1 bg-white">
        <ProgressBar />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="welcome" />
          <Stack.Screen name="select-role" />
          <Stack.Screen name="select-university" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="complete-profile" />
          <Stack.Screen name="follow-suggestions" />
          <Stack.Screen name="ready" />
        </Stack>
      </View>
    </OnboardingProvider>
  );
}
