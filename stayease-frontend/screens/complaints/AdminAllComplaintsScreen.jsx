import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AuthContext from '../../context/AuthContext';
import api from '../../utils/api';
import {
  authHeaders,
  formatDate,
  priorities,
  priorityColor,
  roomLabel,
  statusColor,
  statuses,
} from './complaintHelpers';

export default function AdminAllComplaintsScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [staff, setStaff] = useState([]);
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchComplaints = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;

      const [complaintRes, staffRes] = await Promise.all([
        api.get('/complaints', {
          params,
          headers: authHeaders(token),
        }),
        api.get('/staff', {
          headers: authHeaders(token),
        }),
      ]);

      setComplaints(complaintRes.data || []);
      setStaff(staffRes.data || []);
      const nextUpdates = {};
      (complaintRes.data || []).forEach((item) => {
        nextUpdates[item._id] = {
          status: item.status || 'Open',
          assignedStaff: item.assignedStaff?._id || item.assignedStaff || '',
        };
      });
      setUpdates(nextUpdates);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter, token, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [statusFilter, priorityFilter, token, isAdmin])
  );

  const setUpdate = (id, field, value) => {
    setUpdates((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), [field]: value },
    }));
  };

  const updateComplaint = async (complaint) => {
    const update = updates[complaint._id] || {};

    try {
      const res = await api.put(
        `/complaints/${complaint._id}/status`,
        {
          status: update.status || complaint.status,
          assignedStaff: update.assignedStaff || '',
        },
        { headers: authHeaders(token) }
      );

      setComplaints((current) => current.map((item) => (item._id === complaint._id ? res.data : item)));
      Alert.alert('Success', 'Complaint updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update complaint');
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Only admins can view all complaints.</Text>
      </View>
    );
  }

  const renderComplaint = ({ item }) => {
    const color = statusColor(item.status);
    const pColor = priorityColor(item.priority);
    const update = updates[item._id] || {
      status: item.status,
      assignedStaff: item.assignedStaff?._id || item.assignedStaff || '',
    };

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => navigation.navigate('ComplaintDetail', { id: item._id, complaint: item })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.type}>{item.type}</Text>
          <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
            <Text style={[styles.badgeText, { color }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{roomLabel(item.roomId)}</Text>
          <Text style={[styles.priority, { color: pColor }]}>{item.priority}</Text>
        </View>
        <Text style={styles.meta}>Reported by {item.reportedBy?.name || 'Unknown'} - {formatDate(item.createdAt)}</Text>
        <Text style={styles.meta}>Assigned to {item.assignedTo || 'Not assigned'}</Text>

        <View style={styles.updateBox}>
          <Text style={styles.updateTitle}>Update Status</Text>
          <View style={styles.chipWrap}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.chip, update.status === status && styles.chipActive]}
                onPress={() => setUpdate(item._id, 'status', status)}
              >
                <Text style={[styles.chipText, update.status === status && styles.chipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.updateTitle}>Assign Staff</Text>
          <View style={styles.chipWrap}>
            <TouchableOpacity
              style={[styles.chip, !update.assignedStaff && styles.chipActive]}
              onPress={() => setUpdate(item._id, 'assignedStaff', '')}
            >
              <Text style={[styles.chipText, !update.assignedStaff && styles.chipTextActive]}>
                Unassigned
              </Text>
            </TouchableOpacity>
            {staff.map((member) => (
              <TouchableOpacity
                key={member._id}
                style={[styles.chip, update.assignedStaff === member._id && styles.chipActive]}
                onPress={() => setUpdate(item._id, 'assignedStaff', member._id)}
              >
                <Text style={[styles.chipText, update.assignedStaff === member._id && styles.chipTextActive]}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={() => updateComplaint(item)}>
            <Text style={styles.updateButtonText}>Update status</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <Text style={styles.heading}>All Complaints</Text>
        <Text style={styles.filterLabel}>Status</Text>
        <FlatList
          horizontal
          data={['All', ...statuses]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === item && styles.filterChipActive]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={[styles.filterText, statusFilter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        <Text style={styles.filterLabel}>Priority</Text>
        <FlatList
          horizontal
          data={['All', ...priorities]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, priorityFilter === item && styles.filterChipActive]}
              onPress={() => setPriorityFilter(item)}
            >
              <Text style={[styles.filterText, priorityFilter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.updateButton} onPress={fetchComplaints}>
            <Text style={styles.updateButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item._id}
          renderItem={renderComplaint}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No complaints found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  filters: { backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  heading: { fontSize: 23, fontWeight: '800', color: '#111827', marginBottom: 10 },
  filterLabel: { color: '#6B7280', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, backgroundColor: '#E5E7EB', marginRight: 8 },
  filterChipActive: { backgroundColor: '#1D4ED8' },
  filterText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 96 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  type: { color: '#1D4ED8', fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 17, fontWeight: '800', color: '#111827' },
  description: { color: '#4B5563', marginTop: 6, lineHeight: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  meta: { color: '#6B7280', marginTop: 7, flex: 1 },
  priority: { fontWeight: '800', marginTop: 7 },
  updateBox: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  updateTitle: { color: '#111827', fontWeight: '800', marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#1D4ED8' },
  chipText: { color: '#374151', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#FFFFFF' },
  updateButton: { backgroundColor: '#1D4ED8', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  updateButtonText: { color: '#FFFFFF', fontWeight: '800' },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12, fontWeight: '700' },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 32 },
});
