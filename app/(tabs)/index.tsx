import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from "@expo-google-fonts/lexend";

import BankAnalytics from "../../components/BankAnalytics";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { SMSMessage } from "@/types/type";

SplashScreen.preventAutoHideAsync();

export default function AnalyticsTab() {
  const router = useRouter();
  const hasRedirected = useRef(false);
  
  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  const context = useSMSDataContext();
  
  // Handle font loading
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (context?.hasPermission && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/messages");
    }
  }, [context?.hasPermission, router]);

  if (!fontsLoaded) {
    return null;
  }
  const messages: SMSMessage[] = context?.messages ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <BankAnalytics transactions={messages} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});