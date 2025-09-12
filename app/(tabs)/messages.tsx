import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
} from "react-native";
import LoadingOverlay from "@/components/LoadingOverlay";
import EmptyMessagesList from "@/components/EmptyMessageList";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  useFonts,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from "@expo-google-fonts/lexend";
import { styles } from "@/styles/messagesStyles";

export default function MessagesTab() {
  // Load multiple font weights
  let [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Get the context data - it might be null
  const smsData = useSMSDataContext();

  // Handle null context case
  if (!smsData) {
    return (
      <SafeAreaView
        style={[styles.container, isDark && styles.containerDark]}
        edges={["top"]}
      >
        <LoadingOverlay
          visible={true}
          isDark={isDark}
          fontsLoaded={fontsLoaded}
          loadingText="Initializing..."
          // subText="Please wait"
        />
      </SafeAreaView>
    );
  }

  const {
    messages,
    loading,
    loadBankMessages,
    forceRefresh,
    processing,
    processingLogs,
  } = smsData;

  const isEmpty =
    !loading && !processing && (!messages || messages.length === 0);

  const onProcess = () => {
    if (processing) return;
    Alert.alert(
      "Process Messages",
      "We’ll scan your SMS and extract Bank/UPI transactions.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Process",
          onPress: async () => {
            try {
              await forceRefresh?.();
            } catch (e) {
              Alert.alert("Error", String(e));
            }
          },
        },
      ]
    );
  };

  const renderTransactionItem = ({ item }: any) => (
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

  if (!fontsLoaded) {
    return (
      <SafeAreaView
        style={[styles.container, isDark && styles.containerDark]}
        edges={["top"]}
      >
        <LoadingOverlay
          visible={true}
          isDark={isDark}
          fontsLoaded={false}
          loadingText="Loading Fonts..."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={["top"]}
    >
      {/* header + refresh row */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.subheader}>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Total Messages: {messages?.length || 0}
          </Text>
          <TouchableOpacity onPress={loadBankMessages} disabled={loading}>
            <Text
              style={[
                styles.refreshButtonText,
                isDark && styles.refreshButtonTextDark,
              ]}
            >
              {loading ? "refreshing" : "refresh Messages"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* processing/loading/content */}
      {processing ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            gap: 6,
          }}
        >
          <Text
            style={{
              fontFamily: "Lexend_400Regular",
              fontSize: 16,
              color: isDark ? "#CDCDCD" : "#222",
              textAlign: "center",
            }}
          >
            processing messages...
          </Text>
          <Text
            style={{
              fontFamily: "Lexend_300Light",
              fontSize: 13,
              color: isDark ? "#AFAFAF" : "#444",
              textAlign: "center",
            }}
          >
            to see logs, go on home page
          </Text>
        </View>
      ) : loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "Lexend_400Regular",
              fontSize: 16,
              color: isDark ? "#CDCDCD" : "#222",
              textAlign: "center",
            }}
          >
            ...loading
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages || []}
          keyExtractor={(item) =>
            item._id?.toString() || Math.random().toString()
          }
          renderItem={renderTransactionItem}
          refreshing={loading}
          onRefresh={loadBankMessages}
          contentContainerStyle={[
            styles.listContainer,
            isEmpty && { flexGrow: 1, justifyContent: "center" },
          ]}
          ListEmptyComponent={
            isEmpty ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "stretch",
                  paddingHorizontal: 24,
                  gap: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lexend_400Regular",
                    fontSize: 16,
                    color: isDark ? "#CDCDCD" : "#222",
                    textAlign: "center",
                  }}
                >
                  Looks Like their are no messages to see.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onProcess}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(251, 251, 251, 0.961)"
                      : "rgba(0,0,0,0.25)",
                    backgroundColor: isDark
                      ? "rgba(71, 71, 71, 0.18)"
                      : "rgba(0,0,0,0.06)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Lexend_500Medium",
                      fontSize: 12,
                      letterSpacing: 0.2,
                      color: isDark ? "#FFF" : "#000",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    process
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
