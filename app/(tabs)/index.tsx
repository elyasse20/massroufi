import { useAuth } from '@/context/AuthContext';
import { Transaction, subscribeToTransactions } from '@/services/transactionService';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const CHART_CONFIG = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#ffffff",
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
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

import { getUserBudget } from '@/services/userService'; // Added getUserBudget
import { useFocusEffect, useRouter } from 'expo-router'; // Added useFocusEffect
import { useCallback } from 'react'; // Added useCallback

// ...

export default function TabOneScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0); // Added budget state
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch Budget on Focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        getUserBudget(user.uid).then(b => {
           setMonthlyBudget(b || 0);
        });
      }
    }, [user])
  );

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
      // We don't calculate financials here anymore, strictly dependent on data change
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Recalculate Financials when transactions or budget changes
  useEffect(() => {
     calculateFinancials(transactions, monthlyBudget);
  }, [transactions, monthlyBudget]);


  const calculateFinancials = (data: Transaction[], budget: number) => {
    // Total Balance = Budget + Income - Expenses
    const transactionTotal = data.reduce((acc, curr) => {
      const isIncome = curr.type === 'income';
      return isIncome ? acc + curr.amount : acc - curr.amount; // transactionTotal is (Income - Expenses)
    }, 0);
    
    setTotalBalance(budget + transactionTotal);

    const expensesByCategory: Record<string, number> = {};
    data.filter(t => t.type !== 'income').forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const newChartData = Object.keys(expensesByCategory).map(cat => ({
      name: cat,
      population: expensesByCategory[cat],
      color: CATEGORY_COLORS[cat] || '#808080',
      legendFontColor: "#4B5563",
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

  const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View>
             <Text style={styles.greetingText}>Good Morning,</Text>
             <Text style={styles.userText}>{user?.email?.split('@')[0]}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            style={styles.profileButton}
          >
            <FontAwesome name="user-circle" size={32} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        {/* Premium Balance Card */}
        <LinearGradient
          colors={['#4F46E5', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.cardHeader}>
             <Text style={styles.balanceLabel}>Total Balance</Text>
             <FontAwesome name="cc-visa" size={24} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.balanceAmount}>{totalBalance.toFixed(2)} <Text style={styles.currency}>DH</Text></Text>
          
          <TouchableOpacity 
            onPress={generateReport} 
            style={styles.reportButton}
          >
             <FontAwesome name="download" size={14} color="white" style={{marginRight: 8}}/>
             <Text style={styles.reportButtonText}>Monthly Report</Text>
          </TouchableOpacity>

          <View style={styles.cardReflections} />
        </LinearGradient>

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses Analysis</Text>
            <TouchableOpacity>
               <Text style={styles.seeAllText}>This Month</Text>
            </TouchableOpacity>
          </View>
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
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No expenses to visualize yet</Text>
            </View>
          )}
        </View>

        {/* Recent Transactions List */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
             <TouchableOpacity>
               <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.map((t) => (
            <View key={t.id} style={styles.transactionItem}>
              <View style={[styles.transactionIcon, { backgroundColor: CATEGORY_COLORS[t.category] + '20' }]}>
                 {/* Simple mapping or generic icon */}
                 <Text style={{fontSize: 20}}>
                    {t.category === 'Food' ? '🍔' : 
                     t.category === 'Transport' ? '🚗' :
                     t.category === 'Shopping' ? '🛍️' : '📄'}
                 </Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{t.description}</Text>
                <Text style={styles.transactionCategory}>{t.category} • {t.date instanceof Object && 'toDate' in t.date 
                    ? (t.date as any).toDate().toLocaleDateString() 
                    : new Date(t.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[
                styles.transactionAmount, 
                { color: t.type === 'income' ? '#059669' : '#DC2626' }
              ]}>
                {t.type === 'income' ? '+' : '-'}{t.amount}
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
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  userText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  dateBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    display: 'none', // Hiding date badge if we are replacing it, or just removing the style usage. 
    // Actually I replaced the usage above, so I can replace this style block with the new one.
  },
  profileButton: {
    padding: 4,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 12,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  currency: {
    fontSize: 20,
    fontWeight: '500',
    color: '#E0E7FF',
  },
  reportButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cardReflections: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  chartContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  seeAllText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noDataText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  transactionsContainer: {
    marginBottom: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
