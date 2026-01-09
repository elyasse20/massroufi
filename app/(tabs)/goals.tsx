import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Goal, addGoal, subscribeToGoals, updateGoalProgress } from '../../services/goalsService';

export default function GoalsScreen() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToGoals(user.uid, (data) => {
      setGoals(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddGoal = async () => {
    if (!newGoalName || !newGoalTarget) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      await addGoal({
        name: newGoalName,
        targetAmount: parseFloat(newGoalTarget),
        userId: user.uid,
      });
      setModalVisible(false);
      setNewGoalName('');
      setNewGoalTarget('');
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add goal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = (goal: Goal) => {
    Alert.prompt(
      "Add Funds",
      `Add money to ${goal.name}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: async (amount) => {
            if (amount && !isNaN(parseFloat(amount))) {
              try {
                await updateGoalProgress(goal.id, parseFloat(amount));
              } catch (error) {
                Alert.alert("Error", "Failed to update progress");
              }
            }
          }
        }
      ],
      "plain-text",
      ""
    );
  };

  const renderItem = ({ item }: { item: Goal }) => {
    const progress = Math.min(item.savedAmount / item.targetAmount, 1);
    const percentage = Math.round(progress * 100);

    return (
      <View style={styles.card} className="bg-white dark:bg-slate-800 shadow-sm">
        <View style={styles.cardHeader}>
          <Text style={styles.goalName} className="text-gray-900 dark:text-white">{item.name}</Text>
          <Text style={styles.goalTarget} className="text-gray-500 dark:text-gray-400">
            {item.savedAmount} / {item.targetAmount} DH
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: percentage >= 100 ? '#10B981' : '#3B82F6' }]} />
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.percentage} className="text-blue-600 dark:text-blue-400">{percentage}%</Text>
          <TouchableOpacity onPress={() => handleAddFunds(item)}>
             <FontAwesome name="plus-circle" size={28} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} className="bg-gray-50 dark:bg-slate-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.title} className="text-gray-900 dark:text-white">Financial Goals</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <FontAwesome name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText} className="text-gray-400">No goals yet. Start saving!</Text>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView} className="bg-white dark:bg-slate-800">
            <Text style={styles.modalTitle} className="text-gray-900 dark:text-white">New Goal</Text>
            
            <TextInput
              style={styles.input}
              className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Goal Name (e.g. Laptop)"
              placeholderTextColor="#9CA3AF"
              value={newGoalName}
              onChangeText={setNewGoalName}
            />
            
            <TextInput
              style={styles.input}
              className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Target Amount (DH)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleAddGoal}
                disabled={loading}
              >
                <Text style={styles.textStyle}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalTarget: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: '45%',
    alignItems: 'center',
  },
  buttonClose: {
    backgroundColor: '#EF4444',
  },
  buttonSave: {
    backgroundColor: '#2563EB',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
