import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useFonts, Lexend_400Regular } from "@expo-google-fonts/lexend";

export default function TabLayout() {
  let [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "white",
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          // Add these properties to fix positioning
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="analytics" size={24} color={color} />
          ),
          tabBarLabelStyle: {
            fontFamily: "Lexend_400Regular",
            fontSize: 10,
            // lineHeight: 12,
            paddingBottom: 12,
            fontWeight: "500",
            // flex: 1,
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="message" size={24} color={color} />
          ),
          tabBarLabelStyle: {
            fontFamily: "Lexend_400Regular",
            fontSize: 10,
            lineHeight: 16,
            paddingBottom: 12,
            fontWeight: "500",
          },
        }}
      />
    </Tabs>
  );
}
