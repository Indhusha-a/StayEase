import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { SERVER_URL } from '../../utils/api';

const getReviewImageUri = (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${SERVER_URL}/${imagePath.replace(/^\/+/, '')}`;
};

const StarDisplay = ({ rating }) => (
  <Text style={styles.stars}>
    {[1, 2, 3, 4, 5].map((star) => (star <= rating ? '★' : '☆')).join('')}
  </Text>
);

export default function AdminAllReviewsScreen() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data.reviews || []);
    } catch (_err) {
      Alert.alert('Error', 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchAll();
  }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Review', 'Delete this review permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/reviews/${id}`);
            setReviews((prev) => prev.filter((review) => review._id !== id));
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete review');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const reviewImageUri = getReviewImageUri(item.imageUrl);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.guestName}>{item.userId?.name || 'Guest'}</Text>
          <StarDisplay rating={item.rating} />
        </View>

        <Text style={styles.roomLabel}>
          Room {item.roomId?.roomNumber || 'N/A'} - {item.roomId?.roomType || 'Unknown'}
        </Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.comment}>{item.comment}</Text>

        {reviewImageUri ? (
          <Image source={{ uri: reviewImageUri }} style={styles.reviewImage} />
        ) : null}

        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteText}>Delete Review</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a1a2e" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>All Reviews ({reviews.length})</Text>
      {reviews.length === 0 ? (
        <Text style={styles.empty}>No reviews yet.</Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f4f4' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  guestName: { fontWeight: 'bold', fontSize: 15, color: '#1a1a2e' },
  stars: { fontSize: 18, color: '#f4a226' },
  roomLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  title: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  comment: { fontSize: 14, color: '#555', marginBottom: 8 },
  reviewImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10, backgroundColor: '#E5E7EB' },
  date: { fontSize: 12, color: '#aaa', marginBottom: 10 },
  deleteBtn: {
    backgroundColor: '#e74c3c',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '600' },
});
