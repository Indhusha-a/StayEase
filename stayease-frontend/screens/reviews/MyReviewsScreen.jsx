import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator,
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
    {[1, 2, 3, 4, 5].map((s) => (s <= rating ? '★' : '☆')).join('')}
  </Text>
);

export default function MyReviewsScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/my');
      setReviews(res.data.reviews);
    } catch (_err) {
      Alert.alert('Error', 'Could not load your reviews');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchMyReviews(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/reviews/${id}`);
            setReviews((prev) => prev.filter((r) => r._id !== id));
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.roomLabel}>
        Room {item.roomId?.roomNumber} — {item.roomId?.roomType}
      </Text>
      <StarDisplay rating={item.rating} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.comment}>{item.comment}</Text>
      {getReviewImageUri(item.imageUrl) ? (
        <Image source={{ uri: getReviewImageUri(item.imageUrl) }} style={styles.reviewImage} />
      ) : null}
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditReview', { review: item })}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a1a2e" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.empty}>You have not written any reviews yet.</Text>
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
  empty: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16,
    marginBottom: 12, elevation: 2,
  },
  roomLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  stars: { fontSize: 20, color: '#f4a226', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  comment: { fontSize: 14, color: '#444', marginBottom: 8 },
  reviewImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10, backgroundColor: '#E5E7EB' },
  date: { fontSize: 12, color: '#aaa', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 6,
    padding: 10, alignItems: 'center',
  },
  editText: { color: '#fff', fontWeight: '600' },
  deleteBtn: {
    flex: 1, backgroundColor: '#e74c3c', borderRadius: 6,
    padding: 10, alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '600' },
});
