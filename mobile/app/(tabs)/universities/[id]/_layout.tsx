import { Stack } from "expo-router";

const UniversityDetailLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
};

export default UniversityDetailLayout;
