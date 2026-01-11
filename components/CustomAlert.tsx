import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle' as const, color: '#16A34A', bgColor: '#DCFCE7' };
      case 'error':
        return { name: 'times-circle' as const, color: '#DC2626', bgColor: '#FEE2E2' };
      default:
        return { name: 'info-circle' as const, color: '#2563EB', bgColor: '#DBEAFE' };
    }
  };

  const iconData = getIcon();

  return (
    <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
    >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <View className="items-center mb-4">
                    <View style={{ backgroundColor: iconData.bgColor }} className="w-16 h-16 rounded-full justify-center items-center mb-4">
                        <FontAwesome name={iconData.name} size={32} color={iconData.color} />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                        {title}
                    </Text>
                    <Text className="text-gray-500 text-center leading-5">
                        {message}
                    </Text>
                </View>

                <TouchableOpacity 
                    onPress={onClose}
                    className="bg-gray-900 p-4 rounded-xl items-center active:bg-gray-800"
                >
                    <Text className="text-white font-bold text-base">
                        {t('common.ok', 'OK')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
  );
};
