import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTransactions, Transaction } from '../../services/transactionService';

const screenWidth = Dimensions.get('window').width;

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

const CATEGORY_ICONS: Record<string, string> = {
    'Food': 'cutlery',
    'Transport': 'bus',
    'Shopping': 'shopping-bag',
    'Bills': 'file-text-o',
    'Fun': 'gamepad',
    'Health': 'medkit',
    'Education': 'book',
    'Other': 'ellipsis-h'
};

export default function StatsScreen() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
        if (!user) return;
        
        // Fetch ALL transactions for stats (limit 1000 to get good history)
        const unsubscribe = subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        }, 1000);

        return () => unsubscribe();
    }, [user])
  );

  // Filter only expenses
  const expenses = transactions.filter(t => t.type === 'expense');

  // 1. Weekly Spending (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // -6, -5, ... -0 (Today)
    return d.toISOString().split('T')[0];
  });

  const expensesByDate = expenses.reduce((acc, t) => {
      const dateStr = t.date instanceof Date 
        ? t.date.toISOString().split('T')[0] 
        : new Date(t.date as any).toISOString().split('T')[0]; // Handle timestamp case
      
      acc[dateStr] = (acc[dateStr] || 0) + t.amount;
      return acc;
  }, {} as Record<string, number>);

  const weeklyData = last7Days.map(date => expensesByDate[date] || 0);
  const weeklyLabels = last7Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  // 2. Category Breakdown
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.keys(categoryTotals)
    .map(cat => ({
        name: cat,
        total: categoryTotals[cat],
        percent: totalExpenses > 0 ? categoryTotals[cat] / totalExpenses : 0,
        color: CATEGORY_COLORS[cat] || '#9CA3AF',
        icon: CATEGORY_ICONS[cat] || 'tag'
    }))
    .sort((a, b) => b.total - a.total);


  return (
    <View className="flex-1 bg-gray-50 pt-10">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-slate-800 px-6 py-6 mt-4">Statistics</Text>

        {/* Weekly Trend Chart */}
        <View className="px-6 mb-8">
            <Text className="text-lg font-bold text-slate-700 mb-4">Spending Trend (Last 7 Days)</Text>
            <View className="bg-white rounded-3xl p-2 shadow-sm items-center overflow-hidden">
                {weeklyData.some(v => v > 0) ? (
                    <LineChart
                        data={{
                        labels: weeklyLabels,
                        datasets: [{ data: weeklyData }]
                        }}
                        width={screenWidth - 60}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Blue
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: "#2563EB"
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                ) : (
                    <View className="h-48 justify-center items-center">
                        <Text className="text-slate-400">No spending data for this week</Text>
                    </View>
                )}
            </View>
        </View>

        {/* Top Spending Categories */}
        <View className="px-6">
            <Text className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Expenses by Category</Text>
            {categoryData.length > 0 ? (
                categoryData.map(cat => (
                    <View key={cat.name} className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
                        <View className="flex-row justify-between items-center mb-2">
                            <View className="flex-row items-center gap-3">
                                <View 
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    style={{ backgroundColor: cat.color + '20' }} // 20% opacity using hex assumption, simple trick
                                >
                                    <FontAwesome name={cat.icon as any} size={16} color={cat.color} />
                                </View>
                                <Text className="font-bold text-slate-700 dark:text-slate-200 text-base">{cat.name}</Text>
                            </View>
                            <Text className="font-bold text-slate-900 dark:text-white text-base">{cat.total.toFixed(0)} DH</Text>
                        </View>
                        {/* Progress Bar */}
                        <View className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                            <View 
                                className="h-full rounded-full" 
                                style={{ width: `${cat.percent * 100}%`, backgroundColor: cat.color }} 
                            />
                        </View>
                    </View>
                ))
            ) : (
                <View className="items-center py-10">
                    <Text className="text-slate-400">No expenses recorded yet.</Text>
                </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}
