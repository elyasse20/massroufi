import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { useExpenses } from '../../context/ExpenseContext';

const screenWidth = Dimensions.get('window').width;

export default function GoalsScreen() {
  const { goals, addGoal, deleteGoal, updateGoal } = useExpenses();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // State for adding savings
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');

  // Statistics
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const globalProgress = totalTarget > 0 ? totalSaved / totalTarget : 0;

  const handleAddGoal = () => {
    if (title && target) {
      const date = deadline ? new Date(deadline) : undefined;
      // Simple validation for date string YYYY-MM-DD
      addGoal({
        title,
        targetAmount: parseFloat(target),
        deadline: date,
      });
      setTitle('');
      setTarget('');
      setDeadline('');
      setIsAdding(false);
    }
  };

  const handleAddSavings = () => {
      if (selectedGoalId && savingsAmount) {
          const goal = goals.find(g => g.id === selectedGoalId);
          if (goal) {
              const toAdd = parseFloat(savingsAmount);
              updateGoal(selectedGoalId, { savedAmount: goal.savedAmount + toAdd });
          }
          setSavingsAmount('');
          setSelectedGoalId(null);
      }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header Stats */}
        <View className="bg-white dark:bg-slate-800 rounded-b-3xl p-6 shadow-sm mb-6">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Objectifs 🎯</Text>
            <View className="flex-row items-center justify-between">
                <View>
                    <Text className="text-gray-500 dark:text-gray-400 mb-1">Total Épargné</Text>
                    <Text className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalSaved.toFixed(0)} <Text className="text-xl text-gray-400">DH</Text></Text>
                    <Text className="text-gray-400 text-xs mt-1">sur {totalTarget.toFixed(0)} DH</Text>
                </View>
                <ProgressChart
                    data={{
                        labels: ["Progression"],
                        data: [globalProgress > 1 ? 1 : globalProgress]
                    }}
                    width={100}
                    height={100}
                    strokeWidth={10}
                    radius={32}
                    chartConfig={{
                        backgroundGradientFrom: "#1E293B",
                        backgroundGradientFromOpacity: 0,
                        backgroundGradientTo: "#08130D",
                        backgroundGradientToOpacity: 0,
                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                        strokeWidth: 2,
                        barPercentage: 0.5,
                        useShadowColorFromDataset: false 
                    }}
                    hideLegend={true}
                />
            </View>
        </View>

        {/* Goals List */}
        <View className="px-6 gap-6 mb-8">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0;
            return (
                <View key={goal.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">{goal.title}</Text>
                            {goal.deadline && (
                                <View className="flex-row items-center">
                                    <FontAwesome name="clock-o" size={12} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-xs ml-1">
                                        {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => deleteGoal(goal.id)} className="p-2">
                             <FontAwesome name="trash-o" size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                    
                    <View className="flex-row items-end justify-between mb-2">
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white">{goal.savedAmount.toFixed(0)} <Text className="text-base text-gray-400 font-normal">/ {goal.targetAmount} DH</Text></Text>
                        <Text className="font-bold text-blue-600">{(progress * 100).toFixed(0)}%</Text>
                    </View>
                    
                    <View className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                        <View 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(progress * 100, 100)}%`, backgroundColor: goal.color || '#2563EB' }} 
                        />
                    </View>

                    <TouchableOpacity 
                        className="bg-blue-50 dark:bg-blue-900/20 py-3 rounded-xl items-center flex-row justify-center border border-blue-100 dark:border-blue-800"
                        onPress={() => setSelectedGoalId(goal.id)}
                    >
                        <FontAwesome name="plus-circle" size={16} color="#2563EB" />
                        <Text className="font-bold text-blue-600 ml-2">Ajouter une épargne</Text>
                    </TouchableOpacity>
                </View>
            );
          })}
          
          {goals.length === 0 && (
             <View className="items-center py-10">
                 <FontAwesome name="trophy" size={50} color="#E5E7EB" />
                 <Text className="text-gray-500 mt-4 text-center">Aucun objectif. Fixez-en un pour commencer à épargner !</Text>
             </View>
          )}
        </View>

        {/* Add Goal Toggle */}
        {!isAdding && (
             <TouchableOpacity 
                className="mx-6 bg-gray-900 dark:bg-blue-600 p-4 rounded-2xl items-center flex-row justify-center shadow-lg"
                onPress={() => setIsAdding(true)}
             >
                <FontAwesome name="plus" size={18} color="white" />
                <Text className="font-bold text-white ml-2">Nouvel Objectif</Text>
             </TouchableOpacity>
        )}

        {/* Add Goal Form (Inline) */}
        {isAdding && (
          <View className="mx-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-blue-100 dark:border-blue-900 mb-10">
            <Text className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Créer un objectif</Text>
            
            <Text className="text-gray-500 mb-2 font-medium">Titre</Text>
            <TextInput
              className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
              placeholder="Ex: PC Gamer"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            <Text className="text-gray-500 mb-2 font-medium">Montant Cible (DH)</Text>
            <TextInput
              className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
              placeholder="5000"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={target}
              onChangeText={setTarget}
            />

            <Text className="text-gray-500 mb-2 font-medium">Date limite (Optionnel YYYY-MM-DD)</Text>
            <TextInput
              className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-6 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
              placeholder="2024-12-31"
              placeholderTextColor="#9CA3AF"
              value={deadline}
              onChangeText={setDeadline}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-gray-100 dark:bg-slate-700 p-4 rounded-xl items-center"
                onPress={() => setIsAdding(false)}
              >
                <Text className="font-bold text-gray-700 dark:text-gray-300">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-blue-600 p-4 rounded-xl items-center shadow-md shadow-blue-300"
                onPress={handleAddGoal}
              >
                <Text className="font-bold text-white">Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Savings Modal */}
      <Modal
        visible={!!selectedGoalId}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGoalId(null)}
      >
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
              <View className="bg-white dark:bg-slate-800 w-full max-w-sm p-6 rounded-3xl shadow-2xl">
                  <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Ajouter une épargne</Text>
                  <Text className="text-gray-500 text-center mb-6">Combien voulez-vous mettre de côté ?</Text>
                  
                  <View className="flex-row items-center justify-center border-b-2 border-blue-500 mb-8 pb-2">
                    <TextInput 
                        className="text-4xl font-bold text-gray-900 dark:text-white p-2 text-center min-w-[100px]"
                        value={savingsAmount}
                        onChangeText={setSavingsAmount}
                        keyboardType="numeric"
                        autoFocus
                        placeholder="0"
                        placeholderTextColor="#D1D5DB"
                    />
                    <Text className="text-2xl font-bold text-gray-400 ml-2">DH</Text>
                </View>

                <TouchableOpacity 
                    className="bg-blue-600 w-full py-4 rounded-xl items-center mb-3"
                    onPress={handleAddSavings}
                >
                    <Text className="text-white font-bold text-lg">Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    className="py-3 items-center"
                    onPress={() => setSelectedGoalId(null)}
                >
                    <Text className="text-gray-500 font-semibold">Annuler</Text>
                </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
}
