import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const getBookingRef = (value) => (typeof value === 'string' ? value : value?._id);

const mapPaymentsByBooking = (payments = []) => (
  payments.reduce((acc, payment) => {
    const bookingRef = getBookingRef(payment.bookingId);
    if (bookingRef) {
      acc[bookingRef] = payment;
    }
    return acc;
  }, {})
);

const BookingCard = ({
  booking,
  payment,
  onCancel,
  onApprove,
  onReject,
  onOpenDetails,
  onPayNow,
  onViewPayment,
  isAdmin,
  userId,
}) => {
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);

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
              await onCancel(booking._id);
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Booking',
      'Approve this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Approve',
          style: 'default',
          onPress: async () => {
            setUpdating(true);
            try {
              await onApprove(booking._id);
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Booking',
      'Reject this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Reject',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              await onReject(booking._id);
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return '#10B981';
    if (status === 'Rejected') return '#EF4444';
    if (status === 'Cancelled') return '#9CA3AF';
    return '#F59E0B';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const ownerId = getBookingRef(booking.userId);
  const isOwner = ownerId === userId;
  const isPending = booking.status === 'Pending';
  const isApproved = booking.status === 'Approved';
  const hasPayment = Boolean(payment?._id);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.roomName}>
            {booking.roomId?.roomNumber ? `Room ${booking.roomId.roomNumber}` : 'Room'}
          </Text>
          <Text style={styles.roomType}>
            {booking.roomId?.roomType || 'Standard'} Room
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detail}>{booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}</Text>
          <Text style={styles.detail}>$ {booking.totalPrice}</Text>
        </View>

        {payment ? (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Payment</Text>
            <Text style={styles.paymentText}>{payment.status} via {payment.paymentMethod}</Text>
          </View>
        ) : null}

        {booking.specialRequests ? (
          <View style={styles.requestsBox}>
            <Text style={styles.requestsLabel}>Special Requests:</Text>
            <Text style={styles.requestsText}>{booking.specialRequests}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        {isAdmin && isPending ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn]}
              onPress={handleApprove}
              disabled={updating}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{updating ? 'Updating...' : 'Approve'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={updating}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{updating ? 'Updating...' : 'Reject'}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {!isAdmin && isOwner ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.detailsBtn]}
              onPress={() => onOpenDetails(booking)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Details</Text>
            </TouchableOpacity>

            {isPending ? (
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={handleCancel}
                disabled={cancelling}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{cancelling ? 'Cancelling...' : 'Cancel'}</Text>
              </TouchableOpacity>
            ) : null}

            {isApproved && !hasPayment ? (
              <TouchableOpacity
                style={[styles.btn, styles.payBtn]}
                onPress={() => onPayNow(booking)}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Pay Now</Text>
              </TouchableOpacity>
            ) : null}

            {isApproved && hasPayment ? (
              <TouchableOpacity
                style={[styles.btn, styles.receiptBtn]}
                onPress={() => onViewPayment(payment)}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>View Payment</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
};

export default function BookingListScreen({ navigation }) {
  const { getMyBookings, getAllBookings, cancelBooking, updateBookingStatus } = useBooking();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = user?.role === 'admin';
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    fetchBookings();

    const unsubscribe = navigation.addListener('focus', fetchBookings);
    return unsubscribe;
  }, [navigation, isAdmin, currentUserId]);

  const fetchGuestPayments = async () => {
    const response = await api.get('/payments/my');
    return mapPaymentsByBooking(response.data || []);
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        const response = await getAllBookings();
        setBookings(response.bookings || []);
        setPaymentsByBooking({});
      } else {
        const [bookingResponse, payments] = await Promise.all([
          getMyBookings(),
          fetchGuestPayments(),
        ]);
        setBookings(bookingResponse.bookings || []);
        setPaymentsByBooking(payments);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const replaceBooking = (bookingId, updatedBooking) => {
    setBookings((current) => current.map((booking) => (
      booking._id === bookingId ? { ...booking, ...updatedBooking } : booking
    )));
  };

  const handleCancel = async (bookingId) => {
    try {
      const updatedBooking = await cancelBooking(bookingId);
      replaceBooking(bookingId, updatedBooking);
      await fetchBookings();
      Alert.alert('Success', 'Booking cancelled successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to cancel booking');
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      const updatedBooking = await updateBookingStatus(bookingId, 'Approved');
      replaceBooking(bookingId, updatedBooking);
      await fetchBookings();
      Alert.alert('Success', 'Booking approved successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to approve booking');
    }
  };

  const handleReject = async (bookingId) => {
    try {
      const updatedBooking = await updateBookingStatus(bookingId, 'Rejected');
      replaceBooking(bookingId, updatedBooking);
      await fetchBookings();
      Alert.alert('Success', 'Booking rejected successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to reject booking');
    }
  };

  const openDetails = (booking) => {
    navigation.navigate('BookingDetail', { bookingId: booking._id });
  };

  const openPayment = (booking) => {
    navigation.navigate('Payments', {
      screen: 'PaymentCreate',
      params: {
        bookingId: booking._id,
        booking,
        amount: booking.totalPrice,
      },
    });
  };

  const openReceipt = (payment) => {
    navigation.navigate('Payments', {
      screen: 'PaymentReceipt',
      params: { paymentId: payment._id },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isAdmin ? 'All Bookings' : 'My Bookings'}
        </Text>
        <Text style={styles.headerSub}>
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(b) => b._id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            payment={paymentsByBooking[item._id]}
            onCancel={handleCancel}
            onApprove={handleApprove}
            onReject={handleReject}
            onOpenDetails={openDetails}
            onPayNow={openPayment}
            onViewPayment={openReceipt}
            isAdmin={isAdmin}
            userId={currentUserId}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBookings();
            }}
            colors={['#1D4ED8']}
          />
        )}
        ListEmptyComponent={(
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>No bookings yet</Text>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 13 },
  header: { backgroundColor: '#1D4ED8', paddingHorizontal: 20, paddingVertical: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#BFDBFE', marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  roomName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  roomType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
  cardBody: { padding: 16 },
  dateRow: { marginBottom: 10 },
  dateLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detail: { fontSize: 12, color: '#6B7280' },
  paymentBox: {
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12
  },
  paymentLabel: { fontSize: 11, fontWeight: '600', color: '#166534' },
  paymentText: { fontSize: 12, color: '#166534', marginTop: 4 },
  requestsBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B'
  },
  requestsLabel: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  requestsText: { fontSize: 12, color: '#B45309', marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailsBtn: { backgroundColor: '#E0E7FF', borderWidth: 1, borderColor: '#C7D2FE' },
  cancelBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  approveBtn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0' },
  rejectBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  payBtn: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#BFDBFE' },
  receiptBtn: { backgroundColor: '#ECFCCB', borderWidth: 1, borderColor: '#D9F99D' },
  btnText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  emptyIcon: { fontSize: 16, color: '#6B7280' },
  emptyText: { color: '#9CA3AF', fontSize: 15, marginTop: 10 },
});
