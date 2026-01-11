import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Subscription {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  icon?: string;
}

const COLLECTION_NAME = 'subscriptions';

export const subscribeToSubscriptions = (userId: string, callback: (subs: Subscription[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
    callback(data);
  });
};

export const addSubscription = async (sub: Subscription) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sub);
    return docRef.id;
  } catch (e) {
    console.error("Error adding subscription", e);
    throw e;
  }
};

export const deleteSubscription = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.error("Error deleting subscription", e);
    throw e;
  }
};
