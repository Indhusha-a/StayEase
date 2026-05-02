import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useBooking } from '../../context/BookingContext';

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const { getBookingById, cancelBooking, loading } = useBooking();
  const [booking, setBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load booking details');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelBooking(bookingId);
              Alert.alert('Success', 'Booking cancelled successfully');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !booking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header Card */}
      <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1D4ED8', marginBottom: 8 }}>
          Booking Details
        </Text>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor:
              booking.status === 'Approved' ? '#D1FAE5' : booking.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
            alignSelf: 'flex-start',
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color:
                booking.status === 'Approved' ? '#047857' : booking.status === 'Rejected' ? '#991B1B' : '#92400E',
            }}
          >
            Status: {booking.status}
          </Text>
        </View>
      </View>

      {/* Room Info */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>ROOM INFORMATION</Text>
        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#6B7280' }}>Room Number</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>{booking.roomId.roomNumber}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#6B7280' }}>Room Type</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>{booking.roomId.roomType}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6B7280' }}>Price Per Night</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>PKR {booking.roomId.pricePerNight}</Text>
          </View>
        </View>
      </View>

      {/* Booking Dates */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>BOOKING DATES</Text>
        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#6B7280' }}>Check-In</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>
              {new Date(booking.checkInDate).toDateString()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#6B7280' }}>Check-Out</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>
              {new Date(booking.checkOutDate).toDateString()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6B7280' }}>Number of Nights</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>
              {Math.ceil(
                (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)
              )}{' '}
              nights
            </Text>
          </View>
        </View>
      </View>

      {/* Guests */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>GUESTS</Text>
        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6B7280' }}>Number of Guests</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>{booking.numberOfGuests}</Text>
          </View>
        </View>
      </View>

      {/* Price Summary */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>TOTAL PRICE</Text>
        <View style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#1D4ED8' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1D4ED8' }}>Total</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1D4ED8' }}>PKR {booking.totalPrice}</Text>
          </View>
        </View>
      </View>

      {/* Special Requests */}
      {booking.specialRequests && (
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>SPECIAL REQUESTS</Text>
          <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
            <Text style={{ color: '#1F2937', lineHeight: 20 }}>{booking.specialRequests}</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        {booking.status === 'Pending' && (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 8,
              }}
              onPress={() => Alert.alert('Coming Soon', 'Payment module coming in Day 5')}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>Proceed to Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#EF4444',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 8,
              }}
              onPress={handleCancel}
              disabled={cancelling}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}