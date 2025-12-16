import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApiClient, universityApi } from "@/utils/api";
import { useMyReview, useReviewActions } from "@/hooks/useReviews";
import { ReviewForm, ReviewFormData } from "@/components/reviews";
import { University } from "@/types";

const WriteReviewScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();

  const { data: university, isLoading: universityLoading } = useQuery({
    queryKey: ["university", id],
    queryFn: () => universityApi.getById(api, id),
    select: (res) => res.data.university as University & { city?: string; state?: string },
    enabled: !!id,
  });

  const { data: myReviewData } = useMyReview(id);
  const { createReview, updateReview, isCreating, isUpdating } = useReviewActions(id);

  const handleSubmit = async (data: ReviewFormData) => {
    try {
      if (myReviewData?.hasReviewed && myReviewData.review) {
        await updateReview({
          reviewId: myReviewData.review._id,
          data: {
            overallRating: data.overallRating,
            title: data.title,
            content: data.content,
            categoryRatings: data.categoryRatings,
            pros: data.pros,
            cons: data.cons,
            isAnonymous: data.isAnonymous,
          },
        });
        Alert.alert("Success", "Your review has been updated!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createReview({
          universityId: id,
          overallRating: data.overallRating,
          title: data.title,
          content: data.content,
          categoryRatings: data.categoryRatings,
          pros: data.pros,
          cons: data.cons,
          isAnonymous: data.isAnonymous,
        });
        Alert.alert("Success", "Your review has been submitted!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Failed to submit review");
    }
  };

  if (universityLoading || !university) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  const isEditing = myReviewData?.hasReviewed && myReviewData.review;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: isEditing ? "Edit Review" : "Write a Review",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />

      <ReviewForm
        university={university}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
        initialData={
          isEditing && myReviewData?.review
            ? {
                overallRating: myReviewData.review.overallRating,
                title: myReviewData.review.title || "",
                content: myReviewData.review.content || "",
                categoryRatings: myReviewData.review.categoryRatings || {},
                pros: myReviewData.review.pros || [],
                cons: myReviewData.review.cons || [],
                isAnonymous: myReviewData.review.isAnonymous,
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
};

export default WriteReviewScreen;
