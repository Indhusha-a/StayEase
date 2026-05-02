import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import paymentStyles from './paymentStyles';

const badgeColor = (status) => {
  if (status === 'Paid') return '#DCFCE7';
  if (status === 'Refunded') return '#DBEAFE';
  return '#FEF3C7';
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
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  return (
    <View style={paymentStyles.container}>
      <FlatList
        contentContainerStyle={paymentStyles.scroll}
        data={payments}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />}
        ListHeaderComponent={(
          <View style={paymentStyles.header}>
            <Text style={paymentStyles.title}>{user?.role === 'admin' ? 'All Payments' : 'My Payments'}</Text>
            <Text style={paymentStyles.subtitle}>Track payment history with status badges.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={paymentStyles.card} onPress={() => navigation.navigate('PaymentReceipt', { paymentId: item._id })}>
            <View style={paymentStyles.row}>
              <Text style={paymentStyles.label}>Amount</Text>
              <Text style={paymentStyles.value}>${Number(item.amount || 0).toFixed(2)}</Text>
            </View>
            <View style={paymentStyles.row}>
              <Text style={paymentStyles.label}>Method</Text>
              <Text style={paymentStyles.value}>{item.paymentMethod}</Text>
            </View>
            <View style={paymentStyles.row}>
              <Text style={paymentStyles.label}>Date</Text>
              <Text style={paymentStyles.value}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
            </View>
            <View style={[paymentStyles.statusBadge, { backgroundColor: badgeColor(item.status) }]}>
              <Text style={paymentStyles.statusText}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={paymentStyles.emptyText}>No payments found.</Text>}
      />
    </View>
  );
}
