import { useAuth } from '@/context/AuthContext';
import { addSubscription, deleteSubscription, subscribeToSubscriptions, Subscription } from '@/services/subscriptionService';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSubscriptions(user.uid, setSubscriptions);
    return () => unsub();
  }, [user]);

  const handleAdd = async () => {
    if (!name || !amount || !dueDay || !user) {
        Alert.alert(t('common.error'), t('add.missing_fields'));
        return;
    }

    try {
        await addSubscription({
            userId: user.uid,
            name,
            amount: parseFloat(amount),
            dueDay: parseInt(dueDay),
            icon: 'credit-card'
        });
        setModalVisible(false);
        setName('');
        setAmount('');
        setDueDay('');
    } catch(e) {
        Alert.alert(t('common.error'), 'Failed to add subscription'); // 'Failed to add subscription' could be another key if needed or kept generic
    }
  };

  const handleDelete = (id: string) => {
      Alert.alert('Delete', 'Remove this subscription?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteSubscription(id) }
      ]);
  };

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <View className="flex-1 bg-gray-50">
       <Stack.Screen options={{ headerShown: false }} />
       <StatusBar barStyle="dark-content" />
       
       {/* Header */}
       <View className="pt-14 pb-6 px-6 bg-white border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
             <FontAwesome name="arrow-left" size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-800">{t('subscriptions.title')}</Text>
       </View>

       <ScrollView className="flex-1 px-6 pt-6">
           
           {/* Total Card */}
           <View className="bg-indigo-600 rounded-3xl p-6 mb-8 shadow-lg shadow-indigo-200">
              <Text className="text-indigo-100 font-medium mb-1">{t('subscriptions.total_monthly')}</Text>
              <Text className="text-white text-4xl font-bold">{totalMonthly.toFixed(2)} <Text className="text-xl">{t('common.dh')}</Text></Text>
           </View>

           <Text className="text-lg font-bold text-slate-800 mb-4">{t('subscriptions.your_subscriptions')}</Text>
           
           {subscriptions.map(sub => (
               <View key={sub.id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm flex-row justify-between items-center border border-gray-100">
                  <View className="flex-row items-center gap-4">
                      <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center">
                          <FontAwesome name="credit-card" size={20} color="#4F46E5" />
                      </View>
                      <View>
                          <Text className="font-bold text-slate-800 text-lg">{sub.name}</Text>
                          <Text className="text-slate-500 text-sm">{t('subscriptions.due_day', { day: sub.dueDay })}</Text>
                      </View>
                  </View>
                  <View className="items-end">
                      <Text className="font-bold text-slate-800 text-lg">{sub.amount} DH</Text>
                      <TouchableOpacity onPress={() => sub.id && handleDelete(sub.id)}>
                          <Text className="text-red-500 text-xs font-medium mt-1">{t('common.remove')}</Text>
                      </TouchableOpacity>
                  </View>
               </View>
           ))}
           
           {subscriptions.length === 0 && (
               <Text className="text-center text-slate-400 mt-10">{t('subscriptions.no_subscriptions')}</Text>
           )}

       </ScrollView>

       {/* FAB */}
       <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          className="absolute bottom-10 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg shadow-indigo-400"
       >
          <FontAwesome name="plus" size={24} color="white" />
       </TouchableOpacity>

       {/* Add Modal */}
       <Modal visible={modalVisible} animationType="slide" transparent>
           <View className="flex-1 justify-end bg-black/50">
               <View className="bg-white rounded-t-3xl p-6 h-[60%]">
                   <View className="flex-row justify-between items-center mb-6">
                       <Text className="text-2xl font-bold text-slate-800">{t('subscriptions.add_title')}</Text>
                       <TouchableOpacity onPress={() => setModalVisible(false)}>
                           <FontAwesome name="times" size={24} color="#94A3B8" />
                       </TouchableOpacity>
                   </View>

                   <ScrollView>
                       <Text className="text-slate-600 font-medium mb-2">{t('subscriptions.service_name')}</Text>
                       <TextInput 
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-4"
                          placeholder="Netflix, Rent, Gym..."
                          value={name}
                          onChangeText={setName}
                       />

                       <Text className="text-slate-600 font-medium mb-2">{t('subscriptions.monthly_amount')}</Text>
                       <TextInput 
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-4"
                          placeholder="0.00"
                          keyboardType="numeric"
                          value={amount}
                          onChangeText={setAmount}
                       />

                        <Text className="text-slate-600 font-medium mb-2">{t('subscriptions.day_of_month')}</Text>
                       <TextInput 
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-8"
                          placeholder="1 - 31"
                          keyboardType="numeric"
                          value={dueDay}
                          onChangeText={setDueDay}
                       />

                       <TouchableOpacity 
                           onPress={handleAdd}
                           className="bg-indigo-600 p-4 rounded-xl items-center shadow-md shadow-indigo-200"
                        >
                           <Text className="text-white font-bold text-lg">{t('subscriptions.save_button')}</Text>
                       </TouchableOpacity>
                   </ScrollView>
               </View>
           </View>
       </Modal>
    </View>
  );
}
