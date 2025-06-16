import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const LoadingOverlay = ({
  visible,
  isDark,
  fontsLoaded,
  loadingText = "Processing...",
  subText = null,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Start animations when overlay becomes visible
      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start spinning animation
      const spin = () => {
        spinValue.setValue(0);
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => spin());
      };
      spin();
    } else {
      // Fade out when hiding
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.overlay,
        {
          backgroundColor: isDark
            ? "rgba(0, 0, 0, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
          opacity: fadeValue,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.loadingContainer,
          isDark && styles.loadingContainerDark,
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {/* Animated Loading Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.spinnerContainer,
              {
                transform: [{ rotate: spinInterpolate }],
              },
            ]}
          >
            <MaterialIcons
              name="sync"
              size={32}
              color={isDark ? "#CDCDCD" : "#333"}
            />
          </Animated.View>

          {/* Pulsing background circle */}
          <Animated.View
            style={[
              styles.pulseCircle,
              isDark && styles.pulseCircleDark,
              {
                opacity: fadeValue,
              },
            ]}
          />
        </View>

        {/* Loading Text */}
        <Text
          style={[
            styles.loadingText,
            isDark && styles.loadingTextDark,
            fontsLoaded && styles.fontFamily,
          ]}
        >
          {loadingText}
        </Text>

        {/* Optional subtitle */}
        {subText && (
          <Text
            style={[
              styles.subText,
              isDark && styles.subTextDark,
              fontsLoaded && styles.fontFamily,
            ]}
          >
            {subText}
          </Text>
        )}

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                isDark && styles.dotDark,
                {
                  opacity: fadeValue,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backdropFilter: "blur(2px)", // May not work on all platforms
  },

  loadingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  loadingContainerDark: {
    backgroundColor: "rgba(24, 24, 24, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#fff",
    shadowOpacity: 0.1,
  },

  iconContainer: {
    position: "relative",
    marginBottom: 20,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },

  spinnerContainer: {
    zIndex: 2,
  },

  pulseCircle: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  pulseCircleDark: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 24,
  },
  loadingTextDark: {
    color: "#CDCDCD",
  },

  subText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 180,
  },
  subTextDark: {
    color: "#999",
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666",
  },
  dotDark: {
    backgroundColor: "#999",
  },

  fontFamily: {
    fontFamily: "Lexend_400Regular",
  },
});

export default LoadingOverlay;
