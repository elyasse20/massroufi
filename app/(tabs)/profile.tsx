import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Alert, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getUserBudget, setUserBudget } from '../../services/userService';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [budget, setBudget] = useState('');
  const [loadingBudget, setLoadingBudget] = useState(false);

  useEffect(() => {
    if (user) {
      loadBudget();
    }
  }, [user]);

  const loadBudget = async () => {
    if (!user) return;
    const b = await getUserBudget(user.uid);
    if (b) setBudget(b.toString());
  };

  const saveBudget = async () => {
    if (!user) return;
    setLoadingBudget(true);
    try {
      await setUserBudget(user.uid, parseFloat(budget));
      Alert.alert('Success', 'Monthly budget updated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update budget');
    } finally {
      setLoadingBudget(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert("Error", "Failed to sign out");
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900 p-6">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View className="pt-10 mb-8 items-center">
        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
          <Text className="text-3xl text-blue-600 font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {user?.email?.split('@')[0]}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400">
          {user?.email}
        </Text>
      </View>

      {/* Budget Section */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-4 uppercase text-xs tracking-wider">
          Monthly Budget
        </Text>
        <View className="flex-row items-center space-x-2">
            <TextInput 
              className="flex-1 bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-lg text-gray-900 dark:text-white"
              placeholder="Enter monthly limit (DH)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />
            <TouchableOpacity 
              onPress={saveBudget}
              disabled={loadingBudget}
              className="bg-blue-600 p-3 rounded-lg"
            >
              <Text className="text-white font-bold">Save</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* Settings Section */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
        <Text className="text-gray-500 dark:text-gray-400 font-bold mb-4 uppercase text-xs tracking-wider">
          Settings
        </Text>
        
        <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg items-center justify-center mr-3">
              <FontAwesome name="moon-o" size={16} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </View>
            <Text className="text-gray-900 dark:text-white font-medium text-lg">Dark Mode</Text>
          </View>
          <Switch 
            value={colorScheme === 'dark'} 
            onValueChange={toggleColorScheme}
            trackColor={{ false: "#767577", true: "#2563EB" }}
            thumbColor={colorScheme === 'dark' ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity className="flex-row items-center py-4 mt-2">
           <View className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg items-center justify-center mr-3">
              <FontAwesome name="bell-o" size={16} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </View>
           <Text className="text-gray-900 dark:text-white font-medium text-lg">Notifications</Text>
           <FontAwesome name="angle-right" size={20} color="gray" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
        <TouchableOpacity 
          onPress={handleSignOut}
          className="flex-row items-center py-2"
        >
          <View className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center mr-3">
            <FontAwesome name="sign-out" size={16} color="#DC2626" />
          </View>
          <Text className="text-red-600 font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <View className="mt-auto items-center">
        <Text className="text-gray-400 text-sm">Massroufi v1.0.0</Text>
      </View>

    </View>
  );
}
