import { Stack, router } from 'expo-router';
import { Dimensions, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import BalanceCard from '../../components/BalanceCard';
import RecentTransactions from '../../components/RecentTransactions';
import { CATEGORIES } from '../../constants/categories';
import { useExpenses } from '../../context/ExpenseContext';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { expenses } = useExpenses();

  // Prepare chart data
  const chartData = CATEGORIES.map(category => {
    const total = expenses
      .filter(e => e.categoryId === category.id)
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      name: category.name,
      population: total,
      color: category.hex || '#ccc',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    };
  }).filter(item => item.population > 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-6 mt-2">
          <View>
            <Text className="text-gray-500 text-lg dark:text-gray-400">Bonjour,</Text>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">Etudiant 👋</Text>
          </View>
          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center border-2 border-white shadow-sm">
             <Text className="text-2xl">🎓</Text>
          </View>
        </View>

        {/* Balance Card */}
        <BalanceCard />

        {/* Chart Section */}
        {chartData.length > 0 && (
          <View className="mt-8 px-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Répartition</Text>
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 items-center shadow-sm">
              <PieChart
                data={chartData}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View className="px-6 mt-12 mb-20">
          <View className="flex-row justify-between items-center mb-4">
             <Text className="text-xl font-bold text-gray-900 dark:text-white">Dernières dépenses</Text>
             <TouchableOpacity onPress={() => router.push('/transactions')}>
                 <Text className="text-blue-600 font-semibold">Voir tout</Text>
             </TouchableOpacity>
          </View>
          <RecentTransactions />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

