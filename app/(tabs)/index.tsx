import { useAuth } from '@/context/AuthContext';
import { subscribeToTransactions, Transaction } from '@/services/transactionService';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

import { SmartAdviceCard } from '@/components/SmartAdviceCard'; // Added import
import { getUserBudget } from '@/services/userService';
import { calculateSpendingHealth, SpendingHealth } from '@/utils/financialAnalysis'; // Added import
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useCallback } from 'react';

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

export default function TabOneScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme(); // Hook usage
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0); // Added budget state
  const [chartData, setChartData] = useState<any[]>([]);
  const [spendingHealth, setSpendingHealth] = useState<SpendingHealth | null>(null); // Added state

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
    let expensesTotal = 0;
    const transactionTotal = data.reduce((acc, curr) => {
      const isIncome = curr.type === 'income';
      if (!isIncome) expensesTotal += curr.amount; // Sum expenses
      return isIncome ? acc + curr.amount : acc - curr.amount; // transactionTotal is (Income - Expenses)
    }, 0);
    
    setTotalBalance(budget + transactionTotal);

    // Calculate Spending Health
    const health = calculateSpendingHealth(budget, expensesTotal);
    setSpendingHealth(health);

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

  /* ... inside TabOneScreen ... */
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  // Edit Form State
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ visible: true, message, type });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditCategory(transaction.category);
    setEditModalVisible(true);
  };

  const openDeleteModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedTransaction || !editAmount || !editDescription) return;
    
    setLoading(true);
    try {
        const { updateTransaction } = require('@/services/transactionService');
        await updateTransaction({
            ...selectedTransaction,
            amount: parseFloat(editAmount),
            description: editDescription,
            category: editCategory
        });
        showToast('Transaction updated', 'success');
        setEditModalVisible(false);
        setSelectedTransaction(null);
    } catch (e) {
        showToast('Failed to update', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!selectedTransaction || !selectedTransaction.id) return;

      try {
          const { deleteTransaction } = require('@/services/transactionService');
          await deleteTransaction(selectedTransaction.id);
          showToast('Transaction deleted', 'error'); // Red for delete
          setDeleteModalVisible(false);
          setSelectedTransaction(null);
      } catch (e) {
          showToast('Failed to delete', 'error');
      }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Toast Notification */}
      {toast.visible && (
        <View className={`absolute top-12 left-5 right-5 z-50 rounded-2xl flex-row items-center p-4 shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          <FontAwesome name={toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} size={24} color="white" />
          <Text className="text-white font-semibold ml-3 text-base">{toast.message}</Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingTop: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between items-start mb-6">
          <View>
             <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium">Good Morning,</Text>
             <Text className="text-2xl font-bold text-slate-800 dark:text-white">
               {user?.displayName || user?.email?.split('@')[0]}
             </Text> 
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            className="p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm"
          >
            <FontAwesome name="user-circle" size={32} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        {/* Premium Balance Card */}
        <LinearGradient
          colors={['#4F46E5', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6 mb-6 shadow-lg relative overflow-hidden"
        >
          <View className="flex-row justify-between mb-2">
             <Text className="text-indigo-100 text-sm font-medium">Total Balance</Text>
             <FontAwesome name="cc-visa" size={24} color="rgba(255,255,255,0.8)" />
          </View>
          <Text className="text-white text-4xl font-bold mb-5">
            {totalBalance.toFixed(2)} <Text className="text-xl font-medium text-indigo-100">DH</Text>
          </Text>
          
          <TouchableOpacity 
            onPress={generateReport} 
            className="bg-white/20 px-4 py-2.5 rounded-full self-start flex-row items-center border border-white/30"
          >
             <FontAwesome name="download" size={14} color="white" style={{marginRight: 8}}/>
             <Text className="text-white font-semibold text-sm">Monthly Report</Text>
          </TouchableOpacity>

          <View className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
        </LinearGradient>

        {/* Smart Spending Advisor */}
        {spendingHealth && (
          <SmartAdviceCard spendingHealth={spendingHealth} />
        )}

        {/* Chart Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-slate-800 dark:text-white">Expenses Analysis</Text>
            <TouchableOpacity>
               <Text className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">This Month</Text>
            </TouchableOpacity>
          </View>
          {chartData.length > 0 ? (
            <PieChart
              data={chartData}
              width={screenWidth - 48} // Adjusted for padding
              height={220}
              chartConfig={CHART_CONFIG}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[0, 0]}
              absolute
            />
          ) : (
            <View className="h-48 justify-center items-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <Text className="text-slate-400 dark:text-slate-500 italic">No expenses to visualize yet</Text>
            </View>
          )}
        </View>

        {/* Recent Transactions List */}
        <View className="mb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</Text>
             <TouchableOpacity>
               <Text className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">See All</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.map((t) => (
            <TouchableOpacity 
                key={t.id} 
                onPress={() => openEditModal(t)}
                className="flex-row items-center bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm active:bg-gray-100"
            >
              <View 
                className="w-12 h-12 rounded-xl justify-center items-center mr-4"
                style={{ backgroundColor: CATEGORY_COLORS[t.category] + '20' }}
              >
                 <Text style={{fontSize: 20}}>
                    {t.category === 'Food' ? '🍔' : 
                     t.category === 'Transport' ? '🚗' :
                     t.category === 'Shopping' ? '🛍️' : '📄'}
                 </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-800 dark:text-white mb-1">
                  {t.description}
                </Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {t.category} • {t.date instanceof Object && 'toDate' in t.date 
                    ? (t.date as any).toDate().toLocaleDateString() 
                    : new Date(t.date).toLocaleDateString()}
                </Text>
              </View>
              <Text 
                className="text-base font-bold"
                style={{ color: t.type === 'income' ? '#059669' : '#DC2626' }}
              >
                {t.type === 'income' ? '+' : '-'}{t.amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Transaction Modal */}
      {selectedTransaction && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-bold text-slate-800 dark:text-white">Edit Transaction</Text>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <FontAwesome name="close" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View className="space-y-4 mb-6">
                   <View>
                      <Text className="text-sm font-medium text-slate-500 mb-1">Amount</Text>
                      <TextInput 
                          value={editAmount}
                          onChangeText={setEditAmount}
                          keyboardType="numeric"
                          className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-lg font-bold text-slate-800 dark:text-white border border-gray-200 dark:border-slate-700"
                      />
                   </View>
                   <View>
                      <Text className="text-sm font-medium text-slate-500 mb-1">Description</Text>
                      <TextInput 
                          value={editDescription}
                          onChangeText={setEditDescription}
                          className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-lg text-slate-800 dark:text-white border border-gray-200 dark:border-slate-700"
                      />
                   </View>
                   {/* Simplified Category Input for now, can be upgraded to Picker */}
                   <View>
                      <Text className="text-sm font-medium text-slate-500 mb-1">Category</Text>
                      <TextInput 
                          value={editCategory}
                          onChangeText={setEditCategory}
                          className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-lg text-slate-800 dark:text-white border border-gray-200 dark:border-slate-700"
                      />
                   </View>
                </View>

                <View className="flex-row space-x-4 mb-4" style={{gap: 12}}>
                  <TouchableOpacity 
                    onPress={() => {
                        setEditModalVisible(false);
                        setTimeout(() => openDeleteModal(selectedTransaction), 300);
                    }}
                    className="flex-1 bg-red-100 p-4 rounded-xl items-center"
                  >
                    <Text className="text-red-600 font-bold">Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleUpdate}
                    className="flex-2 bg-blue-600 p-4 rounded-xl items-center flex-grow"
                    style={{flex: 2}}
                  >
                    <Text className="text-white font-bold">Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
               <View className="w-16 h-16 bg-red-100 rounded-full justify-center items-center mb-4">
                  <FontAwesome name="trash" size={32} color="#EF4444" />
               </View>
               <Text className="text-xl font-bold text-slate-900 dark:text-white text-center">Delete Transaction?</Text>
               <Text className="text-slate-500 text-center mt-2">
                 Are you sure you want to remove this transaction? This action cannot be undone.
               </Text>
            </View>

            <View className="flex-row space-x-3" style={{gap: 12}}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className="flex-1 bg-gray-100 dark:bg-slate-700 p-3 rounded-xl items-center"
              >
                <Text className="text-slate-600 dark:text-slate-300 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-1 bg-red-500 p-3 rounded-xl items-center shadow-lg shadow-red-200"
              >
                <Text className="text-white font-bold">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
