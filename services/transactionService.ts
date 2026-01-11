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
  color?: string;
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

export const subscribeToTransactions = (
  userId: string, 
  callback: (transactions: Transaction[]) => void, 
  limitCount: number = 20, 
  categoryFilter: string | null = null
) => {
  let isFromCache = true;
  const { limit } = require('firebase/firestore');

  const loadLocal = () => {
    storageService.getLocal(LOCAL_KEY).then((localData) => {
      if (localData) {
         let userTransactions = localData.filter((t: any) => t.userId === userId);
         
         if (categoryFilter && categoryFilter !== 'All') {
            userTransactions = userTransactions.filter((t: any) => t.category === categoryFilter);
         }

         const parsedData = userTransactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
        
        parsedData.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
        
        callback(parsedData.slice(0, limitCount));
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
  let q;
  if (categoryFilter && categoryFilter !== 'All') {
      q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('category', '==', categoryFilter),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
  } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
  }

  const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
    isFromCache = false;
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date && data.date.toDate ? data.date.toDate() : new Date(data.date) 
      };
    }) as Transaction[];
    
    // Save to local (start serializing dates as strings) - Merging strategy needed ideally, but overly complex for now. 
    // We will just update local cache with what we fetched if it's "All" request, otherwise skip cache update to avoid overwriting full list with filtered list.
    // Ideally we should merge. For now, let's only cache if NO filter is applied to keep simple.
    if (!categoryFilter || categoryFilter === 'All') {
        // We probably want to append/merge, but simpler: just don't overwrite if we are only fetching 5.
        // Actually, let's keep it simple: We rely on local save from 'addTransaction' primarily for offline. 
        // This subscription cache update is for syncing. 
        // Let's only update cache if we are fetching a reasonable amount or logic is robust.
        // For safely, let's skip cache over-write here to prevent data loss if we only fetch 5 items.
        // storageService.saveLocal(LOCAL_KEY, dataToSave); 
    }

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

export const deleteTransaction = async (id: string) => {
  // 1. Optimistic Local Delete
  await storageService.updateItemInList(LOCAL_KEY, { id, _deleted: true }); // Mark as deleted locally or remove
  // Better approach for array: get, filter, save. storageService.updateItemInList might not be designed for delete.
  // Let's implement a direct list manipulation for delete to be safe given current storageService
  
  const localData = await storageService.getLocal(LOCAL_KEY) || [];
  const newData = localData.filter((t: any) => t.id !== id);
  await storageService.saveLocal(LOCAL_KEY, newData);
  
  notifyListeners();

  // 2. Network Delete
  try {
    const { deleteDoc, doc } = require('firebase/firestore');
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.warn("Offline mode: Transaction delete failed remotely.", error);
    // TODO: Sync queue handling would go here
  }
};

export const updateTransaction = async (transaction: Transaction) => {
  if (!transaction.id) return;

  // 1. Optimistic Local Update
  // Ensure date is string for storage
  const localTransaction = {
    ...transaction,
    date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date
  };
  
  await storageService.updateItemInList(LOCAL_KEY, localTransaction);
  notifyListeners();

  // 2. Network Update
  try {
    const { updateDoc, doc } = require('firebase/firestore');
    const transactionRef = doc(db, COLLECTION_NAME, transaction.id);
    // Convert Date back to Timestamp or Date for Firestore
    const firestoreData = {
      ...transaction,
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date as any)
    };
    await updateDoc(transactionRef, firestoreData);
  } catch (error) {
    console.warn("Offline mode: Transaction update failed remotely.", error);
  }
};
