import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  budget: number;
}

export const setUserBudget = async (userId: string, budget: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { budget }, { merge: true });
  } catch (error) {
    console.error("Error setting budget: ", error);
    throw error;
  }
};

export const getUserBudget = async (userId: string): Promise<number | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data().budget || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting budget: ", error);
    return null;
  }
};
