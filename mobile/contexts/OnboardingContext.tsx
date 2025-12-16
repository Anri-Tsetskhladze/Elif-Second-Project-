import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { onboardingStorage, OnboardingData } from "@/utils/storage";

type Role = "student" | "alumni" | "prospective" | "faculty";

interface OnboardingContextType {
  data: OnboardingData | null;
  isLoading: boolean;
  isCompleted: boolean;

  // Navigation
  currentStep: string;
  goToStep: (step: string) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Data setters
  setRole: (role: Role) => Promise<void>;
  setUniversity: (id: string, name: string) => Promise<void>;
  setEmailVerified: (email: string) => Promise<void>;
  setProfile: (profile: OnboardingData["profile"]) => Promise<void>;
  setFollowing: (users: string[], topics: string[]) => Promise<void>;

  // Actions
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  skipStep: () => void;
}

const STEPS = [
  "welcome",
  "select-role",
  "select-university",
  "verify-email",
  "complete-profile",
  "follow-suggestions",
  "ready",
];

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    setIsLoading(true);
    const savedData = await onboardingStorage.get();
    if (savedData) {
      setData(savedData);
    } else {
      const initial: OnboardingData = {
        currentStep: "welcome",
        startedAt: new Date().toISOString(),
      };
      await onboardingStorage.set(initial);
      setData(initial);
    }
    setIsLoading(false);
  };

  const updateData = async (updates: Partial<OnboardingData>) => {
    const updated = await onboardingStorage.update(updates);
    if (updated) {
      setData(updated);
    }
    return updated;
  };

  const currentStep = data?.currentStep || "welcome";
  const isCompleted = !!data?.completedAt;

  const goToStep = useCallback((step: string) => {
    updateData({ currentStep: step });
    router.push(`/(onboarding)/${step}` as any);
  }, [router]);

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    let nextIndex = currentIndex + 1;

    // Skip verify-email for non-students
    if (STEPS[nextIndex] === "verify-email" && data?.role !== "student") {
      nextIndex++;
    }

    if (nextIndex < STEPS.length) {
      goToStep(STEPS[nextIndex]);
    }
  }, [currentStep, data?.role, goToStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    let prevIndex = currentIndex - 1;

    // Skip verify-email for non-students when going back
    if (STEPS[prevIndex] === "verify-email" && data?.role !== "student") {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      goToStep(STEPS[prevIndex]);
    }
  }, [currentStep, data?.role, goToStep]);

  const skipStep = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const setRole = async (role: Role) => {
    await updateData({ role });
  };

  const setUniversity = async (id: string, name: string) => {
    await updateData({ universityId: id, universityName: name });
  };

  const setEmailVerified = async (email: string) => {
    await updateData({ isEmailVerified: true, studentEmail: email });
  };

  const setProfile = async (profile: OnboardingData["profile"]) => {
    await updateData({ profile: { ...data?.profile, ...profile } });
  };

  const setFollowing = async (users: string[], topics: string[]) => {
    await updateData({ followedUsers: users, followedTopics: topics });
  };

  const completeOnboarding = async () => {
    await onboardingStorage.markCompleted();
    const updated = await onboardingStorage.get();
    setData(updated);
  };

  const resetOnboarding = async () => {
    await onboardingStorage.clear();
    const initial: OnboardingData = {
      currentStep: "welcome",
      startedAt: new Date().toISOString(),
    };
    await onboardingStorage.set(initial);
    setData(initial);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        isLoading,
        isCompleted,
        currentStep,
        goToStep,
        nextStep,
        prevStep,
        setRole,
        setUniversity,
        setEmailVerified,
        setProfile,
        setFollowing,
        completeOnboarding,
        resetOnboarding,
        skipStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

export default OnboardingContext;
