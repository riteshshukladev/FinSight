import React, { useEffect, useRef, useState } from "react";
import {
  StatusBar,
  UIManager,
  Platform,
  PixelRatio,
  useWindowDimensions,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
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
  SlideInUp, // slide from bottom
  SlideInDown,
} from "react-native-reanimated";

import QuarterlyTransactionCard from "../../components/cards/QuarterlyTransactionCard";
import MonthTransactionCard from "../../components/cards/MonthTransactionCard";
import WeekTransactionCard from "../../components/cards/WeekTransactionCard";
import TodayTransactionCard from "../../components/cards/TodayTransactionCard";
import EmptyTodayComponent from "../../components/cards/EmptyTodayComponent";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { useTransactionWindows } from "@/hooks/useTransactionWindow";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProcessingLogsComponent from "../../components/cards/ProcessingLogsComponent";
import { BlurView } from "expo-blur";

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
const FINE_LAYER_SHIFT = 1; // subtle extra drop per depth layer
const EXTRA_HIDE_SHIFT = 5; // base extra push
const WEEK_EXTRA_PUSH = 6; // existing week push
const MONTH_EXTRA_PUSH = 6; // existing month push
const TODAY_EXTRA_PUSH = 18; // increased (was 10) to push Today card further down
const WEEK_DEEPER_PUSH = 10; // NEW additional push for week
const TODAY_DATA_PUSH = 24; // NEW: overlap Today more when data is available

type DetailCard = "today" | "week" | "month" | "quarter" | null;

const DEFAULT_TABBAR_HEIGHT = Platform.OS === "ios" ? 95 : 75; // Seed a stable tab bar height to prevent initial layout jump

export default function Deck() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });
  const tabBarHeight = useBottomTabBarHeight();
  const stableTabBarHeight = tabBarHeight || DEFAULT_TABBAR_HEIGHT;
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
  // bump to force a clean mount of absolute card wrappers after processing -> data
  const [stackEpoch, setStackEpoch] = useState(0);
  const prevProcessing = useRef<boolean | null>(null);

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
    const tabPad = stableTabBarHeight;

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

    // APPLY dynamic extra push for Today
    // when data is available, push Today a bit to hide its bottom behind Week
    const dynamicTodayExtra = hasData ? TODAY_DATA_PUSH : TODAY_EXTRA_PUSH;

    const todayTopFinal =
      rawTodayTop +
      STACK_SHIFT * 3 +
      FINE_LAYER_SHIFT * 3 +
      EXTRA_HIDE_SHIFT +
      dynamicTodayExtra;

    const weekTopFinal =
      rawWeekTop +
      STACK_SHIFT * 2 +
      FINE_LAYER_SHIFT * 2 +
      EXTRA_HIDE_SHIFT +
      WEEK_EXTRA_PUSH +
      WEEK_DEEPER_PUSH;

    const monthTopFinal =
      rawMonthTop +
      STACK_SHIFT * 1 +
      FINE_LAYER_SHIFT * 1 +
      EXTRA_HIDE_SHIFT +
      MONTH_EXTRA_PUSH;

    const quarterTopFinal = rawQuarterTop;

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

    return {
      cardHeight: base,
      expandedHeight: exp,
      todayTop: todayTopFinal,
      weekTop: weekTopFinal,
      monthTop: monthTopFinal,
      quarterTop: quarterTopFinal,
      stageHeight: topSpacing + stackTotal + BOTTOM_GAP,
    };
  }, [
    windowHeight,
    insets.top,
    insets.bottom,
    stableTabBarHeight,
    fontScale,
    hasData,
  ]);

  // shared values (top + height)
  const tTop = useSharedValue(todayTop);
  const wTop = useSharedValue(weekTop);
  const mTop = useSharedValue(monthTop);
  const qTop = useSharedValue(quarterTop);

  const tHeight = useSharedValue(cardHeight);
  const wHeight = useSharedValue(cardHeight);
  const mHeight = useSharedValue(cardHeight);
  const qHeight = useSharedValue(cardHeight);

  const emptyTodayHeight = useSharedValue(cardHeight * 3);
  const emptyTodayTop = useSharedValue(quarterTop - cardHeight * 2);

  // Keep EmptyToday backdrop in sync (no-data state) and grow 1x during processing
  useEffect(() => {
    if (hasData) return; // only used in no-data branch
    const baseTop = quarterTop - cardHeight * 2;
    const baseHeight = cardHeight * 3;
    const processingTop = quarterTop - cardHeight * 3; // shift up by 1x
    const processingHeight = cardHeight * 4; // grow to 4x total

    emptyTodayTop.value = withTiming(processing ? processingTop : baseTop, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
    emptyTodayHeight.value = withTiming(
      processing ? processingHeight : baseHeight,
      { duration: 250, easing: Easing.out(Easing.quad) }
    );
  }, [hasData, processing, quarterTop, cardHeight]);

  const emptyTodayAnimatedStyle = useAnimatedStyle(() => ({
    top: emptyTodayTop.value,
    height: emptyTodayHeight.value,
  }));

  // Backdrop blur opacity (animated)
  const backdropOpacity = useSharedValue(0);
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Center selected card on expand; restore positions on close
  useEffect(() => {
    const spring = { damping: 18, stiffness: 190 };
    const expand = (
      topSV: Animated.SharedValue<number>,
      hSV: Animated.SharedValue<number>
    ) => {
      // Center inside the stage
      const stageH = stageHeight;
      const centerTop = Math.max(8, (stageH - expandedHeight) / 2);
      topSV.value = withSpring(centerTop, spring);
      hSV.value = withSpring(expandedHeight, spring);
    };
    const collapse = (
      topSV: Animated.SharedValue<number>,
      hSV: Animated.SharedValue<number>,
      baseTop: number
    ) => {
      topSV.value = withSpring(baseTop, spring);
      hSV.value = withSpring(cardHeight, spring);
    };

    if (detailCard) {
      backdropOpacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
      // expand only the selected card, collapse others to their base tops
      if (detailCard === "today") expand(tTop, tHeight);
      else collapse(tTop, tHeight, todayTop);
      if (detailCard === "week") expand(wTop, wHeight);
      else collapse(wTop, wHeight, weekTop);
      if (detailCard === "month") expand(mTop, mHeight);
      else collapse(mTop, mHeight, monthTop);
      if (detailCard === "quarter") expand(qTop, qHeight);
      else collapse(qTop, qHeight, quarterTop);
    } else {
      backdropOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
      // restore all to base positions/heights
      collapse(tTop, tHeight, todayTop);
      collapse(wTop, wHeight, weekTop);
      collapse(mTop, mHeight, monthTop);
      collapse(qTop, qHeight, quarterTop);
    }
  }, [
    detailCard,
    stageHeight,
    expandedHeight,
    cardHeight,
    todayTop,
    weekTop,
    monthTop,
    quarterTop,
  ]);

  // Immediately reset shared positions when data becomes available
  useEffect(() => {
    if (!hasData) return;
    // snap to correct base positions to avoid off-screen initial paint
    tTop.value = withTiming(todayTop, { duration: 0 });
    wTop.value = withTiming(weekTop, { duration: 0 });
    mTop.value = withTiming(monthTop, { duration: 0 });
    qTop.value = withTiming(quarterTop, { duration: 0 });
    tHeight.value = wHeight.value = mHeight.value = qHeight.value = cardHeight;
  }, [hasData, todayTop, weekTop, monthTop, quarterTop, cardHeight]);

  // Clear any open detail state and backdrop while (re)processing
  useEffect(() => {
    if (processing) {
      setDetailCard(null);
      backdropOpacity.value = 0;
    }
  }, [processing]);

  // When processing finishes (or hasData flips), force a fresh mount of card shells
  useEffect(() => {
    if (prevProcessing.current === true && processing === false) {
      setStackEpoch((n) => n + 1);
    }
    prevProcessing.current = !!processing;
  }, [processing]);
  useEffect(() => {
    if (hasData) setStackEpoch((n) => n + 1);
  }, [hasData]);

  // Animated styles
  const animToday = useAnimatedStyle(() => ({
    top: tTop.value,
    height: tHeight.value,
    zIndex: detailCard === "today" ? 100 : 1,
    left: 0,
    right: 0,
    // keep others visible so BlurView can blur them
    opacity: 1,
  }));
  const animWeek = useAnimatedStyle(() => ({
    top: wTop.value,
    height: wHeight.value,
    zIndex: detailCard === "week" ? 100 : 2,
    left: 0,
    right: 0,
    opacity: 1,
  }));
  const animMonth = useAnimatedStyle(() => ({
    top: mTop.value,
    height: mHeight.value,
    zIndex: detailCard === "month" ? 100 : 3,
    left: 0,
    right: 0,
    opacity: 1,
  }));
  const animQuarter = useAnimatedStyle(() => ({
    top: qTop.value,
    height: qHeight.value,
    zIndex: detailCard === "quarter" ? 100 : 4,
    left: 0,
    right: 0,
    opacity: 1,
  }));

  // Stage height to accommodate lowest card
  const STAGE_HEIGHT = hasData
    ? stageHeight
    : Math.max(
        640,
        quarterTop + cardHeight * 3 + 24 // ensure room for 3x empty backdrop
      );

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

  const bottomPad = stableTabBarHeight + 12;

  const summaries: Record<string, any> = {
    today: windows.today,
    week: windows.week,
    month: windows.month,
    quarter: windows.twoMonths,
  };

  return (
    <SafeAreaView
      style={[styles.container, !isDark && styles.containerLight]}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" />
      <View style={[styles.bottomWrap, { paddingBottom: bottomPad }]}>
        <View style={[styles.stage, { height: STAGE_HEIGHT }]}>
          {/* Backdrop blur sits above non-expanded stack, below expanded card */}
          {detailCard && (
            <Animated.View
              pointerEvents="auto"
              style={[
                StyleSheet.absoluteFillObject,
                styles.backdrop,
                styles.backdropElevated, // ensure it's above non-expanded cards on Android
                { zIndex: 50 },
                backdropStyle,
              ]}
            >
              <BlurView
                intensity={80}
                tint={Platform.OS === "ios" ? "systemThinMaterialDark" : "dark"}
                style={StyleSheet.absoluteFillObject}
              />
              <Pressable
                style={StyleSheet.absoluteFillObject}
                onPress={closeDetails}
              />
            </Animated.View>
          )}

          {hasData ? (
            <>
              {/* Today */}
              <Animated.View
                key={`today-${stackEpoch}`}
                style={[
                  styles.absSlot,
                  animToday,
                  detailCard === "today" && styles.expandedCardSurface, // stay above blur
                ]}
              >
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
              <Animated.View
                key={`week-${stackEpoch}`}
                style={[
                  styles.absSlot,
                  animWeek,
                  detailCard === "week" && styles.expandedCardSurface,
                ]}
              >
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
              <Animated.View
                key={`month-${stackEpoch}`}
                style={[
                  styles.absSlot,
                  animMonth,
                  detailCard === "month" && styles.expandedCardSurface,
                ]}
              >
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
              <Animated.View
                key={`quarter-${stackEpoch}`}
                style={[
                  styles.absSlot,
                  animQuarter,
                  detailCard === "quarter" && styles.expandedCardSurface,
                ]}
              >
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
            <>
              {/* Quarterly (front) at its normal position (unchanged) */}
              <Animated.View
                style={[
                  styles.absSlot,
                  {
                    top: quarterTop,
                    height: cardHeight,
                    zIndex: 2, // front-most (int)
                  },
                ]}
              >
                <QuarterlyTransactionCard
                  summary={windows.twoMonths}
                  hasData={false}
                  processing={!!processing}
                  fixedHeight={cardHeight}
                  isDetailsOpen={false}
                />
              </Animated.View>

              {/* ProcessingLogsComponent (middle layer, fade-in) */}
              {processing && (
                <Animated.View
                  entering={SlideInDown.duration(400)}
                  style={[
                    styles.absSlot,
                    {
                      // extend upward so it appears above the quarterly card
                      top: quarterTop - (cardHeight * 2 - cardHeight), // i.e., quarterTop - cardHeight
                      height: cardHeight * 2,
                      zIndex: 1,
                    },
                  ]}
                >
                  <ProcessingLogsComponent
                    height={cardHeight * 2}
                    logs={smsData?.processingLogs}
                  />
                </Animated.View>
              )}

              {/* EmptyToday backdrop (largest, behind) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.absSlot,
                  emptyTodayAnimatedStyle,
                  {
                    zIndex: 0,
                    overflow: "hidden",
                    // ensure rounded bottom edges while height animates
                    borderBottomLeftRadius: 28,
                    borderBottomRightRadius: 28,
                  },
                ]}
              >
                <EmptyTodayComponent height={cardHeight * 4} />
              </Animated.View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Remove the modal overlay content entirely
const DetailOverlay = () => null;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  containerLight: { backgroundColor: "rgba(218, 218, 218, 0.74)" },
  bottomWrap: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 4,
    overflow: "visible",
  },
  stage: { position: "relative", overflow: "visible", width: "100%" },
  absSlot: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  backdrop: {
    backgroundColor: "transparent", // ensure blur is unobstructed
  },
  // Android stacks by elevation; lift the blur above non-expanded cards (which use elevation ~8)
  backdropElevated: {
    elevation: 12,
  },
  // Lift the expanded card wrapper above the blur overlay
  expandedCardSurface: {
    elevation: 24,
  },
});
