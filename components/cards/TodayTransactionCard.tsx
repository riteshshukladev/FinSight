import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

type WindowSummary = {
  totalCount: number;
  totalCredit: number;
  totalDebit: number;
  net: number;
  top: any[];
};

type Props = {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onHeightChange?: (h: number) => void;
  extraHeight?: number;
  collapsedHeight?: number;
  summary?: WindowSummary;
  hasData?: boolean; // NEW
  processing?: boolean; // NEW
  fixedHeight?: number; // NEW
  isDetailsOpen?: boolean; // NEW
  onOpenDetails?: () => void; // NEW
  onCloseDetails?: () => void; // NEW
};

export default function TodayTransactionCard({
  isExpanded,
  onExpand,
  onCollapse,
  onHeightChange,
  extraHeight = 0,
  collapsedHeight = 220,
  summary,
  hasData = false,
  processing = false,
  fixedHeight,
  isDetailsOpen = false,
  onOpenDetails,
  onCloseDetails,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const expandedHeight = 460 + extraHeight;
  const targetHeight = isCollapsed ? collapsedHeight : expandedHeight;

  // shared value for height & a progress for subtle content effects
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

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onHeightChange?.(e.nativeEvent.layout.height);
    },
    [onHeightChange]
  );

  const toggle = () => {
    setIsCollapsed((c) => !c);
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    height: fixedHeight ?? heightSV.value, // honor fixedHeight if provided
  }));

  const contentAnim = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0.55, 1]);
    const translateY = interpolate(progress.value, [0, 1], [-10, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
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
      <Animated.View
        style={[styles.card, cardAnimStyle]}
        onLayout={handleLayout}
      >
        {/* OPTIONAL: hide expand icon when fixed height */}
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

        <Animated.View style={contentAnim}>
          <Text style={styles.title}>Today’s Activity</Text>
          <Text style={styles.subtitle}>
            {isCollapsed
              ? "Collapsed preview"
              : showSummary
                ? `${summary.totalCount} tx | ₹${summary.totalCredit} in / ₹${summary.totalDebit} out`
                : processing
                  ? "Processing today’s transactions..."
                  : "Daily snapshot"}
          </Text>

          {showDetailsList && (
            <View style={styles.listBox}>
              {summary.top.length === 0 && (
                <Text style={styles.emptyLine}>No transactions today</Text>
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
        </Animated.View>

        <View style={styles.rightBlock}>
          <Text style={styles.amount}>12</Text>
          <Text style={styles.date}>Now</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F1784C",
    borderRadius: RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 14, // raise inner content by 4px
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
    fontSize: 28,
    color: "#F6F6F6",
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: "Lexend_400Regular",
    fontSize: 15,
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
  amount: { fontFamily: "Lexend_700Bold", fontSize: 32, color: "#F6F6F6" },
  date: {
    marginTop: 6,
    fontFamily: "Lexend_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  listBox: {
    marginTop: 14,
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
  emptyLine: {
    fontFamily: "Lexend_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});
