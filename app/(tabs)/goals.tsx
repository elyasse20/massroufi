import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <FontAwesome name="bullseye" size={20} color="#6366F1" />
          </View>
          <View style={{flex: 1}}>
             <Text style={styles.goalName}>{item.name}</Text>
             <Text style={styles.goalTarget}>Target: {item.targetAmount} DH</Text>
          </View>
          <TouchableOpacity onPress={() => handleAddFunds(item)} style={styles.addButtonSmall}>
             <FontAwesome name="plus" size={12} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressTextRow}>
            <Text style={styles.savedAmount}>{item.savedAmount} DH</Text>
            <Text style={styles.percentage}>{percentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: `${percentage}%` }]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
           <Text style={styles.title}>Financial Goals</Text>
           <Text style={styles.subtitle}>Track your dreams</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <LinearGradient
            colors={['#4F46E5', '#3B82F6']}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
             <FontAwesome name="plus" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
               <FontAwesome name="flag-o" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyText}>No goals set yet.</Text>
            <Text style={styles.emptySubText}>Start saving for something special!</Text>
          </View>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>New Goal</Text>
            <Text style={styles.modalSubtitle}>What are you saving for?</Text>
            
            <View style={styles.inputContainer}>
              <FontAwesome name="tag" size={16} color="#94A3B8" style={{marginRight: 10}} />
              <TextInput
                style={styles.input}
                placeholder="Goal Name (e.g. Travel)"
                placeholderTextColor="#94A3B8"
                value={newGoalName}
                onChangeText={setNewGoalName}
              />
            </View>
            
            <View style={styles.inputContainer}>
               <FontAwesome name="money" size={16} color="#94A3B8" style={{marginRight: 10}} />
              <TextInput
                style={styles.input}
                placeholder="Target Amount (DH)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newGoalTarget}
                onChangeText={setNewGoalTarget}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.buttonCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonSave}
                onPress={handleAddGoal}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4F46E5', '#3B82F6']}
                  style={styles.buttonSaveGradient}
                >
                  <Text style={styles.buttonSaveText}>Create Goal</Text>
                </LinearGradient>
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
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  goalTarget: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addButtonSmall: {
    width: 28,
    height: 28,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  savedAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  buttonCancel: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  buttonCancelText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonSave: {
    flex: 1,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonSaveText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
