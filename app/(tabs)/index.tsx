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

SplashScreen.preventAutoHideAsync();

type DetailCard = "today" | "week" | "month" | "quarter" | null;

const CARD_HEIGHT = 200;
const CARD_GAP = 0;
const TODAY_TOP_FINAL = 0;
const WEEK_TOP_FINAL = TODAY_TOP_FINAL + CARD_HEIGHT + CARD_GAP;
const MONTH_TOP_FINAL = WEEK_TOP_FINAL + CARD_HEIGHT + CARD_GAP;
const QUARTER_TOP_FINAL = MONTH_TOP_FINAL + CARD_HEIGHT + CARD_GAP;

export default function Deck() {
  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });
  const tabBarHeight = useBottomTabBarHeight();

  const smsData = useSMSDataContext();
  const bankMessages = smsData?.bankMessages || [];
  const upiMessages = smsData?.upiMessages || [];
  const processing = smsData?.processing;
  const merged = [...bankMessages, ...upiMessages];
  const hasData = !processing && merged.length > 0;
  const windows = useTransactionWindows(merged);

  const [detailCard, setDetailCard] = useState<DetailCard>(null);

  // shared values (top offsets)
  const tTop = useSharedValue(0);
  const wTop = useSharedValue(0);
  const mTop = useSharedValue(0);
  const qTop = useSharedValue(0);

  // Animate into stacked positions when data becomes available
  useEffect(() => {
    if (hasData) {
      const cfg = { damping: 18, stiffness: 180, mass: 0.9 };
      tTop.value = withSpring(TODAY_TOP_FINAL, cfg);
      wTop.value = withSpring(WEEK_TOP_FINAL, cfg);
      mTop.value = withSpring(MONTH_TOP_FINAL, cfg);
      qTop.value = withSpring(QUARTER_TOP_FINAL, cfg);
    } else {
      // collapse all to top 0 during processing / initial
      tTop.value = 0;
      wTop.value = 0;
      mTop.value = 0;
      qTop.value = 0;
    }
  }, [hasData]);

  // Animated styles (top-based)
  const animToday = useAnimatedStyle(() => ({
    top: tTop.value,
    height: CARD_HEIGHT,
    zIndex: 4,
    left: 0,
    right: 0,
  }));
  const animWeek = useAnimatedStyle(() => ({
    top: wTop.value,
    height: CARD_HEIGHT,
    zIndex: 3,
    left: 0,
    right: 0,
  }));
  const animMonth = useAnimatedStyle(() => ({
    top: mTop.value,
    height: CARD_HEIGHT,
    zIndex: 2,
    left: 0,
    right: 0,
  }));
  const animQuarter = useAnimatedStyle(() => ({
    top: qTop.value,
    height: CARD_HEIGHT,
    zIndex: 1,
    left: 0,
    right: 0,
  }));

  // Stage height must fit lowest card (quarterly) + its height
  const STAGE_HEIGHT = hasData ? QUARTER_TOP_FINAL + CARD_HEIGHT + 24 : 640;

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
              <Animated.View style={[styles.absSlot, animToday]}>
                <TodayTransactionCard
                  summary={windows.today}
                  hasData
                  processing={!!processing}
                  fixedHeight={CARD_HEIGHT}
                  isDetailsOpen={false}
                  onOpenDetails={() => setDetailCard("today")}
                  onCloseDetails={() => setDetailCard(null)}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={() => {}}
                />
              </Animated.View>
              <Animated.View style={[styles.absSlot, animWeek]}>
                <WeekTransactionCard
                  summary={windows.week}
                  hasData
                  processing={!!processing}
                  fixedHeight={CARD_HEIGHT}
                  isDetailsOpen={false}
                  onOpenDetails={() => setDetailCard("week")}
                  onCloseDetails={() => setDetailCard(null)}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={() => {}}
                  showLogs={false}
                />
              </Animated.View>
              <Animated.View style={[styles.absSlot, animMonth]}>
                <MonthTransactionCard
                  summary={windows.month}
                  hasData
                  processing={!!processing}
                  fixedHeight={CARD_HEIGHT}
                  isDetailsOpen={false}
                  onOpenDetails={() => setDetailCard("month")}
                  onCloseDetails={() => setDetailCard(null)}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={() => {}}
                />
              </Animated.View>
              <Animated.View style={[styles.absSlot, animQuarter]}>
                <QuarterlyTransactionCard
                  summary={windows.twoMonths}
                  hasData
                  processing={!!processing}
                  fixedHeight={CARD_HEIGHT}
                  isDetailsOpen={false}
                  onOpenDetails={() => setDetailCard("quarter")}
                  onCloseDetails={() => setDetailCard(null)}
                />
              </Animated.View>
            </>
          ) : (
            <Animated.View style={[styles.absSlot, { top: 0 }]}>
              <QuarterlyTransactionCard
                summary={windows.twoMonths}
                hasData={false}
                processing={!!processing}
                fixedHeight={CARD_HEIGHT}
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
