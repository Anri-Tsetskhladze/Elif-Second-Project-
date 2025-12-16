import { Stack } from "expo-router";

const NotesLayout = () => {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="upload"
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Upload Note",
          headerTintColor: "#111827",
          headerStyle: { backgroundColor: "#fff" },
        }}
      />
      <Stack.Screen name="[noteId]" options={{ headerShown: true }} />
    </Stack>
  );
};

export default NotesLayout;
