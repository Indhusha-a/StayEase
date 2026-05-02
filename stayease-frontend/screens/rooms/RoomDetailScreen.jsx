import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, Animated, Alert,
} from 'react-native';
import api, { SERVER_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function RoomDetailScreen({ route, navigation }) {
  const { roomId } = route.params;
  const { user }   = useAuth();
  const [room, setRoom]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Slide-up animation for the white detail card
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      setRoom(res.data);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      Alert.alert('Error', 'Could not load room details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Admin: confirm then delete this room
  const handleDelete = () => {
    Alert.alert('Delete Room', `Delete Room ${room.roomNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.delete(`/rooms/${roomId}`);
          Alert.alert('Deleted', 'Room deleted');
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  // Pick a color based on the room status
  const statusColor = room.availabilityStatus === 'available' ? '#10B981'
                    : room.availabilityStatus === 'booked'    ? '#EF4444'
                    : '#F59E0B';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image — uses SERVER_URL so it matches the same host as API calls */}
        {room.thumbnailImage
          ? <Image source={{ uri: `${SERVER_URL}/${room.thumbnailImage}` }} style={styles.hero} />
          : <View style={styles.heroPlaceholder}><Text style={{ fontSize: 64 }}>🛏️</Text></View>
        }

        {/* Back button sits on top of the image */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {/* Detail card slides up over the image edge */}
        <Animated.View style={[styles.detailCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Room number + live status badge */}
          <View style={styles.row}>
            <Text style={styles.roomTitle}>Room {room.roomNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{room.availabilityStatus}</Text>
            </View>
          </View>

          <Text style={styles.roomType}>{room.roomType} Room · Floor {room.floor || 'N/A'}</Text>

          {/* Three info boxes: price, capacity, occupancy */}
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>${room.pricePerNight}<Text style={styles.infoSub}>/night</Text></Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{room.capacity}<Text style={styles.infoSub}> guests</Text></Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Occupancy</Text>
              <Text style={styles.infoValue}>{room.currentOccupancy}<Text style={styles.infoSub}> now</Text></Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{room.description || 'No description provided.'}</Text>

          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenityGrid}>
            {(room.amenities || []).map((a, i) => (
              <View key={i} style={styles.amenityItem}>
                <Text style={styles.amenityIcon}>✓</Text>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>

          {/* Guests see Book button only when the room is available */}
          {user?.role === 'guest' && room.availabilityStatus === 'available' && (
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => navigation.navigate('Bookings', { screen: 'CreateBooking', params: { roomId: room._id, pricePerNight: room.pricePerNight } })}
              activeOpacity={0.85}
            >
              <Text style={styles.bookBtnText}>📅  Book This Room</Text>
            </TouchableOpacity>
          )}

          {/* Admins see Edit and Delete buttons */}
          {user?.role === 'admin' && (
            <View style={styles.adminRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditRoom', { room })}>
                <Text style={styles.editBtnText}>✏️  Edit Room</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>🗑️  Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#EFF6FF' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero:             { width: '100%', height: 280, resizeMode: 'cover' },
  heroPlaceholder:  { width: '100%', height: 200, backgroundColor: '#BFDBFE', justifyContent: 'center', alignItems: 'center' },
  backBtn:          {
                      position: 'absolute', top: 48, left: 16,
                      backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20,
                      width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
                    },
  backText:         { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  detailCard:       {
                      backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
                      marginTop: -28, padding: 24, paddingBottom: 50,
                      borderWidth: 1, borderColor: '#E5E7EB',
                    },
  row:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roomTitle:        { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot:        { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText:       { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  roomType:         { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  infoRow:          { flexDirection: 'row', gap: 10, marginBottom: 24 },
  infoBox:          { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  // Standard 'bold' renders reliably across Android devices without clipping
  infoLabel:        { fontSize: 11, color: '#6B7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  infoValue:        { fontSize: 20, fontWeight: 'bold', color: '#1D4ED8' },
  infoSub:          { fontSize: 12, fontWeight: 'normal', color: '#6B7280' },
  sectionTitle:     { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  description:      { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 20 },
  amenityGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  amenityItem:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  amenityIcon:      { color: '#1D4ED8', fontWeight: 'bold', marginRight: 6, fontSize: 12 },
  amenityText:      { color: '#1D4ED8', fontSize: 13, fontWeight: 'bold' },
  bookBtn:          { backgroundColor: '#1D4ED8', borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: '#1D4ED8', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  bookBtnText:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  adminRow:         { flexDirection: 'row', gap: 12 },
  editBtn:          { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  editBtnText:      { color: '#1D4ED8', fontWeight: 'bold', fontSize: 14 },
  deleteBtn:        { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText:    { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
});