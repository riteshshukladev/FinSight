import { StyleSheet, Platform } from 'react-native';
import { useFonts, Lexend_400Regular } from "@expo-google-fonts/lexend";

export const styles = StyleSheet.create({
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

 
});