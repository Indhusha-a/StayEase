import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import api from '../../utils/api';
import paymentStyles from './paymentStyles';

const badgeColor = (status) => {
  if (status === 'Paid') return { backgroundColor: '#dcfce7', color: '#15803d' };
  if (status === 'Refunded') return { backgroundColor: '#f1f5f9', color: '#475569' };
  return { backgroundColor: '#fef3c7', color: '#b45309' };
};

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
    return (
      <View style={paymentStyles.centered}>
        <ActivityIndicator size="large" color="#0037b0" />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={paymentStyles.centered}>
        <Text style={paymentStyles.emptyText}>Payment not found.</Text>
      </View>
    );
  }

  const badge = badgeColor(payment.status);

  return (
    <ScrollView style={paymentStyles.container} contentContainerStyle={paymentStyles.scroll}>
      <View style={paymentStyles.header}>
        <Text style={paymentStyles.title}>Payment Receipt</Text>
        <Text style={paymentStyles.subtitle}>Full transaction details for this payment record.</Text>
      </View>

      <View style={paymentStyles.heroPanel}>
        <View style={paymentStyles.heroCircle1} />
        <View style={paymentStyles.heroCircle2} />
        <Text style={paymentStyles.heroEyebrow}>Receipt Total</Text>
        <Text style={paymentStyles.heroValue}>${Number(payment.amount || 0).toFixed(2)}</Text>
        <Text style={paymentStyles.heroSubValue}>
          Payment ID #{payment._id?.slice(-6).toUpperCase()} submitted on {new Date(payment.paymentDate).toLocaleDateString()}.
        </Text>
      </View>

      <View style={paymentStyles.card}>
        <Text style={paymentStyles.sectionTitle}>Transaction Details</Text>
        <View style={paymentStyles.row}>
          <View style={paymentStyles.rowBlock}>
            <Text style={paymentStyles.label}>Booking ID</Text>
            <Text style={paymentStyles.valueStrong}>{payment.bookingId?._id || payment.bookingId}</Text>
          </View>
          <View style={[paymentStyles.rowBlock, { alignItems: 'flex-end' }]}>
            <Text style={paymentStyles.label}>Status</Text>
            <View style={[paymentStyles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
              <Text style={[paymentStyles.statusText, { color: badge.color }]}>{payment.status}</Text>
            </View>
          </View>
        </View>

        <View style={paymentStyles.divider} />

        <View style={paymentStyles.row}>
          <View style={paymentStyles.rowBlock}>
            <Text style={paymentStyles.label}>Method</Text>
            <Text style={paymentStyles.value}>{payment.paymentMethod}</Text>
          </View>
          <View style={paymentStyles.rowBlock}>
            <Text style={paymentStyles.label}>Reference</Text>
            <Text style={paymentStyles.value}>{payment.transactionReference || 'N/A'}</Text>
          </View>
        </View>

        <View style={paymentStyles.row}>
          <View style={paymentStyles.rowBlock}>
            <Text style={paymentStyles.label}>Date</Text>
            <Text style={paymentStyles.value}>{new Date(payment.paymentDate).toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={paymentStyles.card}>
        <Text style={paymentStyles.sectionTitle}>Notes</Text>
        <View style={paymentStyles.notesBox}>
          <Text style={paymentStyles.value}>{payment.notes || 'N/A'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
