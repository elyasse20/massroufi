import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CATEGORIES } from '../constants/categories';
import { useExpenses } from '../context/ExpenseContext';

export default function ModalScreen() {
  const { addExpense } = useExpenses();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);

  const handleSave = () => {
    if (!amount) return;
    
    addExpense({
      amount: parseFloat(amount),
      categoryId: selectedCategory,
      note: note.trim() || CATEGORIES.find(c => c.id === selectedCategory)?.name,
    });
    
    router.back();
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      
      {/* Header / Amount Input */}
      <View className="items-center py-10 bg-gray-50 dark:bg-slate-800 rounded-b-3xl shadow-sm">
        <Text className="text-gray-500 mb-2 dark:text-gray-400">Montant à dépenser</Text>
        <View className="flex-row items-center justify-center">
            <TextInput 
                className="text-5xl font-bold text-gray-900 dark:text-white p-2 min-w-[120px] text-center"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
            />
            <Text className="text-3xl font-bold text-gray-400 ml-2">DH</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Categories */}
        <Text className="text-lg font-bold text-gray-900 mb-4 dark:text-white">Catégorie</Text>
        <View className="flex-row flex-wrap gap-4 justify-between">
            {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                    key={cat.id} 
                    onPress={() => setSelectedCategory(cat.id)}
                    className={`w-[30%] aspect-square items-center justify-center rounded-2xl border-2 ${selectedCategory === cat.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-slate-800'}`}
                >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${cat.color.split(' ')[0]}`}>
                        <FontAwesome name={cat.icon as any} size={18} className={cat.color.split(' ')[1]} color="#333" />
                    </View>
                    <Text className={`text-xs font-medium ${selectedCategory === cat.id ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>{cat.name}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Note Input */}
        <View className="mt-8 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2 dark:text-white">Description</Text>
            <View className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2">
                <TextInput 
                    value={note}
                    onChangeText={setNote}
                    placeholder="Ajouter une note..."
                    placeholderTextColor="#9CA3AF"
                    className="p-3 text-gray-900 dark:text-white"
                />
            </View>
        </View>

        {/* Buttons */}
        <View className="gap-4 mb-10">
            <TouchableOpacity 
              className="bg-blue-600 p-4 rounded-xl items-center shadow-lg shadow-blue-300"
              onPress={handleSave}
            >
                <Text className="text-white font-bold text-lg">Enregistrer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                className="p-4 rounded-xl items-center flex-row justify-center gap-2"
                onPress={() => alert('Scan non implémenté')}
            >
                <FontAwesome name="camera" size={20} color="#6B7280" />
                <Text className="text-gray-500 font-semibold">Scanner un ticket</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
