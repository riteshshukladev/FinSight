import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

interface Transaction {
  amount: string | number;
  date?: string;
  type?: string;
  category?: string;
  merchant?: string;
  confidence?: number;
  account?: string;
}

// Predefined colors for consistency
const CHART_COLORS = [
  "#36A2EB", 
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#FF6B6B",
  "#4ECDC4",
];

export const useBankAnalytics = (transactions: Transaction[] = []) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark"; 

   

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
    const monthlyStats: { [key: string]: { credit: number; debit: number; count: number; net: number } } = {};
    const categoryStats: { [key: string]: { credit: number; debit: number; count: number; total: number } } = {};
    const dailyStats: { [key: string]: { credit: number; debit: number; net: number } } = {};
    const merchantStats: { [key: string]: { credit: number; debit: number; count: number; total: number } } = {};

    // Process AI-classified transactions
    transactions.forEach((transaction) => {
      try {
        if (!transaction || typeof transaction !== "object") return;

        const amount = Math.abs(parseFloat(String(transaction.amount)) || 0);
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
      .sort((a, b) => (new Date(b.date || '')).getTime() - (new Date(a.date || '')).getTime()) // Sort by date desc
      .slice(0, 8) // Get last 8 transactions
      .map((transaction, index) => ({
        ...transaction,
        displayDate: new Date(transaction.date || new Date()).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        displayAmount: Math.abs(parseFloat(String(transaction.amount)) || 0),
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

  return {
    analytics,
    chartConfig,
    barChartData,
    lineChartData,
    pieChartData,
    isDark,
  };
};