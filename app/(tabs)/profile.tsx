import { useAuth } from '@/context/AuthContext';
import { getUserBudget, setUserBudget } from '@/services/userService';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Changed import
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { updateProfile } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();


  
  const [budget, setBudget] = useState('');
  const [loadingBudget, setLoadingBudget] = useState(false);
  
  // Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadBudget();
      setDisplayName(user.displayName || '');
      // Load local photo if available, otherwise fallback to user.photoURL (which might be null)
      loadLocalPhoto();
    }
  }, [user]);

  const loadLocalPhoto = async () => {
    if(!user) return;
    try {
      const storedPhoto = await AsyncStorage.getItem(`user_photo_${user.uid}`);
      if (storedPhoto) {
        setPhotoURL(storedPhoto);
      } else {
        setPhotoURL(user.photoURL);
      }
    } catch (e) {
      setPhotoURL(user.photoURL);
    }
  }

  const loadBudget = async () => {
    if (!user) return;
    const b = await getUserBudget(user.uid);
    if (b) setBudget(b.toString());
  };

  const saveBudget = async () => {
    if (!user) return;
    setLoadingBudget(true);
    try {
      await setUserBudget(user.uid, parseFloat(budget));
      Alert.alert('Success', 'Monthly budget updated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update budget');
    } finally {
      setLoadingBudget(false);
    }
  };

  const handlePickImage = async () => {
    // 1. Request Permission
    const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissions.status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your gallery to change your profile picture.');
      return;
    }

    // 2. Pick Image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && user) {
      saveLocalImage(result.assets[0].uri);
    }
  };

  const saveLocalImage = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    try {
      // Save locally
      await AsyncStorage.setItem(`user_photo_${user.uid}`, uri);
      setPhotoURL(uri);
      
      // Also update Firebase profile with local URI just in case (it won't load on other devices but helps persistence)
      // Actually, for local only, we just keep it in state and AsyncStorage.
      // We can optionally update displayName here too if we want to batch it.
      
      Alert.alert("Success", "Profile picture updated (Local)!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save image locally.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: displayName });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut }
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      <StatusBar style="light" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#3B82F6']}
        className="pb-8 px-6 rounded-b-[40px] shadow-lg"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="items-center">
          {/* Avatar with Edit Button */}
          <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
            <View className="relative w-28 h-28 bg-white/20 rounded-full items-center justify-center mb-4 border-2 border-white/30 backdrop-blur-sm overflow-hidden">
               {uploading ? (
                 <ActivityIndicator color="white" />
               ) : photoURL ? (
                 <Image source={{ uri: photoURL }} className="w-full h-full" />
               ) : (
                 <Text className="text-5xl text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                 </Text>
               )}
               
               {/* Camera Icon Overlay */}
               <View className="absolute bottom-0 w-full h-8 bg-black/40 items-center justify-center">
                 <FontAwesome name="camera" size={14} color="white" />
               </View>
            </View>
          </TouchableOpacity>

          {/* Name Display / Edit */}
          {isEditing ? (
            <View className="flex-row items-center mb-1 bg-white/20 rounded-lg px-2 py-1">
               <TextInput 
                 value={displayName}
                 onChangeText={setDisplayName}
                 className="text-white text-xl font-bold min-w-[150px] text-center"
                 placeholder="Enter Name"
                 placeholderTextColor="#cbd5e1"
                 autoFocus
               />
               <TouchableOpacity onPress={handleSaveProfile} className="ml-2 bg-white/30 p-1 rounded">
                  <FontAwesome name="check" size={16} color="white" />
               </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center mb-1">
               <Text className="text-2xl font-bold text-white mr-2">
                 {user?.displayName || user?.email?.split('@')[0]}
               </Text>
               <TouchableOpacity onPress={() => setIsEditing(true)}>
                 <FontAwesome name="pencil" size={16} color="#bfdbfe" />
               </TouchableOpacity>
            </View>
          )}

          <Text className="text-blue-100 text-sm bg-blue-600/30 px-3 py-1 rounded-full">
            {user?.email}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6 pt-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        
        {/* Budget Card */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm mb-6 border border-gray-100 dark:border-slate-700">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-xl mr-3">
              <FontAwesome name="money" size={20} color="#16A34A" />
            </View>
            <Text className="text-lg font-bold text-gray-800 dark:text-white">Monthly Budget</Text>
          </View>
          
          <View className="flex-row items-center space-x-3">
            <TextInput 
              className="flex-1 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600"
              placeholder="0.00"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />
            <TouchableOpacity 
              onPress={saveBudget}
              disabled={loadingBudget}
              className="bg-blue-600 p-4 rounded-xl shadow-md shadow-blue-200"
            >
              <FontAwesome name="save" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>



        {/* Sign Out */}
        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-red-50 dark:bg-red-900/10 p-4 rounded-3xl flex-row items-center justify-center mb-10 border border-red-100 dark:border-red-900/20"
        >
          <FontAwesome name="sign-out" size={20} color="#DC2626" style={{ marginRight: 8 }} />
          <Text className="text-red-600 font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
