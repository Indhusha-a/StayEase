import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const BookingCard = ({ booking, onCancel, onApprove, onReject, isAdmin, userId }) => {
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

  const isOwner = booking.userId === userId || booking.userId._id === userId;
  const isPending = booking.status === 'Pending';

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
          <Text style={styles.dateLabel}>📅 {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.detail}>👥 {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}</Text>
          <Text style={styles.detail}>💰 $ {booking.totalPrice}</Text>
        </View>

        {booking.specialRequests && (
          <View style={styles.requestsBox}>
            <Text style={styles.requestsLabel}>Special Requests:</Text>
            <Text style={styles.requestsText}>{booking.specialRequests}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {/* Guest can cancel if Pending */}
        {isOwner && isPending && (
          <TouchableOpacity 
            style={[styles.btn, styles.cancelBtn]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            <Text style={styles.btnText}>{cancelling ? '⏳' : '❌'} Cancel</Text>
          </TouchableOpacity>
        )}

        {/* Admin can approve/reject if Pending */}
        {isAdmin && isPending && (
          <>
            <TouchableOpacity 
              style={[styles.btn, styles.approveBtn]}
              onPress={handleApprove}
              disabled={updating}
            >
              <Text style={styles.btnText}>{updating ? '⏳' : '✅'} Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={updating}
            >
              <Text style={styles.btnText}>{updating ? '⏳' : '❌'} Reject</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default function BookingListScreen({ navigation }) {
  const { getMyBookings, getAllBookings } = useBooking();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    console.log('BookingListScreen mounted / focused');
    fetchBookings();
    
    const unsubscribe = navigation.addListener('focus', () => {
         console.log('BookingListScreen focus event');
        fetchBookings();
    });
    return unsubscribe;
  }, [navigation, isAdmin, user?._id]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const res = await api.get('/bookings');
        setBookings(res.data.bookings);
      } else {
        const res = await api.get('/bookings/my');
        
      console.log('Bookings response:', res.data.bookings?.map(b => ({ id: b._id, status: b.status })));
      setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      Alert.alert('Error', 'Failed to fetch bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      console.log('Cancelling booking ID:', bookingId);  // ✅ ADD THIS
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    console.log('Cancel response:', response.data); 
      Alert.alert('Success', 'Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
        console.log('Cancel error response:', err.response?.data);
      Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'Approved' });
      Alert.alert('Success', 'Booking approved successfully');
      fetchBookings();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleReject = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'Rejected' });
      Alert.alert('Success', 'Booking rejected successfully');
      fetchBookings();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject booking');
    }
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
        keyExtractor={b => b._id}
        renderItem={({ item }) => (
          <BookingCard 
            booking={item}
            onCancel={handleCancel}
            onApprove={handleApprove}
            onReject={handleReject}
            isAdmin={isAdmin}
            userId={user?._id}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBookings(); }}
            colors={['#1D4ED8']}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ fontSize: 48 }}>📅</Text>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
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
  cancelBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  approveBtn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0' },
  rejectBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  btnText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  emptyText: { color: '#9CA3AF', fontSize: 15, marginTop: 10 },
});