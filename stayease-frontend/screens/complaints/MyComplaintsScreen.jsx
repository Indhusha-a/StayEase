import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, RefreshControl,
} from 'react-native';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_COLORS = {
  'Open': { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' },
  'In Progress': { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
  'Resolved': { bg: '#D1FAE5', text: '#059669', dot: '#10B981' },
  'Closed': { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

const PRIORITY_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Urgent: '#7C3AED',
};

const TYPE_ICONS = {
  Complaint: '⚠️',
  Maintenance: '🔧',
  Housekeeping: '🧹',
};

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

const ComplaintCard = ({ item, index, onPress }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1, duration: 380, delay: index * 60, useNativeDriver: true,
    }).start();
  }, []);

  const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS['Open'];

  return (
    <Animated.View style={{
      opacity: cardAnim,
      transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
    }}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(item._id)} activeOpacity={0.88}>
        <View style={styles.cardTop}>
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>{TYPE_ICONS[item.type] || '📋'}</Text>
            <Text style={styles.typeLabel}>{item.type}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '22' }]}>
              <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>
                {item.priority}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooter}>
          {item.roomId
            ? <Text style={styles.footerMeta}>🛏️ Room {item.roomId.roomNumber}</Text>
            : <Text style={styles.footerMeta}>No room linked</Text>
          }
          <Text style={styles.footerDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>

        {item.assignedTo && (
          <View style={styles.assignedRow}>
            <Text style={styles.assignedText}>👤 Assigned to: {item.assignedTo}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const MyComplaintsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await api.get('/complaints/my');
      // The backend returns { success, count, complaints }
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.log('Fetch complaints error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchComplaints(); }, [fetchComplaints]));

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const filtered = filter === 'All'
    ? complaints
    : complaints.filter(c => c.status === filter);

  const stats = {
    open: complaints.filter(c => c.status === 'Open').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>
        {filter === 'All' ? 'No complaints yet' : `No ${filter} complaints`}
      </Text>
      <Text style={styles.emptySub}>
        {filter === 'All' ? 'Tap + to submit your first report' : 'Try a different filter'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Animated header */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
        <Text style={styles.headerTitle}>My Reports</Text>
        <Text style={styles.headerSub}>
          {user?.role === 'staff' ? 'Your maintenance & housekeeping requests' : 'Your complaints & requests'}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.open}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>
      </Animated.View>

      {/* Filter bar */}
      <FlatList
        data={FILTERS}
        horizontal
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <ComplaintCard
              item={item}
              index={index}
              onPress={id => navigation.navigate('ComplaintDetail', { complaintId: id })}
            />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaints(true)} colors={['#1D4ED8']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SubmitComplaint')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MyComplaintsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },

  header: {
    backgroundColor: '#1D4ED8',
    paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#BFDBFE', marginBottom: 16 },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#BFDBFE', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 8 },

  filterList: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  filterText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeIcon: { fontSize: 16 },
  typeLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },

  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '700' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerMeta: { fontSize: 12, color: '#9CA3AF' },
  footerDate: { fontSize: 12, color: '#9CA3AF' },

  assignedRow: {
    marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  assignedText: { fontSize: 12, color: '#6366F1', fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#9CA3AF' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1D4ED8', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
});