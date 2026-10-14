import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { COLORS } from '../constants';
import { RootStackParamList, MainTabParamList } from './types';

// Screens
import SplashScreen    from '../screens/SplashScreen';
import LanguageScreen  from '../screens/LanguageScreen';
import LoginScreen     from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BillsScreen     from '../screens/BillsScreen';
import NewBillScreen   from '../screens/NewBillScreen';
import VoiceBillingScreen from '../screens/VoiceBillingScreen';
import InvoiceScreen   from '../screens/InvoiceScreen';

// ── Placeholder tab screens ────────────────────────────────────────
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
    <Text style={{ fontSize: 32 }}>🚧</Text>
    <Text style={{ fontSize: 16, color: COLORS.muted, marginTop: 8 }}>{title} — coming soon</Text>
  </View>
);

const InventoryScreen = () => <PlaceholderScreen title="Inventory" />;
const CustomersScreen = () => <PlaceholderScreen title="Customers" />;
const SettingsScreen  = () => <PlaceholderScreen title="Settings" />;

// ── Stack & Tab navigators ─────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

// Tab icon component
function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.wrap}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, { color: focused ? COLORS.teal : COLORS.muted }]}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: 64,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home"      focused={focused} /> }}
      />
      <Tab.Screen
        name="BillsTab"
        component={BillsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" label="Bills"     focused={focused} /> }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Stock"     focused={focused} /> }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Customers" focused={focused} /> }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Settings"  focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ── Root navigator ─────────────────────────────────────────────────
export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash"    component={SplashScreen}   />
        <Stack.Screen name="Language"  component={LanguageScreen} />
        <Stack.Screen name="Login"     component={LoginScreen}    />
        <Stack.Screen name="MainTabs"  component={MainTabs}       />

        {/* Modal screens — slide up over tabs */}
        <Stack.Screen
          name="NewBill"
          component={NewBillScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="VoiceBilling"
          component={VoiceBillingScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="Invoice"
          component={InvoiceScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="BillDetail"
          component={InvoiceScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  wrap:  { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  emoji: { fontSize: 20 },
  label: { fontSize: 10, fontWeight: '500', marginTop: 2 },
});
