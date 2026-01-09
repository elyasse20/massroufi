import { addDoc, collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Transaction {
  id?: string;
  amount: number;
  category: string;
  date: Timestamp | Date;
  description: string;
  userId: string;
  type: 'expense' | 'income';
}

const COLLECTION_NAME = 'transactions';

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), transaction);
    return docRef.id;
  } catch (error) {
    console.error("Error adding transaction: ", error);
    throw error;
  }
};

export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    callback(transactions);
  });
};

export const getMonthlyExpenses = async (userId: string): Promise<number> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startOfMonth)),
    where('date', '<=', Timestamp.fromDate(endOfMonth))
  );

  // Note: getDocs is better for one-time calculation
  const { getDocs } = require('firebase/firestore'); 
  const querySnapshot = await getDocs(q);

  let total = 0;
  querySnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.type === 'expense' || !data.type) {
      total += data.amount;
    }
  });

  return total;
};
