import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';

export default function BudgetEditScreen() {
  const { income, setIncome } = useExpenses();
  const [amount, setAmount] = useState(income.toString());

  const handleSave = () => {
    const newIncome = parseFloat(amount);
    if (!isNaN(newIncome) && newIncome >= 0) {
      setIncome(newIncome);
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center p-6">
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      
      <View className="w-full max-w-xs bg-gray-50 dark:bg-slate-800 p-8 rounded-3xl shadow-lg">
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Définir le Budget</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">Quel est votre budget mensuel ?</Text>

        <View className="flex-row items-center justify-center border-b-2 border-blue-500 mb-8 pb-2">
            <TextInput 
                className="text-4xl font-bold text-gray-900 dark:text-white p-2 text-center min-w-[100px]"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus
                selectionColor="#3B82F6"
            />
            <Text className="text-2xl font-bold text-gray-400 ml-2">DH</Text>
        </View>

        <TouchableOpacity 
            className="bg-blue-600 w-full py-4 rounded-xl items-center shadow-lg shadow-blue-300"
            onPress={handleSave}
        >
            <Text className="text-white font-bold text-lg">Enregistrer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            className="mt-4 py-3 items-center"
            onPress={() => router.back()}
        >
            <Text className="text-gray-500 font-semibold">Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
