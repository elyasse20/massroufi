import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: '🍔', color: '#F59E0B' }, // Amber
  { id: 'transport', label: 'Transport', icon: '🚌', color: '#3B82F6' }, // Blue
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#EC4899' }, // Pink
  { id: 'bills', label: 'Bills', icon: '📄', color: '#EF4444' }, // Red
  { id: 'entertainment', label: 'Fun', icon: '🎉', color: '#8B5CF6' }, // Violet
  { id: 'health', label: 'Health', icon: '💊', color: '#10B981' }, // Emerald
  { id: 'education', label: 'Education', icon: '📚', color: '#6366F1' }, // Indigo
  { id: 'other', label: 'Other', icon: '🔹', color: '#64748B' }, // Slate
];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', 
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
];

interface CategoryPickerProps {
  selectedCategory: string;
  onSelectCategory: (category: string, color?: string) => void;
}

export default function CategoryPicker({ selectedCategory, onSelectCategory }: CategoryPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState(COLORS[0]);

  const handleCategoryPress = (cat: typeof CATEGORIES[0]) => {
    if (cat.id === 'other') {
      setModalVisible(true);
    } else {
      onSelectCategory(cat.label, cat.color);
    }
  };

  const saveCustomCategory = () => {
    if (customName.trim()) {
      onSelectCategory(customName, customColor);
      setModalVisible(false);
      setCustomName('');
    }
  };

  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-2 ml-1">Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => handleCategoryPress(cat)}
            className={`mr-3 px-4 py-2 rounded-full border ${
              selectedCategory === cat.label
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`${
                selectedCategory === cat.label ? 'text-white' : 'text-gray-700'
              } font-medium`}
            >
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-3xl p-6 w-full shadow-xl">
            <Text className="text-xl font-bold text-gray-800 mb-1 text-center">Custom Category</Text>
            <Text className="text-sm text-gray-500 mb-6 text-center">Create your own category</Text>

            <View className="mb-6">
              <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Category Name</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 font-medium"
                placeholder="e.g. Gym, Freelance, Gifts..."
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
            </View>

            <View className="mb-8">
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Color Code</Text>
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setCustomColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      customColor === color ? 'border-4 border-gray-200 scale-110' : ''
                    }`}
                  >
                    {customColor === color && <FontAwesome name="check" size={12} color="white" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="flex-row space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 bg-gray-100 p-4 rounded-xl items-center"
              >
                <Text className="text-gray-600 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveCustomCategory}
                className="flex-1 bg-blue-600 p-4 rounded-xl items-center shadow-lg shadow-blue-200"
              >
                <Text className="text-white font-bold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
