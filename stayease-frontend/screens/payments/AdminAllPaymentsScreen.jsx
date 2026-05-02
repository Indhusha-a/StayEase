import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import paymentStyles from './paymentStyles';

export default function AdminAllPaymentsScreen({ navigation }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPayments(); }, []));

  const updateStatus = async (paymentId, status) => {
    try {
      await api.put(`/payments/${paymentId}/status`, { status });
      fetchPayments();
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Unable to update status');
    }
  };

  if (user?.role !== 'admin') {
    return <View style={paymentStyles.container}><Text style={paymentStyles.emptyText}>Access denied.</Text></View>;
  }

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
            <Text style={paymentStyles.title}>Admin Payments</Text>
            <Text style={paymentStyles.subtitle}>Manage payment statuses and review transactions.</Text>
            <TouchableOpacity style={paymentStyles.button} onPress={() => navigation.navigate('RevenueSummary')}>
              <Text style={paymentStyles.buttonText}>Open Revenue Summary</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={paymentStyles.card}>
            <View style={paymentStyles.row}><Text style={paymentStyles.label}>User</Text><Text style={paymentStyles.value}>{item.userId?.name || item.userId?.email || 'N/A'}</Text></View>
            <View style={paymentStyles.row}><Text style={paymentStyles.label}>Amount</Text><Text style={paymentStyles.value}>${Number(item.amount || 0).toFixed(2)}</Text></View>
            <View style={paymentStyles.row}><Text style={paymentStyles.label}>Status</Text><Text style={paymentStyles.value}>{item.status}</Text></View>
            <TouchableOpacity style={paymentStyles.pill} onPress={() => updateStatus(item._id, 'Paid')}>
              <Text style={paymentStyles.pillText}>Mark as Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={paymentStyles.pill} onPress={() => updateStatus(item._id, 'Refunded')}>
              <Text style={paymentStyles.pillText}>Mark as Refunded</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
