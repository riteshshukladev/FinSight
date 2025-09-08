import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

export default function MonthTransactionCard({
  isExpanded,
  onExpand,
  onCollapse,
  summary,
  fixedHeight,
  isDetailsOpen = false, // NEW
  onOpenDetails,
  onCloseDetails,
  ...rest
}) {
  const { hasData = false, processing = false } = { ...rest };
  const showSummary = hasData && !processing && summary;
  const showDetailsList = showSummary && isDetailsOpen && summary;
  const formatAmt = (a) => {
    const v = Math.abs(parseFloat(String(a)) || 0);
    return v.toLocaleString("en-IN");
  };
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => {}}>
      <View style={[styles.card, fixedHeight && { height: fixedHeight }]}>
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
          <Text style={styles.title}>Month’s Transactions</Text>
          <Text style={styles.subtitle}>
            {showSummary
              ? `${summary.totalCount} tx | ₹${summary.totalCredit} in / ₹${summary.totalDebit} out`
              : processing
                ? "Processing monthly data..."
                : "Make money, spend Money"}
          </Text>
        </View>
        {showDetailsList && (
          <View style={styles.listBox}>
            {summary.top.length === 0 && (
              <Text style={styles.emptyLine}>No monthly transactions</Text>
            )}
            {summary.top.map((t, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLeft} numberOfLines={1}>
                  {t.description || t.merchant || t.category || "—"}
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
          <Text className="amount">
            ₹
            {showSummary
              ? (summary.totalCredit - summary.totalDebit).toLocaleString(
                  "en-IN"
                )
              : "0"}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#4C89D9",
    borderRadius: RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 14, // raise content
    paddingBottom: 18,
    minHeight: undefined,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  title: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 26,
    color: "#F6F6F6",
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: "Lexend_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  topRight: {
    position: "absolute",
    right: 12,
    top: 6,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dottedOuter: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.55)",
    borderRadius: 22,
  },
  dottedInner: {
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  listBox: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
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
  emptyLine: {
    fontFamily: "Lexend_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});
