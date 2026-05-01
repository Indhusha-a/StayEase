import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useBooking } from '../../context/BookingContext';

export default function CreateBookingScreen({ route, navigation }) {
  const { roomId, pricePerNight } = route.params || {};
  const { createBooking, loading } = useBooking();

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Calculate price when dates change
  const calculatePrice = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn).getTime();
      const checkOutTime = new Date(checkOut).getTime();
      const nights = Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24));
      if (nights > 0) {
        const price = nights * pricePerNight;
        setTotalPrice(price);
      }
    }
  };

  const handleCheckInChange = (date) => {
    setCheckInDate(date);
    calculatePrice(date, checkOutDate);
  };

  const handleCheckOutChange = (date) => {
    setCheckOutDate(date);
    calculatePrice(checkInDate, date);
  };

  const handleSubmit = async () => {
    // Validation
    if (!checkInDate || !checkOutDate || !numberOfGuests) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      Alert.alert('Invalid Dates', 'Check-out date must be after check-in date');
      return;
    }

    if (numberOfGuests <= 0 || isNaN(numberOfGuests)) {
      Alert.alert('Invalid Guests', 'Number of guests must be greater than 0');
      return;
    }

    try {
      const bookingData = {
        roomId,
        checkInDate,
        checkOutDate,
        numberOfGuests: parseInt(numberOfGuests),
        specialRequests: specialRequests || '',
      };

      await createBooking(bookingData);
      Alert.alert('Success', 'Booking created successfully!', [
        {
          text: 'View My Bookings',
          onPress: () => navigation.navigate('Bookings', {
            screen: 'BookingList'
        })
        },
      ]);
    } catch (error) {
     console.log('Booking error:', error);
     navigation.navigate('Bookings', { 
    screen: 'BookingList' 
  });
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1D4ED8', marginBottom: 4 }}>
          Create Booking
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280' }}>
          PKR {pricePerNight}/night
        </Text>
      </View>

      {/* Form */}
      <View style={{ padding: 16 }}>
        {/* Check-In Date */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
            Check-In Date *
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#1F2937',
              backgroundColor: '#F9FAFB',
            }}
            placeholder="YYYY-MM-DD (e.g., 2026-05-20)"
            placeholderTextColor="#9CA3AF"
            value={checkInDate}
            onChangeText={handleCheckInChange}
          />
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Format: YYYY-MM-DD</Text>
        </View>

        {/* Check-Out Date */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
            Check-Out Date *
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#1F2937',
              backgroundColor: '#F9FAFB',
            }}
            placeholder="YYYY-MM-DD (e.g., 2026-05-22)"
            placeholderTextColor="#9CA3AF"
            value={checkOutDate}
            onChangeText={handleCheckOutChange}
          />
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Format: YYYY-MM-DD</Text>
        </View>

        {/* Number of Guests */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
            Number of Guests *
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#1F2937',
              backgroundColor: '#F9FAFB',
            }}
            placeholder="e.g., 2"
            placeholderTextColor="#9CA3AF"
            value={numberOfGuests}
            onChangeText={setNumberOfGuests}
            keyboardType="numeric"
          />
        </View>

        {/* Special Requests */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
            Special Requests (Optional)
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#1F2937',
              backgroundColor: '#F9FAFB',
              height: 100,
              textAlignVertical: 'top',
            }}
            placeholder="e.g., High floor preferred, extra pillows, etc."
            placeholderTextColor="#9CA3AF"
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
          />
        </View>

        {/* Price Summary */}
        {totalPrice > 0 && (
          <View style={{ backgroundColor: '#EFF6FF', padding: 16, borderRadius: 8, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Nights</Text>
              <Text style={{ fontWeight: '600', color: '#1F2937' }}>
                {Math.ceil(
                  (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
                )}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Price per Night</Text>
              <Text style={{ fontWeight: '600', color: '#1F2937' }}>PKR {pricePerNight}</Text>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: '#D1D5DB',
                marginTop: 8,
                paddingTop: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1D4ED8' }}>Total</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#1D4ED8' }}>
                  PKR {totalPrice}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#1D4ED8',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 8,
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center', fontSize: 16 }}>
            {loading ? 'Creating Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#E5E7EB',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 8,
          }}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={{ color: '#1F2937', fontWeight: '700', textAlign: 'center', fontSize: 16 }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
