import React, { useMemo, useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Platform,
} from "react-native";
import { useFonts, Lexend_400Regular } from "@expo-google-fonts/lexend";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

const { width: screenWidth } = Dimensions.get("window");

// Calculate chart width accounting for all padding and margins
const CONTAINER_PADDING = 4;
const CHART_CONTAINER_PADDING = 4;
const CHART_WIDTH =
  screenWidth - CONTAINER_PADDING * 2 - CHART_CONTAINER_PADDING * 2;

// Predefined colors for consistency
const CHART_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#FF6B6B",
  "#4ECDC4",
];

const BankAnalytics = ({ transactions = [] }) => {
  let [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
  });

  // Make sure this is uncommented and working

  const colorScheme = useColorScheme();
  let isDark = colorScheme === "dark";

  // Calculate analytics data with AI-processed transactions
  const analytics = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {
        recentTransactions: [],
        totalCredit: 0,
        totalDebit: 0,
        netBalance: 0,
        transactionCount: 0,
        creditCount: 0,
        debitCount: 0,
        averageCredit: 0,
        averageDebit: 0,
        monthlyData: [],
        categoryData: [],
        weeklyTrend: [],
        topMerchants: [],
        categoryBreakdown: [],
        confidenceScore: 0,
      };
    }

    let totalCredit = 0;
    let totalDebit = 0;
    let creditCount = 0;
    let debitCount = 0;
    let totalConfidence = 0;
    const monthlyStats = {};
    const categoryStats = {};
    const dailyStats = {};
    const merchantStats = {};

    // Process AI-classified transactions
    transactions.forEach((transaction) => {
      try {
        if (!transaction || typeof transaction !== "object") return;

        const amount = Math.abs(parseFloat(transaction.amount) || 0);
        if (amount === 0) return;

        const date = transaction.date ? new Date(transaction.date) : new Date();
        if (isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const dayKey = date.toISOString().split("T")[0];
        const transactionType = (transaction.type || "DEBIT").toUpperCase();
        const category = transaction.category || "Others";
        const merchant = transaction.merchant || "Unknown";
        const confidence = transaction.confidence || 0.5;

        // Add to confidence tracking
        totalConfidence += confidence;

        // Process credit/debit
        if (transactionType === "CREDIT") {
          totalCredit += amount;
          creditCount++;
        } else {
          totalDebit += amount;
          debitCount++;
        }

        // Monthly data aggregation
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { credit: 0, debit: 0, count: 0, net: 0 };
        }

        if (transactionType === "CREDIT") {
          monthlyStats[monthKey].credit += amount;
        } else {
          monthlyStats[monthKey].debit += amount;
        }
        monthlyStats[monthKey].count++;
        monthlyStats[monthKey].net =
          monthlyStats[monthKey].credit - monthlyStats[monthKey].debit;

        // Category data (for spending analysis)
        if (!categoryStats[category]) {
          categoryStats[category] = { credit: 0, debit: 0, count: 0, total: 0 };
        }

        if (transactionType === "CREDIT") {
          categoryStats[category].credit += amount;
        } else {
          categoryStats[category].debit += amount;
        }
        categoryStats[category].count++;
        categoryStats[category].total += amount;

        // Merchant data
        if (merchant !== "Unknown") {
          if (!merchantStats[merchant]) {
            merchantStats[merchant] = {
              credit: 0,
              debit: 0,
              count: 0,
              total: 0,
            };
          }

          if (transactionType === "CREDIT") {
            merchantStats[merchant].credit += amount;
          } else {
            merchantStats[merchant].debit += amount;
          }
          merchantStats[merchant].count++;
          merchantStats[merchant].total += amount;
        }

        // Daily data for weekly trend
        if (!dailyStats[dayKey]) {
          dailyStats[dayKey] = { credit: 0, debit: 0, net: 0 };
        }

        if (transactionType === "CREDIT") {
          dailyStats[dayKey].credit += amount;
        } else {
          dailyStats[dayKey].debit += amount;
        }
        dailyStats[dayKey].net =
          dailyStats[dayKey].credit - dailyStats[dayKey].debit;
      } catch (error) {
        console.warn("Error processing transaction:", error);
      }
    });

    // Prepare monthly data (last 6 months)
    const monthlyData = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en", {
          month: "short",
        }),
        credit: Math.round(data.credit),
        debit: Math.round(data.debit),
        net: Math.round(data.net),
      }));

    // Prepare category data for pie chart (top 8 categories by spending)
    const categoryData = Object.entries(categoryStats)
      .filter(([, data]) => data.debit > 0) // Only show spending categories
      .sort(([, a], [, b]) => b.debit - a.debit)
      .slice(0, 8)
      .map(([category, data], index) => ({
        name:
          category.length > 15 ? category.substring(0, 15) + "..." : category,
        population: Math.round(data.debit),
        color: CHART_COLORS[index % CHART_COLORS.length],
        legendFontColor: isDark ? "#ccc" : "#7F7F7F",
        legendFontSize: 12,
      }));

    // Category breakdown for detailed view
    const categoryBreakdown = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: ((data.total / (totalCredit + totalDebit)) * 100).toFixed(
          1
        ),
      }));

    // Prepare weekly trend data (last 7 days)
    const weeklyTrend = Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([day, data]) => ({
        day: new Date(day).toLocaleDateString("en", { weekday: "short" }),
        date: day,
        credit: Math.round(data.credit),
        debit: Math.round(data.debit),
        net: Math.round(data.net),
      }));

    // Top merchants
    const topMerchants = Object.entries(merchantStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([merchant, data]) => [merchant, data]);

    const recentTransactions = transactions
      .slice() // Create copy to avoid mutating original
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date desc
      .slice(0, 8) // Get last 10 transactions
      .map((transaction, index) => ({
        ...transaction,
        displayDate: new Date(transaction.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        displayAmount: Math.abs(parseFloat(transaction.amount) || 0),
        displayAccount: `****${transaction.account?.slice(-4) || "0000"}`,
        confidencePercentage: ((transaction.confidence || 0.5) * 100).toFixed(
          1
        ),
      }));

    return {
      recentTransactions,
      totalCredit: Math.round(totalCredit),
      totalDebit: Math.round(totalDebit),
      netBalance: Math.round(totalCredit - totalDebit),
      transactionCount: transactions.length,
      creditCount,
      debitCount,
      averageCredit:
        creditCount > 0 ? Math.round(totalCredit / creditCount) : 0,
      averageDebit: debitCount > 0 ? Math.round(totalDebit / debitCount) : 0,
      monthlyData,
      categoryData,
      weeklyTrend,
      topMerchants,
      categoryBreakdown,
      confidenceScore:
        transactions.length > 0 ? totalConfidence / transactions.length : 0,
    };
  }, [transactions, isDark]);

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: isDark ? "#1e1e1e" : "#ffffff",
    backgroundGradientTo: isDark ? "#1e1e1e" : "#ffffff",
    color: (opacity = 1) =>
      isDark
        ? `rgba(99, 179, 237, ${opacity})`
        : `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: isDark ? "#444" : "#e3e3e3",
    },
    style: {
      borderRadius: 16,
    },
  };

  // Prepare chart data with fallbacks
  const barChartData = {
    labels:
      analytics.monthlyData.length > 0
        ? analytics.monthlyData.map((item) => item.month)
        : ["No Data"],
    datasets: [
      {
        data:
          analytics.monthlyData.length > 0
            ? analytics.monthlyData.map((item) => item.credit)
            : [0],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      },
      {
        data:
          analytics.monthlyData.length > 0
            ? analytics.monthlyData.map((item) => item.debit)
            : [0],
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
      },
    ],
    legend: ["Credit", "Debit"],
  };

  const lineChartData = {
    labels:
      analytics.weeklyTrend.length > 0
        ? analytics.weeklyTrend.map((item) => item.day)
        : ["No Data"],
    datasets: [
      {
        data:
          analytics.weeklyTrend.length > 0
            ? analytics.weeklyTrend.map((item) => item.credit)
            : [0],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data:
          analytics.weeklyTrend.length > 0
            ? analytics.weeklyTrend.map((item) => item.debit)
            : [0],
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ["Credit", "Debit"],
  };

  const pieChartData =
    analytics.categoryData.length > 0
      ? analytics.categoryData
      : [
          {
            name: "No Data",
            population: 100,
            color: "#E0E0E0",
            legendFontColor: isDark ? "#ccc" : "#7F7F7F",
            legendFontSize: 12,
          },
        ];

  // Test component to verify font works with number
  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Stats */}
      <View style={[styles.headerStats, isDark && styles.headerStatsDark]}>
        <View
          style={[
            styles.statCard,
            styles.statCardCredit,
            isDark && styles.statCardDark,
          ]}
        >
          <Text style={styles.statValue}>
            ₹{analytics.totalCredit.toLocaleString("en-IN")}
          </Text>
          <Text
            style={[styles.statLabel, isDark && styles.statLabelDark]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Credit
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            styles.statCardDebit,
            isDark && styles.statCardDark,
          ]}
        >
          <Text style={[styles.statValue, { color: "#000000" }]}>
            ₹{analytics.totalDebit.toLocaleString("en-IN")}
          </Text>
          <Text
            style={[styles.statLabel, isDark && styles.statLabelDark]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Debit
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.headerStats,
          styles.headerStatSec,
          isDark && styles.headerStatsDarkSec,
        ]}
      >
        {/* <View style={[styles.statCard, isDark && styles.statCardDark]}>
          <Text
            style={[
              styles.statValue,
              { color: analytics.netBalance >= 0 ? "#4CAF50" : "#F44336" },
            ]}
          >
            ₹{Math.abs(analytics.netBalance).toLocaleString("en-IN")}
          </Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
            Net {analytics.netBalance >= 0 ? "Inflow" : "Outflow"}
          </Text>
        </View> */}
        <View
          style={[
            styles.statCard,
            styles.statCardTrans,
            isDark && styles.statCardDark,

            styles.statCardTransDark,
          ]}
        >
          <Text style={styles.statValue}>{analytics.transactionCount}</Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
            Transactions
          </Text>
        </View>
      </View>

      {/* Pie Chart - Spending Categories */}
      <View
        style={[styles.chartContainer, isDark && styles.chartContainerDark]}
      >
        <Text
          style={[
            styles.chartTitle, // Only apply when loaded
            isDark && styles.chartTitleDark,
          ]}
        >
          Spending by Category
        </Text>
        <PieChart
          data={pieChartData}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[0, 0]}
          absolute={false}
          hasLegend={true}
          // Remove the 'color' style here, as it's not a valid ViewStyle property
          // style={{ color: isDark ? "#fff" : "#000" }}
        />
      </View>
      <View
        style={[styles.chartContainer, isDark && styles.chartContainerDark]}
      >
        <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
          Monthly Credit vs Debit
        </Text>
        <LineChart
          data={barChartData}
          width={CHART_WIDTH}
          height={300}
          chartConfig={chartConfig}
          bezier={true}
          style={styles.chart}
          withDots={true}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          segments={6}
          fromZero={false}
          withHorizontalLines={true}
        />
      </View>

      {/* Line Chart - Weekly Trend */}
      <View
        style={[styles.chartContainer, isDark && styles.chartContainerDark]}
      >
        <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
          Weekly Transaction Trend
        </Text>
        <LineChart
          data={lineChartData}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          bezier={true}
          style={styles.chart}
          withDots={true}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
        />
      </View>

      {/* Top Merchants */}
      {analytics.topMerchants.length > 0 && (
        <View
          style={[
            styles.merchantsSection,
            isDark && styles.merchantsSectionDark,
          ]}
        >
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            Top Transaction Sources
          </Text>
          {analytics.topMerchants.map(([merchant, data], index) => (
            <View
              key={`${merchant}-${index}`}
              style={[styles.merchantCard, isDark && styles.merchantCardDark]}
            >
              <View style={styles.merchantInfo}>
                <Text
                  style={[
                    styles.merchantName,
                    isDark && styles.merchantNameDark,
                  ]}
                  numberOfLines={1}
                >
                  {merchant}
                </Text>
                <Text
                  style={[
                    styles.merchantCount,
                    isDark && styles.merchantCountDark,
                  ]}
                >
                  {data.count} transactions
                </Text>
              </View>
              <Text
                style={[
                  styles.merchantAmount,
                  isDark && styles.merchantAmountDark,
                ]}
              >
                ₹{data.total.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Transactions Table */}
      {analytics.recentTransactions.length > 0 && (
        <View style={styles.transactionsSection}>
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            Recent Transactions
          </Text>

          {/* Table Header */}
          <View style={[styles.tableHeader, isDark && styles.tableHeaderDark]}>
            <Text
              style={[
                styles.tableHeaderText,
                isDark && styles.tableHeaderTextDark,
                styles.dateColumn,
              ]}
            >
              Date
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                isDark && styles.tableHeaderTextDark,
                styles.typeColumn,
              ]}
            >
              Type
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                isDark && styles.tableHeaderTextDark,
                styles.amountColumn,
              ]}
            >
              ₹
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                isDark && styles.tableHeaderTextDark,
                styles.accountColumn,
              ]}
            >
              cateogry
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                isDark && styles.tableHeaderTextDark,
                styles.confidenceColumn,
              ]}
            >
              AI Score
            </Text>
          </View>

          {/* Table Rows */}
          {analytics.recentTransactions.map((transaction, index) => (
            <View
              key={`${transaction.id || index}`}
              style={[styles.tableRow, isDark && styles.tableRowDark]}
            >
              <Text
                style={[
                  styles.tableCellText,
                  isDark && styles.tableCellTextDark,
                  styles.dateColumn,
                ]}
                numberOfLines={1}
              >
                {transaction.displayDate}
              </Text>

              <View style={[styles.typeColumn, styles.typeContainer]}>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor:
                        transaction.type === "CREDIT"
                          ? isDark
                            ? "#1B5E20"
                            : "#E8F5E8"
                          : isDark
                          ? "#B71C1C"
                          : "#FFEBEE",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      {
                        color:
                          transaction.type === "CREDIT"
                            ? isDark
                              ? "#81C784"
                              : "#2E7D32"
                            : isDark
                            ? "#EF5350"
                            : "#C62828",
                      },
                    ]}
                  >
                    {transaction.type}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.tableCellText,
                  isDark && styles.tableCellTextDark,
                  styles.amountColumn,
                  {
                    color:
                      transaction.type === "CREDIT"
                        ? isDark
                          ? "#81C784"
                          : "#2E7D32"
                        : isDark
                        ? "#EF5350"
                        : "#C62828",
                    fontWeight: "600",
                  },
                ]}
                numberOfLines={1}
              >
                ₹{transaction.displayAmount.toLocaleString("en-IN")}
              </Text>

              <Text
                style={[
                  styles.tableCellText,
                  isDark && styles.tableCellTextDark,
                  styles.accountColumn,
                ]}
                numberOfLines={1}
              >
                {transaction.category}
              </Text>

              <View
                style={[styles.confidenceColumn, styles.confidenceContainer]}
              >
                <View
                  style={[
                    styles.confidenceBar,
                    isDark && styles.confidenceBarSmallDark,
                  ]}
                >
                  <View
                    style={[
                      styles.confidenceBarFill,
                      {
                        width: `${transaction.confidencePercentage}%`,
                        backgroundColor:
                          parseFloat(transaction.confidencePercentage) > 80
                            ? "#4CAF50"
                            : parseFloat(transaction.confidencePercentage) > 60
                            ? "#FF9800"
                            : "#F44336",
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.confidenceText,
                    isDark && styles.confidenceTextDark,
                  ]}
                >
                  {transaction.confidencePercentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      {/* {console.log(transactions)} */}
    </ScrollView>
  );
};

export default BankAnalytics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    // padding: CONTAINER_PADDING,
  },
  containerDark: { backgroundColor: "rgba(0, 0, 0, 0.84)" },

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
    // marginBottom: 8,
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
    // backgroundColor: "white",
    padding: 12,
    // borderRadius: 12,
    flex: 1,
    // marginHorizontal: 4,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // borderBottomEndRadius: 1,
  },

  statCardCredit: {
    backgroundColor: "#28AE4A",
  },
  statCardDebit: {
    backgroundColor: "#C66161",
  },
  // statCardTrans: {
  //   backgroundColor: "#181818",
  // },
  statCardTransDark: {
    // backgroundColor: "#181818",
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
      default: "System", // fallback
    }),
    lineHeight: 20,
    paddingRight: 12,
  },

  statLabel: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    // paddingRight: 12,
    fontWeight: "500",
  },
  statLabelDark: {
    color: "#000000",
    fontFamily: "Lexend_400Regular",
  },

  chartContainer: {
    marginTop: 20,
    // marginHorizontal: 4,/
    backgroundColor: "white",
    // borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    fontFamily: "Lexend_400Regular",
    lineHeight: 20,
    borderTopWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: "#000000",
  },
  chartContainerDark: {
    borderColor: "#ffffff",
    // backgroundColor: "#1e1e1e",
    // shadowColor: "#fff",
    // shadowOpacity: 0.5,
    // fontFamily: fontsLoaded ? "Lexend_400Regular" : "System", // Add fallback
    // lineHeight: 20,/
  },

  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 16,
    color: "#000000",
    textAlign: "center",
    fontFamily: "Lexend_400Regular", // Add this line
    lineHeight: 20, // Optional: add consistent line height
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
  },
  sectionTitleDark: {
    color: "#CDCDCD",
  },

  insightCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  insightLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },

  insightValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
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
  },
  merchantNameDark: {
    color: "#fff",
  },

  merchantCount: {
    fontSize: 12,
    color: "#666",
  },
  merchantCountDark: {
    color: "#ccc",
  },

  merchantAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
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
    // borderRadius: 8,
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
  },
  tableCellTextDark: {
    color: "#ccc",
  },

  // Column widths (adjust percentages as needed)
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

  // Not having the dark styles

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
  },

  // Confidence bar styles
  confidenceContainer: {
    alignItems: "center",
  },

  confidenceBar: {
    width: 30,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 2,
  },

  confidenceBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  confidenceText: {
    fontSize: 9,
    color: "#666666",
  },
});
