import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, TouchableOpacity } from "react-native";
import { useFonts, Lexend_400Regular } from "@expo-google-fonts/lexend";

export default function TabLayout() {
  let [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#c9d9e7",
        tabBarInactiveTintColor: "#666",
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            style={props.style}
          />
        ),
        tabBarStyle: {
          backgroundColor: "white",
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === "ios" ? 95 : 75, // Increased height
          paddingBottom: Platform.OS === "ios" ? 25 : 15, // Adjusted padding
          paddingTop: 12,
          paddingHorizontal: 15, // Add horizontal padding for better spacing
        },
        tabBarLabelStyle: {
          fontFamily: "Lexend_400Regular",
          fontSize: 11, // Slightly larger for better readability
          paddingBottom: 8,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2, // Adjust icon spacing
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
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="message" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}