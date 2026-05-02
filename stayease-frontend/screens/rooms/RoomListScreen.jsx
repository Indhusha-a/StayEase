import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, TextInput, Animated, RefreshControl,
} from 'react-native';
import api, { SERVER_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['All', 'Single', 'Double', 'Suite', 'Deluxe'];

// Returns a color based on availability status
const getStatusColor = (status) => {
  if (status === 'available') return '#10B981';
  if (status === 'booked')    return '#EF4444';
  return '#F59E0B';
};

// Defined outside the screen so React never re-creates this component on re-render
const RoomCard = ({ item, index, onPress }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const color = getStatusColor(item.availabilityStatus);

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <TouchableOpacity style={styles.card} onPress={() => onPress(item._id)} activeOpacity={0.9}>
        {/* Room thumbnail — uses SERVER_URL so the path matches the backend */}
        {item.thumbnailImage
          ? <Image source={{ uri: `${SERVER_URL}/${item.thumbnailImage}` }} style={styles.cardImage} />
          : <View style={styles.cardImagePlaceholder}><Text style={{ fontSize: 36 }}>🛏️</Text></View>
        }

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.roomNum}>Room {item.roomNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: color }]} />
              <Text style={[styles.statusText, { color }]}>{item.availabilityStatus}</Text>
            </View>
          </View>

          <Text style={styles.roomType}>{item.roomType} Room · Floor {item.floor || 'N/A'}</Text>

          {/* Show first 3 amenities then a count pill for the rest */}
          <View style={styles.amenityRow}>
            {(item.amenities || []).slice(0, 3).map((a, i) => (
              <View key={i} style={styles.pill}><Text style={styles.pillText}>{a}</Text></View>
            ))}
            {(item.amenities || []).length > 3 && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>+{item.amenities.length - 3}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.price}>
              <Text style={styles.priceAmount}>${item.pricePerNight}</Text> / night
            </Text>
            <View style={styles.capacityBadge}>
              <Text style={styles.capacityText}>👥 {item.currentOccupancy}/{item.capacity}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RoomListScreen({ navigation }) {
  const { user } = useAuth();
  const [rooms, setRooms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [activeFilter, setFilter]   = useState('All');

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRooms();

    const unsubscribe = navigation.addListener('focus', () => {
    fetchRooms();
  });

    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
   return unsubscribe;
  }, [navigation]);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filters rooms client-side by search text and the active type chip
  const filtered = rooms.filter(r => {
    const matchSearch = r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
                        r.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || r.roomType === activeFilter;
    return matchSearch && matchFilter;
  });

  // Stable reference so RoomCard's onPress prop never changes between renders
  const handleCardPress = useCallback((roomId) => {
    navigation.navigate('RoomDetail', { roomId });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Fetching rooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <Text style={styles.headerTitle}>Available Rooms</Text>
        <Text style={styles.headerSub}>{filtered.length} room{filtered.length !== 1 ? 's' : ''} found</Text>
      </Animated.View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by room number or description..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Fixed-height wrapper stops the horizontal FlatList from stretching vertically */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={r => r._id}
        renderItem={({ item, index }) => (
          <RoomCard item={item} index={index} onPress={handleCardPress} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchRooms(); }}
            colors={['#1D4ED8']}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ fontSize: 48 }}>🛏️</Text>
            <Text style={styles.emptyText}>No rooms found</Text>
          </View>
        }
      />

      {/* Admin-only floating button to add a new room */}
      {user?.role === 'admin' && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddRoom')}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#EFF6FF' },
  center:               { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText:          { marginTop: 12, color: '#6B7280', fontSize: 13 },
  header:               { backgroundColor: '#1D4ED8', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24 },
  headerTitle:          { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSub:            { fontSize: 13, color: '#BFDBFE', marginTop: 4 },
  searchWrap:           {
                          flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                          margin: 16, marginBottom: 8, borderRadius: 14, paddingHorizontal: 14,
                          borderWidth: 1, borderColor: '#E5E7EB',
                          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                        },
  searchIcon:           { fontSize: 16, marginRight: 8 },
  searchInput:          { flex: 1, paddingVertical: 13, fontSize: 14, color: '#111' },
  filterWrap:           { height: 46, marginBottom: 4 },
  filterRow:            { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  filterChip:           {
                          paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
                          backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
                        },
  filterChipActive:     { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  // Standard 'bold' weight renders reliably on Android without text clipping
  filterText:           { color: '#6B7280', fontWeight: 'bold', fontSize: 13 },
  filterTextActive:     { color: '#fff' },
  list:                 { padding: 16, paddingTop: 8, paddingBottom: 100 },
  card:                 {
                          backgroundColor: '#fff', borderRadius: 18, marginBottom: 16,
                          borderWidth: 1, borderColor: '#E5E7EB',
                          shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10,
                          elevation: 4, overflow: 'hidden',
                        },
  cardImage:            { width: '100%', height: 160, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 120, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  cardBody:             { padding: 16 },
  cardRow:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roomNum:              { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  statusBadge:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot:            { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusText:           { fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
  roomType:             { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  amenityRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  pill:                 { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  pillText:             { color: '#1D4ED8', fontSize: 11, fontWeight: 'bold' },
  cardFooter:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:                { fontSize: 13, color: '#6B7280' },
  priceAmount:          { fontSize: 20, fontWeight: 'bold', color: '#1D4ED8' },
  capacityBadge:        { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  capacityText:         { fontSize: 12, color: '#374151', fontWeight: 'bold' },
  fab:                  {
                          position: 'absolute', bottom: 24, right: 24,
                          backgroundColor: '#1D4ED8', width: 58, height: 58, borderRadius: 29,
                          justifyContent: 'center', alignItems: 'center',
                          shadowColor: '#1D4ED8', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
                        },
  fabText:              { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  emptyText:            { color: '#9CA3AF', fontSize: 15, marginTop: 10 },
});