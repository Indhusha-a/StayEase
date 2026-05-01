import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import api from '../../utils/api';

export default function SubmitReviewScreen({ route, navigation }) {
  const { roomId, roomNumber } = route.params;

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating');
    if (!title.trim()) return Alert.alert('Error', 'Please enter a title');
    if (!comment.trim()) return Alert.alert('Error', 'Please enter a comment');

    setLoading(true);
    try {
      await api.post('/reviews', { roomId, rating, title, comment });
      Alert.alert('Success', 'Your review has been submitted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Review Room {roomNumber}</Text>

      <Text style={styles.label}>Rating *</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, rating >= star && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Great stay!"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Comment *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell us about your experience..."
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={5}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1a1a2e' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#444' },
  starsRow: { flexDirection: 'row', marginBottom: 20 },
  star: { fontSize: 40, color: '#ccc', marginRight: 6 },
  starActive: { color: '#f4a226' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, marginBottom: 16, fontSize: 15, backgroundColor: '#fafafa',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#1a1a2e', borderRadius: 8,
    padding: 15, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
