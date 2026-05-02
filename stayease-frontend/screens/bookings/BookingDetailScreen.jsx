import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const getBookingRef = (value) => (typeof value === 'string' ? value : value?._id);

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const { getBookingById, cancelBooking } = useBooking();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [screenLoading, setScreenLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    loadBooking();

    const unsubscribe = navigation.addListener('focus', loadBooking);
    return unsubscribe;
  }, [navigation, bookingId, currentUserId]);

  const loadPaymentForBooking = async (targetBookingId) => {
    try {
      const response = await api.get('/payments/my');
      const payments = response.data || [];
      const matchedPayment = payments.find((entry) => getBookingRef(entry.bookingId) === targetBookingId);
      return matchedPayment || null;
    } catch (err) {
      return null;
    }
  };

  const loadBooking = async () => {
    try {
      setScreenLoading(true);
      const data = await getBookingById(bookingId);
      setBooking(data);

      const ownerId = getBookingRef(data.userId);
      if (ownerId === currentUserId && user?.role === 'guest') {
        const existingPayment = await loadPaymentForBooking(data._id);
        setPayment(existingPayment);
      } else {
        setPayment(null);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setScreenLoading(false);
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
              const updatedBooking = await cancelBooking(bookingId);
              setBooking((current) => ({ ...current, ...updatedBooking }));
              Alert.alert('Success', 'Booking cancelled successfully');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const openPayment = () => {
    navigation.navigate('Payments', {
      screen: 'PaymentCreate',
      params: {
        bookingId: booking._id,
        booking,
        amount: booking.totalPrice,
      },
    });
  };

  const openReceipt = () => {
    if (!payment?._id) return;

    navigation.navigate('Payments', {
      screen: 'PaymentReceipt',
      params: { paymentId: payment._id },
    });
  };

  if (screenLoading || !booking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  const ownerId = getBookingRef(booking.userId);
  const isOwner = ownerId === currentUserId;
  const isPending = booking.status === 'Pending';
  const isApproved = booking.status === 'Approved';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ paddingBottom: 100 }}>
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

      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>GUESTS</Text>
        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6B7280' }}>Number of Guests</Text>
            <Text style={{ fontWeight: '600', color: '#1F2937' }}>{booking.numberOfGuests}</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>TOTAL PRICE</Text>
        <View style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#1D4ED8' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1D4ED8' }}>Total</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1D4ED8' }}>PKR {booking.totalPrice}</Text>
          </View>
        </View>
      </View>

      {payment ? (
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>PAYMENT</Text>
          <View style={{ backgroundColor: '#ECFCCB', padding: 12, borderRadius: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#6B7280' }}>Status</Text>
              <Text style={{ fontWeight: '600', color: '#166534' }}>{payment.status}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#6B7280' }}>Method</Text>
              <Text style={{ fontWeight: '600', color: '#1F2937' }}>{payment.paymentMethod}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#6B7280' }}>Date</Text>
              <Text style={{ fontWeight: '600', color: '#1F2937' }}>
                {new Date(payment.paymentDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {booking.specialRequests ? (
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>SPECIAL REQUESTS</Text>
          <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
            <Text style={{ color: '#1F2937', lineHeight: 20 }}>{booking.specialRequests}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        {isApproved && isOwner && !payment ? (
          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 8,
            }}
            onPress={openPayment}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>Proceed to Payment</Text>
          </TouchableOpacity>
        ) : null}

        {isApproved && isOwner && payment ? (
          <TouchableOpacity
            style={{
              backgroundColor: '#65A30D',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 8,
            }}
            onPress={openReceipt}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>View Payment Receipt</Text>
          </TouchableOpacity>
        ) : null}

        {isPending && isOwner ? (
          <TouchableOpacity
            style={{
              backgroundColor: '#EF4444',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 8,
            }}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}
