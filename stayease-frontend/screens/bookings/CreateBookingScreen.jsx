import React, { useState, useEffect } from 'react';
import {
  View, Text,TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView,
  ActivityIndicator, SafeAreaView, Modal,
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { useRoute } from '@react-navigation/native';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';

export default function CreateBookingScreen({ navigation }) {
  const route = useRoute();
  const { roomId, pricePerNight, roomNumber } = route.params;
  const { createBooking } = useBooking();
  const { user } = useAuth();

  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);

  // Calculate total price whenever dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
      setTotalPrice(nights * pricePerNight);
    }
  }, [checkInDate, checkOutDate, pricePerNight]);

  const handleCheckInDateSelect = (date) => {
    setCheckInDate(date);
    setShowCheckInCalendar(false);
  };

  const handleCheckOutDateSelect = (date) => {
    if (checkInDate && date <= checkInDate) {
      Alert.alert('Invalid Date', 'Check-out date must be after check-in date');
      return;
    }
    setCheckOutDate(date);
    setShowCheckOutCalendar(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!checkInDate || !checkOutDate || !numberOfGuests) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        roomId,
        checkInDate: new Date(checkInDate).toISOString(),
        checkOutDate: new Date(checkOutDate).toISOString(),
        numberOfGuests: parseInt(numberOfGuests),
        specialRequests: specialRequests || '',
      };

      console.log('Creating booking with data:', bookingData);
      await createBooking(bookingData);

      Alert.alert('Success', 'Booking created successfully!', [
        {
          text: 'View My Bookings',
          onPress: () => {
            navigation.navigate('Bookings', { 
              screen: 'BookingList' 
            });
          },
        },
      ]);
    } catch (error) {
      console.log('Booking error:', error);
      Alert.alert('Booking Failed', error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Book Room {roomNumber}</Text>
          <Text style={styles.headerSub}>$ {pricePerNight} per night</Text>
        </View>

        {/* Check-in Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Check-in Date *</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowCheckInCalendar(true)}
          >
            <Text style={styles.dateButtonText}>📅 {formatDate(checkInDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Check-out Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Check-out Date *</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowCheckOutCalendar(true)}
          >
            <Text style={styles.dateButtonText}>📅 {formatDate(checkOutDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Number of Guests */}
        <View style={styles.section}>
          <Text style={styles.label}>Number of Guests *</Text>
          <View style={styles.guestSelector}>
            <TouchableOpacity 
              style={styles.minusBtn}
              onPress={() => setNumberOfGuests(Math.max(1, parseInt(numberOfGuests) - 1).toString())}
            >
              <Text style={styles.buttonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.guestCount}>{numberOfGuests}</Text>
            <TouchableOpacity 
              style={styles.plusBtn}
              onPress={() => setNumberOfGuests((parseInt(numberOfGuests) + 1).toString())}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Special Requests */}
       <View style={styles.section}>
  <Text style={styles.label}>Special Requests (Optional)</Text>

  <TextInput
    style={styles.textarea}
    placeholder="e.g., Extra pillows, High floor..."
    placeholderTextColor="#9CA3AF"
    value={specialRequests}
    onChangeText={setSpecialRequests}
    multiline
    textAlignVertical="top"
    maxLength={300}
  />
</View>

        {/* Price Summary */}
        {checkInDate && checkOutDate && (
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Nights</Text>
              <Text style={styles.priceValue}>
                {Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per Night</Text>
              <Text style={styles.priceValue}>$ {pricePerNight}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>$ {totalPrice}</Text>
            </View>
          </View>

        )}

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Check-in Calendar Modal */}
      <Modal
        visible={showCheckInCalendar}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Check-in Date</Text>
              <TouchableOpacity onPress={() => setShowCheckInCalendar(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <CalendarPicker
              onDateChange={handleCheckInDateSelect}
              minDate={new Date()}
              selectedDayColor="#1D4ED8"
              selectedDayTextColor="#fff"
              todayBackgroundColor="#E0E7FF"
            />
          </View>
        </View>
      </Modal>

      {/* Check-out Calendar Modal */}
      <Modal
        visible={showCheckOutCalendar}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Check-out Date</Text>
              <TouchableOpacity onPress={() => setShowCheckOutCalendar(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <CalendarPicker
              onDateChange={handleCheckOutDateSelect}
              minDate={checkInDate || new Date()}
              selectedDayColor="#1D4ED8"
              selectedDayTextColor="#fff"
              todayBackgroundColor="#E0E7FF"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { backgroundColor: '#1D4ED8', padding: 20, borderRadius: 12, marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#BFDBFE', marginTop: 4 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  dateButton: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 8, 
    padding: 14,
    alignItems: 'center'
  },
  dateButtonText: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
  guestSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12
  },
  minusBtn: { padding: 10 },
  plusBtn: { padding: 10 },
  buttonText: { fontSize: 24, color: '#1D4ED8', fontWeight: 'bold' },
  guestCount: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginHorizontal: 20 },
  textarea: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 8, 
    padding: 12,
    minHeight: 80
  },
  textareaPlaceholder: { color: '#9CA3AF', fontSize: 14 },
  priceSection: { 
    backgroundColor: '#EFF6FF', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { color: '#6B7280', fontSize: 13 },
  priceValue: { fontWeight: '600', color: '#1F2937' },
  priceDivider: { height: 1, backgroundColor: '#D1D5DB', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  totalPrice: { fontSize: 20, fontWeight: '700', color: '#1D4ED8' },
  confirmBtn: { 
    backgroundColor: '#1D4ED8', 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center',
    marginBottom: 12
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { 
    backgroundColor: '#F3F4F6', 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center'
  },
  cancelBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    paddingBottom: 20
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  closeBtn: { fontSize: 24, color: '#6B7280', fontWeight: 'bold' },
});