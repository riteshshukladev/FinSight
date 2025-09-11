import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"; // ADDED Image
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient"; // NEW: top-edge shadow

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
  const expandIcon = require("../../assets/icons/expand-icon.png"); // ADDED

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => {}}>
      <View style={[styles.card, fixedHeight && { height: fixedHeight }]}>
        {/* Top-edge stacked shadow */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.10)", "transparent"]}
          locations={[0, 0.25, 1]}
          style={styles.topEdgeShadow}
        />
        <TouchableOpacity
          style={styles.topRight}
          activeOpacity={0.85}
          onPress={isDetailsOpen ? onCloseDetails : onOpenDetails}
        >
          <View style={styles.dottedInner}>
            {isDetailsOpen ? (
              <Ionicons name="close" size={20} color="rgba(0,0,0,0.85)" />
            ) : (
              <Image
                source={expandIcon}
                style={{ width: 25, height: 25, tintColor: "rgba(0,0,0,0.85)" }}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
        {isDetailsOpen && (
          <View>
            <Text style={styles.title}>Month’s Transactions</Text>
            <Text style={styles.subtitle}>
              {showSummary
                ? `${summary.totalCount} tx`
                : processing
                  ? "Processing monthly data..."
                  : "Make money, spend Money"}
            </Text>
          </View>
        )}
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
        {isDetailsOpen ? (
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
        ) : (
          <View
            style={[
              styles.bottomSummaryRow,
              { flexDirection: "column", gap: 2 },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
                width: "100%",
              }}
            >
              <Text style={styles.bottomTitle}>Month’s Transactions</Text>
              <Text style={styles.bottomCount}>
                {(summary?.totalCount ?? 0).toLocaleString("en-IN")}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
                width: "100%",
              }}
            >
              <Text style={styles.bottomSubtitle}>Make money have money</Text>
              <Text style={styles.bottomDate}>
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#5691A6",
    borderRadius: RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "transparent",
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
  topEdgeShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
  },
  bottomSummaryRow: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 36,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  bottomTitle: {
    fontFamily: "Lexend_300Light",
    fontSize: 26,
    color: "#F6F6F6",
  },
  bottomCount: {
    fontFamily: "Lexend_300Light",
    fontSize: 24,
    color: "#F6F6F6",
  },
  bottomSubtitle: {
    fontFamily: "Lexend_400Regular",
    fontSize: 12,
    color: "rgba(246,246,246,0.8)",
  },
  bottomDate: {
    fontFamily: "Lexend_400Regular",
    fontSize: 12,
    color: "rgba(246,246,246,0.8)",
  },
});
