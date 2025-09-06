import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function WeekTransactionCard({
  isExpanded,
  onExpand,
  onCollapse,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={!isExpanded ? onExpand : undefined}
    >
      <View style={styles.card}>
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

        <View>
          <Text style={styles.title}>Week’s Transactions</Text>
          <Text style={styles.subtitle}>Make money, spend Money</Text>
        </View>

        <View style={styles.rightBlock}>
          <Text style={styles.amount}>32</Text>
          <Text style={styles.date}>22/06/25</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#7CBFA9", // weekly green
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    minHeight: 180, // same as others
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
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
