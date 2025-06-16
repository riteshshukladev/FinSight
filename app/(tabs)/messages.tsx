import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import LoadingOverlay from "@/components/LoadingOverlay";
// Fix the import name to match your actual component name
import EmptyMessagesList from "@/components/EmptyMessageList"; // Make sure this matches your file name
import { SafeAreaView } from "react-native-safe-area-context";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useFonts, Lexend_400Regular } from "@expo-google-fonts/lexend";
import { styles } from "@/styles/messagesStyles"; // Adjust the import path as needed

export default function MessagesTab() {
  let [fontsLoaded] = useFonts({
    Lexend_400Regular,
  });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { messages, loading, loadBankMessages, forceRefresh, processing } =
    useSMSDataContext();

  const renderTransactionItem = ({ item }) => (
    <View
      style={[
        styles.item,
        isDark && styles.itemDark,
        {
          borderRightColor: item.type === "CREDIT" ? "#28AE4A" : "#C66161",
          borderLeftColor: item.type === "CREDIT" ? "#28AE4A" : "#C66161",
          borderBottomColor: isDark ? "#ddd" : "#000000",
        },
      ]}
    >
      <View
        style={[
          styles.itemHeader,
          {
            borderTopColor: item.type === "CREDIT" ? "#28AE4A" : "#C66161",
            borderBottomColor: item.type === "CREDIT" ? "#28AE4A" : "#C66161",
          },
        ]}
      >
        {item.amount && (
          <Text style={[styles.amount, isDark && styles.amountDark]}>
            ₹{item.amount}
          </Text>
        )}

        <Text style={[styles.sender, isDark && styles.senderDark]}>
          {item.address}
        </Text>
      </View>

      <Text style={[styles.body, isDark && styles.bodyDark]} numberOfLines={3}>
        {item.body}
      </Text>

      <Text style={[styles.date, isDark && styles.dateDark]}>
        {new Date(item.date).toLocaleDateString("en-IN")} |{" "}
        {new Date(item.date).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={["top"]}
    >
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.subheader}>
          <TouchableOpacity onPress={loadBankMessages} disabled={loading}>
            <Text
              style={[
                styles.refreshButtonText,
                isDark && styles.refreshButtonTextDark,
              ]}
            >
              {loading ? "Loading..." : "refresh"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={forceRefresh} disabled={loading}>
            <Text
              style={[
                styles.refreshButtonText,
                isDark && styles.refreshButtonTextDark,
              ]}
            >
              {loading ? "Loading..." : "clear cache"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          Total Messages: {messages.length}
        </Text>
      </View>

      <LoadingOverlay
        visible={loading || processing}
        isDark={isDark}
        fontsLoaded={fontsLoaded}
        loadingText={processing ? "Processing Messages..." : "Loading..."}
        subText={processing ? "Analyzing bank transactions" : "Please wait"}
      />

      <FlatList
        data={messages}
        keyExtractor={(item) =>
          item._id?.toString() || Math.random().toString()
        }
        renderItem={renderTransactionItem}
        refreshing={loading}
        onRefresh={loadBankMessages}
        // Add some padding to prevent items from touching screen edges
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyMessagesList
            loading={loading}
            isDark={isDark}
            onRefresh={loadBankMessages}
            fontsLoaded={fontsLoaded}
          />
        }
      />
    </SafeAreaView>
  );
}
