import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { imageUrl, roles, shifts } from './staffHelpers';

export default function StaffForm({
  form,
  setForm,
  selectedPhoto,
  onPickPhoto,
  onSubmit,
  submitting,
  error,
  submitLabel,
  showPhotoPicker,
}) {
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showPhotoPicker && (
        <View style={styles.photoSection}>
          {selectedPhoto || form.profileImage ? (
            <Image source={{ uri: selectedPhoto || imageUrl(form.profileImage) }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoText}>Photo</Text>
            </View>
          )}
          <TouchableOpacity style={styles.secondaryButton} onPress={onPickPhoto}>
            <Text style={styles.secondaryButtonText}>Select profile photo</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(value) => setField('name', value)}
        placeholder="Full name"
      />

      <Text style={styles.label}>Role</Text>
      <View style={styles.chipWrap}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.chip, form.role === role && styles.chipActive]}
            onPress={() => setField('role', role)}
          >
            <Text style={[styles.chipText, form.role === role && styles.chipTextActive]}>{role}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={form.email}
        onChangeText={(value) => setField('email', value)}
        placeholder="email@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={(value) => setField('phone', value)}
        placeholder="0771234567"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Salary</Text>
      <TextInput
        style={styles.input}
        value={String(form.salary || '')}
        onChangeText={(value) => setField('salary', value)}
        placeholder="Salary"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Shift</Text>
      <View style={styles.chipWrap}>
        {shifts.map((shift) => (
          <TouchableOpacity
            key={shift}
            style={[styles.chip, form.shift === shift && styles.chipActive]}
            onPress={() => setField('shift', shift)}
          >
            <Text style={[styles.chipText, form.shift === shift && styles.chipTextActive]}>{shift}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Department</Text>
      <TextInput
        style={styles.input}
        value={form.department}
        onChangeText={(value) => setField('department', value)}
        placeholder="Department"
      />

      <Text style={styles.label}>Joining Date</Text>
      <TextInput
        style={styles.input}
        value={form.joiningDate}
        onChangeText={(value) => setField('joiningDate', value)}
        placeholder="YYYY-MM-DD"
      />

      <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Saving...' : submitLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 18, paddingBottom: 36 },
  error: { color: '#DC2626', marginBottom: 12, fontWeight: '600' },
  photoSection: { alignItems: 'center', marginBottom: 18 },
  photo: { width: 108, height: 108, borderRadius: 54, marginBottom: 12, backgroundColor: '#E5E7EB' },
  photoPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    marginBottom: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { color: '#1D4ED8', fontWeight: '800' },
  label: { marginBottom: 7, marginTop: 12, color: '#374151', fontWeight: '800' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#1D4ED8' },
  chipText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },
  secondaryButton: { backgroundColor: '#E0F2FE', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  secondaryButtonText: { color: '#0369A1', fontWeight: '800' },
  submitButton: {
    marginTop: 22,
    backgroundColor: '#1D4ED8',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
