import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
import { getCategoryById } from '../constants/categories';
import { useExpenses } from '../context/ExpenseContext';

export default function RecentTransactions() {
  const { expenses } = useExpenses();
  
  // Sort by date desc and take top 5
  const recent = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <View>
      {recent.map((item) => {
        const category = getCategoryById(item.categoryId);
        return (
          <View key={item.id} className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
            <View className="flex-row items-center gap-4">
              <View className={`w-12 h-12 rounded-2xl items-center justify-center ${category?.color.split(' ')[0] || 'bg-gray-100'}`}>
                <FontAwesome name={(category?.icon as any) || 'question'} size={20} className={category?.color.split(' ')[1] || 'text-gray-600'} color="#333" />
              </View>
              <View>
                <Text className="font-bold text-gray-900 text-base dark:text-white">{item.note || category?.name}</Text>
                <Text className="text-gray-500 text-sm">{new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
              </View>
            </View>
            <Text className="font-bold text-base text-gray-900 dark:text-white">
              -{item.amount.toFixed(2)} DH
            </Text>
          </View>
        );
      })}
    </View>
  );
}
