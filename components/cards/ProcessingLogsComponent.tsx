import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
// NEW: top-edge shadow
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  height: number;
  logs?: string[];
}

export default function ProcessingLogsComponent({ height, logs = [] }: Props) {
  const { currentBatch, totalBatches, foundCount, foundBatch } = useMemo(() => {
    let currentBatch: number | null = null;
    let totalBatches: number | null = null;
    let foundCount: number | null = null;
    let foundBatch: number | null = null;

    logs.forEach((line) => {
      // Example: "Processing batch 3/180 (5 messages)"
      const m1 = line.match(/Processing batch\s+(\d+)\s*\/\s*(\d+)/i);
      if (m1) {
        currentBatch = parseInt(m1[1], 10);
        totalBatches = parseInt(m1[2], 10);
      }
      // Example: "✓ Batch 3: Found 2 transactions"
      const m2 = line.match(
        /[✓✔]?\s*Batch\s*(\d+):\s*Found\s*(\d+)\s*(?:transactions|messages)/i
      );
      if (m2) {
        foundBatch = parseInt(m2[1], 10);
        foundCount = parseInt(m2[2], 10);
      }
    });

    return {
      currentBatch: currentBatch ?? 0,
      totalBatches: totalBatches ?? 0,
      foundCount,
      foundBatch,
    };
  }, [logs]);

  return (
    <View style={[styles.card, { height }]}>
      {/* Top-edge stacked shadow */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.10)", "transparent"]}
        locations={[0, 0.25, 1]}
        style={styles.topEdgeShadow}
      />

      <Text style={styles.title}>processing text</Text>
      <Text style={styles.subtitle}>
        Processed {currentBatch} out of {totalBatches} batches
      </Text>
      {foundCount != null && foundBatch != null && (
        <Text style={styles.foundText}>
          Found {foundCount} Messages in batch {foundBatch}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#77B49D",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  title: {
    fontFamily: "Lexend_400Regular",
    fontSize: 26,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Lexend_300Light",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  foundText: {
    marginTop: 4,
    fontFamily: "Lexend_400Regular",
    fontSize: 14,
    color: "#FFF",
    textAlign: "center",
  },
  topEdgeShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
