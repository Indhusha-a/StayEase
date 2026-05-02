import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import api from '../../utils/api';
import ReviewImageUploadField from './ReviewImageUploadField';

export default function EditReviewScreen({ route, navigation }) {
  const { review } = route.params;

  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title);
  const [comment, setComment] = useState(review.comment);
  const [imageUrl, setImageUrl] = useState(review.imageUrl || '');
  const [imageFileName, setImageFileName] = useState(review.imageUrl ? 'Current review image' : '');
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!comment.trim()) return Alert.alert('Error', 'Comment is required');

    setLoading(true);
    try {
      await api.put(`/reviews/${review._id}`, {
        rating,
        title,
        comment,
        imageUrl,
      });
      Alert.alert('Success', 'Review updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Edit Review</Text>

      <Text style={styles.label}>Rating *</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, rating >= star && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Comment *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={5}
      />

      <ReviewImageUploadField
        imageUrl={imageUrl}
        imageFileName={imageFileName}
        onUploadingStateChange={setImageUploading}
        onUploadSuccess={({ imageUrl: uploadedUrl, fileName }) => {
          setImageUrl(uploadedUrl);
          setImageFileName(fileName);
        }}
        onClearImage={() => {
          setImageUrl('');
          setImageFileName('');
        }}
      />

      <TouchableOpacity
        style={[styles.button, (loading || imageUploading) && styles.buttonDisabled]}
        onPress={handleUpdate}
        disabled={loading || imageUploading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
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
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
