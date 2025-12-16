import { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSocialAuth } from "@/hooks/useSocialAuth";

export default function SignInScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { handleSocialAuth, isLoading: socialLoading } = useSocialAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Sign in incomplete. Please try again.");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      Alert.alert(
        "Sign In Failed",
        error.errors?.[0]?.message || "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Email Required", "Please enter your email address first");
      return;
    }

    try {
      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      Alert.alert("Check Your Email", "We sent a password reset code to your email");
    } catch (error: any) {
      Alert.alert("Error", error.errors?.[0]?.message || "Failed to send reset email");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-14">
          <TouchableOpacity
            className="mb-6"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">Welcome back</Text>
          <Text className="text-gray-500 mb-8">Sign in to your account</Text>

          <View className="gap-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <View className="relative">
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-12"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3.5"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text className="text-indigo-600 text-right">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-indigo-600 rounded-xl py-4 mt-6"
            onPress={handleSignIn}
            disabled={isLoading || socialLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400 text-sm">or continue with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <View className="flex-row gap-4">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 rounded-xl py-3.5"
              onPress={() => handleSocialAuth("oauth_google")}
              disabled={isLoading || socialLoading}
            >
              {socialLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text className="text-gray-700 font-medium ml-2">Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-black rounded-xl py-3.5"
              onPress={() => handleSocialAuth("oauth_apple")}
              disabled={isLoading || socialLoading}
            >
              {socialLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text className="text-white font-medium ml-2">Apple</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8 mb-8">
            <Text className="text-gray-500">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
              <Text className="text-indigo-600 font-medium">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
