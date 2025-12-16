import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  ONBOARDING: "@academy_hub_onboarding",
  USER_PREFERENCES: "@academy_hub_preferences",
} as const;

export interface OnboardingData {
  currentStep: string;
  role?: "student" | "alumni" | "prospective" | "faculty";
  universityId?: string;
  universityName?: string;
  isEmailVerified?: boolean;
  studentEmail?: string;
  profile?: {
    major?: string;
    minor?: string;
    graduationYear?: number;
    academicYear?: string;
    bio?: string;
    interests?: string[];
  };
  followedUsers?: string[];
  followedTopics?: string[];
  completedAt?: string;
  startedAt?: string;
}

// Onboarding storage
export const onboardingStorage = {
  get: async (): Promise<OnboardingData | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error reading onboarding data:", error);
      return null;
    }
  },

  set: async (data: OnboardingData): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    }
  },

  update: async (updates: Partial<OnboardingData>): Promise<OnboardingData | null> => {
    try {
      const current = await onboardingStorage.get();
      const updated = { ...current, ...updates } as OnboardingData;
      await onboardingStorage.set(updated);
      return updated;
    } catch (error) {
      console.error("Error updating onboarding data:", error);
      return null;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    } catch (error) {
      console.error("Error clearing onboarding data:", error);
    }
  },

  isCompleted: async (): Promise<boolean> => {
    const data = await onboardingStorage.get();
    return !!data?.completedAt;
  },

  markCompleted: async (): Promise<void> => {
    await onboardingStorage.update({
      completedAt: new Date().toISOString(),
    });
  },
};

// Generic storage helpers
export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};

export default storage;
