/**
 * ComplaintsNavigator
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in replacement for the ComplaintsScreen placeholder in App.jsx.
 *
 * Usage in App.jsx:
 *   import ComplaintsNavigator from './screens/complaints/ComplaintsNavigator';
 *   // …then replace:
 *   const ComplaintsScreen = () => <Placeholder name="Complaints" icon="🔧" />;
 *   // …with:
 *   // (just import and use ComplaintsNavigator directly)
 *
 * Inside MainTabs, change:
 *   component={ComplaintsScreen}
 * to:
 *   component={ComplaintsNavigator}
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text } from 'react-native';

import { useAuth } from '../../context/AuthContext';

import MyComplaintsScreen from './MyComplaintsScreen';
import AdminComplaintsScreen from './AdminComplaintsScreen';
import ComplaintDetailScreen from './ComplaintDetailScreen';
import SubmitComplaintScreen from './SubmitComplaintScreen';

const Stack = createStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: '#1D4ED8' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerBackTitleVisible: false,
};

export default function ComplaintsNavigator() {
  const { user } = useAuth();

  // Admin sees the all-complaints management view first;
  // guests & staff see their personal list.
  const initialRoute = user?.role === 'admin' ? 'AdminComplaints' : 'MyComplaints';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={headerOptions}>

      {/* Guest / Staff screens */}
      <Stack.Screen
        name="MyComplaints"
        component={MyComplaintsScreen}
        options={({ navigation }) => ({
          title: 'My Reports',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('SubmitComplaint')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300' }}>+</Text>
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="SubmitComplaint"
        component={SubmitComplaintScreen}
        options={{ title: 'New Report' }}
      />

      <Stack.Screen
        name="ComplaintDetail"
        component={ComplaintDetailScreen}
        options={{ title: 'Report Details' }}
      />

      {/* Admin screen — also accessible from guest stack via deep navigation if needed */}
      <Stack.Screen
        name="AdminComplaints"
        component={AdminComplaintsScreen}
        options={{ title: 'All Complaints' }}
      />

    </Stack.Navigator>
  );
}