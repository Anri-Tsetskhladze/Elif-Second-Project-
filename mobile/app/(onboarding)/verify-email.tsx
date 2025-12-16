import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useApiClient } from "@/utils/api";

export default function VerifyEmailScreen() {
  const { setEmailVerified, nextStep, prevStep, data } = useOnboarding();
  const api = useApiClient();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string) => {
    const eduPattern = /^[^\s@]+@[^\s@]+\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2})$/i;
    return eduPattern.test(email);
  };

  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid university email (.edu)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.post("/verification/student/verify", { email });
      setStep("verify");
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.post("/verification/student/complete", { email, code });
      await setEmailVerified(email);
      nextStep();
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError("");

    try {
      await api.post("/verification/student/resend", { email });
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    nextStep();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 px-6 pt-4">
        <TouchableOpacity className="mb-6" onPress={prevStep}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="mail" size={32} color="#6366F1" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Verify your student email
        </Text>
        <Text className="text-gray-500 mb-8">
          Use your university email to get verified student status
        </Text>

        {step === "input" ? (
          <>
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                University Email
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                placeholder="your.name@university.edu"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {error ? (
              <View className="flex-row items-center mb-4">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-red-600 ml-2 text-sm">{error}</Text>
              </View>
            ) : null}

            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-blue-700 text-sm ml-2 flex-1">
                  We'll send a 6-digit code to verify your student email. This
                  gives you access to exclusive student features.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className={`rounded-xl py-4 ${
                email.length > 0 && !isLoading ? "bg-indigo-600" : "bg-gray-300"
              }`}
              onPress={handleSendCode}
              disabled={email.length === 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Send Verification Code
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm">Code sent to</Text>
              <Text className="text-gray-900 font-medium">{email}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                Verification Code
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-base text-center tracking-widest"
                placeholder="000000"
                value={code}
                onChangeText={(text) => {
                  setCode(text.replace(/[^0-9]/g, "").slice(0, 6));
                  setError("");
                }}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {error ? (
              <View className="flex-row items-center mb-4">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-red-600 ml-2 text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`rounded-xl py-4 mb-4 ${
                code.length === 6 && !isLoading ? "bg-indigo-600" : "bg-gray-300"
              }`}
              onPress={handleVerify}
              disabled={code.length !== 6 || isLoading}
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
              className="py-2"
              onPress={handleResend}
              disabled={countdown > 0}
            >
              <Text
                className={`text-center ${
                  countdown > 0 ? "text-gray-400" : "text-indigo-600"
                }`}
              >
                {countdown > 0
                  ? `Resend code in ${countdown}s`
                  : "Resend verification code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-2 mt-2"
              onPress={() => {
                setStep("input");
                setCode("");
                setError("");
              }}
            >
              <Text className="text-center text-gray-500">
                Use a different email
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View className="px-6 pb-8 pt-4 border-t border-gray-100">
        <TouchableOpacity onPress={handleSkip}>
          <Text className="text-center text-gray-500">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
