import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import api from '../../utils/api';
import paymentStyles from './paymentStyles';

export default function PaymentReceiptScreen({ route }) {
  const { paymentId } = route.params;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/payments/${paymentId}`);
        setPayment(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [paymentId]);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  if (!payment) {
    return <View style={paymentStyles.container}><Text style={paymentStyles.emptyText}>Payment not found.</Text></View>;
  }

  return (
    <ScrollView style={paymentStyles.container} contentContainerStyle={paymentStyles.scroll}>
      <View style={paymentStyles.header}>
        <Text style={paymentStyles.title}>Payment Receipt</Text>
        <Text style={paymentStyles.subtitle}>Full transaction details.</Text>
      </View>
      <View style={paymentStyles.card}>
        <View style={paymentStyles.row}><Text style={paymentStyles.label}>Booking ID</Text><Text style={paymentStyles.value}>{payment.bookingId?._id || payment.bookingId}</Text></View>
        <View style={paymentStyles.row}><Text style={paymentStyles.label}>Amount</Text><Text style={paymentStyles.value}>${Number(payment.amount || 0).toFixed(2)}</Text></View>
        <View style={paymentStyles.row}><Text style={paymentStyles.label}>Method</Text><Text style={paymentStyles.value}>{payment.paymentMethod}</Text></View>
        <View style={paymentStyles.row}><Text style={paymentStyles.label}>Reference</Text><Text style={paymentStyles.value}>{payment.transactionReference || 'N/A'}</Text></View>
        <View style={paymentStyles.row}><Text style={paymentStyles.label}>Date</Text><Text style={paymentStyles.value}>{new Date(payment.paymentDate).toLocaleString()}</Text></View>
        <View style={paymentStyles.row}><Text style={paymentStyles.label}>Status</Text><Text style={paymentStyles.value}>{payment.status}</Text></View>
        <Text style={paymentStyles.label}>Notes</Text>
        <Text style={paymentStyles.value}>{payment.notes || 'N/A'}</Text>
      </View>
    </ScrollView>
  );
}
