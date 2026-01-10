import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  // Save data locally
  saveLocal: async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  },

  // Get local data
  getLocal: async (key: string) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting local data:', error);
      return null;
    }
  },

  // Remove local data
  removeLocal: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing local data:', error);
    }
  },

  // Add item to a local list (helper for arrays like transactions/goals)
  addItemToList: async (key: string, item: any) => {
    try {
      const list = (await storageService.getLocal(key)) || [];
      list.unshift(item); // Add to top
      await storageService.saveLocal(key, list);
      return list;
    } catch (error) {
      console.error('Error adding item to list:', error);
      return [];
    }
  },

  // Update item in a local list
  updateItemInList: async (key: string, updatedItem: any, idField: string = 'id') => {
    try {
      const list = (await storageService.getLocal(key)) || [];
      const index = list.findIndex((item: any) => item[idField] === updatedItem[idField]);
      if (index !== -1) {
        list[index] = { ...list[index], ...updatedItem };
        await storageService.saveLocal(key, list);
      }
      return list;
    } catch (error) {
      console.error('Error updating item in list:', error);
      return [];
    }
  }
};
