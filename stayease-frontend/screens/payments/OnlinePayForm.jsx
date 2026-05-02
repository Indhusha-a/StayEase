import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import paymentStyles from './paymentStyles';

const onlyDigits = (value = '') => value.replace(/\D/g, '');

const formatCardNumber = (value) => {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(' ') || digits;
};

const formatExpiry = (value) => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const isValidExpiry = (value) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(value);

export default function OnlinePayForm({ processing, onPayNow }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');

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

      {error ? <Text style={paymentStyles.fieldError}>{error}</Text> : null}

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
