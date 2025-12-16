import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/clerk-expo";
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
import { useStudentVerification } from "@/hooks/useStudentVerification";

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { checkEmail, emailCheckResult, isCheckingEmail, clearEmailCheck } = useStudentVerification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && email.includes("@") && email.includes(".")) {
        checkEmail(email);
      } else {
        clearEmailCheck();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSignUp = async () => {
    if (!isLoaded) return;

    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (error: any) {
      console.error("Sign up error:", error);
      Alert.alert(
        "Sign Up Failed",
        error.errors?.[0]?.message || "Unable to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Verification incomplete. Please try again.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert(
        "Verification Failed",
        error.errors?.[0]?.message || "Invalid code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-white px-6 justify-center">
        <TouchableOpacity
          className="absolute top-14 left-4 p-2"
          onPress={() => setPendingVerification(false)}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="mail-outline" size={32} color="#6366F1" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">Check your email</Text>
          <Text className="text-gray-500 text-center mt-2">
            We sent a verification code to{"\n"}
            <Text className="text-gray-700 font-medium">{email}</Text>
          </Text>
        </View>

        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-lg text-center tracking-widest"
          placeholder="Enter code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity
          className="bg-indigo-600 rounded-xl py-4 mt-6"
          onPress={handleVerifyCode}
          disabled={isLoading || code.length < 6}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Verify Email
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4"
          onPress={() => signUp?.prepareEmailAddressVerification({ strategy: "email_code" })}
        >
          <Text className="text-center text-indigo-600">Resend code</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

          <Text className="text-2xl font-bold text-gray-900 mb-2">Create account</Text>
          <Text className="text-gray-500 mb-8">
            Sign up with your university email to get verified
          </Text>

          {emailCheckResult?.university && (
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex-row items-center">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="school" size={20} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="text-green-800 font-medium">
                  {emailCheckResult.university.name}
                </Text>
                <Text className="text-green-600 text-sm">
                  You'll be auto-verified as a student
                </Text>
              </View>
            </View>
          )}

          {emailCheckResult && !emailCheckResult.isValid && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex-row items-center">
              <Ionicons name="warning-outline" size={20} color="#D97706" />
              <Text className="text-amber-700 ml-2 flex-1">{emailCheckResult.message}</Text>
            </View>
          )}

          <View className="gap-4">
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">First name</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Last name</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <View className="relative">
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-10"
                  placeholder="you@university.edu"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {isCheckingEmail && (
                  <View className="absolute right-3 top-3.5">
                    <ActivityIndicator size="small" color="#6366F1" />
                  </View>
                )}
                {emailCheckResult?.isValid && !isCheckingEmail && (
                  <View className="absolute right-3 top-3.5">
                    <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                  </View>
                )}
              </View>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <View className="relative">
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-12"
                  placeholder="Min. 8 characters"
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
          </View>

          <TouchableOpacity
            className="bg-indigo-600 rounded-xl py-4 mt-8"
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6 mb-8">
            <Text className="text-gray-500">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
              <Text className="text-indigo-600 font-medium">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
