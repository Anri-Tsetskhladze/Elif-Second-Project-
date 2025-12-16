import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";

type Role = "student" | "alumni" | "prospective" | "faculty";

interface RoleOption {
  id: Role;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const ROLES: RoleOption[] = [
  {
    id: "student",
    title: "Current Student",
    description: "I'm currently enrolled at a university",
    icon: "school",
    color: "#6366F1",
    bgColor: "bg-indigo-50",
  },
  {
    id: "alumni",
    title: "Alumni",
    description: "I've graduated from a university",
    icon: "ribbon",
    color: "#16A34A",
    bgColor: "bg-green-50",
  },
  {
    id: "prospective",
    title: "Prospective Student",
    description: "I'm considering or applying to universities",
    icon: "search",
    color: "#D97706",
    bgColor: "bg-amber-50",
  },
  {
    id: "faculty",
    title: "Faculty / Staff",
    description: "I work at a university",
    icon: "briefcase",
    color: "#DC2626",
    bgColor: "bg-red-50",
  },
];

export default function SelectRoleScreen() {
  const { setRole, nextStep, prevStep, data } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(data?.role);

  const handleContinue = async () => {
    if (selectedRole) {
      await setRole(selectedRole);
      nextStep();
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 20 }}>
        <TouchableOpacity className="mb-6" onPress={prevStep}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-2">What's your role?</Text>
        <Text className="text-gray-500 mb-8">
          This helps us personalize your experience
        </Text>

        <View className="gap-3">
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.id}
              className={`flex-row items-center p-4 rounded-xl border-2 ${
                selectedRole === role.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
              onPress={() => setSelectedRole(role.id)}
            >
              <View
                className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${role.bgColor}`}
              >
                <Ionicons name={role.icon} size={24} color={role.color} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base">{role.title}</Text>
                <Text className="text-gray-500 text-sm">{role.description}</Text>
              </View>
              {selectedRole === role.id && (
                <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-8 pt-4">
        <TouchableOpacity
          className={`rounded-xl py-4 ${
            selectedRole ? "bg-indigo-600" : "bg-gray-300"
          }`}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text className="text-white text-center font-semibold text-base">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
