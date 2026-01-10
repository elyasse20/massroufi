import { Timestamp, addDoc, collection, doc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { storageService } from './storageService';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  userId: string;
  createdAt: any;
}

const COLLECTION_NAME = 'goals';
const LOCAL_KEY = 'user_goals';

export const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'savedAmount'>) => {
  // 1. Create a temporary local object (optimistic UI)
  const tempId = 'local_' + Date.now();
  const newGoal = {
    ...goal,
    id: tempId,
    savedAmount: 0,
    createdAt: new Date().toISOString(), // Use string for local storage compatibility
  };

  // 2. Save locally immediately
  await storageService.addItemToList(LOCAL_KEY, newGoal);

  // 3. Try to save to Firestore
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...goal,
      savedAmount: 0,
      createdAt: Timestamp.now(),
    });
    
    // 4. If successful, update the local item with the real ID
    await storageService.updateItemInList(LOCAL_KEY, { ...newGoal, id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.warn("Offline mode: Goal saved locally only for now.", error);
    // TODO: Add to a sync queue for later retry
    return tempId;
  }
};

export const subscribeToGoals = (userId: string, callback: (goals: Goal[]) => void) => {
  let isFromCache = true;

  // 1. Load from local storage first (Instant UI)
  storageService.getLocal(LOCAL_KEY).then((localData) => {
    if (localData && isFromCache) {
      callback(localData);
    }
  });

  // 2. Subscribe to Firestore (Source of Truth)
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    isFromCache = false; // Network data arrived, stop relying solely on cache
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    
    // 3. Update local cache with fresh data
    storageService.saveLocal(LOCAL_KEY, goals);
    callback(goals);
  }, (error) => {
    console.log("Firestore offline, sticking to local data.");
  });
};

export const updateGoalProgress = async (goalId: string, amountToAdd: number) => {
  // 1. Optimistic Update
  const goals = await storageService.getLocal(LOCAL_KEY) || [];
  const goalIndex = goals.findIndex((g: Goal) => g.id === goalId);
  
  if (goalIndex !== -1) {
    goals[goalIndex].savedAmount += amountToAdd;
    await storageService.saveLocal(LOCAL_KEY, goals);
  }

  // 2. Firestore Update
  try {
    const goalRef = doc(db, COLLECTION_NAME, goalId);
    await updateDoc(goalRef, {
      savedAmount: increment(amountToAdd)
    });
  } catch (error) {
    console.warn("Offline mode: Progress saved locally.", error);
    // TODO: Add to sync queue
  }
};
