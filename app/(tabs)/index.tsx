import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  UIManager,
  Platform,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from "@expo-google-fonts/lexend";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  useDerivedValue,
  withDelay,
} from "react-native-reanimated";

import QuarterlyTransactionCard from "../../components/cards/QuarterlyTransactionCard";
import MonthTransactionCard from "../../components/cards/MonthTransactionCard";
import WeekTransactionCard from "../../components/cards/WeekTransactionCard";
import TodayTransactionCard from "../../components/cards/TodayTransactionCard";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { useTransactionWindows } from "@/hooks/useTransactionWindow";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const MAX_BASE_CARD_HEIGHT = 200;
const MIN_BASE_CARD_HEIGHT = 120; // absolute lower clamp
const SAFE_VERTICAL_MARGIN = 40; // total extra vertical space (top padding + breathing room)
const EXPANSION_TOP_OFFSET = 40; // card top when expanded
const MAX_EXPANDED_TARGET = 560; // upper bound on expanded height
const MIN_EXPANDED_EXTRA = 160; // ensure expansion adds at least this much height
const BOTTOM_GAP = 16; // space above tab bar for quarterly card
const TOP_MIN_GAP = 32; // minimum breathing space at top
const STACK_SHIFT = 18; // slightly larger overlap so hidden bottoms are covered
const GLOBAL_STACK_OFFSET = 4; // push entire stack a little lower
const FINE_LAYER_SHIFT = 1; // new: subtle extra drop per depth layer
const EXTRA_HIDE_SHIFT = 2; // NEW: extra 2px downward push to hide edges

type DetailCard = "today" | "week" | "month" | "quarter" | null;

export default function Deck() {
  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();

  const smsData = useSMSDataContext();
  const bankMessages = smsData?.bankMessages || [];
  const upiMessages = smsData?.upiMessages || [];
  const processing = smsData?.processing;
  const merged = [...bankMessages, ...upiMessages];
  const hasData = !processing && merged.length > 0;
  const windows = useTransactionWindows(merged);

  const [detailCard, setDetailCard] = useState<DetailCard>(null);

  // ensure handlers exist (fix ReferenceError)
  const openDetails = (card: DetailCard) => {
    if (detailCard === card) return;
    setDetailCard(card);
  };
  const closeDetails = () => {
    if (detailCard) setDetailCard(null);
  };

  // dynamic metrics memo
  const {
    cardHeight,
    expandedHeight,
    todayTop,
    weekTop,
    monthTop,
    quarterTop,
    stageHeight,
  } = React.useMemo(() => {
    const tabPad = tabBarHeight || 0;

    const availableHeightRaw =
      windowHeight - insets.top - insets.bottom - tabPad - SAFE_VERTICAL_MARGIN;

    const availableHeight = Math.max(
      availableHeightRaw,
      MIN_BASE_CARD_HEIGHT * 4
    );

    const breakpointBase =
      windowHeight >= 740
        ? 200
        : windowHeight >= 680
          ? 170
          : windowHeight >= 620
            ? 150
            : 140;

    const evenDivision = availableHeight / 4;
    let base = Math.min(breakpointBase, evenDivision, MAX_BASE_CARD_HEIGHT);
    base = Math.max(MIN_BASE_CARD_HEIGHT, base);

    if (fontScale > 1.15) {
      const reduction = 10 * (fontScale - 1.0);
      base = Math.max(MIN_BASE_CARD_HEIGHT, base - reduction);
    }
    base = Math.round(base);

    // We want quarterly (last) card bottom to sit just above tab bar:
    // Determine stack total height (4 * base). Compute topSpacing so:
    // topSpacing + 4*base + BOTTOM_GAP = availableHeightRaw (within the padded region).
    // If that would push stack too high (negative), clamp with TOP_MIN_GAP.
    const stackTotal = base * 4;
    const idealTopSpacing = availableHeightRaw - (stackTotal + BOTTOM_GAP);
    const topSpacing = Math.max(TOP_MIN_GAP, idealTopSpacing);

    // Original sequential tops (no shift)
    const rawTodayTop = topSpacing + GLOBAL_STACK_OFFSET;
    const rawWeekTop = rawTodayTop + base;
    const rawMonthTop = rawWeekTop + base;
    const rawQuarterTop = rawMonthTop + base;

    // Apply back-stack shifting (Quarter unchanged)
    const todayTopFinal =
      rawTodayTop + STACK_SHIFT * 3 + FINE_LAYER_SHIFT * 3 + EXTRA_HIDE_SHIFT;
    const weekTopFinal =
      rawWeekTop + STACK_SHIFT * 2 + FINE_LAYER_SHIFT * 2 + EXTRA_HIDE_SHIFT;
    const monthTopFinal =
      rawMonthTop + STACK_SHIFT * 1 + FINE_LAYER_SHIFT * 1 + EXTRA_HIDE_SHIFT;
    const quarterTopFinal = rawQuarterTop; // unchanged

    // Expanded height logic unchanged
    const maxUsableForExpansion =
      windowHeight - insets.top - insets.bottom - 24;
    let exp = Math.min(
      MAX_EXPANDED_TARGET,
      maxUsableForExpansion,
      availableHeight - (base * 3 - 20)
    );
    exp = Math.max(base + MIN_EXPANDED_EXTRA, exp);
    exp = Math.min(exp, availableHeight - 8);
    exp = Math.round(exp);

    const stageH = quarterTopFinal + base + BOTTOM_GAP;

    return {
      cardHeight: base,
      expandedHeight: exp,
      todayTop: todayTopFinal,
      weekTop: weekTopFinal,
      monthTop: monthTopFinal,
      quarterTop: quarterTopFinal,
      stageHeight: stageH,
    };
  }, [windowHeight, insets.top, insets.bottom, tabBarHeight, fontScale]);

  // shared values (top + height)
  const tTop = useSharedValue(todayTop);
  const wTop = useSharedValue(weekTop);
  const mTop = useSharedValue(monthTop);
  const qTop = useSharedValue(quarterTop);

  const tHeight = useSharedValue(cardHeight);
  const wHeight = useSharedValue(cardHeight);
  const mHeight = useSharedValue(cardHeight);
  const qHeight = useSharedValue(cardHeight);

  const backdropOpacity = useSharedValue(0);

  // Animate stack into base positions when data loads
  useEffect(() => {
    if (!hasData || detailCard) return;
    const cfg = { damping: 18, stiffness: 180 };
    tTop.value = withSpring(todayTop, cfg);
    wTop.value = withSpring(weekTop, cfg);
    mTop.value = withSpring(monthTop, cfg);
    qTop.value = withSpring(quarterTop, cfg);
    tHeight.value = wHeight.value = mHeight.value = qHeight.value = cardHeight;
  }, [
    hasData,
    detailCard,
    todayTop,
    weekTop,
    monthTop,
    quarterTop,
    cardHeight,
  ]);

  // Handle expansion / collapse
  useEffect(() => {
    const cfg = { damping: 18, stiffness: 190 };
    const expand = (topSV: any, heightSV: any) => {
      topSV.value = withSpring(EXPANSION_TOP_OFFSET, cfg);
      heightSV.value = withSpring(expandedHeight, cfg);
    };
    const collapse = (topSV: any, heightSV: any, baseTop: number) => {
      topSV.value = withSpring(baseTop, cfg);
      heightSV.value = withSpring(cardHeight, cfg);
    };

    if (detailCard) {
      backdropOpacity.value = withTiming(0.55, { duration: 220 });
      // Expand selected
      if (detailCard === "today") expand(tTop, tHeight);
      else collapse(tTop, tHeight, todayTop);

      if (detailCard === "week") expand(wTop, wHeight);
      else collapse(wTop, wHeight, weekTop);

      if (detailCard === "month") expand(mTop, mHeight);
      else collapse(mTop, mHeight, monthTop);

      if (detailCard === "quarter") expand(qTop, qHeight);
      else collapse(qTop, qHeight, quarterTop);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      // Return all to base (already done by other effect, but ensure)
      collapse(tTop, tHeight, todayTop);
      collapse(wTop, wHeight, weekTop);
      collapse(mTop, mHeight, monthTop);
      collapse(qTop, qHeight, quarterTop);
    }
  }, [detailCard]);

  // Animated styles
  const animToday = useAnimatedStyle(() => ({
    top: tTop.value,
    height: tHeight.value,
    zIndex: detailCard === "today" ? 100 : 1,
    left: 0,
    right: 0,
    opacity: detailCard && detailCard !== "today" ? 0 : 1,
  }));
  const animWeek = useAnimatedStyle(() => ({
    top: wTop.value,
    height: wHeight.value,
    zIndex: detailCard === "week" ? 100 : 2,
    left: 0,
    right: 0,
    opacity: detailCard && detailCard !== "week" ? 0 : 1,
  }));
  const animMonth = useAnimatedStyle(() => ({
    top: mTop.value,
    height: mHeight.value,
    zIndex: detailCard === "month" ? 100 : 3,
    left: 0,
    right: 0,
    opacity: detailCard && detailCard !== "month" ? 0 : 1,
  }));
  const animQuarter = useAnimatedStyle(() => ({
    top: qTop.value,
    height: qHeight.value,
    zIndex: detailCard === "quarter" ? 100 : 4, // quarter front (unchanged)
    left: 0,
    right: 0,
    opacity: detailCard && detailCard !== "quarter" ? 0 : 1,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0.01 ? "auto" : "none",
  }));

  // Stage height to accommodate lowest card
  const STAGE_HEIGHT = hasData ? stageHeight : 640;

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      (UIManager as any).setLayoutAnimationEnabledExperimental
    ) {
      (UIManager as any).setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;

  const bottomPad = tabBarHeight + 12;

  const summaries: Record<string, any> = {
    today: windows.today,
    week: windows.week,
    month: windows.month,
    quarter: windows.twoMonths,
  };

  const DetailOverlay = () => {
    if (!detailCard) return null;
    const summary = summaries[detailCard];
    const list = summary?.top || [];
    return (
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setDetailCard(null)}
        />
        <View
          style={{
            width: "90%",
            maxHeight: "70%",
            backgroundColor: "#181818",
            borderRadius: 28,
            padding: 20,
          }}
        >
          <View
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setDetailCard(null)}
              activeOpacity={0.85}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontFamily: "Lexend_600SemiBold",
              fontSize: 24,
              color: "#FFF",
              marginRight: 46,
            }}
          >
            {detailCard === "quarter"
              ? "Quarterly Transactions"
              : detailCard === "month"
                ? "Month’s Transactions"
                : detailCard === "week"
                  ? "Week’s Transactions"
                  : "Today’s Activity"}
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontFamily: "Lexend_400Regular",
              fontSize: 14,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {summary
              ? `${summary.totalCount} tx | ₹${summary.totalCredit} in / ₹${summary.totalDebit} out`
              : "No data"}
          </Text>

          <ScrollView
            style={{ marginTop: 16 }}
            contentContainerStyle={{ paddingBottom: 8, gap: 8 }}
          >
            {(!summary || summary.top.length === 0) && (
              <Text
                style={{
                  fontFamily: "Lexend_400Regular",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                No transactions in this period
              </Text>
            )}
            {list.map((t: any, i: number) => (
              <View
                key={i}
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "Lexend_400Regular",
                    fontSize: 12,
                    color: "#FFF",
                    marginRight: 10,
                  }}
                  numberOfLines={1}
                >
                  {t.description || t.merchant || t.category || "—"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Lexend_600SemiBold",
                    fontSize: 12,
                    color:
                      (t.type || "").toUpperCase() === "CREDIT"
                        ? "#68F5A4"
                        : "#FFB4B4",
                  }}
                >
                  {(t.type || "").toUpperCase() === "CREDIT" ? "+" : "-"}₹
                  {Math.abs(parseFloat(String(t.amount)) || 0).toLocaleString(
                    "en-IN"
                  )}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.bottomWrap, { paddingBottom: bottomPad }]}>
        <View style={[styles.stage, { height: STAGE_HEIGHT }]}>
          {hasData ? (
            <>
              {/* Backdrop ONLY when a detailCard is active */}
              {detailCard && (
                <Animated.View
                  pointerEvents="auto"
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: "rgba(0,0,0,0.55)",
                      zIndex: 50,
                      opacity: backdropOpacity.value,
                    },
                  ]}
                >
                  <Pressable style={{ flex: 1 }} onPress={closeDetails} />
                </Animated.View>
              )}

              {/* Today */}
              <Animated.View style={[styles.absSlot, animToday]}>
                <TodayTransactionCard
                  summary={windows.today}
                  hasData
                  processing={!!processing}
                  fixedHeight={
                    detailCard === "today" ? expandedHeight : cardHeight
                  }
                  isDetailsOpen={detailCard === "today"}
                  onOpenDetails={() => openDetails("today")}
                  onCloseDetails={closeDetails}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={() => {}}
                />
              </Animated.View>

              {/* Week */}
              <Animated.View style={[styles.absSlot, animWeek]}>
                <WeekTransactionCard
                  summary={windows.week}
                  hasData
                  processing={!!processing}
                  fixedHeight={
                    detailCard === "week" ? expandedHeight : cardHeight
                  }
                  isDetailsOpen={detailCard === "week"}
                  onOpenDetails={() => openDetails("week")}
                  onCloseDetails={closeDetails}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={() => {}}
                  showLogs={false}
                />
              </Animated.View>

              {/* Month */}
              <Animated.View style={[styles.absSlot, animMonth]}>
                <MonthTransactionCard
                  summary={windows.month}
                  hasData
                  processing={!!processing}
                  fixedHeight={
                    detailCard === "month" ? expandedHeight : cardHeight
                  }
                  isDetailsOpen={detailCard === "month"}
                  onOpenDetails={() => openDetails("month")}
                  onCloseDetails={closeDetails}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={() => {}}
                />
              </Animated.View>

              {/* Quarter */}
              <Animated.View style={[styles.absSlot, animQuarter]}>
                <QuarterlyTransactionCard
                  summary={windows.twoMonths}
                  hasData
                  processing={!!processing}
                  fixedHeight={
                    detailCard === "quarter" ? expandedHeight : cardHeight
                  }
                  isDetailsOpen={detailCard === "quarter"}
                  onOpenDetails={() => openDetails("quarter")}
                  onCloseDetails={closeDetails}
                />
              </Animated.View>
            </>
          ) : (
            <Animated.View style={[styles.absSlot, { top: 0 }]}>
              <QuarterlyTransactionCard
                summary={windows.twoMonths}
                hasData={false}
                processing={!!processing}
                fixedHeight={cardHeight}
                isDetailsOpen={false}
              />
            </Animated.View>
          )}
        </View>
      </View>
      <DetailOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  bottomWrap: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    overflow: "visible",
  },
  stage: { position: "relative", overflow: "visible", width: "100%" },
  absSlot: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
