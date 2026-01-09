import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: Date;
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: Date; // Added this based on usage in goals screen
}

interface ExpenseContextType {
  expenses: Expense[];
  goals: Goal[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'savedAmount'>) => void;
  deleteExpense: (id: string) => void;
  deleteGoal: (id: string) => void;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id'>>) => void;
  totalExpenses: number;
  balance: number;
  setIncome: (amount: number) => void;
  income: number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [income, setIncomeState] = useState(2000);
  const [isLoading, setIsLoading] = useState(true);

  // Load Income separately as a single document/setting
  // For simplicity using a 'settings' collection and 'user' doc
  useEffect(() => {
    const incomeRef = doc(db, 'settings', 'user_income');
    const unsubscribe = onSnapshot(incomeRef, (docSnap) => {
        if (docSnap.exists()) {
            setIncomeState(docSnap.data().amount);
        } else {
             // Create default if not exists
             setDoc(incomeRef, { amount: 2000 });
        }
    });
    return () => unsubscribe();
  }, []);

  // Sync Expenses
  useEffect(() => {
    const expensesRef = collection(db, 'expenses');
    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const loadedExpenses: Expense[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          categoryId: data.categoryId,
          // Firestore stores dates as Timestamp
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date), 
          note: data.note
        } as Expense;
      });
      // Sort by date desc
      loadedExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
      setExpenses(loadedExpenses);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Goals
  useEffect(() => {
    const goalsRef = collection(db, 'goals');
    const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
      const loadedGoals: Goal[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              title: data.title,
              targetAmount: data.targetAmount,
              savedAmount: data.savedAmount,
              deadline: data.deadline?.toDate ? data.deadline.toDate() : (data.deadline ? new Date(data.deadline) : undefined)
          } as Goal;
      });
      setGoals(loadedGoals);
    });
    return () => unsubscribe();
  }, []);


  const setIncome = async (amount: number) => {
      // Optimistic update
      setIncomeState(amount); 
      // Update in DB
      try {
          await setDoc(doc(db, 'settings', 'user_income'), { amount });
      } catch (e) {
          console.error("Error setting income:", e);
      }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'date'>) => {
    try {
        await addDoc(collection(db, 'expenses'), {
            ...expenseData,
            date: new Date(), // This will be stored as Timestamp by default or we can force it
        });
    } catch (e) {
        console.error("Error adding expense:", e);
    }
  };

  const deleteExpense = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'expenses', id));
      } catch (e) {
          console.error("Error deleting expense:", e);
      }
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'savedAmount'>) => {
      try {
          await addDoc(collection(db, 'goals'), {
              ...goalData,
              savedAmount: 0
          });
      } catch (e) {
          console.error("Error adding goal:", e);
      }
  };

  const deleteGoal = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'goals', id));
      } catch (e) {
          console.error("Error deleting goal:", e);
      }
  };

  const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id'>>) => {
      try {
          await updateDoc(doc(db, 'goals', id), updates);
      } catch (e) {
          console.error("Error updating goal:", e);
      }
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = income - totalExpenses;

  // While loading we might want to return null or a loader, 
  // but context usually provides initial empty states.
  
  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        goals,
        addExpense,
        addGoal,
        updateGoal,
        deleteExpense,
        deleteGoal,
        totalExpenses,
        balance,
        setIncome,
        income,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

