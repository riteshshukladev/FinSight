import React, { useEffect, useState } from "react";
import { StyleSheet, View, StatusBar, Text } from "react-native";
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
} from "react-native-reanimated";

import QuarterlyTransactionCard from "../../components/cards/QuarterlyTransactionCard";
import MonthTransactionCard from "../../components/cards/MonthTransactionCard";
import WeekTransactionCard from "../../components/cards/WeekTransactionCard";
import TodayTransactionCard from "../../components/cards/TodayTransactionCard";

SplashScreen.preventAutoHideAsync();

// shared collapsed heights
const CARD_HEIGHT = 180;

// ladder offsets (unchanged)
const QUARTER_OFFSET = 0;
const MONTH_OFFSET = 20;
const WEEK_OFFSET = MONTH_OFFSET + 20; // 40
const TODAY_OFFSET = WEEK_OFFSET + 20; // 60

type OpenCard = "today" | "week" | "month" | null;

export default function Deck() {
  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });
  const tabBarHeight = useBottomTabBarHeight();

  const [openCard, setOpenCard] = useState<OpenCard>(null);

  // measure Today card so stage can grow to fit it
  const [todayHeight, setTodayHeight] = useState<number>(260); // start from previous min
  const onTodayHeight = (h: number) => setTodayHeight(h);

  // animated bottom offsets
  const monthBottom = useSharedValue(MONTH_OFFSET);
  const weekBottom = useSharedValue(WEEK_OFFSET);
  const todayBottom = useSharedValue(TODAY_OFFSET);

  useEffect(() => {
    monthBottom.value = withSpring(openCard === "month" ? 0 : MONTH_OFFSET, {
      damping: 16,
      stiffness: 140,
    });
    weekBottom.value = withSpring(openCard === "week" ? 0 : WEEK_OFFSET, {
      damping: 16,
      stiffness: 140,
    });
    todayBottom.value = withSpring(openCard === "today" ? 0 : TODAY_OFFSET, {
      damping: 16,
      stiffness: 140,
    });
  }, [openCard]);

  const monthSlotStyle = useAnimatedStyle(() => ({
    bottom: monthBottom.value,
  }));
  const weekSlotStyle = useAnimatedStyle(() => ({ bottom: weekBottom.value }));
  const todaySlotStyle = useAnimatedStyle(() => ({
    bottom: todayBottom.value,
  }));

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;

  // lift above tab bar
  const EXTRA_RAISE = 12;
  const bottomPad = tabBarHeight + EXTRA_RAISE;

  // STAGE HEIGHT now based on REAL Today height (prevents clipping)
  const STAGE_HEIGHT = Math.max(
    QUARTER_OFFSET + CARD_HEIGHT,
    MONTH_OFFSET + CARD_HEIGHT,
    WEEK_OFFSET + CARD_HEIGHT,
    TODAY_OFFSET + todayHeight // measured!
  );

  // z-index: whichever is open sits on top; otherwise Today < Week < Month < Quarter
  const zToday = openCard === "today" ? 10 : 1;
  const zWeek = openCard === "week" ? 10 : 2;
  const zMonth = openCard === "month" ? 10 : 3;
  const zQuart = openCard ? 4 : 5;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.bottomWrap, { paddingBottom: bottomPad }]}>
        <View style={[styles.stage, { height: STAGE_HEIGHT }]}>
          {/* TODAY — deepest offset (+60) */}
          <Animated.View
            style={[styles.absSlot, todaySlotStyle, { zIndex: zToday }]}
          >
            <TodayTransactionCard
              isExpanded={openCard === "today"}
              onExpand={() => setOpenCard("today")}
              onCollapse={() => setOpenCard(null)}
              onHeightChange={onTodayHeight} // <-- pass the measuring callback
            />
          </Animated.View>

          {/* WEEK — offset +40 */}
          <Animated.View
            style={[styles.absSlot, weekSlotStyle, { zIndex: zWeek }]}
          >
            <WeekTransactionCard
              isExpanded={openCard === "week"}
              onExpand={() => setOpenCard("week")}
              onCollapse={() => setOpenCard(null)}
            />
          </Animated.View>

          {/* MONTH — offset +20 */}
          <Animated.View
            style={[styles.absSlot, monthSlotStyle, { zIndex: zMonth }]}
          >
            <MonthTransactionCard
              isExpanded={openCard === "month"}
              onExpand={() => setOpenCard("month")}
              onCollapse={() => setOpenCard(null)}
            />
          </Animated.View>

          {/* QUARTER — baseline 0 */}
          <View
            style={[styles.absSlot, { bottom: QUARTER_OFFSET, zIndex: zQuart }]}
          >
            <QuarterlyTransactionCard />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },

  header: { paddingHorizontal: 20, paddingVertical: 14 },
  h1: { color: "#ECECEC", fontSize: 22, fontFamily: "Lexend_600SemiBold" },
  h2: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Lexend_400Regular",
  },

  bottomWrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    overflow: "visible", // allow peeks to render
  },
  stage: { position: "relative", overflow: "visible" },
  absSlot: { position: "absolute", left: 0, right: 0 },
});
