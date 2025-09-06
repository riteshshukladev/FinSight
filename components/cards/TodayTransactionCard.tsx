import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onHeightChange?: (h: number) => void; // <-- NEW
};

export default function TodayTransactionCard({
  isExpanded,
  onExpand,
  onCollapse,
  onHeightChange,
}: Props) {
  const handleLayout = (e: LayoutChangeEvent) => {
    onHeightChange?.(e.nativeEvent.layout.height); // report actual height to parent
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={!isExpanded ? onExpand : undefined}
    >
      <View style={styles.card} onLayout={handleLayout}>
        {/* top-right control: dotted ring (collapsed) / close (expanded) */}
        <TouchableOpacity
          style={styles.topRight}
          onPress={isExpanded ? onCollapse : onExpand}
          activeOpacity={0.9}
        >
          {isExpanded ? (
            <View style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </View>
          ) : (
            <>
              <View style={styles.dottedOuter} />
              <View style={styles.dottedInner}>
                <Ionicons
                  name="open-outline"
                  size={18}
                  color="rgba(0,0,0,0.85)"
                />
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* CENTERED CONTENT (no flex:1, so height grows with content) */}
        <View style={styles.centerWrap}>
          <View style={styles.logoCircle} />
          <Text style={styles.brand}>finman</Text>
          <Text style={styles.blurb}>
            {`it’s problematic to where your money
is flowing. But not anymore.
Let us manage your finance related query and 
problems, by making sure we collect and process them
accordingly with the help of AI and make your life
a little stress free. That much i can do.`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EC6B3D",
    borderRadius: RADIUS,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    minHeight: 460, // can grow beyond this; we’ll measure actual height
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
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
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
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

  centerWrap: {
    alignItems: "center", // center horizontally
    gap: 10,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  brand: {
    fontFamily: "Lexend_700Bold",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 0.5,
    textTransform: "lowercase",
  },
  blurb: {
    marginTop: 6,
    fontFamily: "Lexend_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
  },
});
