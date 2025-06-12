import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSMSDataContext } from "../../hooks/SMSDataContext";

export default function MessagesTab() {
  const { messages, loading, loadBankMessages, forceRefresh, processing } =
    useSMSDataContext();

  const renderTransactionItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.sender}>{item.address}</Text>
        {item.type && (
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: item.type === "CREDIT" ? "#4CAF50" : "#F44336",
              },
            ]}
          >
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        )}
      </View>

      {item.amount && <Text style={styles.amount}>₹{item.amount}</Text>}

      {item.merchant && (
        <Text style={styles.merchant}>At: {item.merchant}</Text>
      )}

      {item.balance && (
        <Text style={styles.balance}>Balance: ₹{item.balance}</Text>
      )}

      {item.card && <Text style={styles.card}>Card: {item.card}</Text>}

      <Text style={styles.body} numberOfLines={3}>
        {item.body}
      </Text>

      <Text style={styles.date}>{item.date.toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bank Transaction Messages</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadBankMessages}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? "Loading..." : "Refresh"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={forceRefresh}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? "Loading..." : "clear cache"}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        Found {messages.length} bank transaction messages
      </Text>
      {(loading || processing) && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(255,255,255,0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Processing...
          </Text>
        </View>
      )}
      <FlatList
        data={messages}
        keyExtractor={(item) =>
          item._id?.toString() || Math.random().toString()
        }
        renderItem={renderTransactionItem}
        refreshing={loading}
        onRefresh={loadBankMessages}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading
                ? "Loading bank messages..."
                : "No bank transaction messages found"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  item: {
    backgroundColor: "white",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sender: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  merchant: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  balance: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  card: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
    lineHeight: 18,
  },
  date: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
