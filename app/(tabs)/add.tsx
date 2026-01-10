import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CategoryPicker from '../../components/CategoryPicker';
import { useAuth } from '../../context/AuthContext';
import { addTransaction, getMonthlyExpenses } from '../../services/transactionService';
import { getUserBudget } from '../../services/userService';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const scanReceipt = async () => {
    // 1. Request Permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // 2. Launch Camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      processReceipt(result.assets[0].uri);
    }
  };

  const processReceipt = async (uri: string) => {
    setScanning(true);
    // Simulate OCR processing time
    setTimeout(() => {
      // Mock OCR Logic: Extract a random approximate amount
      const mockAmount = (Math.random() * (500 - 20) + 20).toFixed(2);
      
      setAmount(mockAmount);
      setDescription('Scanned Receipt - Supermarket');
      setCategory('Food'); // Guess category
      setScanning(false);
      
      Alert.alert('Scan Complete', `Detected Amount: ${mockAmount} DH`);
    }, 2000);
  };

  const handleSave = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        description,
        category,
        date: Timestamp.now(),
        userId: user.uid,
        type: 'expense' // Defaulting to expense for now
      });

      // Budget Check Logic (Non-blocking)
      try {
        const budget = await getUserBudget(user.uid);
        if (budget) {
          const totalExpenses = await getMonthlyExpenses(user.uid);
          if (totalExpenses >= budget * 0.8) {
            Alert.alert("Warning", `You have reached ${Math.round((totalExpenses/budget)*100)}% of your budget!`);
          }
        }
      } catch (budgetError) {
        console.log("Budget check failed silently:", budgetError);
      }

      Alert.alert('Success', 'Transaction added', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-6">
      <StatusBar style="dark" />
      <View className="pt-10 mb-6 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-gray-900">Add Expense</Text>
        <TouchableOpacity 
          onPress={scanReceipt}
          disabled={scanning}
          className="bg-purple-100 p-3 rounded-full"
        >
          {scanning ? <ActivityIndicator size="small" color="#9333ea" /> : <FontAwesome name="camera" size={24} color="#9333ea" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
          
          <View>
            <Text className="text-gray-500 mb-1 ml-1 text-sm uppercase font-bold tracking-wider">Amount</Text>
            <View className="flex-row items-center border-b-2 border-gray-100 focus:border-blue-500 py-2">
              <Text className="text-3xl font-bold text-gray-900 mr-2">DH</Text>
              <TextInput
                className="flex-1 text-4xl font-bold text-gray-900"
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-1 ml-1">Description</Text>
            <TextInput
              className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-lg"
              placeholder="What is this for?"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <CategoryPicker selectedCategory={category} onSelectCategory={setCategory} />

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || scanning}
            className={`w-full py-4 rounded-xl items-center mt-4 ${loading ? 'bg-blue-400' : 'bg-blue-600 shadow-lg shadow-blue-200'}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Save Transaction</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
