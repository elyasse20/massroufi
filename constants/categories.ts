export const CATEGORIES = [
  { id: '1', name: 'Nourriture', icon: 'cutlery', color: 'bg-orange-100 text-orange-600', hex: '#ea580c' },
  { id: '2', name: 'Transport', icon: 'bus', color: 'bg-blue-100 text-blue-600', hex: '#2563eb' },
  { id: '3', name: 'Loisirs', icon: 'gamepad', color: 'bg-purple-100 text-purple-600', hex: '#9333ea' },
  { id: '4', name: 'Shopping', icon: 'shopping-bag', color: 'bg-pink-100 text-pink-600', hex: '#db2777' },
  { id: '5', name: 'Santé', icon: 'medkit', color: 'bg-red-100 text-red-600', hex: '#dc2626' },
  { id: '6', name: 'Autre', icon: 'ellipsis-h', color: 'bg-gray-100 text-gray-600', hex: '#4b5563' },
];

export const getCategoryById = (id: string) => CATEGORIES.find(c => c.id === id);
