import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  height?: number; // now optional
}

export default function EmptyTodayComponent({ height }: Props) {
  return (
    <View
      style={[
        styles.card,
        height != null && { height },
        // allow intrinsic height but keep a gentle minimum so backdrop still feels like a card stack
        height == null && { minHeight: 360 },
      ]}
    >
      <View style={styles.headerBlock}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>FS</Text>
        </View>
        <Text style={styles.appTitle}>finsight</Text>
        <Text style={styles.subtitle}>
          {"Smart finance, simplified.\n"}
          {"We’ll scan your SMS and organize transactions with AI."}
        </Text>
      </View>
    </View>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F1784C",
    borderRadius: RADIUS,
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 20,
  },
  appTitle: {
    fontFamily: "Lexend_500Medium",
    fontSize: 22,
    color: "#FFF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoText: {
    fontFamily: "Lexend_700Bold",
    fontSize: 30,
    color: "#FFF",
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: "Lexend_300Light",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 20,
    width: "85%",
  },
  stepsBox: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  stepLine: {
    fontFamily: "Lexend_500Medium",
    fontSize: 13,
    color: "#FFF",
  },
  stepLineDim: {
    fontFamily: "Lexend_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  footerNote: {
    marginTop: 16,
    fontFamily: "Lexend_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 18,
  },
});
