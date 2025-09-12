import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, TouchableOpacity, useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#fff" : "#222",
        tabBarInactiveTintColor: isDark ? "#9a9898" : "#888888",
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.8}
            style={props.style}
          />
        ),
        tabBarStyle: {
          backgroundColor: isDark ? "#181818" : "white",
          // elevation: 0,
          shadowColor: isDark ? "#fff" : "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === "ios" ? 64 : 56,
          paddingTop: 14,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? "#333" : "#e0e0e0",
          alignItems: "center",
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0, // allow label to use full available width
          justifyContent: "center",
          alignItems: "center",
          height: Platform.OS === "ios" ? 52 : 44,
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontFamily: "Lexend_400Regular",
          fontSize: 12,
          lineHeight: 14,
          fontWeight: "500",
          color: isDark ? "#fff" : "#222",
          textAlign: "center",
          includeFontPadding: false,
          textAlignVertical: "center",
          paddingVertical: 0,
          marginTop: 0,
          marginBottom: 0,
        },
        // Remove icon placeholder space entirely
        tabBarIconStyle: {
          width: 0,
          height: 0,
          margin: 0,
          display: "none",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
