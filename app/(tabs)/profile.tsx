import { useAuth } from '@/context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Changed import
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CustomAlert } from '@/components/CustomAlert';
import { getUserBudget, setUserBudget } from '@/services/userService';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [budget, setBudget] = useState('');
  const [loadingBudget, setLoadingBudget] = useState(false);
  
  // Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Modal State
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ visible: true, message, type });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setAlertConfig({ title, message, type });
      setAlertVisible(true);
  };

  useEffect(() => {
    if (user) {
      loadBudget();
      setDisplayName(user.displayName || '');
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
  };

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
      showToast('Monthly budget updated!', 'success');
    } catch (e) {
      showToast('Failed to update budget', 'error');
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

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
      setShowSignOutModal(false);
      signOut();
  };

  const changeLanguage = (lang: string) => {
      setPendingLanguage(lang);
      setShowLanguageModal(true);
  };

  const confirmLanguageChange = async () => {
      if (!pendingLanguage) return;
      
      const lang = pendingLanguage;
      setShowLanguageModal(false);

      try {
          await AsyncStorage.setItem('user-language', lang);
          await i18n.changeLanguage(lang);
          
          const isRTL = lang === 'ar';
          I18nManager.allowRTL(isRTL);
          I18nManager.forceRTL(isRTL);

          try {
              await Updates.reloadAsync();
          } catch (reloadError) {
              console.log("Reload failed:", reloadError);
              showAlert(t('profile.title'), t('profile.restart_confirm'), 'info');
          }
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <View className="flex-1 bg-gray-50">
       <StatusBar style="dark" />
       
       {/* ... existing header ... */}
      <LinearGradient
        colors={['#4F46E5', '#3B82F6']}
        className="pb-8 px-6 rounded-b-[40px] shadow-lg"
        style={{ paddingTop: insets.top + 20 }}
      >
        {/* ... header content ... */}
        <View className="items-center">
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
               <View className="absolute bottom-0 w-full h-8 bg-black/40 items-center justify-center">
                 <FontAwesome name="camera" size={14} color="white" />
               </View>
            </View>
          </TouchableOpacity>

          {isEditing ? (
            <View className="flex-row items-center mb-1 bg-white/20 rounded-lg px-2 py-1">
               <TextInput 
                 value={displayName}
                 onChangeText={setDisplayName}
                 className="text-white text-xl font-bold min-w-[150px] text-center"
                 placeholder={t('profile.edit_name')}
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
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-6 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-xl mr-3">
              <FontAwesome name="money" size={20} color="#16A34A" />
            </View>
            <Text className="text-lg font-bold text-gray-800">{t('profile.monthly_budget')}</Text>
          </View>
          
          <View className="flex-row items-center space-x-3">
            <TextInput 
              className="flex-1 bg-gray-50 p-4 rounded-xl text-xl font-bold text-gray-900 border border-gray-200"
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

        {/* Subscriptions Entry */}
        <TouchableOpacity 
          onPress={() => require('expo-router').router.push('/subscriptions')}
          className="bg-indigo-50 p-5 rounded-3xl flex-row items-center justify-between mb-6 border border-indigo-100"
        >
           <View className="flex-row items-center">
              <View className="bg-indigo-100 p-2 rounded-xl mr-3">
                 <FontAwesome name="refresh" size={20} color="#4F46E5" />
              </View>
              <View>
                 <Text className="text-lg font-bold text-slate-800">{t('profile.subscriptions')}</Text>
                 <Text className="text-slate-500 text-sm">{t('profile.subscriptions_desc')}</Text>
              </View>
           </View>
           <FontAwesome name="chevron-right" size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Language Selector */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-6 border border-gray-100">
             <View className="flex-row items-center mb-4">
                <View className="bg-orange-100 p-2 rounded-xl mr-3">
                   <FontAwesome name="globe" size={20} color="#F97316" />
                </View>
                <Text className="text-lg font-bold text-gray-800">{t('profile.language')}</Text>
             </View>
             
             <View className="flex-row justify-between gap-2">
                 {(['en', 'fr', 'ar'] as const).map((lang) => (
                    <TouchableOpacity 
                        key={lang}
                        onPress={() => changeLanguage(lang)}
                        className={`flex-1 py-3 items-center rounded-xl border ${i18n.language === lang ? 'bg-orange-500 border-orange-500' : 'bg-gray-50 border-gray-200'}`}
                    >
                        <Text className={`font-bold ${i18n.language === lang ? 'text-white' : 'text-slate-600'}`}>
                            {lang.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                 ))}
             </View>
        </View>

        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-red-50 p-4 rounded-3xl flex-row items-center justify-center mb-10 border border-red-100"
        >
          <FontAwesome name="sign-out" size={20} color="#DC2626" style={{ marginRight: 8 }} />
          <Text className="text-red-600 font-bold text-lg">{t('profile.sign_out')}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Toast Notification */}
      {toast.visible && (
        <View 
            className={`absolute top-10 left-6 right-6 z-50 rounded-2xl flex-row items-center p-4 shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ marginTop: insets.top }}
        >
          <FontAwesome name={toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} size={24} color="white" />
          <Text className="text-white font-bold ml-3 text-base flex-1 shadow-black/20" style={{textShadowRadius: 2}}>
            {toast.message}
          </Text>
        </View>
      )}

      {/* Sign Out Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSignOutModal}
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
             <View className="items-center mb-6">
                <View className="w-16 h-16 bg-red-100 rounded-full justify-center items-center mb-4">
                   <FontAwesome name="sign-out" size={32} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-gray-900 text-center mb-2">{t('profile.sign_out')}</Text>
                <Text className="text-gray-500 text-center">{t('profile.sign_out_confirm')}</Text>
             </View>
             
             <View className="flex-row space-x-3 gap-3">
                <TouchableOpacity 
                  onPress={() => setShowSignOutModal(false)}
                  className="flex-1 bg-gray-100 p-4 rounded-xl items-center"
                >
                   <Text className="text-gray-700 font-bold">{t('profile.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={confirmSignOut}
                  className="flex-1 bg-red-600 p-4 rounded-xl items-center shadow-lg shadow-red-200"
                >
                   <Text className="text-white font-bold">{t('profile.sign_out')}</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* Language Change Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
           <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <View className="items-center mb-6">
                 <View className="w-16 h-16 bg-orange-100 rounded-full justify-center items-center mb-4">
                    <FontAwesome name="refresh" size={32} color="#F97316" />
                 </View>
                 <Text className="text-xl font-bold text-gray-900 text-center mb-2">{t('profile.select_language')}</Text>
                 <Text className="text-gray-500 text-center">{t('profile.restart_confirm')}</Text>
              </View>

              <View className="flex-row space-x-3 gap-3">
                 <TouchableOpacity 
                   onPress={() => setShowLanguageModal(false)}
                   className="flex-1 bg-gray-100 p-4 rounded-xl items-center"
                 >
                    <Text className="text-gray-700 font-bold">{t('profile.cancel')}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={confirmLanguageChange}
                   className="flex-1 bg-orange-600 p-4 rounded-xl items-center shadow-lg shadow-orange-200"
                 >
                    <Text className="text-white font-bold">{t('profile.confirm')}</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />

    </View>
  );
}
