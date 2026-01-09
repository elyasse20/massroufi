import { useAuth } from '@/context/AuthContext';
import { Transaction, subscribeToTransactions } from '@/services/transactionService';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const CHART_CONFIG = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0.5,
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false
};

const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#F87171',
  'Transport': '#60A5FA',
  'Shopping': '#FBBF24',
  'Bills': '#34D399',
  'Fun': '#A78BFA',
  'Health': '#F472B6',
  'Education': '#818CF8',
  'Other': '#9CA3AF'
};

export default function TabOneScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
      calculateFinancials(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const calculateFinancials = (data: Transaction[]) => {
    // Calculate total balance (assuming all are expenses for now, or use type)
    const total = data.reduce((acc, curr) => {
      // Logic: If type is income, add; if expense, subtract.
      // If type is missing, assume expense (default behavior)
      const isIncome = curr.type === 'income';
      return isIncome ? acc + curr.amount : acc - curr.amount;
    }, 0);
    setTotalBalance(total);

    // Prepare chart data
    const expensesByCategory: Record<string, number> = {};
    data.filter(t => t.type !== 'income').forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const newChartData = Object.keys(expensesByCategory).map(cat => ({
      name: cat,
      population: expensesByCategory[cat],
      color: CATEGORY_COLORS[cat] || '#808080',
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    }));

    setChartData(newChartData);
  };

  const generateReport = async () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'No transactions to generate report for.');
      return;
    }

    setLoading(true);
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; }
              h1 { color: #2563EB; text-align: center; }
              .summary { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .amount { text-align: right; }
              .total-row { font-weight: bold; background-color: #e6f7ff; }
            </style>
          </head>
          <body>
            <h1>Monthly Expense Report</h1>
            <div class="summary">
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Total Balance:</strong> ${totalBalance.toFixed(2)} DH</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount (DH)</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map(t => `
                  <tr>
                    <td>${t.date && 'toDate' in (t.date as any) ? (t.date as any).toDate().toLocaleDateString() : 'N/A'}</td>
                    <td>${t.description}</td>
                    <td>${t.category}</td>
                    <td>${t.type === 'income' ? 'Income' : 'Expense'}</td>
                    <td class="amount" style="color: ${t.type === 'income' ? 'green' : 'red'}">
                      ${t.type === 'income' ? '+' : '-'}${t.amount}
                    </td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="4">Total Balance</td>
                  <td class="amount">${totalBalance.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Balance Card */}
        {/* Header / Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{totalBalance.toFixed(2)} DH</Text>
          
          <TouchableOpacity 
            onPress={generateReport} 
            style={styles.reportButton}
          >
             <Text style={styles.reportButtonText}>Download Monthly Report</Text>
          </TouchableOpacity>
        </View>

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Expenses by Category</Text>
          {chartData.length > 0 ? (
            <PieChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={CHART_CONFIG}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[0, 0]}
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No expenses yet</Text>
          )}
        </View>

        {/* Recent Transactions List */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.map((t) => (
            <View key={t.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Text style={styles.iconText}>{t.category[0]}</Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{t.description}</Text>
                <Text style={styles.transactionDate}>
                  {t.date instanceof Object && 'toDate' in t.date 
                    ? (t.date as any).toDate().toLocaleDateString() 
                    : new Date(t.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount, 
                { color: t.type === 'income' ? '#34D399' : '#F87171' }
              ]}>
                {t.type === 'income' ? '+' : '-'}{t.amount} DH
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  balanceCard: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    color: '#E0E7FF',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  noDataText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    padding: 20,
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    paddingBottom: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
