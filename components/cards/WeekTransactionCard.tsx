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
} from "react-native-reanimated";

interface Props {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  extraHeight?: number;
  showLogs?: boolean;
  referenceHeight?: number;
  onHeightChange?: (h: number) => void;
  collapsedHeight?: number;
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
    height: heightSV.value,
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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={isCollapsed ? toggle : undefined}
    >
      <Reanimated.View style={[styles.card, cardAnimStyle]} onLayout={onLayout}>
        {/* Collapse / Expand button (top-right) */}
        <TouchableOpacity
          style={styles.topRight}
          onPress={toggle}
          activeOpacity={0.85}
        >
          <View style={styles.dottedInner}>
            <Ionicons
              name={isCollapsed ? "chevron-up" : "chevron-down"}
              size={20}
              color="rgba(0,0,0,0.85)"
            />
          </View>
        </TouchableOpacity>

        <Reanimated.View style={headerAnim}>
          <Text style={styles.title}>Week’s Transactions</Text>
          <Text style={styles.subtitle}>
            {isCollapsed ? "Collapsed preview" : "Make money, spend Money"}
          </Text>
        </Reanimated.View>

        {!isCollapsed && showLogs && (
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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    // minHeight removed for animated collapse
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
});
