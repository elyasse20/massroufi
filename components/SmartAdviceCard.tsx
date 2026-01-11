import { SpendingHealth } from '@/utils/financialAnalysis';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

interface SmartAdviceCardProps {
  spendingHealth: SpendingHealth;
}

export const SmartAdviceCard = ({ spendingHealth }: SmartAdviceCardProps) => {
  const { t } = useTranslation();
  return (
    <View 
      style={[
        styles.advisorCard, 
        { 
          backgroundColor: spendingHealth.color + '15', 
          borderColor: spendingHealth.color 
        }
      ]}
      className="mb-6 rounded-2xl p-4 border dark:bg-slate-800/50"
    >
      <View className="flex-row items-center mb-2">
         <FontAwesome 
            name={spendingHealth.status === 'Safe' ? 'check-circle' : 'exclamation-triangle'} 
            size={24} 
            color={spendingHealth.color} 
         />
         <Text 
            style={{ color: spendingHealth.color }}
            className="text-lg font-bold ml-3"
         >
            {spendingHealth.status === 'Safe' ? t('home.on_track') : 
            spendingHealth.status === 'Warning' ? t('home.warning') : t('home.critical_alert')}
         </Text>
      </View>
      <Text className="text-gray-700 dark:text-gray-300 text-[15px] leading-6 mt-1">
        {t(spendingHealth.messageKey, spendingHealth.messageParams)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  advisorCard: {
    // Kept for pure RN fallback if needed, but NativeWind classes above handle most.
    // We only need this for the dynamic background/border which RN handles better via style prop.
    borderWidth: 1,
  },
});
