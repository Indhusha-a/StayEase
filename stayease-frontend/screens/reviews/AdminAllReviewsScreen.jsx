import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';

const StarDisplay = ({ rating }) => (
  <Text style={styles.stars}>
    {[1, 2, 3, 4, 5].map((s) => (s <= rating ? '★' : '☆')).join('')}
  </Text>
);

export default function AdminAllReviewsScreen() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data.reviews);
    } catch (err) {
      Alert.alert('Error', 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Review', 'Delete this review permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/reviews/${id}`);
            setReviews((prev) => prev.filter((r) => r._id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.guestName}>{item.userId?.name || 'Guest'}</Text>
        <StarDisplay rating={item.rating} />
      </View>
      <Text style={styles.roomLabel}>
        Room {item.roomId?.roomNumber} — {item.roomId?.roomType}
      </Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.comment}>{item.comment}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
        <Text style={styles.deleteText}>Delete Review</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a1a2e" />;

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
    backgroundColor: '#fff', borderRadius: 10, padding: 16,
    marginBottom: 12, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  guestName: { fontWeight: 'bold', fontSize: 15, color: '#1a1a2e' },
  stars: { fontSize: 18, color: '#f4a226' },
  roomLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  title: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  comment: { fontSize: 14, color: '#555', marginBottom: 8 },
  date: { fontSize: 12, color: '#aaa', marginBottom: 10 },
  deleteBtn: {
    backgroundColor: '#e74c3c', borderRadius: 6,
    padding: 10, alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '600' },
});
