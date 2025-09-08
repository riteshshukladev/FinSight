import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  height: number;
}

export default function EmptyTodayIntroCard({ height }: Props) {
  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>FS</Text>
        </View>
      </View>
      <Text style={styles.title}>Welcome to FinSight</Text>
      <Text style={styles.subtitle}>
        Your transactions will appear here once you process your SMS data. Tap
        the Process button on the Quarterly card to begin.
      </Text>
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
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Lexend_700Bold",
    fontSize: 30,
    color: "#FFF",
    letterSpacing: 1,
  },
  title: {
    fontFamily: "Lexend_700Bold",
    fontSize: 24,
    color: "#FFF",
    textAlign: "center",
    lineHeight: 30,
  },
  subtitle: {
    marginTop: 14,
    fontFamily: "Lexend_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 20,
  },
});
