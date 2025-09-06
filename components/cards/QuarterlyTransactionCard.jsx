// ...existing code...
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSMSDataContext } from "../../hooks/SMSDataContext"; 

export default function QuarterlyTransactionCard() {
  const smsData = useSMSDataContext(); 

  const onProcess = () => {
    // Confirm before clearing cache
    Alert.alert(
      "Clear cache",
      "This will clear stored messages and reprocess SMS data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              if (smsData && smsData.forceRefresh) {
                await smsData.forceRefresh(); // <-- trigger clear cache / reprocess
                Alert.alert("Done", "Cache cleared and processing started.");
              } else {
                Alert.alert("Unavailable", "SMS data not initialized.");
              }
            } catch (e) {
              Alert.alert("Error", String(e));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Top row: CTA text (left) + button (right) */}
      <View style={styles.topRow}>
        <View style={styles.copyCol}>
          <Text style={styles.beginTitle}>Let’s Begin!!</Text>
          <Text style={styles.beginSub}>Start managing your finances</Text>
        </View>

        <TouchableOpacity
          onPress={onProcess}
          activeOpacity={0.9}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaText}>process</Text>
        </TouchableOpacity>
      </View>

      {/* Keep your amount + date anchored at the bottom-right */}
    </View>
  );
}



const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#B24C51", // clay
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    minHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },

  /* TOP CONTENT */
  topRow: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  copyCol: {
    flexShrink: 1,
    paddingRight: 8,
  },
  beginTitle: {
    fontFamily: "Lexend_700Bold",
    fontSize: 22,
    color: "#FFF",
    lineHeight: 28,
    textAlign: "center",
  },
  beginSub: {
    marginTop: 4,
    fontFamily: "Lexend_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  ctaBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  ctaText: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 13,
    color: "#FFF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /* BOTTOM RIGHT METRICS (unchanged) */
  rightBlock: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "flex-end",
  },
  amount: {
    fontFamily: "Lexend_700Bold",
    fontSize: 28,
    color: "#F6F6F6",
  },
  date: {
    marginTop: 6,
    fontFamily: "Lexend_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
});
