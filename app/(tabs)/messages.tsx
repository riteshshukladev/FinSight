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
import EmptyMessagesList from "@/components/EmptyMessagesList"; // Make sure this matches your file name
import { SafeAreaView } from "react-native-safe-area-context";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useFonts, Lexend_400Regular } from "@expo-google-fonts/lexend";

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.84)",
  },
  containerDark: {
    backgroundColor: "rgba(0, 0, 0, 0.84)",
  },

  header: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: "rgba(241, 241, 241, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "#9c9c9c",
    marginBottom: 8,
    fontFamily: "Lexend_400Regular",
  },
  headerDark: {
    backgroundColor: "rgba(24, 24, 24, 1)",
    borderBottomColor: "#ddd",
  },

  subheader: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },

  subtitle: {
    fontSize: 14,
    fontWeight: "semibold",
    color: "#000000",
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
  },
  subtitleDark: {
    color: "#CDCDCD",
    lineHeight: 20,
  },

  refreshButtonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "normal",
    paddingBottom: 0.5,
    borderBottomColor: "black",
    borderBottomWidth: 1,
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
  },
  refreshButtonTextDark: {
    fontSize: 14,
    color: "#fff",
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },

  // Add padding for list items
  listContainer: {
    paddingHorizontal: 12,
    flexGrow: 1,
  },

  item: {
    backgroundColor: "white",
    marginBottom: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    width: "100%",
    alignSelf: "stretch",
    borderBottomWidth: 0.5,
    borderRightWidth: 4,
    borderLeftWidth: 4,
    overflow: "hidden",
    shadowColor: "#000",
  },
  itemDark: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#fff",
    shadowOpacity: 0.1,
  },

  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    width: "100%",
    paddingVertical: 6,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    paddingHorizontal: 12,
    flex: 1,
  },

  sender: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#000000",
    lineHeight: 18,
    fontFamily: "Lexend_400Regular",
  },
  senderDark: {
    color: "#CDCDCD",
    fontFamily: "Lexend_400Regular",
  },

  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    lineHeight: 18,
    fontFamily: "Lexend_400Regular",
  },
  amountDark: {
    color: "#CDCDCD",
    fontFamily: "Lexend_400Regular",
  },

  body: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 6,
    lineHeight: 18,
    fontFamily: "Lexend_400Regular",
    letterSpacing: 0.2,
    paddingHorizontal: 12,
  },
  bodyDark: {
    color: "#CDCDCD",
  },

  date: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingBottom: 6,
    color: "#888",
    fontStyle: "italic",
    lineHeight: 18,
    fontFamily: "Lexend_400Regular",
  },
  dateDark: {
    color: "#aaa",
  },

  // Removed unused styles:
  // - refreshButton, refreshButtonDark (not being used)
  // - typeBadge, typeText (not being used)
  // - merchant, merchantDark, balance, balanceDark, card, cardDark (not being used)
  // - emptyContainer, emptyText, emptyTextDark (replaced by EmptyMessagesList component)
});
