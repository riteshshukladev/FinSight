import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  LayoutAnimation,
  UIManager,
  Platform,
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
  Easing,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

import QuarterlyTransactionCard from "../../components/cards/QuarterlyTransactionCard";
import MonthTransactionCard from "../../components/cards/MonthTransactionCard";
import WeekTransactionCard from "../../components/cards/WeekTransactionCard";
import TodayTransactionCard from "../../components/cards/TodayTransactionCard";

SplashScreen.preventAutoHideAsync();

// shared collapsed heights
const CARD_HEIGHT = 180;

// ladder offsets
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

  // dynamic height growth for Today card measurement
  const [todayHeight, setTodayHeight] = useState<number>(260);
  const onTodayHeight = (h: number) => setTodayHeight(h);

  // WEEK measured height (for stage sizing)  <<< ADD
  const [weekHeight, setWeekHeight] = useState<number>(CARD_HEIGHT);
  const onWeekHeight = (h: number) => setWeekHeight(h);
  // <<< END ADD

  // extra animated vertical growth trigger after processing starts
  const [heightBoost, setHeightBoost] = useState(0);

  // enable LayoutAnimation on Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // NEW
  const [showWeek, setShowWeek] = useState(false); // NEW
  // (Month intentionally hidden per requirement)

  // appearance animation for week card
  const weekAppear = useSharedValue(0); // 0 = hidden, 1 = shown

  const triggerHeightBoost = () => {
    if (heightBoost === 0) {
      if (!showWeek) {
        setShowWeek(true);
        weekAppear.value = 0;
        // smoother eased timing instead of stiff spring
        weekAppear.value = withTiming(1, {
          duration: 620,
          easing: Easing.out(Easing.exp),
        });
      }
      // gentler layout transition
      LayoutAnimation.configureNext({
        duration: 600,
        create: { type: "easeInEaseOut", property: "opacity" },
        update: {
          type: "spring",
          springDamping: 0.75, // smoother (0.0 - 1.0)
        },
        delete: { type: "easeInEaseOut", property: "opacity" },
      });
      setHeightBoost(200);
    }
  };

  // animated bottom offsets (month removed)
  const weekBottom = useSharedValue(WEEK_OFFSET);
  const todayBottom = useSharedValue(TODAY_OFFSET);

  useEffect(() => {
    // only animate week if visible
    if (showWeek) {
      weekBottom.value = withSpring(openCard === "week" ? 0 : WEEK_OFFSET, {
        damping: 16,
        stiffness: 140,
      });
    }
    todayBottom.value = withSpring(openCard === "today" ? 0 : TODAY_OFFSET, {
      damping: 16,
      stiffness: 140,
    });
  }, [openCard, showWeek]);

  const weekSlotStyle = useAnimatedStyle(() => {
    // smoother travel + subtle scale & fade curve
    const progress = weekAppear.value;
    const translateY = interpolate(
      progress,
      [0, 1],
      [140, 0],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(progress, [0, 1], [0, 1]);
    const scale = interpolate(progress, [0, 1], [0.9, 1], Extrapolate.CLAMP);
    return {
      bottom: weekBottom.value,
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  const todaySlotStyle = useAnimatedStyle(() => {
    // slight soften when heightBoost animates (optional subtle scale)
    return {
      bottom: todayBottom.value,
      transform: [
        {
          scale: withSpring(1, {
            damping: 18,
            stiffness: 140,
          }),
        },
      ],
    };
  });

  // stage height (exclude month)
  const STAGE_HEIGHT = Math.max(
    QUARTER_OFFSET + CARD_HEIGHT,
    showWeek ? WEEK_OFFSET + weekHeight : 0, // use measured week height
    TODAY_OFFSET + todayHeight
  );

  // z-index ordering (month removed)
  const zToday = openCard === "today" ? 10 : 1;
  const zWeek = openCard === "week" ? 10 : 2;
  const zQuart = openCard ? 4 : 5;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;

  // lift above tab bar
  const EXTRA_RAISE = 12;
  const bottomPad = tabBarHeight + EXTRA_RAISE;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.bottomWrap, { paddingBottom: bottomPad }]}>
        <View style={[styles.stage, { height: STAGE_HEIGHT }]}>
          {/* TODAY (always visible) */}
          <Animated.View
            style={[styles.absSlot, todaySlotStyle, { zIndex: zToday }]}
          >
            <TodayTransactionCard
              isExpanded={true} // kept for interface; unused internally
              onExpand={() => {}}
              onCollapse={() => {}}
              onHeightChange={onTodayHeight}
              extraHeight={heightBoost}
              collapsedHeight={CARD_HEIGHT + 40} // 220 (week collapsed +20)
            />
          </Animated.View>

          {/* WEEK (appears only after processing start) */}
          {showWeek && (
            <Animated.View
              style={[styles.absSlot, weekSlotStyle, { zIndex: zWeek }]}
            >
              <WeekTransactionCard
                isExpanded={true}
                onExpand={() => {}}
                onCollapse={() => {}}
                extraHeight={heightBoost}
                showLogs={heightBoost > 0}
                referenceHeight={todayHeight}
                onHeightChange={onWeekHeight} // NEW
                collapsedHeight={CARD_HEIGHT + 20} // 200
              />
            </Animated.View>
          )}

          {/* QUARTERLY */}
          <View
            style={[styles.absSlot, { bottom: QUARTER_OFFSET, zIndex: zQuart }]}
          >
            <QuarterlyTransactionCard onStartProcessing={triggerHeightBoost} />
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
    overflow: "visible",
  },
  stage: { position: "relative", overflow: "visible" },
  absSlot: { position: "absolute", left: 0, right: 0 },
});
