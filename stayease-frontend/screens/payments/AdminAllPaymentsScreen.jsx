import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { SERVER_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PRIMARY = '#0037b0';
const PRIMARY_CONT = '#1d4ed8';
const ON_PRI_CONT = '#cad3ff';
const SURFACE = '#faf8ff';
const SURF_CONT_LOW = '#f3f2fe';
const ON_SURFACE = '#1a1b23';
const ON_VARIANT = '#434655';
const OUTLINE = '#747686';
const OUTLINE_VAR = '#c4c5d7';
const SURF_VAR = '#e2e1ed';
const WHITE = '#ffffff';

const PersonIcon = () => (
  <View style={s.personCircle}>
    <View style={s.personHead} />
    <View style={s.personBody} />
  </View>
);

const StatusBadge = ({ status }) => {
  const config = {
    Paid: { bg: '#dcfce7', text: '#15803d', symbol: 'OK' },
    Pending: { bg: '#fef3c7', text: '#b45309', symbol: '...' },
    Refunded: { bg: '#f1f5f9', text: '#475569', symbol: 'R' },
  }[status] || { bg: SURF_VAR, text: ON_VARIANT, symbol: '.' };

  return (
    <View style={[s.badge, { backgroundColor: config.bg }]}>
      <Text style={[s.badgeSymbol, { color: config.text }]}>{config.symbol}</Text>
      <Text style={[s.badgeText, { color: config.text }]}>{status}</Text>
    </View>
  );
};

const PaymentCard = ({ item, onUpdateStatus, onOpenSlip, onDeletePayment, compact }) => {
  const isPaid = item.status === 'Paid';
  const isRefunded = item.status === 'Refunded';
  const canDelete = isPaid || isRefunded;
  const hasSlip = Boolean(item.slipUrl);
  const amountColor = isRefunded ? ON_VARIANT : PRIMARY;

  const formattedDate = item.paymentDate
    ? `${new Date(item.paymentDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} | ${new Date(item.paymentDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '-';

  return (
    <View style={s.card}>
      <View style={[s.cardTop, compact && s.cardTopCompact]}>
        <View style={[s.cardLeft, compact && s.cardLeftCompact]}>
          <PersonIcon />
          <View style={s.cardInfo}>
            <Text style={s.cardName} numberOfLines={1}>
              {item.userId?.name || item.userId?.email || 'Unknown'}
            </Text>
            <Text style={s.cardEmail} numberOfLines={1}>
              {item.userId?.email || ''}
            </Text>
            <View style={s.badgeRow}>
              <StatusBadge status={item.status} />
              <Text style={s.txId}>ID: #{item._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={[s.cardRight, compact && s.cardRightCompact]}>
          <Text style={[s.amount, { color: amountColor }]}>${Number(item.amount || 0).toFixed(2)}</Text>
          <Text style={[s.dateText, compact && s.dateTextCompact]}>{formattedDate}</Text>

          <View style={[s.actionsRow, compact && s.actionsRowCompact]}>
            {isPaid ? (
              <View style={[s.actionBtn, s.actionDisabled, compact && s.actionBtnCompact]}>
                <Text style={s.actionDisabledText}>Mark as Paid</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.actionBtn, s.actionPaid, compact && s.actionBtnCompact, compact && s.actionBtnFill]}
                onPress={() => onUpdateStatus(item._id, 'Paid')}
                activeOpacity={0.85}
              >
                <Text style={s.actionPaidText}>Mark as Paid</Text>
              </TouchableOpacity>
            )}

            {isRefunded ? (
              <View style={[s.actionBtn, s.actionDisabled, compact && s.actionBtnCompact]}>
                <Text style={s.actionDisabledText}>Mark as Refunded</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.actionBtn, s.actionRefund, compact && s.actionBtnCompact, compact && s.actionBtnFill]}
                onPress={() => onUpdateStatus(item._id, 'Refunded')}
                activeOpacity={0.85}
              >
                <Text style={s.actionRefundText}>Mark as Refunded</Text>
              </TouchableOpacity>
            )}

            {hasSlip ? (
              <TouchableOpacity
                style={[s.actionBtn, s.actionSlip, compact && s.actionBtnCompact, compact && s.actionBtnFill]}
                onPress={() => onOpenSlip(item.slipUrl)}
                activeOpacity={0.85}
              >
                <Text style={s.actionSlipText}>View Slip</Text>
              </TouchableOpacity>
            ) : (
              <View style={[s.actionBtn, s.actionDisabled, compact && s.actionBtnCompact]}>
                <Text style={s.actionDisabledText}>No Slip</Text>
              </View>
            )}

            {canDelete ? (
              <TouchableOpacity
                style={[s.actionBtn, s.actionDelete, compact && s.actionBtnCompact, compact && s.actionBtnFill]}
                onPress={() => onDeletePayment(item)}
                activeOpacity={0.85}
              >
                <Text style={s.actionDeleteText}>Delete Payment</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const AnalyticsBanner = ({ payments, compact }) => {
  const totalPaid = payments.filter((payment) => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0);
  const totalPending = payments.filter((payment) => payment.status === 'Pending').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingCount = payments.filter((payment) => payment.status === 'Pending').length;

  return (
    <View style={s.banner}>
      <View style={s.bannerCircle1} />
      <View style={s.bannerCircle2} />
      <View style={[s.bannerGrid, compact && s.bannerGridCompact]}>
        <View style={s.bannerStat}>
          <Text style={s.bannerStatLabel}>Monthly Collection</Text>
          <Text style={s.bannerStatValue}>${totalPaid.toFixed(2)}</Text>
          <Text style={s.bannerStatSub}>Confirmed payments</Text>
        </View>
        <View style={[s.bannerDivider, compact && s.bannerDividerCompact]} />
        <View style={s.bannerStat}>
          <Text style={s.bannerStatLabel}>Outstanding</Text>
          <Text style={s.bannerStatValue}>${totalPending.toFixed(2)}</Text>
          <Text style={s.bannerStatSub}>
            {pendingCount} invoice{pendingCount !== 1 ? 's' : ''} pending
          </Text>
        </View>
        <View style={[s.trendCircle, compact && s.trendCircleCompact]}>
          <Text style={s.trendIcon}>+</Text>
        </View>
      </View>
    </View>
  );
};

export default function AdminAllPaymentsScreen({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 430;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [fetchPayments])
  );

  const updateStatus = async (paymentId, status) => {
    try {
      await api.put(`/payments/${paymentId}/status`, { status });
      fetchPayments();
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Unable to update status');
    }
  };

  const deletePayment = useCallback(
    (payment) => {
      Alert.alert(
        'Delete Payment',
        `Delete this ${payment.status.toLowerCase()} payment? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/payments/${payment._id}`);
                setPayments((prev) => prev.filter((row) => row._id !== payment._id));
              } catch (err) {
                Alert.alert('Delete Failed', err.response?.data?.message || 'Unable to delete payment');
              }
            },
          },
        ]
      );
    },
    []
  );

  const resolveSlipUrl = useCallback((rawUrl = '') => {
    if (!rawUrl) return '';
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    if (rawUrl.startsWith('/')) return `${SERVER_URL}${rawUrl}`;
    return `${SERVER_URL}/${rawUrl}`;
  }, []);

  const buildCloudinaryPdfPreviewUrl = useCallback((url = '') => {
    const isCloudinaryUrl = /res\.cloudinary\.com/i.test(url);
    const isPdf = /\.pdf(?:$|\?)/i.test(url);
    if (!isCloudinaryUrl || !isPdf) return '';

    let previewUrl = url;
    if (previewUrl.includes('/upload/')) {
      previewUrl = previewUrl.replace('/upload/', '/upload/pg_1,f_jpg/');
    }

    return previewUrl.replace(/\.pdf(?=($|\?))/i, '.jpg');
  }, []);

  const openSlip = useCallback(
    async (rawUrl) => {
      const slipUrl = resolveSlipUrl(rawUrl);
      if (!slipUrl) {
        Alert.alert('Slip Missing', 'No uploaded slip found for this payment.');
        return;
      }

      // Cloudinary free plans can block direct PDF delivery.
      // For PDFs, open page-1 JPG preview to keep admin review working.
      const previewUrl = buildCloudinaryPdfPreviewUrl(slipUrl);
      const targetUrl = previewUrl || slipUrl;

      try {
        const supported = await Linking.canOpenURL(targetUrl);
        if (!supported) {
          Alert.alert('Open Failed', 'This slip URL cannot be opened on this device.');
          return;
        }
        await Linking.openURL(targetUrl);
      } catch {
        Alert.alert('Open Failed', 'Unable to open the uploaded slip right now.');
      }
    },
    [buildCloudinaryPdfPreviewUrl, resolveSlipUrl]
  );

  const filteredPayments = useMemo(
    () => (activeFilter === 'All' ? payments : payments.filter((payment) => payment.status === activeFilter)),
    [payments, activeFilter]
  );

  if (user?.role !== 'admin') {
    return (
      <View style={s.centered}>
        <Text style={s.emptyText}>Access denied.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <FlatList
        contentContainerStyle={s.scroll}
        data={filteredPayments}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPayments();
            }}
            tintColor={PRIMARY}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={s.hero}>
              <View style={s.heroText}>
                <Text style={[s.h1, compact && s.h1Compact]}>Admin Payments</Text>
                <Text style={s.heroSubtitle}>
                  Manage payment statuses and review transactions across your entire property portfolio.
                </Text>
              </View>
              <TouchableOpacity
                style={[s.summaryBtn, compact && s.summaryBtnCompact]}
                onPress={() => navigation.navigate('RevenueSummary')}
                activeOpacity={0.85}
              >
                <Text style={s.summaryBtnIcon}>+</Text>
                <Text style={s.summaryBtnText}>Open Revenue Summary</Text>
              </TouchableOpacity>
            </View>

            <View style={s.filterBar}>
              <Text style={s.filterLabel}>FILTER BY:</Text>
              {['All', 'Pending', 'Paid', 'Refunded'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[s.filterPill, activeFilter === filter && s.filterPillActive]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.filterPillText, activeFilter === filter && s.filterPillTextActive]}>
                    {filter === 'All' ? 'All Transactions' : filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No payments found</Text>
            <Text style={s.emptySubtitle}>
              {activeFilter === 'All'
                ? 'Payments will appear here once guests submit them.'
                : `No ${activeFilter.toLowerCase()} payments yet.`}
            </Text>
          </View>
        }
        ListFooterComponent={<AnalyticsBanner payments={payments} compact={compact} />}
        renderItem={({ item }) => (
          <PaymentCard
            item={item}
            onUpdateStatus={updateStatus}
            onOpenSlip={openSlip}
            onDeletePayment={deletePayment}
            compact={compact}
          />
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SURFACE },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SURFACE },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },

  hero: { marginBottom: 20, gap: 16 },
  heroText: { gap: 6 },
  h1: { fontSize: 36, fontWeight: '700', letterSpacing: -0.72, color: ON_SURFACE, lineHeight: 44 },
  h1Compact: { fontSize: 30, lineHeight: 36 },
  heroSubtitle: { fontSize: 16, fontWeight: '400', color: ON_VARIANT, lineHeight: 24 },

  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  summaryBtnCompact: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  summaryBtnIcon: { fontSize: 16, color: WHITE, fontWeight: '700' },
  summaryBtnText: { fontSize: 14, fontWeight: '600', color: WHITE, letterSpacing: 0.1 },

  filterBar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterLabel: { fontSize: 11, fontWeight: '600', color: ON_VARIANT, letterSpacing: 0.8, marginRight: 4 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
  },
  filterPillActive: { backgroundColor: ON_PRI_CONT, borderColor: 'transparent' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: ON_VARIANT },
  filterPillTextActive: { color: PRIMARY_CONT },

  card: { backgroundColor: WHITE, borderRadius: 12, borderWidth: 0.5, borderColor: OUTLINE_VAR, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTopCompact: { flexDirection: 'column' },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1, minWidth: 0 },
  cardLeftCompact: { flex: 0 },

  personCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURF_CONT_LOW,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    paddingTop: 6,
  },
  personHead: { width: 14, height: 14, borderRadius: 7, backgroundColor: PRIMARY, marginBottom: 2 },
  personBody: { width: 22, height: 12, borderRadius: 11, backgroundColor: PRIMARY },

  cardInfo: { flex: 1, gap: 2, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: '600', color: ON_SURFACE, lineHeight: 22 },
  cardEmail: { fontSize: 13, fontWeight: '400', color: ON_VARIANT, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeSymbol: { fontSize: 12, fontWeight: '700' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  txId: { fontSize: 12, color: ON_VARIANT },

  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, flexShrink: 0 },
  cardRightCompact: { alignItems: 'stretch' },
  amount: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  dateText: { fontSize: 11, color: ON_VARIANT, textAlign: 'right' },
  dateTextCompact: { textAlign: 'left' },

  actionsRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  actionsRowCompact: { flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  actionBtnCompact: { minWidth: 120 },
  actionBtnFill: { flexGrow: 1 },
  actionPaid: { backgroundColor: PRIMARY },
  actionPaidText: { fontSize: 12, fontWeight: '600', color: WHITE, textAlign: 'center' },
  actionRefund: { borderWidth: 1, borderColor: OUTLINE, backgroundColor: 'transparent' },
  actionRefundText: { fontSize: 12, fontWeight: '600', color: ON_VARIANT, textAlign: 'center' },
  actionSlip: { borderWidth: 1, borderColor: PRIMARY, backgroundColor: 'transparent' },
  actionSlipText: { fontSize: 12, fontWeight: '600', color: PRIMARY, textAlign: 'center' },
  actionDelete: { backgroundColor: '#dc2626' },
  actionDeleteText: { fontSize: 12, fontWeight: '600', color: WHITE, textAlign: 'center' },
  actionDisabled: { backgroundColor: SURF_VAR, opacity: 0.4 },
  actionDisabledText: { fontSize: 12, fontWeight: '600', color: ON_VARIANT, textAlign: 'center' },

  banner: { backgroundColor: ON_PRI_CONT, borderRadius: 16, padding: 24, marginTop: 12, marginBottom: 12, overflow: 'hidden' },
  bannerCircle1: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  bannerCircle2: { position: 'absolute', bottom: -36, left: -36, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.08)' },
  bannerGrid: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerGridCompact: { flexDirection: 'column', alignItems: 'stretch' },
  bannerStat: { flex: 1, gap: 4 },
  bannerStatLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: PRIMARY, opacity: 0.8 },
  bannerStatValue: { fontSize: 22, fontWeight: '700', color: PRIMARY, letterSpacing: -0.4 },
  bannerStatSub: { fontSize: 13, color: PRIMARY, opacity: 0.85 },
  bannerDivider: { width: 0.5, height: 60, backgroundColor: PRIMARY, opacity: 0.2 },
  bannerDividerCompact: { width: '100%', height: 0.5 },
  trendCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(0,55,176,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trendCircleCompact: { alignSelf: 'flex-start' },
  trendIcon: { fontSize: 22, color: PRIMARY, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: ON_SURFACE },
  emptySubtitle: { fontSize: 14, color: OUTLINE, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: OUTLINE },
});
