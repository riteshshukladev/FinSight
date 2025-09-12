import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image, // ADDED
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// NEW: top-edge shadow
import { LinearGradient } from "expo-linear-gradient";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
// NEW: reanimated
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  FadeIn,
} from "react-native-reanimated";

interface WindowSummary {
  totalCount: number;
  totalCredit: number;
  totalDebit: number;
  net: number;
  top: any[];
}

interface Props {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  extraHeight?: number;
  showLogs?: boolean;
  referenceHeight?: number;
  onHeightChange?: (h: number) => void;
  collapsedHeight?: number;
  summary?: WindowSummary;
  hasData?: boolean; // NEW
  processing?: boolean; // NEW
  fixedHeight?: number; // NEW
  isDetailsOpen?: boolean;
  onOpenDetails?: () => void;
  onCloseDetails?: () => void;
}

export default function WeekTransactionCard({
  isExpanded,
  onExpand,
  onCollapse,
  extraHeight = 0,
  showLogs = false,
  referenceHeight,
  onHeightChange,
  collapsedHeight = 200,
  summary,
  hasData = false,
  processing = false,
  fixedHeight,
  isDetailsOpen = false,
  onOpenDetails,
  onCloseDetails,
}: Props) {
  const smsData = useSMSDataContext();
  const logs: string[] = (
    smsData?.processingLogs ? smsData.processingLogs.slice(0, 3) : []
  ) as string[];

  const fade = useRef(new Animated.Value(0)).current;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (showLogs) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [showLogs, logs.length]);

  const expandedHeight = 180 + extraHeight;
  const targetHeight = isCollapsed
    ? Math.max(collapsedHeight, 0)
    : expandedHeight;

  const heightSV = useSharedValue(targetHeight);
  const progress = useSharedValue(isCollapsed ? 0 : 1);

  useEffect(() => {
    heightSV.value = withTiming(targetHeight, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    progress.value = withTiming(isCollapsed ? 0 : 1, {
      duration: 420,
      easing: Easing.out(Easing.quad),
    });
  }, [targetHeight, isCollapsed]);

  const onLayout = useCallback(
    (e: any) => {
      onHeightChange?.(e.nativeEvent.layout.height);
    },
    [onHeightChange]
  );

  const toggle = () => {
    setIsCollapsed((c) => !c);
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    height: fixedHeight ?? heightSV.value,
  }));

  const headerAnim = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0.55, 1]);
    const translateY = interpolate(progress.value, [0, 1], [-8, 0]);
    return { opacity, transform: [{ translateY }] };
  });

  const logsWrapperAnim = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const translateY = interpolate(progress.value, [0, 1], [12, 0]);
    return { opacity, transform: [{ translateY }] };
  });

  const formatAmt = (a: any) => {
    const v = Math.abs(parseFloat(String(a)) || 0);
    return v.toLocaleString("en-IN");
  };

  const showSummary = hasData && !processing && summary;
  const showDetailsList = showSummary && isDetailsOpen && summary;

  const expandIcon = require("../../assets/icons/expand-icon.png"); // ADDED

  return (
    <View>
      <Reanimated.View
        style={[
          styles.card,
          isDetailsOpen && styles.expandedRoundBottom,
          cardAnimStyle,
        ]}
        onLayout={onLayout}
      >
        {/* Top-edge stacked shadow */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.10)", "transparent"]}
          locations={[0, 0.25, 1]}
          style={styles.topEdgeShadow}
        />
        {/* Collapse / Expand button (top-right) */}
        <TouchableOpacity
          style={styles.topRight}
          onPress={isDetailsOpen ? onCloseDetails : onOpenDetails}
          activeOpacity={0.85}
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

        <Reanimated.View style={headerAnim}>
          {isDetailsOpen && showSummary && (
            <>
              <Text style={styles.reportTitle}>weeks’s transaction report</Text>
              <View style={styles.reportDivider} />
            </>
          )}
        </Reanimated.View>
        {showDetailsList && (
          <View style={styles.listBox}>
            {summary.top.length === 0 && (
              <Text style={styles.emptyLine}>No weekly transactions</Text>
            )}
            {summary.top.slice(0, 8).map((t: any, i: number) => {
              const isCredit = (t.type || "").toUpperCase() === "CREDIT";
              const amountRs = formatAmt(t.amount);
              const verb = isCredit ? "received" : "sent";
              return (
                <View key={i} style={styles.row}>
                  <Text style={styles.descLine} numberOfLines={1}>
                    {`${amountRs} rs ${verb}`}
                  </Text>
                  <Text
                    style={[
                      styles.signedAmt,
                      isCredit ? styles.credit : styles.debit,
                    ]}
                  >
                    {isCredit ? "+" : "-"}
                    {amountRs}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* processing logs remain only if not showing details */}
        {!isCollapsed && showLogs && processing && !showDetailsList && (
          <Reanimated.View style={[styles.logsBox, logsWrapperAnim]}>
            <Text style={styles.logsTitle}>Processing…</Text>
            {logs.length === 0 && (
              <Text style={styles.logLine}>Starting engine...</Text>
            )}
            {logs.map((l, i) => (
              <Text key={i} style={styles.logLine} numberOfLines={1}>
                • {l}
              </Text>
            ))}
          </Reanimated.View>
        )}

        {!isDetailsOpen && (
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
              <Text style={styles.bottomTitle}>Week’s Transactions</Text>
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
      </Reanimated.View>
    </View>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#77B49D",
    borderRadius: RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 14, // raise content
    paddingBottom: 18,
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
  logsBox: {
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 16,
    padding: 12,
  },
  logsTitle: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 14,
    color: "#083026",
    marginBottom: 4,
  },
  logLine: {
    fontFamily: "Lexend_400Regular",
    fontSize: 12,
    color: "#083026",
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "transparent",
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
  reportTitle: {
    marginTop: 32,
    textAlign: "center",
    fontFamily: "Lexend_300Light",
    fontSize: 24,
    color: "#FFF",
  },
  reportDivider: {
    marginTop: 18,
    marginBottom: 8,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  listBox: {
    marginTop: 14,
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  descLine: {
    flex: 1,
    fontFamily: "Lexend_300Light",
    fontSize: 14,
    color: "#FFF",
    marginRight: 4,
  },
  signedAmt: {
    fontFamily: "Lexend_300Light",
    fontSize: 14,
  },
  credit: { color: "#68F5A4" },
  debit: { color: "#FFB4B4" },
  emptyLine: {
    fontFamily: "Lexend_400Regular",
    textAlign: "center",
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
    bottom: 40,
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
  expandedRoundBottom: {
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
});
