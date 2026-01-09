import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'bills', label: 'Bills', icon: '📄' },
  { id: 'entertainment', label: 'Fun', icon: '🎉' },
  { id: 'health', label: 'Health', icon: '💊' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'other', label: 'Other', icon: '🔹' },
];

interface CategoryPickerProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryPicker({ selectedCategory, onSelectCategory }: CategoryPickerProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-2 ml-1">Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelectCategory(cat.label)}
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
    </View>
  );
}
