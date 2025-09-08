import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SMSDataProvider } from "../hooks/SMSDataContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SMSDataProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SMSDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
