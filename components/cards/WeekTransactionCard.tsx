import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={isCollapsed ? toggle : undefined}
    >
      <Reanimated.View style={[styles.card, cardAnimStyle]} onLayout={onLayout}>
        {/* Collapse / Expand button (top-right) */}
        <TouchableOpacity
          style={styles.topRight}
          onPress={isDetailsOpen ? onCloseDetails : onOpenDetails}
          activeOpacity={0.85}
        >
          <View style={styles.dottedInner}>
            <Ionicons
              name={isDetailsOpen ? "close" : "expand-outline"}
              size={20}
              color="rgba(0,0,0,0.85)"
            />
          </View>
        </TouchableOpacity>

        <Reanimated.View style={headerAnim}>
          <Text style={styles.title}>Week’s Transactions</Text>
          <Text style={styles.subtitle}>
            {isCollapsed
              ? "Collapsed preview"
              : showSummary
                ? `${summary.totalCount} tx | ₹${summary.totalCredit} in / ₹${summary.totalDebit} out`
                : processing
                  ? "Processing weekly data..."
                  : "Make money, spend Money"}
          </Text>
        </Reanimated.View>

        {showDetailsList && (
          <View style={styles.listBox}>
            {summary.top.length === 0 && (
              <Text style={styles.emptyLine}>No weekly transactions</Text>
            )}
            {summary.top.map((t: any, i: number) => (
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

        <View style={styles.rightBlock}>
          <Text style={styles.amount}>32</Text>
          <Text style={styles.date}>22/06/25</Text>
        </View>
      </Reanimated.View>
    </TouchableOpacity>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#7CBFA9",
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
