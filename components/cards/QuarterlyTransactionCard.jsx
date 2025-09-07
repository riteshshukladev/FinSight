import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function QuarterlyTransactionCard({ onStartProcessing }) {
  const smsData = useSMSDataContext();

  // Existing context values
  const processing = smsData?.processing;
  const forceRefresh = smsData?.forceRefresh;

  // Newly expected context values (defensive fallback if not yet implemented)
  const processingCutoff = smsData?.processingCutoff || null;
  const setProcessingCutoff =
    smsData?.setProcessingCutoff ||
    (() => {
      /* no-op until implemented */
    });

  const [showPicker, setShowPicker] = useState(false);

  const onProcess = () => {
    if (processing) return; 
    Alert.alert(
      "Clear & Process",
      "This will clear cached data and reprocess SMS data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              onStartProcessing?.(); // trigger UI animation immediately
              if (forceRefresh) {
                await forceRefresh();
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

  const cutoffLabel = processingCutoff
    ? processingCutoff.toLocaleDateString()
    : "All time";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.copyCol}>
          <Text style={styles.beginTitle}>Let’s Begin!!</Text>
          <Text style={styles.beginSub}>Start managing your finances</Text>
        </View>

        <TouchableOpacity
          onPress={onProcess}
          disabled={processing}
          activeOpacity={0.85}
          style={[styles.ctaBtn, processing && { opacity: 0.55 }]}
        >
          <Text style={styles.ctaText}>
            {processing ? "processing..." : "process"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cutoff Date Selector (only if setter exists) */}
      {setProcessingCutoff !== null && (
        <View style={styles.cutoffRow}>
          <Text style={styles.cutoffLabel}>Since:</Text>
          <TouchableOpacity
            style={styles.cutoffBtn}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.85}
            disabled={processing}
          >
            <Text style={styles.cutoffBtnText}>{cutoffLabel}</Text>
          </TouchableOpacity>
          {processingCutoff && (
            <TouchableOpacity
              onPress={() => setProcessingCutoff(null)}
              style={styles.clearBtn}
              disabled={processing}
              activeOpacity={0.85}
            >
              <Text style={styles.clearBtnText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          mode="date"
          value={
            processingCutoff || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
          maximumDate={new Date()}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(e, date) => {
            setShowPicker(false);
            if (date) setProcessingCutoff(date);
          }}
        />
      )}
    </View>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#B24C51",
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    minHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
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
    textAlign: "center",
  },
  ctaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
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

  cutoffRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cutoffLabel: {
    fontFamily: "Lexend_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  cutoffBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cutoffBtnText: {
    fontFamily: "Lexend_500Medium",
    fontSize: 13,
    color: "#FFF",
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 18,
    color: "#FFF",
    lineHeight: 20,
  },
});
