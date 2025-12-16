import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
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
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Step = "email" | "pending" | "verify" | "success";

export default function VerifyStudentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const { currentUser, refetch: refetchUser } = useCurrentUser();
  const {
    checkEmail,
    startVerification,
    verify,
    resend,
    cancel,
    status,
    emailCheckResult,
    isCheckingEmail,
    isStartingVerification,
    isVerifying,
    isResending,
    clearEmailCheck,
  } = useStudentVerification();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  // Handle deep link token
  useEffect(() => {
    if (params.token) {
      setToken(params.token);
      setStep("verify");
    }
  }, [params.token]);

  // Check existing verification status
  useEffect(() => {
    if (status?.isVerified) {
      setStep("success");
    } else if (status?.hasPendingVerification) {
      setStep("pending");
    }
  }, [status]);

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

  const handleStartVerification = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your student email");
      return;
    }

    try {
      await startVerification(email);
      setStep("pending");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleVerify = async () => {
    if (!token) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    try {
      await verify(token);
      await refetchUser();
      setStep("success");
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message);
    }
  };

  const handleResend = async () => {
    try {
      await resend();
      Alert.alert("Success", "Verification email resent");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancel();
      setStep("email");
      setEmail("");
      setToken("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Success screen
  if (step === "success") {
    return (
      <View className="flex-1 bg-white px-6 justify-center items-center">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Verified!</Text>
        <Text className="text-gray-500 text-center mb-8">
          You're now verified as a student
          {emailCheckResult?.university && (
            <Text> at {emailCheckResult.university.name}</Text>
          )}
        </Text>
        <TouchableOpacity
          className="bg-indigo-600 rounded-xl py-4 px-8"
          onPress={() => router.replace("/(tabs)")}
        >
          <Text className="text-white font-semibold">Continue to App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pending verification screen
  if (step === "pending" || step === "verify") {
    return (
      <View className="flex-1 bg-white px-6 justify-center">
        <TouchableOpacity
          className="absolute top-14 left-4 p-2"
          onPress={handleCancel}
        >
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="mail-outline" size={32} color="#6366F1" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">Verify your email</Text>
          <Text className="text-gray-500 text-center mt-2">
            Enter the verification code sent to{"\n"}
            <Text className="text-gray-700 font-medium">
              {status?.studentEmail || email}
            </Text>
          </Text>
        </View>

        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-lg text-center tracking-widest"
          placeholder="Enter verification token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />

        <TouchableOpacity
          className="bg-indigo-600 rounded-xl py-4 mt-6"
          onPress={handleVerify}
          disabled={isVerifying || !token}
        >
          {isVerifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Verify
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-4 gap-4">
          <TouchableOpacity onPress={handleResend} disabled={isResending}>
            <Text className="text-indigo-600">
              {isResending ? "Sending..." : "Resend code"}
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-300">|</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text className="text-gray-500">Use different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Email input screen
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

          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="school-outline" size={32} color="#6366F1" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              Verify Student Status
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Enter your university email to unlock{"\n"}student-only features
            </Text>
          </View>

          {currentUser?.isVerifiedStudent && (
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text className="text-green-700 ml-2">
                Already verified as a student
              </Text>
            </View>
          )}

          {emailCheckResult?.university && (
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="school" size={20} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text className="text-green-800 font-medium">
                    {emailCheckResult.university.name}
                  </Text>
                  {emailCheckResult.university.city && (
                    <Text className="text-green-600 text-sm">
                      {emailCheckResult.university.city}
                      {emailCheckResult.university.state && `, ${emailCheckResult.university.state}`}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {emailCheckResult && !emailCheckResult.isValid && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex-row items-center">
              <Ionicons name="warning-outline" size={20} color="#D97706" />
              <Text className="text-amber-700 ml-2 flex-1">
                {emailCheckResult.message}
              </Text>
            </View>
          )}

          <View>
            <Text className="text-gray-700 font-medium mb-2">Student Email</Text>
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
            <Text className="text-gray-400 text-sm mt-2">
              Use your .edu email to get verified instantly
            </Text>
          </View>

          <TouchableOpacity
            className={`rounded-xl py-4 mt-8 ${
              emailCheckResult?.isValid ? "bg-indigo-600" : "bg-gray-300"
            }`}
            onPress={handleStartVerification}
            disabled={isStartingVerification || !emailCheckResult?.isValid}
          >
            {isStartingVerification ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Send Verification Email
              </Text>
            )}
          </TouchableOpacity>

          <View className="mt-8 p-4 bg-gray-50 rounded-xl">
            <Text className="text-gray-700 font-medium mb-2">
              Benefits of verification:
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#6366F1" />
                <Text className="text-gray-600 ml-2">Verified student badge</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#6366F1" />
                <Text className="text-gray-600 ml-2">Access student-only forums</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#6366F1" />
                <Text className="text-gray-600 ml-2">Join your university community</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={16} color="#6366F1" />
                <Text className="text-gray-600 ml-2">Share and access study materials</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
