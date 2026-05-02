import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';

import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import IndexScreen from './screens/home/IndexScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import RoomListScreen from './screens/rooms/RoomListScreen';
import RoomDetailScreen from './screens/rooms/RoomDetailScreen';
import AddRoomScreen from './screens/rooms/AddRoomScreen';
import EditRoomScreen from './screens/rooms/EditRoomScreen';
import BookingListScreen from './screens/bookings/BookingListScreen';
import BookingDetailScreen from './screens/bookings/BookingDetailScreen';
import CreateBookingScreen from './screens/bookings/CreateBookingScreen';
import PaymentScreen from './screens/payments/PaymentScreen';
import MyPaymentsScreen from './screens/payments/MyPaymentsScreen';
import PaymentReceiptScreen from './screens/payments/PaymentReceiptScreen';
import AdminAllPaymentsScreen from './screens/payments/AdminAllPaymentsScreen';
import RevenueSummaryScreen from './screens/payments/RevenueSummaryScreen';
import MyReviewsScreen from './screens/reviews/MyReviewsScreen';
import SubmitReviewScreen from './screens/reviews/SubmitReviewScreen';
import EditReviewScreen from './screens/reviews/EditReviewScreen';
import AdminAllReviewsScreen from './screens/reviews/AdminAllReviewsScreen';

const Placeholder = ({ name, icon }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
    <Text style={{ fontSize: 48, marginBottom: 12 }}>{icon}</Text>
    <Text style={{ fontSize: 20, color: '#1D4ED8', fontWeight: '700' }}>{name}</Text>
    <Text style={{ color: '#9CA3AF', marginTop: 6, fontSize: 13 }}>Module coming soon</Text>
  </View>
);

const RoomStack = createStackNavigator();
const BookingStack = createStackNavigator();
const PaymentStack = createStackNavigator();
const ReviewStack = createStackNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function RoomsScreen() {
  return (
    <RoomStack.Navigator screenOptions={{ headerShown: false }}>
      <RoomStack.Screen name="RoomList" component={RoomListScreen} />
      <RoomStack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <RoomStack.Screen name="AddRoom" component={AddRoomScreen} />
      <RoomStack.Screen name="EditRoom" component={EditRoomScreen} />
    </RoomStack.Navigator>
  );
}

function BookingsScreen() {
  return (
    <BookingStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingStack.Screen name="BookingList" component={BookingListScreen} />
      <BookingStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <BookingStack.Screen name="CreateBooking" component={CreateBookingScreen} />
    </BookingStack.Navigator>
  );
}

function PaymentsStackScreen() {
  const { user } = useAuth();

  return (
    <PaymentStack.Navigator screenOptions={{ headerShown: false }}>
      <PaymentStack.Screen
        name="MyPayments"
        component={user?.role === 'admin' ? AdminAllPaymentsScreen : MyPaymentsScreen}
      />
      <PaymentStack.Screen name="PaymentCreate" component={PaymentScreen} />
      <PaymentStack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} />
      <PaymentStack.Screen name="AdminAllPayments" component={AdminAllPaymentsScreen} />
      <PaymentStack.Screen name="RevenueSummary" component={RevenueSummaryScreen} />
    </PaymentStack.Navigator>
  );
}

function ReviewsScreen() {
  const { user } = useAuth();

  return (
    <ReviewStack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === 'admin' ? (
        <ReviewStack.Screen name="AdminAllReviews" component={AdminAllReviewsScreen} />
      ) : (
        <ReviewStack.Screen name="MyReviews" component={MyReviewsScreen} />
      )}
      <ReviewStack.Screen name="SubmitReview" component={SubmitReviewScreen} />
      <ReviewStack.Screen name="EditReview" component={EditReviewScreen} />
    </ReviewStack.Navigator>
  );
}

const StaffScreen = () => <Placeholder name="Staff" icon="??" />;
const ComplaintsScreen = () => <Placeholder name="Complaints" icon="??" />;

// Tab icon helper
const TabIcon = ({ emoji, label, focused }) => {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 56,
        paddingHorizontal: 8,
      }}
    >
      <Text style={{ fontSize: 20 }}>
        {emoji}
      </Text>

      <Text
        numberOfLines={1} // ✅ prevents wrap
        style={{
          marginTop: 4,
          fontSize: 11,
          fontWeight: focused ? '700' : '500',
          color: focused ? '#1D4ED8' : '#9CA3AF',
        }}
      >
        {label}
      </Text>

      {/* ✅ tiny active indicator */}
      <View
        style={{
          marginTop: 4,
          height: 3,
          width: 18,
          borderRadius: 99,
          backgroundColor: focused ? '#1D4ED8' : 'transparent',
        }}
      />
    </View>
  );
};

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Index" component={IndexScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user, logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          height: 72,
          paddingBottom: 6,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 15,
        },
        headerStyle: { backgroundColor: '#1D4ED8' },
        headerTintColor: '#fff',
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
        options={{ title: 'Browse Rooms', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Rooms" focused={focused} /> }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ title: 'My Bookings', tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Book" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: 'Reviews', tabBarIcon: ({ focused }) => <TabIcon emoji="📝" label="Reviews" focused={focused} /> }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsStackScreen}
        options={{ title: 'Payments', tabBarIcon: ({ focused }) => <TabIcon emoji="💳" label="Pay" focused={focused} /> }}
      />
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
        options={{ title: 'Issues', tabBarIcon: ({ focused }) => <TabIcon emoji="🛠️" label="Issues" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>??</Text>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 13 }}>Loading StayEase...</Text>
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}

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
