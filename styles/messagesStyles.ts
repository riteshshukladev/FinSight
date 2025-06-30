import { StyleSheet, Platform } from 'react-native';

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
    color: "#000000",
    fontFamily: "Lexend_600SemiBold", // Use SemiBold instead of fontWeight
    lineHeight: 20,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  subtitleDark: {
    color: "#CDCDCD",
  },

  refreshButtonText: {
    color: "black",
    fontSize: 14,
    paddingBottom: 0.5,
    borderBottomColor: "black",
    borderBottomWidth: 1,
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
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
    minHeight: 80, // Ensure minimum height for content
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
    paddingVertical: 8, // Increased padding
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    paddingHorizontal: 12,
    flex: 1,
    minHeight: 32, // Ensure minimum height
  },

  sender: {
    fontSize: 14,
    color: "#000000",
    fontFamily: "Lexend_700Bold", // Use Bold font instead of fontWeight
    lineHeight: 20, // Increased line height
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
    flexShrink: 1, // Allow text to shrink if needed
  },
  senderDark: {
    color: "#CDCDCD",
  },

  amount: {
    fontSize: 16,
    color: "#000000",
    fontFamily: "Lexend_700Bold", // Use Bold font instead of fontWeight
    lineHeight: 22, // Increased line height
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
    flexShrink: 0, // Don't shrink amount text
  },
  amountDark: {
    color: "#CDCDCD",
  },

  body: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 6,
    fontFamily: "Lexend_400Regular",
    lineHeight: 20, // Increased line height
    letterSpacing: 0.2,
    paddingHorizontal: 12,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'top', // Android fix for multiline text
    minHeight: 20, // Ensure minimum height
  },
  bodyDark: {
    color: "#CDCDCD",
  },

  date: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingBottom: 8, // Increased padding
    color: "#888",
    fontFamily: "Lexend_300Light", // Use Light font for italic effect
    lineHeight: 18, // Increased line height
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
    minHeight: 18, // Ensure minimum height
  },
  dateDark: {
    color: "#aaa",
  },
});