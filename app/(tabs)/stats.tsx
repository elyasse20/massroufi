import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Dimensions, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { CATEGORIES } from '../../constants/categories';
import { useExpenses } from '../../context/ExpenseContext';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { expenses, totalExpenses } = useExpenses();

  // 1. Weekly Spending Text Logic (Last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  // Group by date
  const expensesByDate = expenses.reduce((acc, exp) => {
    const dateStr = new Date(exp.date).toISOString().split('T')[0];
    acc[dateStr] = (acc[dateStr] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const weeklyData = last7Days.map(date => expensesByDate[date] || 0);
  const weeklyLabels = last7Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  });

  // 2. Category Breakdown
  const categoryData = CATEGORIES.map(cat => {
      const total = expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
      return {
          ...cat,
          total,
          percent: totalExpenses > 0 ? total / totalExpenses : 0
      };
  }).sort((a, b) => b.total - a.total); // Sort by highest spend

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-3xl font-bold text-gray-900 dark:text-white px-6 py-6">Statistiques</Text>

        {/* Weekly Trend Chart */}
        <View className="px-6 mb-8">
            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Dépenses (7 derniers jours)</Text>
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-2 shadow-sm items-center overflow-hidden">
                <LineChart
                    data={{
                    labels: weeklyLabels,
                    datasets: [{ data: weeklyData }]
                    }}
                    width={screenWidth - 60} // from react-native
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix="dh"
                    chartConfig={{
                        backgroundColor: "#ffffff",
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: {
                            r: "5",
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
            </View>
        </View>

        {/* Top Spending Categories */}
        <View className="px-6">
            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Dépenses par catégorie</Text>
            {categoryData.filter(c => c.total > 0).map(cat => (
                <View key={cat.id} className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
                    <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center gap-3">
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${cat.color.split(' ')[0]}`}>
                                <FontAwesome name={cat.icon as any} size={16} className={cat.color.split(' ')[1]} />
                            </View>
                            <Text className="font-bold text-gray-700 dark:text-gray-200">{cat.name}</Text>
                        </View>
                        <Text className="font-bold text-gray-900 dark:text-white">{cat.total.toFixed(0)} DH</Text>
                    </View>
                    {/* Progress Bar */}
                    <View className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <View 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${cat.percent * 100}%` }} 
                        />
                    </View>
                </View>
            ))}
            {categoryData.every(c => c.total === 0) && (
                <Text className="text-gray-500 text-center mt-4">Aucune donnée disponible</Text>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
