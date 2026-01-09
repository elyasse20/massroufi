import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, router } from 'expo-router';
import { SectionList, Text, TouchableOpacity, View } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { Expense, useExpenses } from '../context/ExpenseContext';

export default function TransactionsScreen() {
  const { expenses, deleteExpense } = useExpenses();

  const getCategory = (id: string) => CATEGORIES.find(c => c.id === id);

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sections = Object.keys(groupedExpenses)
    .sort((a, b) => {
        // Sort keys (dates) roughly... easier to just sort expenses first.
        // Let's assume expenses are sorted by date desc in context or we sort here.
        // Simple string comparison might fail for dates format "lundi ...".
        // Better to re-sort:
        return 0; 
    })
    .map(date => ({
      title: date,
      data: groupedExpenses[date],
    }));
    
  // Better approach: sort expenses then group.
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const sectionsCorrect = [];
  let currentDate = '';
  let currentData: Expense[] = [];

  sortedExpenses.forEach(exp => {
      const dateStr = new Date(exp.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric', 
        month: 'long'
      });
      // Capitalize first letter
      const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

      if (formattedDate !== currentDate) {
          if (currentDate) {
              sectionsCorrect.push({ title: currentDate, data: currentData });
          }
          currentDate = formattedDate;
          currentData = [];
      }
      currentData.push(exp);
  });
  if (currentDate) {
      sectionsCorrect.push({ title: currentDate, data: currentData });
  }


  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Stack.Screen 
        options={{ 
            title: 'Transactions',
            headerStyle: { backgroundColor: '#F9FAFB' }, // gray-50
            headerTitleStyle: { color: '#111827' },
            headerTintColor: '#3B82F6',
            headerShown: true,
            headerShadowVisible: false,
        }} 
      />
      
      {expenses.length === 0 ? (
          <View className="flex-1 items-center justify-center p-10">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <FontAwesome name="list-alt" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-lg text-center">Aucune transaction pour le moment.</Text>
              <TouchableOpacity onPress={() => router.back()} className="mt-6">
                  <Text className="text-blue-600 font-semibold">Retour</Text>
              </TouchableOpacity>
          </View>
      ) : (
        <SectionList
            sections={sectionsCorrect}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            renderSectionHeader={({ section: { title } }) => (
                <Text className="text-gray-500 font-bold mb-3 mt-4 px-1">{title}</Text>
            )}
            renderItem={({ item }) => {
            const category = getCategory(item.categoryId);
            return (
                <View className="flex-row items-center bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm">
                <View className={`w-12 h-12 rounded-full items-center justify-center ${category?.color.split(' ')[0] || 'bg-gray-100'}`}>
                    <FontAwesome name={category?.icon as any || 'question'} size={20} className={category?.color.split(' ')[1] || 'text-gray-600'} />
                </View>
                <View className="flex-1 ml-4">
                    <Text className="text-base font-bold text-gray-900 dark:text-white">{category?.name || 'Inconnu'}</Text>
                    <Text className="text-gray-500 text-sm dark:text-gray-400" numberOfLines={1}>{item.note}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-base font-bold text-gray-900 dark:text-white">-{item.amount.toFixed(2)} DH</Text>
                    <TouchableOpacity onPress={() => deleteExpense(item.id)}>
                        <Text className="text-red-400 text-xs mt-1">Supprimer</Text>
                    </TouchableOpacity>
                </View>
                </View>
            );
            }}
        />
      )}
    </View>
  );
}
