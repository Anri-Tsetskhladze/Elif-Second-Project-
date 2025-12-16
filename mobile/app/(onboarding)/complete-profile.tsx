import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";

const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() + i - 2;
  return year.toString();
});

const INTERESTS = [
  "Computer Science",
  "Engineering",
  "Business",
  "Medicine",
  "Law",
  "Arts",
  "Sciences",
  "Mathematics",
  "Psychology",
  "Communications",
  "Education",
  "Music",
  "Design",
  "Literature",
  "Economics",
  "Politics",
];

export default function CompleteProfileScreen() {
  const { setProfile, nextStep, prevStep, data } = useOnboarding();

  const [major, setMajor] = useState(data?.profile?.major || "");
  const [graduationYear, setGraduationYear] = useState(
    data?.profile?.graduationYear || ""
  );
  const [bio, setBio] = useState(data?.profile?.bio || "");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    data?.profile?.interests || []
  );
  const [showYearPicker, setShowYearPicker] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
        ? [...prev, interest]
        : prev
    );
  };

  const handleContinue = async () => {
    await setProfile({
      major,
      graduationYear,
      bio,
      interests: selectedInterests,
    });
    nextStep();
  };

  const canContinue = major.length > 0 || selectedInterests.length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-6 pt-4">
          <TouchableOpacity className="mb-6" onPress={prevStep}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Complete your profile
          </Text>
          <Text className="text-gray-500 mb-6">
            Tell us about yourself so we can personalize your experience
          </Text>

          {/* Major */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">
              Major / Field of Study
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="e.g., Computer Science"
              value={major}
              onChangeText={setMajor}
            />
          </View>

          {/* Graduation Year */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">
              Graduation Year
            </Text>
            <TouchableOpacity
              className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Text
                className={graduationYear ? "text-gray-900" : "text-gray-400"}
              >
                {graduationYear || "Select year"}
              </Text>
              <Ionicons
                name={showYearPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {showYearPicker && (
              <View className="bg-gray-50 rounded-xl mt-2 p-2 max-h-40">
                <ScrollView nestedScrollEnabled>
                  {GRADUATION_YEARS.map((year) => (
                    <TouchableOpacity
                      key={year}
                      className={`py-2 px-3 rounded-lg ${
                        graduationYear === year ? "bg-indigo-100" : ""
                      }`}
                      onPress={() => {
                        setGraduationYear(year);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text
                        className={`text-center ${
                          graduationYear === year
                            ? "text-indigo-600 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Bio */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Bio</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="Tell us a bit about yourself..."
              value={bio}
              onChangeText={(text) => setBio(text.slice(0, 150))}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
            <Text className="text-gray-400 text-xs text-right mt-1">
              {bio.length}/150
            </Text>
          </View>

          {/* Interests */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">
              Interests (select up to 5)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    className={`px-4 py-2 rounded-full border ${
                      isSelected
                        ? "bg-indigo-100 border-indigo-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? "text-indigo-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedInterests.length > 0 && (
              <Text className="text-gray-400 text-xs mt-2">
                {selectedInterests.length}/5 selected
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-white border-t border-gray-100">
        <TouchableOpacity className="mb-3" onPress={nextStep}>
          <Text className="text-center text-gray-500">Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`rounded-xl py-4 ${
            canContinue ? "bg-indigo-600" : "bg-gray-300"
          }`}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text className="text-white text-center font-semibold text-base">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
