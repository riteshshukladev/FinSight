import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BankAnalytics from "../../components/BankAnalytics";
// import { useSMSData } from "../../hooks/useSMSData";
import { useSMSDataContext } from "../../hooks/SMSDataContext";
import { SMSMessage } from "@/types/type";

export default function AnalyticsTab() {
  const context = useSMSDataContext();
  const messages: SMSMessage[] = context?.messages ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <BankAnalytics transactions={messages} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    // paddingBottom: 0,
  },
});
