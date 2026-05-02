import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Animated, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TYPES = ['Complaint', 'Maintenance', 'Housekeeping'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const PRIORITY_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Urgent: '#7C3AED',
};

const TYPE_ICONS = {
  Complaint: '⚠️',
  Maintenance: '🔧',
  Housekeeping: '🧹',
};

const SubmitComplaintScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [type, setType] = useState('Complaint');
  const [priority, setPriority] = useState('Low');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data || []);
    } catch (_) { }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to attach evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Please enter a title.');
    if (!description.trim()) return Alert.alert('Validation', 'Please enter a description.');

    try {
      setSubmitting(true);

      // Step 1 — create the complaint record
      const payload = { type, title: title.trim(), description: description.trim(), priority };
      if (roomId) payload.roomId = roomId;

      const res = await api.post('/complaints', payload);
      const newId = res.data.complaint._id;

      // Step 2 — upload evidence image if one was chosen
      if (image) {
        try {
          const formData = new FormData();
          formData.append('evidenceImage', {
            uri: image.uri,
            name: image.fileName || `evidence_${Date.now()}.jpg`,
            type: image.mimeType || 'image/jpeg',
          });

          await api.post(`/complaints/${newId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr) {
          // Image upload failed, but complaint was already created
          console.warn('Image upload failed, but complaint was submitted:', uploadErr.message);
          // Continue - don't fail the entire submission
        }
      }

      Alert.alert('Submitted! ✅', 'Your complaint has been recorded. We\'ll get back to you soon.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Report</Text>
        <Text style={styles.headerSub}>
          {user?.role === 'staff'
            ? 'Submit a maintenance or housekeeping request'
            : 'Report an issue or request room service'}
        </Text>
      </View>

      {/* Type picker */}
      <Text style={styles.label}>Request Type</Text>
      <View style={styles.chipRow}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => setType(t)}
          >
            <Text style={styles.chipIcon}>{TYPE_ICONS[t]}</Text>
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Priority picker */}
      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        {PRIORITIES.map(p => (
          <TouchableOpacity
            key={p}
            style={[
              styles.priorityChip,
              priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.priorityText, priority === p && { color: '#fff' }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Air conditioner not working"
        placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the issue in detail…"
        placeholderTextColor="#9CA3AF"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Optional room selector */}
      {rooms.length > 0 && (
        <>
          <Text style={styles.label}>Room (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.roomScroll}
          >
            <TouchableOpacity
              style={[styles.roomChip, !roomId && styles.roomChipActive]}
              onPress={() => setRoomId('')}
            >
              <Text style={[styles.roomChipText, !roomId && styles.roomChipTextActive]}>None</Text>
            </TouchableOpacity>
            {rooms.map(r => (
              <TouchableOpacity
                key={r._id}
                style={[styles.roomChip, roomId === r._id && styles.roomChipActive]}
                onPress={() => setRoomId(r._id)}
              >
                <Text style={[styles.roomChipText, roomId === r._id && styles.roomChipTextActive]}>
                  {r.roomNumber} · {r.roomType}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Evidence image */}
      <Text style={styles.label}>Evidence Photo (optional)</Text>
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        {image ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setImage(null)}
            >
              <Text style={styles.removeImageText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>📷</Text>
            <Text style={styles.imagePlaceholderText}>Tap to attach a photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Submit Report</Text>
        }
      </TouchableOpacity>
    </Animated.ScrollView>
  );
};

export default SubmitComplaintScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#BFDBFE' },

  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  priorityChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  priorityText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827',
  },
  textArea: { height: 110, paddingTop: 12 },

  roomScroll: { marginBottom: 4 },
  roomChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#D1D5DB',
    backgroundColor: '#fff', marginRight: 8,
  },
  roomChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  roomChipText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  roomChipTextActive: { color: '#fff' },

  imageButton: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#D1D5DB',
    borderStyle: 'dashed', overflow: 'hidden', backgroundColor: '#fff',
  },
  imagePlaceholder: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 28,
  },
  imagePlaceholderIcon: { fontSize: 32, marginBottom: 8 },
  imagePlaceholderText: { fontSize: 13, color: '#9CA3AF' },

  imagePreviewWrapper: { position: 'relative' },
  imagePreview: { width: '100%', height: 180 },
  removeImage: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  removeImageText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  submitBtn: {
    backgroundColor: '#1D4ED8', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
    shadowColor: '#1D4ED8', shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});