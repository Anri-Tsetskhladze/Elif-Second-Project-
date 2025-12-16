import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useApiClient, universityApi } from "@/utils/api";

interface University {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  images?: { logo?: string };
}

export default function SelectUniversityScreen() {
  const { setUniversity, nextStep, prevStep, data } = useOnboarding();
  const api = useApiClient();

  const [query, setQuery] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<University | null>(null);

  // Load initial data if already selected
  useEffect(() => {
    if (data?.universityId && data?.universityName) {
      setSelected({ _id: data.universityId, name: data.universityName });
    }
    loadPopular();
  }, []);

  const loadPopular = async () => {
    setIsLoading(true);
    try {
      const response = await universityApi.getPopular(api, 10);
      setUniversities(response.data.universities || []);
    } catch (error) {
      console.error("Failed to load universities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search universities
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const response = await universityApi.search(api, { q: query, limit: 20 });
          setUniversities(response.data.universities || []);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (query.length === 0) {
        loadPopular();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (university: University) => {
    setSelected(university);
  };

  const handleContinue = async () => {
    if (selected) {
      await setUniversity(selected._id, selected.name);
      nextStep();
    }
  };

  const handleSkip = () => {
    nextStep();
  };

  const renderUniversity = ({ item }: { item: University }) => {
    const isSelected = selected?._id === item._id;
    const location = [item.city, item.state, item.country].filter(Boolean).join(", ");

    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 rounded-xl mb-2 border-2 ${
          isSelected ? "border-indigo-600 bg-indigo-50" : "border-gray-100 bg-gray-50"
        }`}
        onPress={() => handleSelect(item)}
      >
        <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-3 border border-gray-200">
          <Ionicons name="school" size={24} color="#6366F1" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-medium" numberOfLines={1}>
            {item.name}
          </Text>
          {location && (
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {location}
            </Text>
          )}
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#6366F1" />}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-4">
        <TouchableOpacity className="mb-6" onPress={prevStep}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Select your university
        </Text>
        <Text className="text-gray-500 mb-6">
          Find and join your university community
        </Text>

        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 mb-4">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-base"
            placeholder="Search universities..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={universities}
          renderItem={renderUniversity}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          ListHeaderComponent={
            query.length === 0 ? (
              <Text className="text-gray-400 text-sm mb-2">Popular universities</Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-8">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">No universities found</Text>
            </View>
          }
        />
      )}

      <View className="px-6 pb-8 pt-4 border-t border-gray-100">
        <TouchableOpacity
          className="mb-3"
          onPress={handleSkip}
        >
          <Text className="text-center text-gray-500">
            My university isn't listed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`rounded-xl py-4 ${
            selected ? "bg-indigo-600" : "bg-gray-300"
          }`}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text className="text-white text-center font-semibold text-base">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
