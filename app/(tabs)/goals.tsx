import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Timestamp } from 'firebase/firestore';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Goal, addGoal, deleteGoal, subscribeToGoals, updateGoal, updateGoalProgress } from '../../services/goalsService';
import { addTransaction } from '../../services/transactionService';

export default function GoalsScreen() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const [addFundsModalVisible, setAddFundsModalVisible] = useState(false);
  const [goalToAddFunds, setGoalToAddFunds] = useState<Goal | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');

  // Celebration State
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebratedGoal, setCelebratedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToGoals(user.uid, (data) => {
      setGoals(data);
    });
    return () => unsubscribe();
  }, [user]);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const handleSaveGoal = async () => {
    if (!newGoalName || !newGoalTarget) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      if (editingGoal) {
        // Update existing
        await updateGoal(editingGoal.id, {
          name: newGoalName,
          targetAmount: parseFloat(newGoalTarget),
        });
        
        // Manual Optimistic Update
        setGoals(prev => prev.map(g => 
          g.id === editingGoal.id 
            ? { ...g, name: newGoalName, targetAmount: parseFloat(newGoalTarget) } 
            : g
        ));

        showToast('Goal updated successfully! 🎉');
      } else {
        // Create new
        const newId = await addGoal({
          name: newGoalName,
          targetAmount: parseFloat(newGoalTarget),
          userId: user.uid,
        });
        
        // Manual Optimistic Update (addGoal already returns ID)
        const newGoalObj: Goal = {
          id: newId || 'temp_' + Date.now(),
          name: newGoalName,
          targetAmount: parseFloat(newGoalTarget),
          savedAmount: 0,
          userId: user.uid,
          createdAt: new Date().toISOString()
        };
        setGoals(prev => [newGoalObj, ...prev]);

        showToast('New goal created! 🚀');
      }
      
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewGoalName('');
    setNewGoalTarget('');
    setEditingGoal(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoalName(goal.name);
    setNewGoalTarget(goal.targetAmount.toString());
    setModalVisible(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      await deleteGoal(goalToDelete.id);
      
      // Manual Optimistic Update
      setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));

      showToast('Goal deleted.', 'error');
      setDeleteModalVisible(false);
      setGoalToDelete(null);
    } catch (e) {
      Alert.alert("Error", "Could not delete goal");
    }
  };

  const handleAddFunds = (goal: Goal) => {
    setGoalToAddFunds(goal);
    setAddFundsAmount('');
    setAddFundsModalVisible(true);
  };

  const confirmAddFunds = async () => {
    if (!goalToAddFunds || !addFundsAmount || isNaN(parseFloat(addFundsAmount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const amount = parseFloat(addFundsAmount);
    try {
      if (!user) return;

      await updateGoalProgress(goalToAddFunds.id, amount);
      
      // Auto-deduct from balance by creating an expense
      await addTransaction({
        amount: amount,
        category: 'Savings',
        date: Timestamp.now(),
        description: `Transfer to Goal: ${goalToAddFunds.name}`,
        userId: user.uid,
        type: 'expense'
      });
      
      // Manual Optimistic Update
      setGoals(prev => prev.map(g => 
        g.id === goalToAddFunds.id 
          ? { ...g, savedAmount: g.savedAmount + amount } 
          : g
      ));

      showToast(`Added ${amount} DH to ${goalToAddFunds.name}! 💰`);
      
      // Check for completion
      if (goalToAddFunds.savedAmount + amount >= goalToAddFunds.targetAmount) {
          setCelebratedGoal(goalToAddFunds);
          setCelebrationVisible(true);
      }

      setAddFundsModalVisible(false);
      setGoalToAddFunds(null);
      setAddFundsAmount('');
    } catch (error) {
      Alert.alert("Error", "Failed to update progress");
    }
  };

  const renderItem = ({ item }: { item: Goal }) => {
    const progress = Math.min(item.savedAmount / item.targetAmount, 1);
    const percentage = Math.round(progress * 100);

    const isCompleted = item.savedAmount >= item.targetAmount;

    return (
      <View style={[styles.card, isCompleted && styles.cardCompleted]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, isCompleted && styles.iconContainerCompleted]}>
            <FontAwesome name={isCompleted ? "trophy" : "bullseye"} size={20} color={isCompleted ? "#D97706" : "#6366F1"} />
          </View>
          <View style={{flex: 1, marginRight: 8}}>
             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.goalName}>{item.name}</Text>
                {isCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>Completed</Text>
                    </View>
                )}
             </View>
             <Text style={styles.goalTarget}>Target: {item.targetAmount} DH</Text>
          </View>
          
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
              <FontAwesome name="pencil" size={14} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteGoal(item)} style={styles.actionButton}>
              <FontAwesome name="trash" size={14} color="#EF4444" />
            </TouchableOpacity>
            {!isCompleted && (
                <TouchableOpacity onPress={() => handleAddFunds(item)} style={[styles.addButtonSmall, {marginLeft: 4}]}>
                   <FontAwesome name="plus" size={12} color="white" />
                </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressTextRow}>
            <Text style={[styles.savedAmount, isCompleted && {color: '#D97706'}]}>{item.savedAmount} DH</Text>
            <Text style={[styles.percentage, isCompleted && {color: '#D97706'}]}>{percentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={isCompleted ? ['#F59E0B', '#D97706'] : ['#6366F1', '#8B5CF6']}
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
      {/* Toast Notification */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <FontAwesome name={toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} size={20} color="white" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
           <Text style={styles.title}>Financial Goals</Text>
           <Text style={styles.subtitle}>Track your dreams</Text>
        </View>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
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
            <Text style={styles.modalTitle}>{editingGoal ? 'Edit Goal' : 'New Goal'}</Text>
            <Text style={styles.modalSubtitle}>{editingGoal ? 'Update your goal details' : 'What are you saving for?'}</Text>
            
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
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonSave}
                onPress={handleSaveGoal}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4F46E5', '#3B82F6']}
                  style={styles.buttonSaveGradient}
                >
                  <Text style={styles.buttonSaveText}>{editingGoal ? 'Update Goal' : 'Create Goal'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { borderLeftWidth: 6, borderLeftColor: '#EF4444' }]}>
            <View style={{alignItems: 'center', marginBottom: 16}}>
               <View style={{width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 12}}>
                  <FontAwesome name="trash" size={24} color="#EF4444" />
               </View>
               <Text style={styles.modalTitle}>Delete Goal</Text>
               <Text style={styles.modalSubtitle}>
                 Are you sure you want to delete <Text style={{fontWeight: 'bold', color: '#1E293B'}}>"{goalToDelete?.name}"</Text>?{' \n'}
                 This action cannot be undone.
               </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.buttonCancel}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonSave, { shadowColor: '#EF4444' }]}
                onPress={confirmDelete}
              >
                <View
                  style={[styles.buttonSaveGradient, { backgroundColor: '#EF4444' }]}
                >
                  <Text style={styles.buttonSaveText}>Delete</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addFundsModalVisible}
        onRequestClose={() => setAddFundsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { borderLeftWidth: 6, borderLeftColor: '#10B981' }]}>
            <Text style={styles.modalTitle}>Add Funds</Text>
            <Text style={styles.modalSubtitle}>Add money to "{goalToAddFunds?.name}"</Text>
            
            <View style={styles.inputContainer}>
              <FontAwesome name="money" size={16} color="#94A3B8" style={{marginRight: 10}} />
              <TextInput
                style={styles.input}
                placeholder="Amount to add (DH)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={addFundsAmount}
                onChangeText={setAddFundsAmount}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.buttonCancel}
                onPress={() => {
                  setAddFundsModalVisible(false);
                  setAddFundsAmount('');
                }}
              >
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonSave}
                onPress={confirmAddFunds}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.buttonSaveGradient}
                >
                  <Text style={styles.buttonSaveText}>Add Funds</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Celebration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={celebrationVisible}
        onRequestClose={() => setCelebrationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: '#F0F9FF', borderColor: '#3B82F6', borderWidth: 2 }]}>
            <View style={{ alignItems: 'center' }}>
               <Text style={{ fontSize: 60, marginBottom: 10 }}>🎉🏆🎉</Text>
               <Text style={[styles.modalTitle, { color: '#2563EB', fontSize: 26 }]}>CONGRATULATIONS!</Text>
               <Text style={[styles.modalSubtitle, { marginBottom: 20 }]}>
                 You've reached your goal:
               </Text>
               <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 20, textAlign: 'center' }}>
                 "{celebratedGoal?.name}"
               </Text>
               <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 30 }}>
                  Fantastic job! Your hard work has paid off. Time to enjoy the reward! 🌟
               </Text>

                <TouchableOpacity
                  style={[styles.buttonSave, { width: '100%', marginTop: 10 }]}
                  onPress={() => setCelebrationVisible(false)}
                >
                  <LinearGradient
                     colors={['#FBBF24', '#B45309']} 
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                     style={[styles.buttonSaveGradient, { paddingVertical: 16 }]}
                  >
                     <Text style={[
                       styles.buttonSaveText, 
                       { 
                         fontSize: 20, 
                         fontWeight: 'bold',
                         textTransform: 'uppercase', 
                         letterSpacing: 2,
                         color: '#FFFFFF',
                         zIndex: 10,
                         elevation: 5 // Ensure text is above gradient on Android
                       }
                     ]}>Awesome!</Text>
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
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 100,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  toastSuccess: {
    backgroundColor: '#10B981', // Emerald 500
  },
  toastError: {
    backgroundColor: '#EF4444', // Red 500
  },
  toastText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 12,
    fontSize: 15,
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
  cardCompleted: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFBEB', // Light yellow hint
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
  iconContainerCompleted: {
    backgroundColor: '#FEF3C7',
  },
  completedBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  actionButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F1F5F9',
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
