import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.84)",
  },
  containerDark: { 
    backgroundColor: "rgba(0, 0, 0, 0.84)" 
  },

  aiIndicator: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiIndicatorDark: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#fff",
    shadowOpacity: 0.05,
  },

  aiText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  aiTextDark: {
    color: "#fff",
  },

  confidenceBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  confidenceBarDark: {
    backgroundColor: "#444",
  },

  confidenceFill: {
    height: "100%",
    borderRadius: 4,
  },

  headerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerStatSec: {
    borderBottomWidth: 0.8,
    borderBottomColor: "#000000",
  },
  headerStatsDarkSec: {
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff",
  },

  statCard: {
    padding: 12,
    flex: 1,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  statCardCredit: {
    backgroundColor: "#28AE4A",
  },
  statCardDebit: {
    backgroundColor: "#C66161",
  },
  statCardTransDark: {
    backgroundColor: "#D9D9D9",
  },

  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "Lexend_400Regular",
      android: "Lexend_400Regular",
      default: "System",
    }),
    lineHeight: 20,
    paddingRight: 12,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },

  statLabel: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    fontWeight: "500",
    paddingRight: 4,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  statLabelDark: {
    color: "#000000",
    fontFamily: "Lexend_400Regular",
  },

  chartContainer: {
    marginTop: 20,
    backgroundColor: "white",
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: "#000000",
  },
  chartContainerDark: {
    borderColor: "#ffffff",
  },

  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 16,
    color: "#000000",
    textAlign: "center",
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  chartTitleDark: {
    color: "#CDCDCD",
  },

  chart: {
    color: "#000000",
    marginVertical: 8,
    borderRadius: 16,
  },

  quickStats: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000000",
    flex: 1,
    width: "100%",
    textAlign: "center",
    fontFamily: "Lexend_400Regular",
    lineHeight: 24,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  sectionTitleDark: {
    color: "#CDCDCD",
  },

  insightCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  insightLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },

  insightValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },

  merchantsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  merchantsSectionDark: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#fff",
    shadowOpacity: 0.05,
  },

  merchantCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  merchantCardDark: {
    borderBottomColor: "#444",
  },

  merchantInfo: {
    flex: 1,
    marginRight: 8,
  },

  merchantName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  merchantNameDark: {
    color: "#fff",
  },

  merchantCount: {
    fontSize: 12,
    color: "#666",
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  merchantCountDark: {
    color: "#ccc",
  },

  merchantAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  merchantAmountDark: {
    color: "#64B5F6",
  },

  transactionsSection: {
    marginTop: 16,
    paddingHorizontal: 0,
    paddingBottom: 88,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#CDCDCD",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderBottomWidth: 0.8,
    borderTopWidth: 0.8,
    borderBottomColor: "#000000",
    borderTopColor: "#000000",
  },
  tableHeaderDark: {
    backgroundColor: "#1e1e1e",
    borderBottomColor: "#555",
    borderTopColor: "#555",
  },

  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  tableHeaderTextDark: {
    color: "#CDCDCD",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.8,
    overflow: "hidden",
    borderBottomColor: "#000000",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  tableRowDark: {
    backgroundColor: "transparent",
    borderBottomColor: "#ffffff",
  },

  tableCellText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  tableCellTextDark: {
    color: "#ccc",
  },

  // Column widths
  dateColumn: {
    flex: 2,
  },

  typeColumn: {
    flex: 1.5,
    alignItems: "center",
  },

  amountColumn: {
    flex: 1.5,
    textAlign: "center",
  },

  accountColumn: {
    flex: 1.5,
  },

  confidenceColumn: {
    flex: 2,
    alignItems: "center",
  },

  // Type badge styles
  typeContainer: {
    alignItems: "center",
  },

  typeBadge: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 50,
    alignItems: "center",
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Lexend_400Regular",
    lineHeight: 16,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },

  // Confidence bar styles
  confidenceContainer: {
    alignItems: "center",
  },

  confidenceBarSmall: {
    width: 30,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 2,
  },
  confidenceBarSmallDark: {
    backgroundColor: "#444",
  },

  confidenceBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  confidenceText: {
    fontSize: 9,
    color: "#666666",
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center', // Android fix
  },
  confidenceTextDark: {
    color: "#ccc",
  },
});