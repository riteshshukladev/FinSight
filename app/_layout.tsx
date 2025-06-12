import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SMSDataProvider } from "../hooks/SMSDataContext"; 

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SMSDataProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SMSDataProvider>
    </SafeAreaProvider>
  );
}
