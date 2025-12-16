import { Stack } from "expo-router";

const UniversitiesLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
};

export default UniversitiesLayout;
