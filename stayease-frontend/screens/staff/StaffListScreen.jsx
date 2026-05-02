import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AuthContext from '../../context/AuthContext';
import api from '../../utils/api';
import { authHeaders, imageUrl, roles } from './staffHelpers';

export default function StaffListScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [staff, setStaff] = useState([]);
  const [selectedRole, setSelectedRole] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchStaff = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const params = selectedRole === 'All' ? {} : { role: selectedRole };
      const res = await api.get('/staff', {
        params,
        headers: authHeaders(token),
      });
      setStaff(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [selectedRole, token, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [selectedRole, token, isAdmin])
  );

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Staff access only</Text>
        <Text style={styles.muted}>This section is available for administrators.</Text>
      </View>
    );
  }

  const renderStaff = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('StaffDetail', { id: item._id })}
    >
      {item.profileImage ? (
        <Image source={{ uri: imageUrl(item.profileImage) }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.role}</Text>
      </View>
      <View style={styles.shiftBadge}>
        <Text style={styles.shiftText}>{item.shift || 'Morning'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          data={['All', ...roles]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedRole === item && styles.chipActive]}
              onPress={() => setSelectedRole(item)}
            >
              <Text style={[styles.chipText, selectedRole === item && styles.chipTextActive]}>
                {item}
              </Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchStaff}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item._id}
          renderItem={renderStaff}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No active staff found.</Text>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddStaff')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  muted: { color: '#6B7280', textAlign: 'center' },
  filterBar: { paddingVertical: 12, paddingLeft: 16, backgroundColor: '#FFFFFF' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#1D4ED8' },
  chipText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 96 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#E5E7EB' },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1D4ED8', fontSize: 22, fontWeight: '800' },
  cardBody: { flex: 1, marginLeft: 14 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  meta: { color: '#6B7280', marginTop: 4 },
  shiftBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  shiftText: { color: '#047857', fontWeight: '700', fontSize: 12 },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: '#1D4ED8', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 32 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  fabText: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '500' },
});
