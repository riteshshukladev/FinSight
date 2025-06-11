
import React, { useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

const { width: screenWidth } = Dimensions.get("window");

// Calculate chart width accounting for all padding and margins
const CONTAINER_PADDING = 16;
const CHART_CONTAINER_PADDING = 16;
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
  // Calculate analytics data with AI-processed transactions
  const analytics = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {
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
            merchantStats[merchant] = { credit: 0, debit: 0, count: 0, total: 0 };
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
        name: category.length > 15 ? category.substring(0, 15) + "..." : category,
        population: Math.round(data.debit),
        color: CHART_COLORS[index % CHART_COLORS.length],
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      }));

    // Category breakdown for detailed view
    const categoryBreakdown = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: ((data.total / (totalCredit + totalDebit)) * 100).toFixed(1),
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

    return {
      totalCredit: Math.round(totalCredit),
      totalDebit: Math.round(totalDebit),
      netBalance: Math.round(totalCredit - totalDebit),
      transactionCount: transactions.length,
      creditCount,
      debitCount,
      averageCredit: creditCount > 0 ? Math.round(totalCredit / creditCount) : 0,
      averageDebit: debitCount > 0 ? Math.round(totalDebit / debitCount) : 0,
      monthlyData,
      categoryData,
      weeklyTrend,
      topMerchants,
      categoryBreakdown,
      confidenceScore: transactions.length > 0 ? (totalConfidence / transactions.length) : 0,
    };
  }, [transactions]);

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
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
      stroke: "#e3e3e3",
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
            legendFontColor: "#7F7F7F",
            legendFontSize: 12,
          },
        ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* AI Confidence Indicator */}
      <View style={styles.aiIndicator}>
        <Text style={styles.aiText}>
          AI Classification Confidence: {(analytics.confidenceScore * 100).toFixed(1)}%
        </Text>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                width: `${analytics.confidenceScore * 100}%`,
                backgroundColor: analytics.confidenceScore > 0.8 ? '#4CAF50' : 
                                analytics.confidenceScore > 0.6 ? '#FF9800' : '#F44336'
              }
            ]} 
          />
        </View>
      </View>

      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ₹{analytics.totalCredit.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.statLabel}>Total Credit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#F44336" }]}>
            ₹{analytics.totalDebit.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.statLabel}>Total Debit</Text>
        </View>
      </View>

      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Text
            style={[
              styles.statValue,
              { color: analytics.netBalance >= 0 ? "#4CAF50" : "#F44336" },
            ]}
          >
            ₹{Math.abs(analytics.netBalance).toLocaleString("en-IN")}
          </Text>
          <Text style={styles.statLabel}>
            Net {analytics.netBalance >= 0 ? "Inflow" : "Outflow"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.transactionCount}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {/* Pie Chart - Spending Categories */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Spending by Category</Text>
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
        />
      </View>

      {/* Bar Chart - Monthly Comparison */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Credit vs Debit</Text>
        <BarChart
          data={barChartData}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          showValuesOnTopOfBars={true}
          fromZero={true}
          showBarTops={false}
          style={styles.chart}
        />
      </View>

      {/* Line Chart - Weekly Trend */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Transaction Trend</Text>
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

      {/* Category Breakdown */}
      {analytics.categoryBreakdown.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {analytics.categoryBreakdown.map((cat, index) => (
            <View key={`${cat.category}-${index}`} style={styles.categoryCard}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <Text style={styles.categoryPercentage}>{cat.percentage}%</Text>
              </View>
              <View style={styles.categoryAmounts}>
                {cat.debit > 0 && (
                  <Text style={styles.categoryDebit}>
                    Spent: ₹{cat.debit.toLocaleString("en-IN")}
                  </Text>
                )}
                {cat.credit > 0 && (
                  <Text style={styles.categoryCredit}>
                    Received: ₹{cat.credit.toLocaleString("en-IN")}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>Quick Insights</Text>

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>Average Credit Amount</Text>
          <Text style={styles.insightValue}>
            ₹{analytics.averageCredit.toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>Average Debit Amount</Text>
          <Text style={styles.insightValue}>
            ₹{analytics.averageDebit.toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>Credit Transactions</Text>
          <Text style={styles.insightValue}>{analytics.creditCount}</Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>Debit Transactions</Text>
          <Text style={styles.insightValue}>{analytics.debitCount}</Text>
        </View>
      </View>

      {/* Top Merchants */}
      {analytics.topMerchants.length > 0 && (
        <View style={styles.merchantsSection}>
          <Text style={styles.sectionTitle}>Top Transaction Sources</Text>
          {analytics.topMerchants.map(([merchant, data], index) => (
            <View key={`${merchant}-${index}`} style={styles.merchantCard}>
              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName} numberOfLines={1}>
                  {merchant}
                </Text>
                <Text style={styles.merchantCount}>
                  {data.count} transactions
                </Text>
              </View>
              <Text style={styles.merchantAmount}>
                ₹{data.total.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default BankAnalytics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: CONTAINER_PADDING,
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: CHART_CONTAINER_PADDING,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  chart: {
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  insightCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
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
  merchantCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
  merchantCount: {
    fontSize: 12,
    color: "#666",
  },
  merchantAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
  },
});
