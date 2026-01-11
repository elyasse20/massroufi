import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CustomAlert } from '../../components/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import { mapFirebaseError } from '../../utils/errorMapping';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useTranslation();

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      showAlert(t('auth.error_title'), t('auth.fill_all_fields'), 'error');
      return;
    }
    if (password.length < 6) {
      showAlert(t('auth.error_title'), t('auth.password_length_error'), 'error');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      showAlert(t('auth.success_title'), t('auth.account_created'), 'success');
    } catch (error: any) {
      const errorKey = mapFirebaseError(error.code);
      showAlert(t('auth.registration_failed'), t(errorKey), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={{ flex: 1, justifyContent: 'center', padding: 24 }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="items-center mb-10">
             <View className="bg-white/20 p-4 rounded-full mb-4">
              <FontAwesome name="user-plus" size={32} color="white" />
            </View>
            <Text className="text-3xl font-bold text-white mb-2 tracking-wider">{t('auth.create_account')}</Text>
            <Text className="text-blue-100 text-lg">{t('auth.join_revolution')}</Text>
          </View>

          <View className="bg-white/10 p-6 rounded-3xl space-y-4 shadow-xl border border-white/20">
            <View>
              <Text className="text-blue-100 font-medium mb-1 ml-1">{t('auth.email_label')}</Text>
               <View className="flex-row items-center bg-black/20 rounded-xl px-4 border border-white/10">
                 <FontAwesome name="envelope" size={16} color="#93C5FD" style={{ marginRight: 10 }} />
                <TextInput
                  className="flex-1 py-4 text-white text-base"
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View>
              <Text className="text-blue-100 font-medium mb-1 ml-1">{t('auth.password_label')}</Text>
              <View className="flex-row items-center bg-black/20 rounded-xl px-4 border border-white/10">
                <FontAwesome name="lock" size={20} color="#93C5FD" style={{ marginRight: 12, marginLeft: 2 }} />
                <TextInput
                  className="flex-1 py-4 text-white text-base"
                  placeholder={t('auth.password_placeholder')}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
               className="w-full bg-white py-4 rounded-xl items-center mt-4 shadow-lg active:bg-gray-100"
            >
              {loading ? (
                <ActivityIndicator color="#3b5998" />
              ) : (
                <Text className="text-[#3b5998] font-bold text-lg">{t('auth.sign_up')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-10">
            <Text className="text-blue-200">{t('auth.already_have_account')} </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text className="text-white font-bold underline">{t('auth.sign_in')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </KeyboardAvoidingView>

        <CustomAlert 
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            type={alertType}
            onClose={() => setAlertVisible(false)}
        />
      </LinearGradient>
    </View>
  );
}
