import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../utils/api';
import paymentStyles from './paymentStyles';

const METHODS = ['Cash', 'Card', 'Online Transfer'];

export default function PaymentScreen({ route, navigation }) {
  const booking = route.params?.booking || {};
  const bookingId = route.params?.bookingId || booking?._id;
  const amount = route.params?.amount ?? booking?.totalPrice ?? 0;

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const amountText = useMemo(() => Number(amount || 0).toFixed(2), [amount]);

  const handleSubmit = async () => {
    if (!bookingId) {
      Alert.alert('Missing booking', 'Booking ID is required to submit payment.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/payments', {
        bookingId,
        amount: Number(amount),
        paymentMethod,
        transactionReference: transactionReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Payment submitted successfully.');
      navigation.replace('PaymentReceipt', { paymentId: res.data._id });
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.message || 'Unable to submit payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={paymentStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={paymentStyles.scroll}>
        <View style={paymentStyles.header}>
          <Text style={paymentStyles.title}>Make Payment</Text>
          <Text style={paymentStyles.subtitle}>Complete payment for your approved booking.</Text>
        </View>

        <View style={paymentStyles.card}>
          <Text style={paymentStyles.label}>Booking Summary</Text>
          <View style={paymentStyles.row}>
            <Text style={paymentStyles.value}>Room</Text>
            <Text style={paymentStyles.value}>{booking?.roomId?.roomNumber || booking?.roomName || 'N/A'}</Text>
          </View>
          <View style={paymentStyles.row}>
            <Text style={paymentStyles.value}>Check-in</Text>
            <Text style={paymentStyles.value}>{booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A'}</Text>
          </View>
          <View style={paymentStyles.row}>
            <Text style={paymentStyles.value}>Check-out</Text>
            <Text style={paymentStyles.value}>{booking?.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>

        <View style={paymentStyles.card}>
          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Amount</Text>
            <TextInput style={[paymentStyles.input, paymentStyles.inputReadonly]} editable={false} value={amountText} />
          </View>

          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Payment Method</Text>
            {METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={[paymentStyles.pill, paymentMethod === method && paymentStyles.pillActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[paymentStyles.pillText, paymentMethod === method && paymentStyles.pillTextActive]}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Transaction Reference (Optional)</Text>
            <TextInput
              style={paymentStyles.input}
              value={transactionReference}
              onChangeText={setTransactionReference}
              placeholder="e.g. TXN-12345"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Notes (Optional)</Text>
            <TextInput
              style={[paymentStyles.input, { minHeight: 90, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Any payment note..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity style={paymentStyles.button} disabled={loading} onPress={handleSubmit}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={paymentStyles.buttonText}>Submit Payment</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
