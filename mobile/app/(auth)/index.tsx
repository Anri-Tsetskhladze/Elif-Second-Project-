import { useSocialAuth } from "@/hooks/useSocialAuth";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AuthScreen() {
  const { handleSocialAuth, isLoading } = useSocialAuth();
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-between">
        <View className="flex-1 justify-center">
          <View className="items-center mb-8">
            <Image
              source={require("../../assets/images/auth2.png")}
              className="w-72 h-72"
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-gray-900 mt-4">Academy Hub</Text>
            <Text className="text-gray-500 text-center mt-2">
              Connect with your university community
            </Text>
          </View>

          <View className="gap-3">
            <TouchableOpacity
              className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3.5 px-6"
              onPress={() => handleSocialAuth("oauth_google")}
              disabled={isLoading}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <Image
                    source={require("../../assets/images/google.png")}
                    className="w-6 h-6 mr-3"
                    resizeMode="contain"
                  />
                  <Text className="text-gray-800 font-medium text-base">
                    Continue with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center bg-black rounded-full py-3.5 px-6"
              onPress={() => handleSocialAuth("oauth_apple")}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <Ionicons name="logo-apple" size={22} color="white" />
                  <Text className="text-white font-medium text-base ml-2">
                    Continue with Apple
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-gray-400 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-center bg-indigo-600 rounded-full py-3.5 px-6"
              onPress={() => router.push("/(auth)/sign-up")}
              disabled={isLoading}
            >
              <Ionicons name="school-outline" size={22} color="white" />
              <Text className="text-white font-medium text-base ml-2">
                Sign up with University Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3"
              onPress={() => router.push("/(auth)/sign-in")}
            >
              <Text className="text-center text-indigo-600 font-medium">
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-gray-400 text-xs leading-5 mt-6 px-4">
            By signing up, you agree to our{" "}
            <Text className="text-indigo-500">Terms of Service</Text>
            {" and "}
            <Text className="text-indigo-500">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
