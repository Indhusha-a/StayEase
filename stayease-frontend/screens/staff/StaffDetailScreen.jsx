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
import { authHeaders, formatDate, imageUrl } from './staffHelpers';

export default function StaffDetailScreen({ route, navigation }) {
  const { token, user } = useContext(AuthContext);
  const staffId = route.params?.id || route.params?.staff?._id;
  const [staff, setStaff] = useState(route.params?.staff || null);
  const [loading, setLoading] = useState(!route.params?.staff);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchStaff = async () => {
    if (!staffId) {
      setError('Staff id is missing');
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.get(`/staff/${staffId}`, {
        headers: authHeaders(token),
      });
      setStaff(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [staffId, token]);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [staffId, token])
  );

  const deactivateStaff = () => {
    Alert.alert('Deactivate staff', 'This staff member will be hidden from the active list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/staff/${staffId}`, {
              headers: authHeaders(token),
            });
            Alert.alert('Success', 'Staff member deactivated');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to deactivate staff');
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
        <TouchableOpacity style={styles.primaryButton} onPress={fetchStaff}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Staff member not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {staff.profileImage ? (
          <Image source={{ uri: imageUrl(staff.profileImage) }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoText}>{staff.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
          </View>
        )}
        <Text style={styles.name}>{staff.name}</Text>
        <Text style={styles.role}>{staff.role}</Text>
        <Text style={styles.shift}>{staff.shift}</Text>
      </View>

      <View style={styles.details}>
        <DetailRow label="Phone" value={staff.phone} />
        <DetailRow label="Email" value={staff.email} />
        <DetailRow label="Department" value={staff.department || 'Not set'} />
        <DetailRow label="Salary" value={staff.salary !== undefined ? `LKR ${staff.salary}` : 'Not set'} />
        <DetailRow label="Joining date" value={formatDate(staff.joiningDate)} />
      </View>

      {isAdmin && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('EditStaff', { staff })}
          >
            <Text style={styles.primaryButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerButton} onPress={deactivateStaff}>
            <Text style={styles.dangerButtonText}>Deactivate</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 18 },
  photo: { width: 118, height: 118, borderRadius: 59, backgroundColor: '#E5E7EB' },
  photoPlaceholder: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { color: '#1D4ED8', fontSize: 42, fontWeight: '800' },
  name: { marginTop: 14, fontSize: 24, color: '#111827', fontWeight: '800', textAlign: 'center' },
  role: { marginTop: 5, color: '#4B5563', fontSize: 16 },
  shift: { marginTop: 8, color: '#047857', fontWeight: '800', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  details: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { color: '#6B7280', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  value: { marginTop: 5, color: '#111827', fontSize: 16, fontWeight: '600' },
  actions: { marginTop: 18, gap: 10 },
  primaryButton: { backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  dangerButton: { backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  dangerButtonText: { color: '#B91C1C', fontWeight: '800', fontSize: 16 },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12 },
});
