import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import paymentStyles from './paymentStyles';
import OnlinePayForm from './OnlinePayForm';
import BankTransferForm from './BankTransferForm';

const METHODS = [
  {
    key: 'Cash',
    title: 'Cash',
    hint: 'Pay directly at the property.',
    icon: 'cash'
  },
  {
    key: 'Online Pay',
    title: 'Online Pay',
    hint: 'Simulated card checkout flow.',
    icon: 'credit-card-outline'
  },
  {
    key: 'Bank Transfer',
    title: 'Bank Transfer',
    hint: 'Upload JPG, PNG, or PDF slip.',
    icon: 'bank-transfer-out'
  }
];

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export default function PaymentScreen({ route, navigation }) {
  const booking = route.params?.booking || {};
  const bookingId = route.params?.bookingId || booking?._id;
  const amount = route.params?.amount ?? booking?.totalPrice ?? 0;

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionReference, setTransactionReference] = useState('');
  const [slipUrl, setSlipUrl] = useState('');
  const [slipFileName, setSlipFileName] = useState('');
  const [slipUploading, setSlipUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingOnlinePay, setProcessingOnlinePay] = useState(false);

  const amountText = useMemo(() => Number(amount || 0).toFixed(2), [amount]);

  const submitPayment = async ({
    methodOverride,
    referenceOverride,
    slipUrlOverride
  } = {}) => {
    if (!bookingId) {
      Alert.alert('Missing booking', 'Booking ID is required to submit payment.');
      return false;
    }

    try {
      setLoading(true);
      const res = await api.post('/payments', {
        bookingId,
        amount: Number(amount),
        paymentMethod: methodOverride || paymentMethod,
        transactionReference: (referenceOverride ?? transactionReference).trim() || undefined,
        slipUrl: (slipUrlOverride ?? slipUrl) || undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Payment submitted successfully.');
      navigation.replace('PaymentReceipt', { paymentId: res.data._id });
      return true;
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.message || 'Unable to submit payment');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCashOrTransferSubmit = async () => {
    if (paymentMethod === 'Bank Transfer' && !slipUrl) {
      Alert.alert('Slip Required', 'Upload a transfer slip before submitting this payment.');
      return;
    }

    await submitPayment();
  };

  const handleOnlinePay = async () => {
    if (!bookingId) {
      Alert.alert('Missing booking', 'Booking ID is required to submit payment.');
      return;
    }

    try {
      setProcessingOnlinePay(true);
      await sleep(2000);

      const generatedReference = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setTransactionReference(generatedReference);

      await submitPayment({
        methodOverride: 'Online Pay',
        referenceOverride: generatedReference,
      });
    } finally {
      setProcessingOnlinePay(false);
    }
  };

  return (
    <KeyboardAvoidingView style={paymentStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={paymentStyles.scroll}>
        <View style={paymentStyles.header}>
          <Text style={paymentStyles.title}>Make Payment</Text>
          <Text style={paymentStyles.subtitle}>Complete payment for your approved booking.</Text>
        </View>

        <View style={paymentStyles.heroPanel}>
          <View style={paymentStyles.heroCircle1} />
          <View style={paymentStyles.heroCircle2} />
          <Text style={paymentStyles.heroEyebrow}>Amount Due</Text>
          <Text style={paymentStyles.heroValue}>${amountText}</Text>
          <Text style={paymentStyles.heroSubValue}>
            Room {booking?.roomId?.roomNumber || booking?.roomName || 'N/A'} from {booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A'} to {booking?.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}.
          </Text>
        </View>

        <View style={paymentStyles.card}>
          <Text style={paymentStyles.sectionTitle}>Booking Summary</Text>
          <View style={paymentStyles.row}>
            <View style={paymentStyles.rowBlock}>
              <Text style={paymentStyles.label}>Room</Text>
              <Text style={paymentStyles.valueStrong}>{booking?.roomId?.roomNumber || booking?.roomName || 'N/A'}</Text>
            </View>
            <View style={paymentStyles.rowBlock}>
              <Text style={paymentStyles.label}>Booking ID</Text>
              <Text style={paymentStyles.value}>{bookingId || 'N/A'}</Text>
            </View>
          </View>
          <View style={paymentStyles.row}>
            <View style={paymentStyles.rowBlock}>
              <Text style={paymentStyles.label}>Check-in</Text>
              <Text style={paymentStyles.value}>{booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={paymentStyles.rowBlock}>
              <Text style={paymentStyles.label}>Check-out</Text>
              <Text style={paymentStyles.value}>{booking?.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={paymentStyles.card}>
          <Text style={paymentStyles.sectionTitle}>Payment Details</Text>

          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Amount</Text>
            <TextInput style={[paymentStyles.input, paymentStyles.inputReadonly]} editable={false} value={amountText} />
          </View>

          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Payment Method</Text>
            <View style={paymentStyles.methodCards}>
              {METHODS.map((method) => {
                const isActive = paymentMethod === method.key;

                return (
                <TouchableOpacity
                  key={method.key}
                  style={[paymentStyles.methodCard, isActive && paymentStyles.methodCardActive]}
                  onPress={() => setPaymentMethod(method.key)}
                  activeOpacity={0.85}
                >
                  <View style={[paymentStyles.methodIconWrap, isActive && paymentStyles.methodIconWrapActive]}>
                    <MaterialCommunityIcons
                      name={method.icon}
                      size={20}
                      color={isActive ? '#0037b0' : '#434655'}
                    />
                  </View>
                  <View style={paymentStyles.methodTextBlock}>
                    <Text style={[paymentStyles.methodTitle, isActive && paymentStyles.methodTitleActive]}>
                      {method.title}
                    </Text>
                    <Text style={[paymentStyles.methodHint, isActive && paymentStyles.methodHintActive]}>
                      {method.hint}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            </View>
          </View>

          {paymentMethod === 'Online Pay' ? (
            <OnlinePayForm
              processing={processingOnlinePay || loading}
              onPayNow={handleOnlinePay}
            />
          ) : null}

          {paymentMethod === 'Bank Transfer' ? (
            <BankTransferForm
              slipUrl={slipUrl}
              slipFileName={slipFileName}
              onUploadingStateChange={setSlipUploading}
              onUploadSuccess={({ slipUrl: uploadedUrl, fileName }) => {
                setSlipUrl(uploadedUrl);
                setSlipFileName(fileName);
              }}
              onClearSlip={() => {
                setSlipUrl('');
                setSlipFileName('');
              }}
            />
          ) : null}

          {paymentMethod !== 'Online Pay' ? (
            <View style={paymentStyles.fieldWrapper}>
              <Text style={paymentStyles.label}>Transaction Reference (Optional)</Text>
              <TextInput
                style={paymentStyles.input}
                value={transactionReference}
                onChangeText={setTransactionReference}
                placeholder="e.g. TXN-12345"
                placeholderTextColor="#747686"
              />
            </View>
          ) : null}

          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Notes (Optional)</Text>
            <TextInput
              style={[paymentStyles.input, { minHeight: 90, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Any payment note..."
              placeholderTextColor="#747686"
            />
          </View>

          {paymentMethod !== 'Online Pay' ? (
            <TouchableOpacity
              style={[paymentStyles.button, (loading || slipUploading) && paymentStyles.buttonDisabled]}
              disabled={loading || slipUploading}
              onPress={handleCashOrTransferSubmit}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={paymentStyles.buttonText}>Submit Payment</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
