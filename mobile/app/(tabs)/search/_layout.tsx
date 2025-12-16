import { Stack } from "expo-router";

const SearchLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="results" />
    </Stack>
  );
};

export default SearchLayout;
