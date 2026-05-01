import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import paymentStyles from './paymentStyles';

const AmountCard = ({ label, amount }) => (
  <View style={paymentStyles.card}>
    <Text style={paymentStyles.label}>{label}</Text>
    <Text style={[paymentStyles.title, { textAlign: 'left' }]}>${Number(amount || 0).toFixed(2)}</Text>
  </View>
);

export default function RevenueSummaryScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/payments/stats');
      setStats(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, []));

  if (user?.role !== 'admin') {
    return <View style={paymentStyles.container}><Text style={paymentStyles.emptyText}>Access denied.</Text></View>;
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  return (
    <ScrollView
      style={paymentStyles.container}
      contentContainerStyle={paymentStyles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />}
    >
      <View style={paymentStyles.header}>
        <Text style={paymentStyles.title}>Revenue Summary</Text>
        <Text style={paymentStyles.subtitle}>Totals grouped by payment status.</Text>
      </View>
      <AmountCard label="Total Paid" amount={stats?.Paid?.totalAmount} />
      <AmountCard label="Total Pending" amount={stats?.Pending?.totalAmount} />
      <AmountCard label="Total Refunded" amount={stats?.Refunded?.totalAmount} />
    </ScrollView>
  );
}
