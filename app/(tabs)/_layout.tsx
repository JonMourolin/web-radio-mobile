import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabLayout() {
  const tintColor = useThemeColor({ light: '#3b82f6', dark: '#60a5fa' }, 'tint');
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="radio"
        options={{
          title: 'Radio',
          tabBarIcon: ({ color }) => <Ionicons name="radio" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mixcloud"
        options={{
          title: 'DJ Sets',
          tabBarIcon: ({ color }) => <Ionicons name="musical-notes" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
} 