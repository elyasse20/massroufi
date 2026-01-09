import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

export default function BalanceCard() {
  const { balance, totalExpenses, income } = useExpenses();

  return (
    <View className="px-6 mt-4">
      <LinearGradient
        colors={['#3B82F6', '#2563EB', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-[32px] p-6 shadow-xl shadow-blue-500/30"
        style={{ elevation: 10 }}
      >
        {/* Top Row: Title + Edit Button */}
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <View className="flex-row items-center space-x-2">
                <Text className="text-blue-200 font-medium text-lg mr-2">Solde total</Text>
                <TouchableOpacity 
                    className="bg-white/10 px-2 py-1 rounded-lg"
                    onPress={() => router.push('/budget-edit')}
                >
                    <FontAwesome name="edit" size={12} color="#BFDBFE" />
                </TouchableOpacity>
            </View>
            <Text className="text-white text-5xl font-bold mt-2 tracking-tight">{balance.toFixed(2)} <Text className="text-2xl text-blue-200">DH</Text></Text>
          </View>
          <View className="bg-white/20 p-3 rounded-full">
            <FontAwesome name="credit-card" size={24} color="white" />
          </View>
        </View>

        {/* Bottom Row: Income & Expense */}
        <View className="flex-row justify-between items-center bg-black/10 p-4 rounded-2xl border border-white/5">
          <View className="flex-1">
             <View className="flex-row items-center mb-1">
                <View className="w-6 h-6 rounded-full bg-green-400/20 items-center justify-center mr-2">
                    <FontAwesome name="arrow-up" size={10} color="#4ade80" />
                </View>
                <Text className="text-blue-100 text-xs">Budget</Text>
             </View>
             <Text className="text-white font-semibold text-lg">{income.toFixed(0)} DH</Text>
          </View>

          <View className="w-px h-10 bg-white/20 mx-4" />

          <View className="flex-1">
             <View className="flex-row items-center mb-1">
                <View className="w-6 h-6 rounded-full bg-red-400/20 items-center justify-center mr-2">
                    <FontAwesome name="arrow-down" size={10} color="#f87171" />
                </View>
                <Text className="text-blue-100 text-xs">Dépenses</Text>
             </View>
             <Text className="text-white font-semibold text-lg">{totalExpenses.toFixed(2)} DH</Text>
          </View>
        </View>

        {/* Add Button Fab-like (positioned absolute or relative here) */}
        <View className="absolute -bottom-6 right-6">
            <TouchableOpacity 
                className="bg-gray-900 border-4 border-gray-50 dark:border-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-lg"
                onPress={() => router.push('/modal')}
            >
                <FontAwesome name="plus" size={24} color="white" />
            </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}
