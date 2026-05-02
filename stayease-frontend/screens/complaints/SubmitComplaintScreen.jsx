import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AuthContext from '../../context/AuthContext';
import api from '../../utils/api';
import {
  authHeaders,
  complaintTypes,
  evidenceUploadUrl,
  priorities,
} from './complaintHelpers';

const initialForm = {
  type: 'Complaint',
  priority: 'Low',
  title: '',
  description: '',
  roomId: '',
};

export default function SubmitComplaintScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [form, setForm] = useState(initialForm);
  const [rooms, setRooms] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = user?.role === 'guest' || user?.role === 'staff';

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await api.get('/rooms');
        setRooms(res.data || []);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Gallery permission is required to select an evidence photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0]);
    }
  };

  const uploadImage = async (complaintId) => {
    const formData = new FormData();
    formData.append('image', {
      uri: photo.uri,
      name: photo.fileName || `complaint-${Date.now()}.jpg`,
      type: photo.mimeType || 'image/jpeg',
    });

    const res = await fetch(evidenceUploadUrl(complaintId), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Complaint was saved, but image upload failed');
    }
  };

  const submit = async () => {
    if (!form.type || !form.title.trim() || !form.description.trim()) {
      setError('Type, title, and description are required');
      return;
    }

    try {
      setError('');
      setSubmitting(true);

      const payload = {
        type: form.type,
        priority: form.priority,
        title: form.title.trim(),
        description: form.description.trim(),
        roomId: form.roomId || undefined,
      };

      const res = await api.post('/complaints', payload, {
        headers: authHeaders(token),
      });

      if (photo) {
        await uploadImage(res.data._id);
      }

      Alert.alert('Success', 'Request submitted successfully');
      navigation.navigate('MyComplaints');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canSubmit) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Only guests and staff can submit complaints or requests.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Submit Request</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Type</Text>
      <View style={styles.chipWrap}>
        {complaintTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, form.type === type && styles.chipActive]}
            onPress={() => setField('type', type)}
          >
            <Text style={[styles.chipText, form.type === type && styles.chipTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipWrap}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority}
            style={[styles.chip, form.priority === priority && styles.chipActive]}
            onPress={() => setField('priority', priority)}
          >
            <Text style={[styles.chipText, form.priority === priority && styles.chipTextActive]}>
              {priority}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={form.title}
        onChangeText={(value) => setField('title', value)}
        placeholder="Short title"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.description}
        onChangeText={(value) => setField('description', value)}
        placeholder="Explain the issue"
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>Room</Text>
      {loadingRooms ? (
        <ActivityIndicator color="#1D4ED8" />
      ) : (
        <View style={styles.chipWrap}>
          <TouchableOpacity
            style={[styles.chip, !form.roomId && styles.chipActive]}
            onPress={() => setField('roomId', '')}
          >
            <Text style={[styles.chipText, !form.roomId && styles.chipTextActive]}>None</Text>
          </TouchableOpacity>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room._id}
              style={[styles.chip, form.roomId === room._id && styles.chipActive]}
              onPress={() => setField('roomId', room._id)}
            >
              <Text style={[styles.chipText, form.roomId === room._id && styles.chipTextActive]}>
                Room {room.roomNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Evidence Image</Text>
      {photo ? <Image source={{ uri: photo.uri }} style={styles.preview} /> : null}
      <TouchableOpacity style={styles.secondaryButton} onPress={pickPhoto}>
        <Text style={styles.secondaryText}>{photo ? 'Change image' : 'Select image'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit request'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 18, paddingBottom: 36 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  error: { color: '#DC2626', fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  label: { marginTop: 12, marginBottom: 7, color: '#374151', fontWeight: '800' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
  },
  textArea: { minHeight: 120 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#1D4ED8' },
  chipText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },
  preview: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10, backgroundColor: '#E5E7EB' },
  secondaryButton: { backgroundColor: '#E0F2FE', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  secondaryText: { color: '#0369A1', fontWeight: '800' },
  submitButton: { marginTop: 20, backgroundColor: '#1D4ED8', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
