import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
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
          <View className="items-center mb-12">
            <View className="bg-white/20 p-4 rounded-full mb-4">
              <FontAwesome name="dollar" size={40} color="white" />
            </View>
            <Text className="text-4xl font-bold text-white mb-2 tracking-wider">Massroufi</Text>
            <Text className="text-blue-100 text-lg tracking-wide">Financial Freedom</Text>
          </View>

          <View className="bg-white/10 p-6 rounded-3xl space-y-4 shadow-xl border border-white/20">
            <View>
              <Text className="text-blue-100 font-medium mb-1 ml-1">Email Address</Text>
              <View className="flex-row items-center bg-black/20 rounded-xl px-4 border border-white/10">
                <FontAwesome name="envelope" size={16} color="#93C5FD" style={{ marginRight: 10 }} />
                <TextInput
                  className="flex-1 py-4 text-white text-base"
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View>
              <Text className="text-blue-100 font-medium mb-1 ml-1">Password</Text>
              <View className="flex-row items-center bg-black/20 rounded-xl px-4 border border-white/10">
                <FontAwesome name="lock" size={20} color="#93C5FD" style={{ marginRight: 12, marginLeft: 2 }} />
                <TextInput
                  className="flex-1 py-4 text-white text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              className="w-full bg-white py-4 rounded-xl items-center mt-4 shadow-lg active:bg-gray-100"
            >
              {loading ? (
                <ActivityIndicator color="#3b5998" />
              ) : (
                <Text className="text-[#3b5998] font-bold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-10">
            <Text className="text-blue-200">New here? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text className="text-white font-bold underline">Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
