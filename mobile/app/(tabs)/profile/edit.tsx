import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useApiClient, userApi, universityApi } from "@/utils/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 4);

const EditProfileScreen = () => {
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    major: "",
    graduationYear: "",
    universityId: "",
    universityName: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showUniversitySearch, setShowUniversitySearch] = useState(false);
  const [universitySearch, setUniversitySearch] = useState("");
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        username: currentUser.username || "",
        bio: currentUser.bio || "",
        major: currentUser.major || "",
        graduationYear: currentUser.graduationYear?.toString() || "",
        universityId: currentUser.university?._id || "",
        universityName: currentUser.university?.name || "",
      });
      setProfileImage(currentUser.profilePicture || null);
    }
  }, [currentUser]);

  // Search universities
  const { data: universityResults } = useQuery({
    queryKey: ["university-search", universitySearch],
    queryFn: () => universityApi.suggest(api, universitySearch),
    select: (res) => res.data.universities || [],
    enabled: universitySearch.length >= 2 && showUniversitySearch,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(api, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.response?.data?.error || "Failed to update profile");
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: (formData: FormData) => userApi.uploadProfileImage(api, formData),
    onSuccess: (res) => {
      setProfileImage(res.data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to upload image");
    },
  });

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageFormData = new FormData();
      imageFormData.append("image", {
        uri: asset.uri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);
      uploadImageMutation.mutate(imageFormData);
    }
  }, [uploadImageMutation]);

  const handleSave = useCallback(() => {
    if (!formData.firstName.trim()) {
      Alert.alert("Error", "First name is required");
      return;
    }
    if (!formData.username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    const updateData: any = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim(),
      bio: formData.bio.trim(),
      major: formData.major.trim(),
    };

    if (formData.graduationYear) {
      updateData.graduationYear = parseInt(formData.graduationYear, 10);
    }

    if (formData.universityId && formData.universityId !== currentUser?.university?._id) {
      updateData.universityId = formData.universityId;
    }

    updateMutation.mutate(updateData);
  }, [formData, currentUser, updateMutation]);

  const selectUniversity = useCallback((university: any) => {
    setFormData((prev) => ({
      ...prev,
      universityId: university._id,
      universityName: university.name,
    }));
    setShowUniversitySearch(false);
    setUniversitySearch("");
  }, []);

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Edit Profile",
          headerBackTitle: "Cancel",
          headerTintColor: "#111827",
          headerStyle: { backgroundColor: "#fff" },
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Text className="text-indigo-600 font-semibold text-base">Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Picture */}
          <View className="items-center py-6 border-b border-gray-100">
            <TouchableOpacity onPress={pickImage} disabled={uploadImageMutation.isPending}>
              <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
                {uploadImageMutation.isPending ? (
                  <ActivityIndicator size="large" color="#6366F1" />
                ) : profileImage ? (
                  <Image source={{ uri: profileImage }} className="w-full h-full" />
                ) : (
                  <Ionicons name="person" size={40} color="#9CA3AF" />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full items-center justify-center">
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text className="text-indigo-600 font-medium mt-2">Change Photo</Text>
          </View>

          {/* Form Fields */}
          <View className="px-4 py-4">
            {/* Name */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-1">First Name</Text>
                <TextInput
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.firstName}
                  onChangeText={(text) => updateField("firstName", text)}
                  autoCapitalize="words"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-1">Last Name</Text>
                <TextInput
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.lastName}
                  onChangeText={(text) => updateField("lastName", text)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Username */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-1">Username</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <Text className="text-gray-400">@</Text>
                <TextInput
                  className="flex-1 py-3 ml-1 text-gray-900"
                  placeholder="username"
                  placeholderTextColor="#9CA3AF"
                  value={formData.username}
                  onChangeText={(text) => updateField("username", text.toLowerCase())}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-1">Bio</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 min-h-[100px]"
                placeholder="Write something about yourself..."
                placeholderTextColor="#9CA3AF"
                value={formData.bio}
                onChangeText={(text) => updateField("bio", text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* University */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-1">University</Text>
              <TouchableOpacity
                className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
                onPress={() => setShowUniversitySearch(true)}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="school-outline" size={20} color="#6B7280" />
                  <Text
                    className={`ml-2 ${formData.universityName ? "text-gray-900" : "text-gray-400"}`}
                    numberOfLines={1}
                  >
                    {formData.universityName || "Select university"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {currentUser?.university && formData.universityId !== currentUser.university._id && (
                <Text className="text-amber-600 text-sm mt-1">
                  Changing university may require re-verification
                </Text>
              )}
            </View>

            {/* Major */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-1">Major</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g. Computer Science"
                placeholderTextColor="#9CA3AF"
                value={formData.major}
                onChangeText={(text) => updateField("major", text)}
                autoCapitalize="words"
              />
            </View>

            {/* Graduation Year */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-1">Graduation Year</Text>
              <TouchableOpacity
                className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
                onPress={() => setShowYearPicker(!showYearPicker)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text
                    className={`ml-2 ${formData.graduationYear ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {formData.graduationYear
                      ? `Class of ${formData.graduationYear}`
                      : "Select year"}
                  </Text>
                </View>
                <Ionicons
                  name={showYearPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
              {showYearPicker && (
                <View className="bg-gray-50 rounded-xl mt-2 p-2">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {GRADUATION_YEARS.map((year) => (
                        <TouchableOpacity
                          key={year}
                          className={`px-4 py-2 rounded-lg ${
                            formData.graduationYear === year.toString()
                              ? "bg-indigo-600"
                              : "bg-white border border-gray-200"
                          }`}
                          onPress={() => {
                            updateField("graduationYear", year.toString());
                            setShowYearPicker(false);
                          }}
                        >
                          <Text
                            className={`font-medium ${
                              formData.graduationYear === year.toString()
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* University Search Modal */}
      {showUniversitySearch && (
        <View className="absolute inset-0 bg-white">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
              <TouchableOpacity onPress={() => setShowUniversitySearch(false)} className="mr-3">
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-gray-900"
                  placeholder="Search universities..."
                  placeholderTextColor="#9CA3AF"
                  value={universitySearch}
                  onChangeText={setUniversitySearch}
                  autoFocus
                />
              </View>
            </View>
            <ScrollView className="flex-1">
              {universityResults?.map((uni: any) => (
                <TouchableOpacity
                  key={uni._id}
                  className="flex-row items-center px-4 py-3 border-b border-gray-100"
                  onPress={() => selectUniversity(uni)}
                >
                  <View className="w-10 h-10 rounded-lg bg-indigo-50 items-center justify-center mr-3">
                    {uni.images?.logo ? (
                      <Image
                        source={{ uri: uni.images.logo }}
                        className="w-full h-full rounded-lg"
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons name="school" size={20} color="#6366F1" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{uni.name}</Text>
                    {uni.city && (
                      <Text className="text-gray-500 text-sm">
                        {[uni.city, uni.state].filter(Boolean).join(", ")}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {universitySearch.length >= 2 && universityResults?.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-gray-400">No universities found</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
};

export default EditProfileScreen;
