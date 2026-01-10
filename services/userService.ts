import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { storageService } from './storageService';

export interface UserProfile {
  budget: number;
}

const LOCAL_KEY = 'user_budget';

export const setUserBudget = async (userId: string, budget: number) => {
  // 1. Save Local
  await storageService.saveLocal(LOCAL_KEY + '_' + userId, budget);

  // 2. Save Network
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { budget }, { merge: true });
  } catch (error) {
    console.warn("Offline mode: Budget saved locally.", error);
  }
};

export const getUserBudget = async (userId: string): Promise<number | null> => {
  const key = LOCAL_KEY + '_' + userId;
  
  // 1. Try Local first
  const localBudget = await storageService.getLocal(key);
  
  // 2. We return local immediately if exists, but we also want to refresh from network
  // Since this function returns a Promise<number>, we can't emit twice easily without callback.
  // For now, let's return local if available, otherwise wait for network.
  // Ideally, this should also be a subscription or we just optimize for "fast load".
  
  if (localBudget !== null) {
    // Fire and forget network refresh to keep cache updated for next time? 
    // Or just rely on local. Let's try to fetch network to update cache in background.
    getDoc(doc(db, 'users', userId)).then(snap => {
      if (snap.exists()) {
        const val = snap.data().budget;
        storageService.saveLocal(key, val);
      }
    }).catch(err => console.log("Budget refresh failed", err));

    return Number(localBudget);
  }

  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const val = docSnap.data().budget;
      storageService.saveLocal(key, val);
      return val || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting budget: ", error);
    return null;
  }
};
