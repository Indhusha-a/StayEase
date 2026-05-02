import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, Animated, Alert,
} from 'react-native';
import api, { SERVER_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const getRoomImageUri = (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${SERVER_URL}/${imagePath.replace(/^\/+/, '')}`;
};

const getReviewImageUri = (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${SERVER_URL}/${imagePath.replace(/^\/+/, '')}`;
};

export default function RoomDetailScreen({ route, navigation }) {
  const { roomId } = route.params;
  const { user }   = useAuth();
  const [room, setRoom]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews]       = useState([]);
  const [avgRating, setAvgRating]   = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewEligibility, setReviewEligibility] = useState({
    loading: false,
    canReview: false,
    message: '',
  });

  // Slide-up animation for the white detail card
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      setRoom(res.data);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    } catch (_err) {
      Alert.alert('Error', 'Could not load room details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [fadeAnim, navigation, roomId, slideAnim]);


  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/room/${roomId}`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.averageRating || 0);
      setReviewCount(res.data.count || 0);
    } catch (_err) {
      // Reviews failing shouldn't break the whole screen
      setReviews([]);
    }
  }, [roomId]);

  const fetchReviewEligibility = useCallback(async () => {
    setReviewEligibility({ loading: true, canReview: false, message: '' });

    try {
      const res = await api.get(`/reviews/eligibility/${roomId}`);
      setReviewEligibility({
        loading: false,
        canReview: Boolean(res.data?.canReview),
        message: res.data?.message || '',
      });
    } catch (err) {
      setReviewEligibility({
        loading: false,
        canReview: false,
        message: err.response?.data?.message || 'Review access becomes available after admin confirms your payment.',
      });
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
    fetchReviews();
    if (user?.role === 'guest') {
      fetchReviewEligibility();
    }
  }, [fetchReviewEligibility, fetchReviews, fetchRoom, user?.role]);

  
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
  const imageUri = getRoomImageUri(room.thumbnailImage);

   // Render filled/empty stars
  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map((s) => (
      <Text key={s} style={{ fontSize: 14, color: s <= rating ? '#F59E0B' : '#D1D5DB' }}>★</Text>
    ));

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Supports Cloudinary URLs and older local upload paths. */}
        {imageUri
          ? <Image source={{ uri: imageUri }} style={styles.hero} />
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

          {/* ── REVIEWS SECTION ── */}
          <Text style={styles.sectionTitle}>Guest Reviews</Text>

          {/* Average rating summary */}
          <View style={styles.ratingBox}>
            <Text style={styles.ratingNumber}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
            <View>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {renderStars(Math.round(avgRating))}
              </View>
              <Text style={styles.ratingCount}>
                {reviewCount === 0 ? 'No reviews yet' : `${reviewCount} review${reviewCount > 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>

          {/* Recent reviews list — show max 3 */}
          {reviews.slice(0, 3).map((review) => (
            <View key={review._id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.userId?.name || 'Guest'}</Text>
                <View style={{ flexDirection: 'row' }}>
                  {renderStars(review.rating)}
                </View>
              </View>
              <Text style={styles.reviewTitle}>{review.title}</Text>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              {getReviewImageUri(review.imageUrl) ? (
                <Image source={{ uri: getReviewImageUri(review.imageUrl) }} style={styles.reviewImage} />
              ) : null}
              <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
            </View>
          ))}

          {reviewCount === 0 && (
            <Text style={styles.noReviews}>Be the first to review this room!</Text>
          )}

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

          {user?.role === 'guest' && reviewEligibility.loading && (
            <Text style={styles.reviewAvailabilityText}>Checking review access...</Text>
          )}

          {user?.role === 'guest' && !reviewEligibility.loading && !reviewEligibility.canReview && reviewEligibility.message ? (
            <View style={styles.reviewNoticeCard}>
              <Text style={styles.reviewNoticeText}>{reviewEligibility.message}</Text>
            </View>
          ) : null}

          {user?.role === 'guest' && reviewEligibility.canReview && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('Reviews', { screen: 'SubmitReview', params: { roomId: room._id, roomNumber: room.roomNumber } })}
              activeOpacity={0.85}
            >
              <Text style={styles.reviewBtnText}>⭐  Write a Review</Text>
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
  
  ratingBox:        { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
  ratingNumber:     { fontSize: 40, fontWeight: 'bold', color: '#F59E0B' },
  ratingCount:      { fontSize: 12, color: '#6B7280' },
  reviewCard:       { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  reviewHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewerName:     { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  reviewTitle:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  reviewComment:    { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 6 },
  reviewImage:      { width: '100%', height: 180, borderRadius: 10, marginBottom: 8, backgroundColor: '#E5E7EB' },
  reviewDate:       { fontSize: 11, color: '#9CA3AF' },
  noReviews:        { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginBottom: 20, fontStyle: 'italic' },
  reviewAvailabilityText: { color: '#6B7280', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  reviewNoticeCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    marginTop: 12,
  },
  reviewNoticeText: { color: '#9A3412', fontSize: 13, lineHeight: 19 },
  
  bookBtn:          { backgroundColor: '#1D4ED8', borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: '#1D4ED8', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  bookBtnText:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  adminRow:         { flexDirection: 'row', gap: 12 },
  editBtn:          { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  editBtnText:      { color: '#1D4ED8', fontWeight: 'bold', fontSize: 14 },
  deleteBtn:        { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText:    { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
  reviewBtn:        { backgroundColor: '#F59E0B', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 12, elevation: 4 },
  reviewBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
