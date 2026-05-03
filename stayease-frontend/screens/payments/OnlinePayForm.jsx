import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import paymentStyles from './paymentStyles';

// ---------------------------------------------------------------------------
// onlyDigits
// ---------------------------------------------------------------------------
// Strips all non-numeric characters from card-related inputs.
// ---------------------------------------------------------------------------
const onlyDigits = (value = '') => value.replace(/\D/g, '');

// Formats a 16-digit card number as groups of 4 for readability.
const formatCardNumber = (value) => {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(' ') || digits;
};

// Formats 4 digits into MM/YY display form.
const formatExpiry = (value) => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

// Demo form validation: checks only the shape, not a real expiry date window.
const isValidExpiry = (value) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(value);

// ---------------------------------------------------------------------------
// OnlinePayForm
// ---------------------------------------------------------------------------
// Child form rendered by PaymentScreen for the "Online Pay" flow.
// It owns local card-input state and only calls onPayNow() after validation.
// ---------------------------------------------------------------------------
export default function OnlinePayForm({ processing, onPayNow }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');

  // Returns the first validation error found, or an empty string if valid.
  const validate = () => {
    if (onlyDigits(cardNumber).length !== 16) {
      return 'Enter a valid 16-digit card number.';
    }

    if (!cardholderName.trim()) {
      return 'Cardholder name is required.';
    }

    if (!isValidExpiry(expiry)) {
      return 'Enter expiry in MM/YY format.';
    }

    const cvvDigits = onlyDigits(cvv);
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      return 'Enter a valid 3 or 4 digit CVV.';
    }

    return '';
  };

  // Parent submit callback is only invoked after local validation passes.
  const handlePayNow = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    await onPayNow();
  };

  return (
    <View style={paymentStyles.methodFormSection}>
      <Text style={paymentStyles.methodFormTitle}>Card Details</Text>
      <Text style={paymentStyles.methodFormHint}>
        Demo flow only. Card details are not saved.
      </Text>

      {/* Card number with live 4-digit spacing */}
      <View style={paymentStyles.fieldWrapper}>
        <Text style={paymentStyles.label}>Card Number</Text>
        <TextInput
          style={paymentStyles.input}
          value={cardNumber}
          onChangeText={(value) => setCardNumber(formatCardNumber(value))}
          keyboardType="number-pad"
          maxLength={19}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor="#747686"
        />
      </View>

      {/* Cardholder name stays as free text */}
      <View style={paymentStyles.fieldWrapper}>
        <Text style={paymentStyles.label}>Cardholder Name</Text>
        <TextInput
          style={paymentStyles.input}
          value={cardholderName}
          onChangeText={setCardholderName}
          autoCapitalize="words"
          placeholder="Name on card"
          placeholderTextColor="#747686"
        />
      </View>

      {/* Expiry and CVV share one row like a checkout form */}
      <View style={paymentStyles.cardMetaRow}>
        <View style={[paymentStyles.fieldWrapper, paymentStyles.cardMetaBlock]}>
          <Text style={paymentStyles.label}>Expiry</Text>
          <TextInput
            style={paymentStyles.input}
            value={expiry}
            onChangeText={(value) => setExpiry(formatExpiry(value))}
            keyboardType="number-pad"
            maxLength={5}
            placeholder="MM/YY"
            placeholderTextColor="#747686"
          />
        </View>

        <View style={[paymentStyles.fieldWrapper, paymentStyles.cardMetaBlock]}>
          <Text style={paymentStyles.label}>CVV</Text>
          <TextInput
            style={paymentStyles.input}
            value={cvv}
            onChangeText={(value) => setCvv(onlyDigits(value).slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="123"
            placeholderTextColor="#747686"
          />
        </View>
      </View>

      {/* Inline validation feedback */}
      {error ? <Text style={paymentStyles.fieldError}>{error}</Text> : null}

      {/* Submit button state is controlled by the parent via `processing` */}
      <TouchableOpacity
        style={[paymentStyles.button, processing && paymentStyles.buttonDisabled]}
        onPress={handlePayNow}
        disabled={processing}
        activeOpacity={0.85}
      >
        {processing ? (
          <View style={paymentStyles.processingRow}>
            <ActivityIndicator color="#fff" />
            <Text style={paymentStyles.processingText}>Processing payment...</Text>
          </View>
        ) : (
          <Text style={paymentStyles.buttonText}>Pay Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
