import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BankAnalytics from "../../components/BankAnalytics";
// import { useSMSData } from "../../hooks/useSMSData";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { SMSMessage } from "@/types/type";
import { useEffect } from "react";
import BootSplash from "react-native-bootsplash";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import {
  useFonts,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from "@expo-google-fonts/lexend";

SplashScreen.preventAutoHideAsync();

export default function AnalyticsTab() {
  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const context = useSMSDataContext();
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
    // paddingBottom: 0,
  },
});
