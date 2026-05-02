import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import paymentStyles from './paymentStyles';

const badgeColor = (status) => {
  if (status === 'Paid') return { backgroundColor: '#dcfce7', color: '#15803d' };
  if (status === 'Refunded') return { backgroundColor: '#f1f5f9', color: '#475569' };
  return { backgroundColor: '#fef3c7', color: '#b45309' };
};

export default function MyPaymentsScreen({ navigation }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/payments' : '/payments/my';
      const res = await api.get(endpoint);
      setPayments(res.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [user?.role])
  );

  if (loading) {
    return (
      <View style={paymentStyles.centered}>
        <ActivityIndicator size="large" color="#0037b0" />
      </View>
    );
  }

  return (
    <View style={paymentStyles.container}>
      <FlatList
        contentContainerStyle={paymentStyles.scroll}
        data={payments}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPayments();
            }}
            tintColor="#0037b0"
          />
        }
        ListHeaderComponent={(
          <View>
            <View style={paymentStyles.header}>
              <Text style={paymentStyles.title}>{user?.role === 'admin' ? 'All Payments' : 'My Payments'}</Text>
              <Text style={paymentStyles.subtitle}>Track payment history with status badges and receipt access.</Text>
            </View>

            <View style={paymentStyles.heroPanel}>
              <View style={paymentStyles.heroCircle1} />
              <View style={paymentStyles.heroCircle2} />
              <Text style={paymentStyles.heroEyebrow}>Payment Overview</Text>
              <Text style={paymentStyles.heroValue}>{payments.length} transaction{payments.length !== 1 ? 's' : ''}</Text>
              <Text style={paymentStyles.heroSubValue}>Tap any payment to open the full receipt.</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          const badge = badgeColor(item.status);

          return (
            <TouchableOpacity
              style={paymentStyles.card}
              onPress={() => navigation.navigate('PaymentReceipt', { paymentId: item._id })}
              activeOpacity={0.85}
            >
              <View style={paymentStyles.listCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={paymentStyles.listCardTitle}>{item.paymentMethod}</Text>
                  <Text style={paymentStyles.listCardSubtitle}>
                    Payment ID #{item._id?.slice(-6).toUpperCase()}
                  </Text>
                </View>

                <View style={paymentStyles.statusBadge}>
                  <View style={[paymentStyles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
                    <Text style={[paymentStyles.statusText, { color: badge.color }]}>{item.status}</Text>
                  </View>
                </View>
              </View>

              <View style={paymentStyles.row}>
                <View style={paymentStyles.rowBlock}>
                  <Text style={paymentStyles.label}>Amount</Text>
                  <Text style={paymentStyles.amount}>${Number(item.amount || 0).toFixed(2)}</Text>
                </View>
                <View style={[paymentStyles.rowBlock, { alignItems: 'flex-end' }]}>
                  <Text style={paymentStyles.label}>Date</Text>
                  <Text style={paymentStyles.valueStrong}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
                  <Text style={paymentStyles.metaText}>
                    {new Date(item.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View style={paymentStyles.divider} />

              <View style={paymentStyles.metaRow}>
                <Text style={paymentStyles.metaText}>Booking: {item.bookingId?._id || item.bookingId || 'N/A'}</Text>
                <Text style={paymentStyles.metaText}>Open receipt</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={(
          <View style={paymentStyles.emptyState}>
            <Text style={paymentStyles.emptyTitle}>No payments found</Text>
            <Text style={paymentStyles.emptyText}>Payments will appear here once you submit them.</Text>
          </View>
        )}
      />
    </View>
  );
}
