import { addDoc, collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { storageService } from './storageService';

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
const LOCAL_KEY = 'user_transactions';

const listeners: (() => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(l => l());
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  // 1. Optimistic Local Save
  const tempId = 'local_' + Date.now();
  // Ensure date is serializable for AsyncStorage
  const localTransaction = {
    ...transaction,
    id: tempId,
    date: transaction.date instanceof Date ? transaction.date.toISOString() : new Date().toISOString()
  };

  await storageService.addItemToList(LOCAL_KEY, localTransaction);
  notifyListeners(); // Notify listeners of local change

  // 2. Network Save
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), transaction);
    // Update local with real ID
    await storageService.updateItemInList(LOCAL_KEY, { ...localTransaction, id: docRef.id });
    notifyListeners(); // Notify again with real ID
    return docRef.id;
  } catch (error) {
    console.warn("Offline mode: Transaction saved locally.", error);
    // TODO: Sync queue
    return tempId;
  }
};

export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
  let isFromCache = true;

  const loadLocal = () => {
    storageService.getLocal(LOCAL_KEY).then((localData) => {
      // Create a Map to deduplicate based on ID, preferring newer/synced data
      // Actually, simple strategy: use list. Filter by userId potentially if we store all users together (but usually per device is one user)
      // For now assume key is shared or filtered. The query filters by userId. 
      // LOCAL_KEY is generic 'user_transactions'. Let's assume it only stores current user's data or we filter.
      if (localData) {
         // Filter for current user just in case
         const userTransactions = localData.filter((t: any) => t.userId === userId);
         
         const parsedData = userTransactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
        // Sort
        parsedData.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
        
        callback(parsedData);
      }
    });
  };

  // 1. Load Local Initial
  loadLocal();

  // 2. Subscribe to local events
  const onLocalChange = () => {
      if(isFromCache) {
          loadLocal();
      }
  };
  listeners.push(onLocalChange);

  // 3. Subscribe Firestore
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
    isFromCache = false;
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Firestore timestamps need conversion if we want consistent Date objects across app
        date: data.date && data.date.toDate ? data.date.toDate() : new Date(data.date) 
      };
    }) as Transaction[];
    
    // Save to local (start serializing dates as strings)
    const dataToSave = transactions.map(t => ({
      ...t,
      date: (t.date as Date).toISOString()
    }));
    storageService.saveLocal(LOCAL_KEY, dataToSave);

    callback(transactions);
  }, (error) => {
    console.log("Firestore offline (transactions), sticking to cache.");
  });

  return () => {
    unsubscribeFirestore();
    const index = listeners.indexOf(onLocalChange);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
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
