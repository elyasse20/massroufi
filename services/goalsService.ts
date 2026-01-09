import { Timestamp, addDoc, collection, doc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  userId: string;
  createdAt: any;
}

const COLLECTION_NAME = 'goals';

export const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'savedAmount'>) => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      ...goal,
      savedAmount: 0,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding goal: ", error);
    throw error;
  }
};

export const subscribeToGoals = (userId: string, callback: (goals: Goal[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    callback(goals);
  });
};

export const updateGoalProgress = async (goalId: string, amountToAdd: number) => {
  try {
    const goalRef = doc(db, COLLECTION_NAME, goalId);
    await updateDoc(goalRef, {
      savedAmount: increment(amountToAdd)
    });
  } catch (error) {
    console.error("Error updating goal: ", error);
    throw error;
  }
};
