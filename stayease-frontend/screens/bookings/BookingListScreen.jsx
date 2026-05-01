import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useBooking } from '../../context/BookingContext';

export default function BookingListScreen({ navigation }) {
  const { bookings, loading, error, getMyBookings } = useBooking();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getMyBookings();
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  const renderBooking = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: item.status === 'Approved' ? '#10B981' : item.status === 'Rejected' ? '#EF4444' : '#F59E0B',
      }}
      onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
            Room {item.roomId.roomNumber}
          </Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
            {new Date(item.checkInDate).toDateString()} - {new Date(item.checkOutDate).toDateString()}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={{ fontSize: 12, color: '#4B5563' }}>👥 {item.numberOfGuests} guests</Text>
            <Text style={{ fontSize: 12, color: '#4B5563' }}>💰 PKR {item.totalPrice}</Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor:
              item.status === 'Approved' ? '#D1FAE5' : item.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color:
                item.status === 'Approved' ? '#047857' : item.status === 'Rejected' ? '#991B1B' : '#92400E',
            }}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      {error && (
        <View style={{ backgroundColor: '#FEE2E2', padding: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 8 }}>
          <Text style={{ color: '#991B1B', fontSize: 12 }}>{error}</Text>
        </View>
      )}

      {!bookings || bookings.length === 0 ? (
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 }}>
            No Bookings Yet
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
            Start your StayEase journey by booking a room today!
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#1D4ED8',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16,
            }}
            onPress={() => navigation.navigate('Rooms')}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Browse Rooms</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          scrollEnabled={true}
        />
      )}
    </View>
  );
}
