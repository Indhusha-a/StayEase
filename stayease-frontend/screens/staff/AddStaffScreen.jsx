import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AuthContext from '../../context/AuthContext';
import api from '../../utils/api';
import StaffForm from './StaffForm';
import { authHeaders, photoUploadUrl } from './staffHelpers';

const initialForm = {
  name: '',
  role: 'Receptionist',
  email: '',
  phone: '',
  salary: '',
  shift: 'Morning',
  department: '',
  joiningDate: '',
  profileImage: '',
};

export default function AddStaffScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Gallery permission is required to select a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (staffId) => {
    const formData = new FormData();
    const fileName = photo.fileName || `staff-${Date.now()}.jpg`;
    const mimeType = photo.mimeType || 'image/jpeg';

    formData.append('photo', {
      uri: photo.uri,
      name: fileName,
      type: mimeType,
    });

    const res = await fetch(photoUploadUrl(staffId), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Staff was added, but photo upload failed');
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.role || !form.email.trim() || !form.phone.trim()) {
      setError('Name, role, email, and phone are required');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        role: form.role,
        email: form.email.trim(),
        phone: form.phone.trim(),
        salary: form.salary === '' ? 0 : Number(form.salary),
        shift: form.shift,
        department: form.department.trim(),
        joiningDate: form.joiningDate || undefined,
      };

      const res = await api.post('/staff', payload, {
        headers: authHeaders(token),
      });

      if (photo) {
        await uploadPhoto(res.data._id);
      }

      Alert.alert('Success', 'Staff member added');
      navigation.navigate('StaffList');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Only admins can add staff members.</Text>
      </View>
    );
  }

  return (
    <StaffForm
      form={form}
      setForm={setForm}
      selectedPhoto={photo?.uri || ''}
      onPickPhoto={pickPhoto}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      submitLabel="Add staff member"
      showPhotoPicker
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  error: { color: '#DC2626', textAlign: 'center', fontWeight: '700' },
});
