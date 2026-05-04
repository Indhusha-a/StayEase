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

// ---------------------------------------------------------------------------
// Local palette
// ---------------------------------------------------------------------------
// This screen keeps its own StyleSheet because the admin dashboard layout is
// denser and more custom than the shared guest-payment screens.
// ---------------------------------------------------------------------------
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

// Small avatar glyph used on each payment card.
const PersonIcon = () => (
  <View style={s.personCircle}>
    <View style={s.personHead} />
    <View style={s.personBody} />
  </View>
);

// Status badge used on admin payment cards.
const StatusBadge = ({ status }) => {
  const config = {
    Paid: { bg: '#dcfce7', text: '#15803d', label: 'Paid' },
    Pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
    Refunded: { bg: '#f1f5f9', text: '#475569', label: 'Refunded' },
  }[status] || { bg: SURF_VAR, text: ON_VARIANT, label: status || '—' };

  return (
    <View style={[s.badge, { backgroundColor: config.bg }]}>
      <Text style={[s.badgeText, { color: config.text }]} numberOfLines={1}>
        {config.label}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// PaymentCard
// ---------------------------------------------------------------------------
// Renders one admin-facing payment row with status actions, slip access,
// and optional deletion for completed/refunded records.
// ---------------------------------------------------------------------------
const PaymentCard = ({ item, onUpdateStatus, onOpenSlip, onDeletePayment, smallPhone }) => {
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
      {/* Top row: avatar + info + amount */}
      <View style={s.cardTop}>
        <PersonIcon />

        <View style={s.cardMid}>
          <Text style={s.cardName} numberOfLines={1}>
            {item.userId?.name || item.userId?.email || 'Unknown'}
          </Text>
          <Text style={s.cardEmail} numberOfLines={1}>
            {item.userId?.email || ''}
          </Text>
          <View style={s.badgeRow}>
            <StatusBadge status={item.status} />
            <Text style={s.txId} numberOfLines={1}>
              #{item._id?.slice(-6).toUpperCase() || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={s.cardAmountBlock}>
          <Text style={[s.amount, { color: amountColor }]} numberOfLines={1}>
            ${Number(item.amount || 0).toFixed(2)}
          </Text>
          <Text style={s.dateText} numberOfLines={2}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* Actions row */}
      <View style={s.actionsRow}>
        {isPaid ? (
          <View style={[s.actionBtn, s.actionDisabled]}>
            <Text style={s.actionDisabledText} numberOfLines={1}>
              {smallPhone ? 'Paid' : 'Mark as Paid'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.actionBtn, s.actionPaid]}
            onPress={() => onUpdateStatus(item._id, 'Paid')}
            activeOpacity={0.85}
          >
            <Text style={s.actionPaidText} numberOfLines={1}>
              {smallPhone ? 'Paid' : 'Mark as Paid'}
            </Text>
          </TouchableOpacity>
        )}

        {isRefunded ? (
          <View style={[s.actionBtn, s.actionDisabled]}>
            <Text style={s.actionDisabledText} numberOfLines={1}>
              {smallPhone ? 'Refund' : 'Mark as Refunded'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.actionBtn, s.actionRefund]}
            onPress={() => onUpdateStatus(item._id, 'Refunded')}
            activeOpacity={0.85}
          >
            <Text style={s.actionRefundText} numberOfLines={1}>
              {smallPhone ? 'Refund' : 'Mark as Refunded'}
            </Text>
          </TouchableOpacity>
        )}

        {hasSlip ? (
          <TouchableOpacity
            style={[s.actionBtn, s.actionSlip]}
            onPress={() => onOpenSlip(item.slipUrl)}
            activeOpacity={0.85}
          >
            <Text style={s.actionSlipText} numberOfLines={1}>
              {smallPhone ? 'Slip' : 'View Slip'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.actionBtn, s.actionDisabled]}>
            <Text style={s.actionDisabledText} numberOfLines={1}>
              {smallPhone ? 'No Slip' : 'No Slip'}
            </Text>
          </View>
        )}

        {canDelete ? (
          <TouchableOpacity
            style={[s.actionBtn, s.actionDelete]}
            onPress={() => onDeletePayment(item)}
            activeOpacity={0.85}
          >
            <Text style={s.actionDeleteText} numberOfLines={1}>
              {smallPhone ? 'Delete' : 'Delete Payment'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

// Footer summary derived from the currently loaded payment collection.
const AnalyticsBanner = ({ payments, smallPhone }) => {
  const totalPaid = payments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === 'Pending').length;

  return (
    <View style={s.banner}>
      <View style={s.bannerCircle1} />
      <View style={s.bannerCircle2} />
      <View style={s.bannerGrid}>
        <View style={s.bannerStat}>
          <Text style={s.bannerStatLabel}>Monthly Collection</Text>
          <Text style={[s.bannerStatValue, smallPhone && s.bannerStatValueSmall]}>
            ${totalPaid.toFixed(2)}
          </Text>
          <Text style={[s.bannerStatSub, smallPhone && s.bannerStatSubSmall]}>Confirmed payments</Text>
        </View>
        <View style={s.bannerDivider} />
        <View style={s.bannerStat}>
          <Text style={s.bannerStatLabel}>Outstanding</Text>
          <Text style={[s.bannerStatValue, smallPhone && s.bannerStatValueSmall]}>
            ${totalPending.toFixed(2)}
          </Text>
          <Text style={[s.bannerStatSub, smallPhone && s.bannerStatSubSmall]}>
            {pendingCount} invoice{pendingCount !== 1 ? 's' : ''} pending
          </Text>
        </View>
        {!smallPhone && (
          <View style={s.trendCircle}>
            <Text style={s.trendIcon}>+</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// AdminAllPaymentsScreen
// ---------------------------------------------------------------------------
// Admin-only dashboard for reviewing and managing every payment in the system.
// ---------------------------------------------------------------------------
export default function AdminAllPaymentsScreen({ navigation }) {
  const { user } = useAuth();
  const { width, fontScale } = useWindowDimensions();
  // Raised threshold: only trigger smallPhone for genuinely tiny screens
  const smallPhone = width < 360 || fontScale > 1.25;
  const hideFilterLabel = width < 340;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Pulls all payment records for the admin dashboard.
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

  // Sends the status change to PUT /payments/:id/status, then reloads the list.
  const updateStatus = async (paymentId, status) => {
    try {
      await api.put(`/payments/${paymentId}/status`, { status });
      fetchPayments();
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Unable to update status');
    }
  };

  // Deletion is double-confirmed because it permanently removes the record.
  const deletePayment = useCallback((payment) => {
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
  }, []);

  // Accepts either absolute URLs or server-relative paths from the API.
  const resolveSlipUrl = useCallback((rawUrl = '') => {
    if (!rawUrl) return '';
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    if (rawUrl.startsWith('/')) return `${SERVER_URL}${rawUrl}`;
    return `${SERVER_URL}/${rawUrl}`;
  }, []);

  // For Cloudinary-hosted PDFs, build a preview image URL for page 1.
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

  // Opens either the original slip or a Cloudinary-generated PDF preview.
  const openSlip = useCallback(
    async (rawUrl) => {
      const slipUrl = resolveSlipUrl(rawUrl);
      if (!slipUrl) {
        Alert.alert('Slip Missing', 'No uploaded slip found for this payment.');
        return;
      }
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

  // Filter pills are client-side only; the full list is fetched once.
  const filteredPayments = useMemo(
    () => (activeFilter === 'All' ? payments : payments.filter((p) => p.status === activeFilter)),
    [payments, activeFilter]
  );

  // Route guard in case a non-admin navigates here manually.
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
            {/* Header hero + revenue-summary shortcut */}
            <View style={s.hero}>
              <View style={s.heroText}>
                <Text style={[s.h1, smallPhone && s.h1Small]}>Admin Payments</Text>
                <Text style={[s.heroSubtitle, smallPhone && s.heroSubtitleSmall]}>
                  Manage payment statuses and review transactions across your entire property portfolio.
                </Text>
              </View>
              <TouchableOpacity
                style={s.summaryBtn}
                onPress={() => navigation.navigate('RevenueSummary')}
                activeOpacity={0.85}
              >
                <Text style={s.summaryBtnIcon}>+</Text>
                <Text style={s.summaryBtnText}>
                  {smallPhone ? 'Revenue Summary' : 'Open Revenue Summary'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Client-side status filter pills */}
            <View style={s.filterBar}>
              {!hideFilterLabel && <Text style={s.filterLabel}>FILTER BY:</Text>}
              {['All', 'Pending', 'Paid', 'Refunded'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[s.filterPill, activeFilter === filter && s.filterPillActive]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      s.filterPillText,
                      activeFilter === filter && s.filterPillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {filter === 'All' ? (smallPhone ? 'All' : 'All Transactions') : filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          // Empty state respects the active filter selection.
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No payments found</Text>
            <Text style={s.emptySubtitle}>
              {activeFilter === 'All'
                ? 'Payments will appear here once guests submit them.'
                : `No ${activeFilter.toLowerCase()} payments yet.`}
            </Text>
          </View>
        }
        ListFooterComponent={<AnalyticsBanner payments={payments} smallPhone={smallPhone} />}
        renderItem={({ item }) => (
          // Each item stays self-contained so row actions are easy to scan/tap.
          <PaymentCard
            item={item}
            onUpdateStatus={updateStatus}
            onOpenSlip={openSlip}
            onDeletePayment={deletePayment}
            smallPhone={smallPhone}
          />
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SURFACE },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SURFACE },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: { marginBottom: 20, gap: 14 },
  heroText: { gap: 6 },
  h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, color: ON_SURFACE, lineHeight: 40 },
  h1Small: { fontSize: 26, lineHeight: 32 },
  heroSubtitle: { fontSize: 15, fontWeight: '400', color: ON_VARIANT, lineHeight: 22 },
  heroSubtitleSmall: { fontSize: 13, lineHeight: 20 },

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
  summaryBtnIcon: { fontSize: 16, color: WHITE, fontWeight: '700' },
  summaryBtnText: { fontSize: 14, fontWeight: '600', color: WHITE, letterSpacing: 0.1 },

  // ── Filter bar ────────────────────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ON_VARIANT,
    letterSpacing: 0.8,
    marginRight: 4,
  },
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

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: OUTLINE_VAR,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },

  // Top section: avatar | info | amount (always row, never wraps weirdly)
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  // Avatar
  personCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURF_CONT_LOW,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    paddingTop: 5,
  },
  personHead: { width: 13, height: 13, borderRadius: 7, backgroundColor: PRIMARY, marginBottom: 2 },
  personBody: { width: 20, height: 11, borderRadius: 10, backgroundColor: PRIMARY },

  // Middle info column — takes remaining space
  cardMid: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: ON_SURFACE,
    lineHeight: 20,
  },
  cardEmail: {
    fontSize: 12,
    fontWeight: '400',
    color: ON_VARIANT,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },

  // Badge — NO rotation risk
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start', // shrink to content, prevents stretching
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  txId: {
    fontSize: 11,
    color: ON_VARIANT,
    flexShrink: 1,
  },

  // Right: amount + date, fixed width so it never crowds the middle
  cardAmountBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: 130,
    gap: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 10,
    color: ON_VARIANT,
    textAlign: 'right',
    lineHeight: 14,
  },

  // ── Actions row (always horizontal, wraps naturally) ─────────────────────
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 1, // allows shrinking on narrow screens
  },
  actionPaid: { backgroundColor: PRIMARY },
  actionPaidText: { fontSize: 12, fontWeight: '600', color: WHITE },
  actionRefund: { borderWidth: 1, borderColor: OUTLINE, backgroundColor: 'transparent' },
  actionRefundText: { fontSize: 12, fontWeight: '600', color: ON_VARIANT },
  actionSlip: { borderWidth: 1, borderColor: PRIMARY, backgroundColor: 'transparent' },
  actionSlipText: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  actionDelete: { backgroundColor: '#dc2626' },
  actionDeleteText: { fontSize: 12, fontWeight: '600', color: WHITE },
  actionDisabled: { backgroundColor: SURF_VAR, opacity: 0.45 },
  actionDisabledText: { fontSize: 12, fontWeight: '600', color: ON_VARIANT },

  // ── Analytics banner ─────────────────────────────────────────────────────
  banner: {
    backgroundColor: ON_PRI_CONT,
    borderRadius: 16,
    padding: 22,
    marginTop: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  bannerCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerCircle2: {
    position: 'absolute',
    bottom: -36,
    left: -36,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerStat: { flex: 1, gap: 4 },
  bannerStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PRIMARY,
    opacity: 0.8,
  },
  bannerStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: -0.4,
  },
  bannerStatValueSmall: { fontSize: 19, lineHeight: 26 },
  bannerStatSub: { fontSize: 13, color: PRIMARY, opacity: 0.85 },
  bannerStatSubSmall: { fontSize: 12, lineHeight: 18 },
  bannerDivider: {
    width: 0.5,
    height: 56,
    backgroundColor: PRIMARY,
    opacity: 0.2,
  },
  trendCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(0,55,176,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trendIcon: { fontSize: 22, color: PRIMARY, fontWeight: '700' },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: ON_SURFACE },
  emptySubtitle: {
    fontSize: 14,
    color: OUTLINE,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 16, color: OUTLINE },
});
