import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function MainTabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarActiveTintColor: '#111820', tabBarInactiveTintColor: '#52616e', tabBarStyle: { height: 68, paddingTop: 8, paddingBottom: 10, backgroundColor: '#f8fafc', borderTopWidth: 0, elevation: 8 } }}>
    <Tabs.Screen name="index" options={{ tabBarIcon: ({ color, focused }) => <Feather name="dollar-sign" size={25} color={focused ? '#111820' : color} /> }} />
    <Tabs.Screen name="transactions" options={{ tabBarIcon: ({ color, focused }) => <Feather name="credit-card" size={24} color={focused ? '#111820' : color} /> }} />
    <Tabs.Screen name="dashboard" options={{ tabBarIcon: ({ color, focused }) => <Feather name="pie-chart" size={24} color={focused ? '#111820' : color} /> }} />
    <Tabs.Screen name="report" options={{ tabBarIcon: ({ color, focused }) => <Feather name="file-text" size={24} color={focused ? '#111820' : color} /> }} />
    <Tabs.Screen name="settings" options={{ tabBarIcon: ({ color, focused }) => <Feather name="settings" size={24} color={focused ? '#111820' : color} /> }} />
  </Tabs>;
}
