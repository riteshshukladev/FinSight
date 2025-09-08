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
          elevation: 0,
          shadowColor: isDark ? "#fff" : "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === "ios" ? 95 : 75,
          paddingBottom: Platform.OS === "ios" ? 25 : 15,
          paddingTop: 12,
          paddingHorizontal: 10,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? "#333" : "#e0e0e0",
        },
        tabBarLabelStyle: {
          fontFamily: "Lexend_400Regular",
          fontSize: 10,
          paddingBottom: 6,
          fontWeight: "500",
          marginTop: 2,
          color: isDark ? "#fff" : "#222",
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Stats",
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
