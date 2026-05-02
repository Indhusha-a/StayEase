import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../utils/api';

const inferMimeType = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return 'application/octet-stream';
};

const MAX_REVIEW_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const normalizeNativeUri = (uri = '') => {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri}`;
};

const uploadReviewImageRequest = async (formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_URL}/reviews/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  let payload = null;

  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const textPayload = await response.text();
    payload = textPayload ? { message: textPayload } : {};
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Upload failed (${response.status})`);
  }

  return payload;
};

export default function ReviewImageUploadField({
  imageUrl,
  imageFileName,
  onUploadSuccess,
  onClearImage,
  onUploadingStateChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const setUploadingState = (value) => {
    setUploading(value);
    onUploadingStateChange?.(value);
  };

  const pickAndUploadImage = async () => {
    try {
      setError('');

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) {
        setError('No image selected.');
        return;
      }

      if (file.size && file.size > MAX_REVIEW_IMAGE_SIZE_BYTES) {
        setError('Review image must be 5MB or smaller.');
        return;
      }

      setUploadingState(true);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const webFile = file.file || result.output?.[0];
        if (webFile) {
          formData.append('image', webFile, webFile.name || file.name || `review-${Date.now()}`);
        } else {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('image', blob, file.name || `review-${Date.now()}`);
        }
      } else {
        const normalizedUri = normalizeNativeUri(file.uri);
        formData.append('image', {
          uri: normalizedUri,
          name: file.name || `review-${Date.now()}`,
          type: file.mimeType || inferMimeType(file.name),
        });
      }

      const payload = await uploadReviewImageRequest(formData);

      onUploadSuccess?.({
        imageUrl: payload?.imageUrl || '',
        fileName: payload?.fileName || file.name || 'Uploaded review image',
      });
    } catch (err) {
      setError(err?.message || 'Unable to upload review image. Try again.');
    } finally {
      setUploadingState(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Review Image</Text>
      <Text style={styles.hint}>Optional. Accepted: JPG, PNG (up to 5MB)</Text>

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.preview} />
      ) : (
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewPlaceholderText}>Upload an image for your review</Text>
        </View>
      )}

      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>{imageUrl ? 'Image uploaded' : 'No image uploaded yet'}</Text>
        <Text style={styles.statusMeta}>
          {imageFileName || (imageUrl ? 'Current review image' : 'Select an image from your device.')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={pickAndUploadImage}
        disabled={uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <View style={styles.processingRow}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}>Uploading image...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{imageUrl ? 'Replace Image' : 'Upload Image'}</Text>
        )}
      </TouchableOpacity>

      {imageUrl ? (
        <View style={styles.uploadStatusRow}>
          <Text style={styles.successText}>Uploaded successfully</Text>
          <TouchableOpacity onPress={onClearImage} activeOpacity={0.8}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#444' },
  hint: { fontSize: 12, color: '#777', marginBottom: 10 },
  preview: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#e5e7eb',
  },
  previewPlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  previewPlaceholderText: { color: '#6b7280', textAlign: 'center', fontSize: 13 },
  statusBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  statusTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  statusMeta: { fontSize: 12, color: '#6b7280' },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  uploadStatusRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successText: { fontSize: 12, color: '#15803d', fontWeight: '600' },
  clearText: { fontSize: 12, color: '#b91c1c', fontWeight: '600' },
  errorText: { marginTop: 10, fontSize: 12, color: '#dc2626' },
});
