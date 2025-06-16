import React from "react";
import { Text, View, Dimensions, ScrollView } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import { useBankAnalytics } from "../hooks/useBankAnalytics";
import { styles } from "../styles/bankAnalyticsStyles";

const { width: screenWidth } = Dimensions.get("window");

// Calculate chart width accounting for all padding and margins
const CONTAINER_PADDING = 4;
const CHART_CONTAINER_PADDING = 4;
const CHART_WIDTH =
  screenWidth - CONTAINER_PADDING * 2 - CHART_CONTAINER_PADDING * 2;

// Header Stats Component
export const HeaderStats = ({ analytics, isDark }) => (
  <>
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
          // numberOfLines={1}
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
          // numberOfLines={1}
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
  </>
);

// Chart Components
export const SpendingPieChart = ({ pieChartData, chartConfig, isDark }) => (
  <View style={[styles.chartContainer, isDark && styles.chartContainerDark]}>
    <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
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
    />
  </View>
);

export const MonthlyLineChart = ({ barChartData, chartConfig, isDark }) => (
  <View style={[styles.chartContainer, isDark && styles.chartContainerDark]}>
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
);

export const WeeklyTrendChart = ({ lineChartData, chartConfig, isDark }) => (
  <View style={[styles.chartContainer, isDark && styles.chartContainerDark]}>
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
);

// Top Merchants Component
export const TopMerchants = ({ analytics, isDark }) => {
  if (analytics.topMerchants.length === 0) return null;

  return (
    <View
      style={[styles.merchantsSection, isDark && styles.merchantsSectionDark]}
    >
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Top Transaction Sources
      </Text>
      {analytics.topMerchants.map(([merchant, data], index) => (
        <View
          key={`${merchant}-${index}`}
          style={[styles.merchantCard, isDark && styles.merchantCardDark]}
        >
          <View style={styles.merchantInfo}>
            <Text
              style={[styles.merchantName, isDark && styles.merchantNameDark]}
              numberOfLines={1}
            >
              {merchant}
            </Text>
            <Text
              style={[styles.merchantCount, isDark && styles.merchantCountDark]}
            >
              {data.count} transactions
            </Text>
          </View>
          <Text
            style={[styles.merchantAmount, isDark && styles.merchantAmountDark]}
          >
            ₹{data.total.toLocaleString("en-IN")}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Transactions Table Component
export const TransactionsTable = ({ analytics, isDark }) => {
  if (analytics.recentTransactions.length === 0) return null;

  return (
    <View style={styles.transactionsSection}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
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
          Category
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
          key={`${transaction.id}-${index}`}
          style={[styles.tableRow, isDark && styles.tableRowDark]}
        >
          {/* Date Column */}
          <Text
            style={[
              styles.tableCellText,
              isDark && styles.tableCellTextDark,
              styles.dateColumn,
            ]}
          >
            {transaction.displayDate}
          </Text>

          {/* Type Column */}
          <View style={[styles.typeContainer, styles.typeColumn]}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    transaction.type === "CREDIT"
                      ? "rgba(76, 175, 80, 0.2)"
                      : "rgba(244, 67, 54, 0.2)",
                },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  {
                    color:
                      transaction.type === "CREDIT"
                        ? "rgb(76, 175, 80)"
                        : "rgb(244, 67, 54)",
                  },
                ]}
              >
                {transaction.type}
              </Text>
            </View>
          </View>

          {/* Amount Column */}
          <Text
            style={[
              styles.tableCellText,
              isDark && styles.tableCellTextDark,
              styles.amountColumn,
            ]}
          >
            {transaction.displayAmount.toLocaleString("en-IN")}
          </Text>

          {/* Category Column */}
          <Text
            style={[
              styles.tableCellText,
              isDark && styles.tableCellTextDark,
              styles.accountColumn,
            ]}
            numberOfLines={1}
          >
            {transaction.category || "Others"}
          </Text>

          {/* Confidence Score Column */}
          <View style={[styles.confidenceContainer, styles.confidenceColumn]}>
            <View
              style={[
                styles.confidenceBarSmall,
                isDark && styles.confidenceBarSmallDark,
              ]}
            >
              <View
                style={[
                  styles.confidenceBarFill,
                  {
                    width: `${transaction.confidencePercentage}%`,
                    backgroundColor:
                      parseFloat(transaction.confidencePercentage) > 70
                        ? "#4CAF50"
                        : parseFloat(transaction.confidencePercentage) > 40
                        ? "#FFC107"
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
  );
};

// Main Component
const BankAnalytics = ({ transactions = [] }) => {
  // Use the custom analytics hook
  const {
    analytics,
    chartConfig,
    barChartData,
    lineChartData,
    pieChartData,
    isDark,
  } = useBankAnalytics(transactions);

  return (
    <ScrollView>
      <View style={[styles.container, isDark && styles.containerDark]}>
        {/* AI Confidence Indicator */}

        {/* Stats and Charts */}
        <HeaderStats analytics={analytics} isDark={isDark} />
        <SpendingPieChart
          pieChartData={pieChartData}
          chartConfig={chartConfig}
          isDark={isDark}
        />
        <MonthlyLineChart
          barChartData={barChartData}
          chartConfig={chartConfig}
          isDark={isDark}
        />
        <WeeklyTrendChart
          lineChartData={lineChartData}
          chartConfig={chartConfig}
          isDark={isDark}
        />
        <TopMerchants analytics={analytics} isDark={isDark} />
        <TransactionsTable analytics={analytics} isDark={isDark} />
      </View>
    </ScrollView>
  );
};

export default BankAnalytics;
