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
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

export default function QuarterlyTransactionCard({
  onStartProcessing,
  summary,
  hasData = false,
  processing = false,
  fixedHeight,
  isDetailsOpen = false,
  onOpenDetails,
  onCloseDetails,
}) {
  const smsData = useSMSDataContext();
  const ctxProcessing = smsData?.processing;
  const forceRefresh = smsData?.forceRefresh;
  const isProcessing = processing || ctxProcessing;

  // keep cutoff only for pre‑data state
  const processingCutoff = smsData?.processingCutoff || null;
  const setProcessingCutoff = smsData?.setProcessingCutoff || (() => {});
  const [showPicker, setShowPicker] = useState(false);

  const onProcess = () => {
    if (isProcessing) return;
    Alert.alert(
      "Clear & Process",
      "This will clear cached data and reprocess SMS data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              onStartProcessing?.();
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

  const showSummary = hasData && !isProcessing && summary;
  const showDetailsList = showSummary && isDetailsOpen && summary;

  // FORMAT helper (was missing -> caused ReferenceError)
  const formatAmt = (a) => {
    const v = Math.abs(parseFloat(String(a)) || 0);
    return v.toLocaleString("en-IN");
  };

  return (
    <View style={[styles.card, fixedHeight && { height: fixedHeight }]}>
      {/* PRE-DATA / INITIAL STATE (unchanged) */}
      {!showSummary && (
        <View style={styles.topRow}>
          <View style={styles.copyCol}>
            <Text style={styles.beginTitle}>Let’s Begin!!</Text>
            <Text style={styles.beginSub}>Start managing your finances</Text>
          </View>
          <TouchableOpacity
            onPress={onProcess}
            disabled={isProcessing}
            activeOpacity={0.85}
            style={[styles.ctaBtn, isProcessing && { opacity: 0.55 }]}
          >
            <Text style={styles.ctaText}>
              {isProcessing ? "processing..." : "process"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SUMMARY MODE (NOW MATCHES OTHER CARDS) */}
      {showSummary && (
        <>
          {/* summary mode button */}
          <TouchableOpacity
            style={styles.topRight}
            activeOpacity={0.85}
            onPress={isDetailsOpen ? onCloseDetails : onOpenDetails}
          >
            <View style={styles.dottedInner}>
              <Ionicons
                name={isDetailsOpen ? "close" : "expand-outline"}
                size={20}
                color="rgba(0,0,0,0.85)"
              />
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.summaryTitle}>Quarterly Transactions</Text>
            <Text style={styles.summarySubtitle}>
              {summary.totalCount} tx | ₹{summary.totalCredit} in / ₹
              {summary.totalDebit} out
            </Text>
          </View>

          {showDetailsList && (
            <View style={styles.listBox}>
              {summary.top.length === 0 && (
                <Text style={styles.emptyWindowText}>
                  No transactions in this period
                </Text>
              )}
              {summary.top.map((t, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.rowLeft} numberOfLines={1}>
                    {t.description ||
                      t.merchant ||
                      t.category ||
                      t.address ||
                      "—"}
                  </Text>
                  <Text
                    style={[
                      styles.rowAmt,
                      (t.type || "").toUpperCase() === "CREDIT"
                        ? styles.credit
                        : styles.debit,
                    ]}
                  >
                    {(t.type || "").toUpperCase() === "CREDIT" ? "+" : "-"}₹
                    {formatAmt(t.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.rightBlock}>
            <Text style={styles.amount}>{summary.totalCount}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </Text>
          </View>
        </>
      )}

      {/* REMOVE cutoff / reprocess UI when data is available */}
      {!showSummary && (
        <>
          <View style={[styles.cutoffRow]}>
            <Text style={styles.cutoffLabel}>Since:</Text>
            <TouchableOpacity
              style={styles.cutoffBtn}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.85}
              disabled={isProcessing}
            >
              <Text style={styles.cutoffBtnText}>
                {processingCutoff
                  ? processingCutoff.toLocaleDateString()
                  : "All time"}
              </Text>
            </TouchableOpacity>
            {processingCutoff && (
              <TouchableOpacity
                onPress={() => setProcessingCutoff(null)}
                style={styles.clearBtn}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <Text style={styles.clearBtnText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          {showPicker && (
            <DateTimePicker
              mode="date"
              value={
                processingCutoff ||
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
              maximumDate={new Date()}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, date) => {
                setShowPicker(false);
                if (date) setProcessingCutoff(date);
              }}
            />
          )}
        </>
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
    minHeight: undefined,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
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
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  summaryTitle: {
    fontFamily: "Lexend_700Bold",
    fontSize: 20,
    color: "#FFF",
    lineHeight: 26,
  },
  summarySubtitle: {
    marginTop: 4,
    fontFamily: "Lexend_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 14,
    marginBottom: 10,
  },
  listBox: {
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flex: 1,
    fontFamily: "Lexend_400Regular",
    fontSize: 12,
    color: "#FFF",
    marginRight: 8,
  },
  rowAmt: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 12,
  },
  credit: { color: "#68F5A4" },
  debit: { color: "#FFB4B4" },
  emptyWindowText: {
    fontFamily: "Lexend_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  topRight: {
    position: "absolute",
    right: 12,
    top: 6,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  dottedInner: {
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightBlock: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "flex-end",
  },
  amount: { fontFamily: "Lexend_700Bold", fontSize: 28, color: "#F6F6F6" },
  date: {
    marginTop: 6,
    fontFamily: "Lexend_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
});
