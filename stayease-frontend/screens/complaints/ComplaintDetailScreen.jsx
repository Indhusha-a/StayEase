import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
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
  imageUrl,
  priorityColor,
  roomLabel,
  statusColor,
  statuses,
} from './complaintHelpers';

export default function ComplaintDetailScreen({ route, navigation }) {
  const { token, user } = useContext(AuthContext);
  const complaintId = route.params?.id;
  const [complaint, setComplaint] = useState(route.params?.complaint || null);
  const [selectedStatus, setSelectedStatus] = useState(route.params?.complaint?.status || 'Open');
  const [assignedStaff, setAssignedStaff] = useState(
    route.params?.complaint?.assignedStaff?._id || route.params?.complaint?.assignedStaff || ''
  );
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(!route.params?.complaint);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchComplaint = async () => {
    if (!complaintId) {
      setError('Complaint id is missing');
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.get(`/complaints/${complaintId}`, {
        headers: authHeaders(token),
      });
      setComplaint(res.data);
      setSelectedStatus(res.data.status || 'Open');
      setAssignedStaff(res.data.assignedStaff?._id || res.data.assignedStaff || '');

      if (isAdmin) {
        const staffRes = await api.get('/staff', {
          headers: authHeaders(token),
        });
        setStaff(staffRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [complaintId, token]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaint();
    }, [complaintId, token])
  );

  const updateStatus = async () => {
    try {
      setSaving(true);
      const res = await api.put(
        `/complaints/${complaintId}/status`,
        { status: selectedStatus, assignedStaff },
        { headers: authHeaders(token) }
      );
      setComplaint(res.data);
      Alert.alert('Success', 'Complaint updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update complaint');
    } finally {
      setSaving(false);
    }
  };

  const deleteComplaint = () => {
    Alert.alert('Delete complaint', 'This complaint will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/complaints/${complaintId}`, {
              headers: authHeaders(token),
            });
            Alert.alert('Success', 'Complaint deleted');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete complaint');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={fetchComplaint}>
          <Text style={styles.primaryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sColor = statusColor(complaint?.status);
  const pColor = priorityColor(complaint?.priority);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.type}>{complaint?.type}</Text>
        <Text style={styles.title}>{complaint?.title}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: `${sColor}22` }]}>
            <Text style={[styles.badgeText, { color: sColor }]}>{complaint?.status}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${pColor}22` }]}>
            <Text style={[styles.badgeText, { color: pColor }]}>{complaint?.priority}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Row label="Description" value={complaint?.description} />
        <Row label="Room" value={roomLabel(complaint?.roomId)} />
        <Row label="Assigned to" value={complaint?.assignedTo || 'Not assigned'} />
        <Row label="Reported by" value={complaint?.reportedBy?.name || 'Unknown'} />
        <Row label="Created" value={formatDate(complaint?.createdAt)} />
        <Row label="Resolved" value={formatDate(complaint?.resolvedAt)} />
      </View>

      {complaint?.evidenceImage ? (
        <View style={styles.imagePanel}>
          <Text style={styles.sectionTitle}>Evidence</Text>
          <Image source={{ uri: imageUrl(complaint.evidenceImage) }} style={styles.evidence} />
        </View>
      ) : null}

      {isAdmin && (
        <View style={styles.adminPanel}>
          <Text style={styles.sectionTitle}>Admin Update</Text>
          <View style={styles.chipWrap}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.chip, selectedStatus === status && styles.chipActive]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={[styles.chipText, selectedStatus === status && styles.chipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Assign Staff</Text>
          <View style={styles.chipWrap}>
            <TouchableOpacity
              style={[styles.chip, !assignedStaff && styles.chipActive]}
              onPress={() => setAssignedStaff('')}
            >
              <Text style={[styles.chipText, !assignedStaff && styles.chipTextActive]}>
                Unassigned
              </Text>
            </TouchableOpacity>
            {staff.map((member) => (
              <TouchableOpacity
                key={member._id}
                style={[styles.chip, assignedStaff === member._id && styles.chipActive]}
                onPress={() => setAssignedStaff(member._id)}
              >
                <Text style={[styles.chipText, assignedStaff === member._id && styles.chipTextActive]}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={updateStatus} disabled={saving}>
            <Text style={styles.primaryText}>{saving ? 'Updating...' : 'Update status'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerButton} onPress={deleteComplaint}>
            <Text style={styles.dangerText}>Delete complaint</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'Not set'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 18, paddingBottom: 36 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 },
  type: { color: '#1D4ED8', fontWeight: '800', marginBottom: 6 },
  title: { fontSize: 23, fontWeight: '800', color: '#111827' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  panel: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { color: '#6B7280', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  value: { color: '#111827', fontSize: 16, fontWeight: '600', marginTop: 5, lineHeight: 22 },
  imagePanel: { marginTop: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 10 },
  evidence: { width: '100%', height: 220, borderRadius: 8, backgroundColor: '#E5E7EB' },
  adminPanel: { marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#1D4ED8' },
  chipText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },
  primaryButton: { backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  dangerButton: { marginTop: 10, backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  dangerText: { color: '#B91C1C', fontWeight: '800', fontSize: 16 },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12, fontWeight: '700' },
});
