import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import paymentStyles from './paymentStyles';

// ---------------------------------------------------------------------------
// AmountCard
// ---------------------------------------------------------------------------
// Reusable summary card for one payment-status bucket.
// ---------------------------------------------------------------------------
const AmountCard = ({ label, amount, hint }) => (
  <View style={paymentStyles.card}>
    <Text style={paymentStyles.sectionTitle}>{label}</Text>
    <Text style={paymentStyles.amountCardValue}>${Number(amount || 0).toFixed(2)}</Text>
    <Text style={paymentStyles.metaText}>{hint}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// RevenueSummaryScreen
// ---------------------------------------------------------------------------
// Admin-only totals page powered by GET /payments/stats.
// ---------------------------------------------------------------------------
export default function RevenueSummaryScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Loads the backend summary object for Paid / Pending / Refunded totals.
  const fetchStats = async () => {
    try {
      const res = await api.get('/payments/stats');
      setStats(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh whenever navigation focuses this screen again.
  useFocusEffect(useCallback(() => { fetchStats(); }, []));

  // Guard against accidental access from non-admin users.
  if (user?.role !== 'admin') {
    return (
      <View style={paymentStyles.centered}>
        <Text style={paymentStyles.emptyText}>Access denied.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={paymentStyles.centered}>
        <ActivityIndicator size="large" color="#0037b0" />
      </View>
    );
  }

  return (
    <ScrollView
      style={paymentStyles.container}
      contentContainerStyle={paymentStyles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchStats();
          }}
          tintColor="#0037b0"
        />
      }
    >
      {/* Page intro */}
      <View style={paymentStyles.header}>
        <Text style={paymentStyles.title}>Revenue Summary</Text>
        <Text style={paymentStyles.subtitle}>Totals grouped by payment status.</Text>
      </View>

      {/* High-level comparison between paid and pending totals */}
      <View style={paymentStyles.statsBanner}>
        <View style={paymentStyles.heroCircle1} />
        <View style={paymentStyles.heroCircle2} />
        <View style={paymentStyles.statsGrid}>
          <View style={paymentStyles.statsBlock}>
            <Text style={paymentStyles.heroEyebrow}>Total Paid</Text>
            <Text style={paymentStyles.heroValue}>${Number(stats?.Paid?.totalAmount || 0).toFixed(2)}</Text>
            <Text style={paymentStyles.heroSubValue}>{stats?.Paid?.count || 0} completed payment{stats?.Paid?.count !== 1 ? 's' : ''}</Text>
          </View>
          <View style={paymentStyles.statsDivider} />
          <View style={paymentStyles.statsBlock}>
            <Text style={paymentStyles.heroEyebrow}>Outstanding</Text>
            <Text style={paymentStyles.heroValue}>${Number(stats?.Pending?.totalAmount || 0).toFixed(2)}</Text>
            <Text style={paymentStyles.heroSubValue}>{stats?.Pending?.count || 0} pending payment{stats?.Pending?.count !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Full three-status breakdown */}
      <View style={paymentStyles.summaryGrid}>
        <AmountCard label="Total Paid" amount={stats?.Paid?.totalAmount} hint={`${stats?.Paid?.count || 0} payment records`} />
        <AmountCard label="Total Pending" amount={stats?.Pending?.totalAmount} hint={`${stats?.Pending?.count || 0} payment records`} />
        <AmountCard label="Total Refunded" amount={stats?.Refunded?.totalAmount} hint={`${stats?.Refunded?.count || 0} payment records`} />
      </View>
    </ScrollView>
  );
}
