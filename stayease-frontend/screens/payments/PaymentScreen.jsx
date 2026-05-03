import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import paymentStyles from './paymentStyles';
import OnlinePayForm from './OnlinePayForm';
import BankTransferForm from './BankTransferForm';

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------
// Source of truth for the selectable payment-method cards.
// ---------------------------------------------------------------------------
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

// Small helper used to simulate a short processing delay for demo card payments.
const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

// ---------------------------------------------------------------------------
// PaymentScreen
// ---------------------------------------------------------------------------
// Main guest payment screen for an approved booking.
// It coordinates the shared submit flow plus the two child method forms:
//   OnlinePayForm    -> card demo flow
//   BankTransferForm -> slip upload flow
// ---------------------------------------------------------------------------
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

  // Readonly amount string reused in the hero and the disabled amount input.
  const amountText = useMemo(() => Number(amount || 0).toFixed(2), [amount]);

  // Shared POST /payments request for all payment methods.
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

  // Cash and bank transfer both use the outer "Submit Payment" button.
  const handleCashOrTransferSubmit = async () => {
    if (paymentMethod === 'Bank Transfer' && !slipUrl) {
      Alert.alert('Slip Required', 'Upload a transfer slip before submitting this payment.');
      return;
    }

    await submitPayment();
  };

  // Online Pay adds a generated transaction reference before submitting.
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
        {/* Page header */}
        <View style={paymentStyles.header}>
          <Text style={paymentStyles.title}>Make Payment</Text>
          <Text style={paymentStyles.subtitle}>Complete payment for your approved booking.</Text>
        </View>

        {/* Booking + amount summary hero */}
        <View style={paymentStyles.heroPanel}>
          <View style={paymentStyles.heroCircle1} />
          <View style={paymentStyles.heroCircle2} />
          <Text style={paymentStyles.heroEyebrow}>Amount Due</Text>
          <Text style={paymentStyles.heroValue}>${amountText}</Text>
          <Text style={paymentStyles.heroSubValue}>
            Room {booking?.roomId?.roomNumber || booking?.roomName || 'N/A'} from {booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A'} to {booking?.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}.
          </Text>
        </View>

        {/* Read-only booking details for context before payment */}
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

          {/* Amount is fixed to the booking total and cannot be edited here */}
          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Amount</Text>
            <TextInput style={[paymentStyles.input, paymentStyles.inputReadonly]} editable={false} value={amountText} />
          </View>

          {/* Selecting a method controls which child form and submit flow appears */}
          <View style={paymentStyles.fieldWrapper}>
            <Text style={paymentStyles.label}>Payment Method</Text>
            <View style={paymentStyles.methodCards}>
              {METHODS.map((method) => {
                const isActive = paymentMethod === method.key;
                return (
                // Card press updates the local paymentMethod state only.
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

          {/*
           * ─────────────────────────────────────────────────────────────────
           * RENDERING SECTION 1 — Online Pay form (card details)
           * ─────────────────────────────────────────────────────────────────
           * Shown exclusively when the user selects "Online Pay".
           *
           * OnlinePayForm renders four inputs: card number, cardholder name,
           * expiry (MM/YY), and CVV. It validates all fields internally before
           * calling the onPayNow prop.
           *
           * onPayNow triggers handleOnlinePay() in this screen, which:
           *   1. Simulates a 2-second processing delay (sleep(2000))
           *   2. Auto-generates a unique transaction reference (TXN-timestamp-random)
           *   3. Calls submitPayment() with methodOverride = 'Online Pay'
           *      and referenceOverride = the generated reference
           *
           * The `processing` prop receives (processingOnlinePay || loading) so
           * the button inside OnlinePayForm shows a spinner and is disabled
           * during both the fake processing delay and the actual API call.
           *
           * Note: Cash and Bank Transfer use a separate "Submit Payment" button
           * (Section 3 below). Online Pay manages its own submit button inside
           * OnlinePayForm, which is why this section has no sibling button.
           * ─────────────────────────────────────────────────────────────────
           */}
          {paymentMethod === 'Online Pay' ? (
            <OnlinePayForm
              processing={processingOnlinePay || loading}
              onPayNow={handleOnlinePay}
            />
          ) : null}

          {/*
           * ─────────────────────────────────────────────────────────────────
           * RENDERING SECTION 2 — Bank Transfer form (slip upload)
           * ─────────────────────────────────────────────────────────────────
           * Shown exclusively when the user selects "Bank Transfer".
           *
           * BankTransferForm lets the user pick a file (JPG, PNG, or PDF up
           * to 5MB) using expo-document-picker. On selection it immediately
           * POSTs the file as multipart/form-data to POST /payments/upload-slip,
           * which runs it through Multer (saved locally) then uploads to
           * Cloudinary, returning a secure URL.
           *
           * Props:
           *   slipUrl / slipFileName  — controlled state held here in
           *                             PaymentScreen so submitPayment() can
           *                             read the URL when the guest submits.
           *
           *   onUploadSuccess         — called with { slipUrl, fileName } once
           *                             Cloudinary responds; updates slipUrl and
           *                             slipFileName state here.
           *
           *   onClearSlip             — resets both slipUrl and slipFileName to
           *                             empty strings, allowing the guest to
           *                             re-upload a different file.
           *
           *   onUploadingStateChange  — syncs the slipUploading boolean here so
           *                             the Submit Payment button (Section 3)
           *                             stays disabled while the upload is in
           *                             flight, preventing an early submit before
           *                             the Cloudinary URL is ready.
           *
           * If the guest presses Submit Payment (Section 3) without uploading,
           * handleCashOrTransferSubmit() blocks with an alert: "Slip Required".
           * ─────────────────────────────────────────────────────────────────
           */}
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

          {/*
           * Transaction Reference input — hidden for Online Pay because the
           * reference is auto-generated inside handleOnlinePay(). For Cash and
           * Bank Transfer the guest may optionally enter one manually.
           */}
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

          {/* Optional free-form note stored with the payment record */}
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

          {/*
           * ─────────────────────────────────────────────────────────────────
           * RENDERING SECTION 3 — Submit Payment button (Cash + Bank Transfer)
           * ─────────────────────────────────────────────────────────────────
           * Hidden for Online Pay because OnlinePayForm (Section 1) contains
           * its own "Pay Now" button. This button is only needed for Cash and
           * Bank Transfer, which have no inner form component with a submit.
           *
           * Disabled states — the button is greyed out (opacity 0.72) when:
           *   loading      — the POST /payments API call is in flight
           *   slipUploading — a Bank Transfer slip upload to Cloudinary is still
           *                   in progress (slipUrl not yet available)
           *
           * On press it calls handleCashOrTransferSubmit(), which:
           *   • For Bank Transfer: checks slipUrl is non-empty, alerts if not
           *   • For both methods:  calls submitPayment() → POST /payments
           *                        → on success, navigates to PaymentReceiptScreen
           *
           * While loading is true the button body swaps from the "Submit
           * Payment" label to an ActivityIndicator spinner so the guest knows
           * the request is in flight.
           * ─────────────────────────────────────────────────────────────────
           */}
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
