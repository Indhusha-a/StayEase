import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AuthContext from '../../context/AuthContext';
import api from '../../utils/api';
import { authHeaders, formatDate, priorityColor, roomLabel, statusColor } from './complaintHelpers';

export default function MyComplaintsScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('mine');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    try {
      setError('');
      setLoading(true);

      if (user?.role === 'staff') {
        const [myRes, assignedRes] = await Promise.all([
          api.get('/complaints/my', {
            headers: authHeaders(token),
          }),
          api.get('/complaints/assigned/my', {
            headers: authHeaders(token),
          }),
        ]);
        setComplaints(myRes.data || []);
        setAssignedComplaints(assignedRes.data || []);
      } else {
        const res = await api.get('/complaints/my', {
          headers: authHeaders(token),
        });
        setComplaints(res.data || []);
        setAssignedComplaints([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [token, user?.role]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [token, user?.role])
  );

  const renderComplaint = ({ item }) => {
    const color = statusColor(item.status);
    const pColor = priorityColor(item.priority);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ComplaintDetail', { id: item._id })}
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
          <Text style={styles.room}>{roomLabel(item.roomId)}</Text>
          <Text style={[styles.priority, { color: pColor }]}>{item.priority}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>{activeTab === 'assigned' ? 'Assigned to Me' : 'My Requests'}</Text>
          <Text style={styles.subheading}>
            {user?.role === 'staff'
              ? `${complaints.length} submitted, ${assignedComplaints.length} assigned`
              : `${complaints.length} total`}
          </Text>
        </View>
        {(user?.role === 'guest' || user?.role === 'staff') && (
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SubmitComplaint')}>
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {user?.role === 'staff' && assignedComplaints.length > 0 ? (
        <TouchableOpacity style={styles.notice} onPress={() => setActiveTab('assigned')}>
          <Text style={styles.noticeTitle}>New assigned work</Text>
          <Text style={styles.noticeText}>
            You have {assignedComplaints.length} complaint{assignedComplaints.length !== 1 ? 's' : ''} assigned.
          </Text>
        </TouchableOpacity>
      ) : null}

      {user?.role === 'staff' ? (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
            onPress={() => setActiveTab('mine')}
          >
            <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>My Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'assigned' && styles.tabActive]}
            onPress={() => setActiveTab('assigned')}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>Assigned to Me</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchComplaints}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'assigned' ? assignedComplaints : complaints}
          keyExtractor={(item) => item._id}
          renderItem={renderComplaint}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {activeTab === 'assigned' ? 'No assigned complaints yet.' : 'No complaints or requests yet.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  heading: { fontSize: 23, fontWeight: '800', color: '#111827' },
  subheading: { color: '#6B7280', marginTop: 3 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#FFFFFF', fontSize: 28, lineHeight: 32, fontWeight: '600' },
  notice: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 13,
  },
  noticeTitle: { color: '#92400E', fontWeight: '800', marginBottom: 3 },
  noticeText: { color: '#92400E' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  tabActive: { backgroundColor: '#1D4ED8' },
  tabText: { color: '#374151', fontWeight: '800', fontSize: 13 },
  tabTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 96 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  type: { color: '#1D4ED8', fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 17, fontWeight: '800', color: '#111827' },
  description: { color: '#4B5563', marginTop: 6, lineHeight: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  room: { color: '#6B7280', flex: 1 },
  priority: { fontWeight: '800' },
  date: { color: '#9CA3AF', marginTop: 8, fontSize: 12 },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12, fontWeight: '700' },
  retryButton: { backgroundColor: '#1D4ED8', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 32 },
});
