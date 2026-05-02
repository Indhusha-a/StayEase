import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AuthContext from '../../context/AuthContext';
import api from '../../utils/api';
import { authHeaders, formatDate, imageUrl } from './staffHelpers';

export default function MyProfileScreen() {
  const { token, user } = useContext(AuthContext);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const id = user?._id || user?.id;
      if (!id) {
        setError('Logged-in staff id is missing');
        setLoading(false);
        return;
      }

      try {
        setError('');
        setLoading(true);
        const res = await api.get(`/staff/${id}`, {
          headers: authHeaders(token),
        });
        setStaff(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {staff?.profileImage ? (
          <Image source={{ uri: imageUrl(staff.profileImage) }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoText}>{staff?.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
          </View>
        )}
        <Text style={styles.name}>{staff?.name}</Text>
        <Text style={styles.role}>{staff?.role}</Text>
      </View>

      <View style={styles.details}>
        <Row label="Shift" value={staff?.shift} />
        <Row label="Department" value={staff?.department || 'Not set'} />
        <Row label="Phone" value={staff?.phone} />
        <Row label="Email" value={staff?.email} />
        <Row label="Joining date" value={formatDate(staff?.joiningDate)} />
      </View>
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
  loadingText: { marginTop: 10, color: '#6B7280' },
  error: { color: '#DC2626', textAlign: 'center', fontWeight: '700' },
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
  details: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { color: '#6B7280', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  value: { marginTop: 5, color: '#111827', fontSize: 16, fontWeight: '600' },
});
