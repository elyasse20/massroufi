import { storageService } from './storageService';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  userId: string;
  createdAt: any;
}

const LOCAL_KEY = 'user_goals';

export const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'savedAmount'>) => {
  const newId = 'local_' + Date.now();
  const newGoal = {
    ...goal,
    id: newId,
    savedAmount: 0,
    createdAt: new Date().toISOString(),
  };

  await storageService.addItemToList(LOCAL_KEY, newGoal);
  return newId;
};

export const subscribeToGoals = (userId: string, callback: (goals: Goal[]) => void) => {
  // Load from local storage
  storageService.getLocal(LOCAL_KEY).then((localData) => {
    if (localData) {
      // Filter by userId if you want to support multiple users locally (optional)
      const userGoals = localData.filter((g: Goal) => g.userId === userId);
      callback(userGoals);
    } else {
      callback([]);
    }
  });

  // Return dummy unsubscribe
  return () => {};
};

export const deleteGoal = async (goalId: string) => {
  const goals = (await storageService.getLocal(LOCAL_KEY)) || [];
  const newGoals = goals.filter((g: Goal) => g.id !== goalId);
  await storageService.saveLocal(LOCAL_KEY, newGoals);
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
  const goals = (await storageService.getLocal(LOCAL_KEY)) || [];
  const goalIndex = goals.findIndex((g: Goal) => g.id === goalId);

  if (goalIndex !== -1) {
    goals[goalIndex] = { ...goals[goalIndex], ...updates };
    await storageService.saveLocal(LOCAL_KEY, goals);
  }
};

export const updateGoalProgress = async (goalId: string, amountToAdd: number) => {
  const goals = (await storageService.getLocal(LOCAL_KEY)) || [];
  const goalIndex = goals.findIndex((g: Goal) => g.id === goalId);
  
  if (goalIndex !== -1) {
    goals[goalIndex].savedAmount += amountToAdd;
    await storageService.saveLocal(LOCAL_KEY, goals);
  }
};
