import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Animated,
} from 'react-native';
import api from '../../utils/api';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITY_FILTER = ['All', 'Low', 'Medium', 'High', 'Urgent'];
const STATUS_FILTER = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const TYPE_FILTER = ['All', 'Complaint', 'Maintenance', 'Housekeeping'];

const STATUS_COLORS = {
  'Open': { bg: '#FEE2E2', text: '#DC2626' },
  'In Progress': { bg: '#FEF3C7', text: '#D97706' },
  'Resolved': { bg: '#D1FAE5', text: '#059669' },
  'Closed': { bg: '#F3F4F6', text: '#6B7280' },
};
const PRIORITY_COLORS = {
  Low: '#10B981', Medium: '#F59E0B', High: '#EF4444', Urgent: '#7C3AED',
};
const TYPE_ICONS = { Complaint: '⚠️', Maintenance: '🔧', Housekeeping: '🧹' };

// ─────────────────────────────────────────────────────────────────────────────
// Inline status update modal
// ─────────────────────────────────────────────────────────────────────────────
function UpdateModal({ visible, complaint, onClose, onUpdated }) {
  const [newStatus, setNewStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (complaint) {
      setNewStatus(complaint.status);
      setAssignedTo(complaint.assignedTo || '');
    }
  }, [complaint]);

  const save = async () => {
    try {
      setSaving(true);
      await api.put(`/complaints/${complaint._id}/status`, {
        status: newStatus,
        assignedTo: assignedTo.trim() || null,
      });
      onUpdated();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!complaint) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <Text style={modal.sheetTitle}>Update Complaint</Text>
          <Text style={modal.sheetSub}>{complaint.title}</Text>

          <Text style={modal.label}>Status</Text>
          <View style={modal.optionRow}>
            {STATUS_OPTIONS.map(s => {
              const c = STATUS_COLORS[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={[modal.optionChip, newStatus === s && { backgroundColor: c.bg, borderColor: c.text }]}
                  onPress={() => setNewStatus(s)}
                >
                  <Text style={[modal.optionText, newStatus === s && { color: c.text }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={modal.label}>Assign to (name or department)</Text>
          <TextInput
            style={modal.input}
            placeholder="e.g. Housekeeping Dept"
            placeholderTextColor="#9CA3AF"
            value={assignedTo}
            onChangeText={setAssignedTo}
          />

          <View style={modal.actionRow}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.saveBtn, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={modal.saveText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete confirmation
// ─────────────────────────────────────────────────────────────────────────────
function confirmDelete(id, onDeleted) {
  Alert.alert('Delete Complaint', 'Are you sure you want to permanently delete this complaint?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive',
      onPress: async () => {
        try {
          await api.delete(`/complaints/${id}`);
          onDeleted(id);
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Delete failed.');
        }
      },
    },
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin card
// ─────────────────────────────────────────────────────────────────────────────
const AdminCard = ({ item, index, onUpdate, onDelete, onPress }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }).start();
  }, []);

  const sc = STATUS_COLORS[item.status] || STATUS_COLORS['Open'];

  return (
    <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(item._id)} activeOpacity={0.88}>
        <View style={styles.cardTop}>
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>{TYPE_ICONS[item.type] || '📋'}</Text>
            <Text style={styles.typeLabel}>{item.type}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '22' }]}>
              <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.submitterRow}>
          <Text style={styles.submitterText}>
            👤 {item.reportedBy?.name || 'Unknown'} · {item.reportedBy?.role || '?'}
          </Text>
          {item.roomId && (
            <Text style={styles.roomText}>🛏️ Room {item.roomId.roomNumber}</Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          {item.assignedTo && (
            <Text style={styles.assignedText}>→ {item.assignedTo}</Text>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => onUpdate(item)}
          >
            <Text style={styles.updateBtnText}>✏️ Update Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(item._id)}
          >
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
const AdminComplaintsScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [stats, setStats] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (typeFilter !== 'All') params.type = typeFilter;

      const [listRes, statsRes] = await Promise.all([
        api.get('/complaints', { params }),
        api.get('/complaints/stats'),
      ]);
      // Backend returns { success: true, count: ..., complaints: [...] }
      setComplaints(listRes.data.complaints || []);
      setStats(statsRes.data);
    } catch (err) {
      console.log('Admin complaints error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, typeFilter]);

  useFocusEffect(useCallback(() => { fetchComplaints(); }, [fetchComplaints]));
  useEffect(() => { fetchComplaints(); }, [statusFilter, priorityFilter, typeFilter]);

  const handleDeleted = (id) => setComplaints(prev => prev.filter(c => c._id !== id));

  const openUpdate = (item) => { setSelected(item); setModalVisible(true); };

  const FilterBar = ({ label, options, value, onChange }) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{label}</Text>
      <FlatList
        data={options}
        horizontal
        keyExtractor={o => o}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: o }) => (
          <TouchableOpacity
            style={[styles.filterChip, value === o && styles.filterChipActive]}
            onPress={() => onChange(o)}
          >
            <Text style={[styles.filterChipText, value === o && styles.filterChipTextActive]}>{o}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Complaints</Text>
        <Text style={styles.headerSub}>Manage and resolve reported issues</Text>

        {stats && (
          <View style={styles.statsRow}>
            {stats.byStatus.map(s => {
              const sc = STATUS_COLORS[s._id] || {};
              return (
                <View key={s._id} style={styles.statBox}>
                  <Text style={[styles.statNum, { color: sc.text || '#fff' }]}>{s.count}</Text>
                  <Text style={styles.statLabel}>{s._id}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FilterBar label="Status" options={STATUS_FILTER} value={statusFilter} onChange={setStatusFilter} />
        <FilterBar label="Priority" options={PRIORITY_FILTER} value={priorityFilter} onChange={setPriorityFilter} />
        <FilterBar label="Type" options={TYPE_FILTER} value={typeFilter} onChange={setTypeFilter} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={c => c._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <AdminCard
              item={item}
              index={index}
              onUpdate={openUpdate}
              onDelete={id => confirmDelete(id, handleDeleted)}
              onPress={id => navigation.navigate('ComplaintDetail', { complaintId: id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptySub}>Try adjusting the filters above</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaints(true)} colors={['#1D4ED8']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <UpdateModal
        visible={modalVisible}
        complaint={selected}
        onClose={() => { setModalVisible(false); setSelected(null); }}
        onUpdated={() => fetchComplaints()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },

  header: { backgroundColor: '#1D4ED8', paddingTop: 16, paddingHorizontal: 20, paddingBottom: 18 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#BFDBFE', marginBottom: 14 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10, gap: 8 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#BFDBFE', marginTop: 1, textAlign: 'center' },

  filtersContainer: { backgroundColor: '#fff', paddingTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterGroup: { marginBottom: 8 },
  filterGroupLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginLeft: 16, marginBottom: 4, letterSpacing: 1 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, marginLeft: 10,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  filterChipText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  listContent: { padding: 14, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeIcon: { fontSize: 15 },
  typeLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
  priorityBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },

  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 8 },

  submitterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  submitterText: { fontSize: 11, color: '#6B7280' },
  roomText: { fontSize: 11, color: '#6B7280' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  footerDate: { fontSize: 11, color: '#9CA3AF' },
  assignedText: { fontSize: 11, color: '#6366F1', fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 8 },
  updateBtn: {
    flex: 1, backgroundColor: '#EFF6FF', borderRadius: 10,
    paddingVertical: 9, alignItems: 'center',
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  updateBtnText: { fontSize: 12, color: '#1D4ED8', fontWeight: '700' },
  deleteBtn: {
    width: 40, backgroundColor: '#FEF2F2', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 16 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#9CA3AF' },
});

export default AdminComplaintsScreen;

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sheetSub: { fontSize: 13, color: '#6B7280', marginBottom: 18 },

  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  optionChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionText: { fontSize: 12, color: '#374151', fontWeight: '700' },

  input: {
    backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827', marginBottom: 20,
  },

  actionRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { color: '#6B7280', fontWeight: '700', fontSize: 14 },
  saveBtn: { flex: 2, backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});