import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator }     from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';

// Import screens
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import IndexScreen    from './screens/home/IndexScreen';
import LoginScreen    from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import RoomListScreen   from './screens/rooms/RoomListScreen';
import RoomDetailScreen from './screens/rooms/RoomDetailScreen';
import AddRoomScreen    from './screens/rooms/AddRoomScreen';
import EditRoomScreen   from './screens/rooms/EditRoomScreen';
import BookingListScreen from './screens/bookings/BookingListScreen';
import BookingDetailScreen from './screens/bookings/BookingDetailScreen';
import CreateBookingScreen from './screens/bookings/CreateBookingScreen';

// ── Placeholder screens — each member replaces with their real screens ──
const Placeholder = ({ name, icon }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
    <Text style={{ fontSize: 48, marginBottom: 12 }}>{icon}</Text>
    <Text style={{ fontSize: 20, color: '#1D4ED8', fontWeight: '700' }}>{name}</Text>
    <Text style={{ color: '#9CA3AF', marginTop: 6, fontSize: 13 }}>Module coming soon</Text>
  </View>
);

const RoomStack = createStackNavigator();

function RoomsScreen() {
  return (
    <RoomStack.Navigator screenOptions={{ headerShown: false }}>
      <RoomStack.Screen name="RoomList"   component={RoomListScreen} />
      <RoomStack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <RoomStack.Screen name="AddRoom"    component={AddRoomScreen} />
      <RoomStack.Screen name="EditRoom"   component={EditRoomScreen} />
    </RoomStack.Navigator>
  );
}
const BookingStack = createStackNavigator();

function BookingsStackNav() {
  return (
    <BookingStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingStack.Screen name="BookingList" component={BookingListScreen} />
      <BookingStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <BookingStack.Screen name="CreateBooking" component={CreateBookingScreen} />
    </BookingStack.Navigator>
  );
}


// Each member imports and replaces their screen here
const BookingsScreen = () => <BookingsStackNav />;
const ReviewsScreen    = () => <Placeholder name="Reviews"    icon="⭐" />;
const PaymentsScreen   = () => <Placeholder name="Payments"   icon="💳" />;
const StaffScreen      = () => <Placeholder name="Staff"      icon="👥" />;
const ComplaintsScreen = () => <Placeholder name="Complaints" icon="🔧" />;

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// Tab icon helper
const TabIcon = ({ emoji, label, focused }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: focused ? 22 : 18 }}>{emoji}</Text>
    <Text style={{ fontSize: 10, color: focused ? '#1D4ED8' : '#9CA3AF', fontWeight: focused ? '700' : '400' }}>
      {label}
    </Text>
  </View>
);

// Auth screens (Login + Register)
function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Index"    component={IndexScreen} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main app tabs — shown after login
function MainTabs() {
  const { user, logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,   // We use custom labels inside TabIcon
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          height: 65,
          paddingBottom: 6,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 10,
        },
        headerStyle:      { backgroundColor: '#1D4ED8' },
        headerTintColor:  '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        options={{ title: 'Browse Rooms', tabBarIcon: ({ focused }) => <TabIcon emoji="🛏️" label="Rooms" focused={focused} /> }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ title: 'My Bookings', tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Book" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: 'Reviews', tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" label="Reviews" focused={focused} /> }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: 'Payments', tabBarIcon: ({ focused }) => <TabIcon emoji="💳" label="Pay" focused={focused} /> }}
      />
      {/* Staff tab — only visible to admins */}
      {user?.role === 'admin' && (
        <Tab.Screen
          name="Staff"
          component={StaffScreen}
          options={{ title: 'Staff', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Staff" focused={focused} /> }}
        />
      )}
      <Tab.Screen
        name="Complaints"
        component={ComplaintsScreen}
        options={{ title: 'Issues', tabBarIcon: ({ focused }) => <TabIcon emoji="🔧" label="Issues" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// Decides whether to show Auth or Main based on login state
function RootNavigator() {
  const { user, loading } = useAuth();

  // Show spinner while checking stored token
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🏨</Text>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 13 }}>Loading StayEase...</Text>
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}

// Root app — wraps everything in AuthProvider and NavigationContainer
export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      </BookingProvider>
    </AuthProvider>
  );
}