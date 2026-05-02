import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AuthContext from '../../context/AuthContext';
import api from '../../utils/api';
import StaffForm from './StaffForm';
import { authHeaders, toDateInput } from './staffHelpers';

export default function EditStaffScreen({ route, navigation }) {
  const { token, user } = useContext(AuthContext);
  const staff = route.params?.staff;
  const [form, setForm] = useState({
    name: staff?.name || '',
    role: staff?.role || 'Receptionist',
    email: staff?.email || '',
    phone: staff?.phone || '',
    salary: staff?.salary === undefined ? '' : String(staff.salary),
    shift: staff?.shift || 'Morning',
    department: staff?.department || '',
    joiningDate: toDateInput(staff?.joiningDate),
    profileImage: staff?.profileImage || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

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

      await api.put(`/staff/${staff._id}`, payload, {
        headers: authHeaders(token),
      });

      Alert.alert('Success', 'Updated successfully');
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update staff');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Only admins can edit staff members.</Text>
      </View>
    );
  }

  if (!staff?._id) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Staff details are missing.</Text>
      </View>
    );
  }

  return (
    <StaffForm
      form={form}
      setForm={setForm}
      selectedPhoto=""
      onPickPhoto={() => {}}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      submitLabel="Update staff member"
      showPhotoPicker={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  error: { color: '#DC2626', textAlign: 'center', fontWeight: '700' },
});
