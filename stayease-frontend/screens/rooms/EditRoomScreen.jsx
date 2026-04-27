import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';

const TYPES     = ['Single', 'Double', 'Suite', 'Deluxe'];
const AMENITIES = ['WiFi', 'AC', 'TV', 'Minibar', 'Balcony', 'Safe', 'Bathtub', 'Kitchen'];
const STATUSES  = ['available', 'booked', 'maintenance'];

// Defined outside the screen so React never re-creates it on state change — keeps the keyboard open
const Field = ({ label, keyName, placeholder, keyboard, multiline, form, onChange }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 90, textAlignVertical: 'top' }]}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={form[keyName]}
      onChangeText={v => onChange(keyName, v)}
      keyboardType={keyboard || 'default'}
      multiline={multiline}
    />
  </>
);

export default function EditRoomScreen({ route, navigation }) {
  const { room } = route.params;

  const [form, setForm] = useState({
    roomNumber:         room.roomNumber         || '',
    roomType:           room.roomType           || 'Single',
    pricePerNight:      String(room.pricePerNight || ''),
    capacity:           String(room.capacity     || ''),
    description:        room.description         || '',
    floor:              String(room.floor        || ''),
    availabilityStatus: room.availabilityStatus  || 'available',
  });
  const [amenities, setAmenities] = useState(room.amenities || []);
  const [image, setImage]         = useState(null);
  const [loading, setLoading]     = useState(false);

  // Updates a single key in the form state
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Toggles a single amenity in/out of the selected list
  const toggleAmenity = (a) => setAmenities(prev =>
    prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
  );

  // Opens device gallery and stores the selected image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  // Sends updated fields as multipart/form-data so a new image can optionally be included
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      amenities.forEach(a => data.append('amenities', a));
      if (image) data.append('image', { uri: image.uri, name: 'room.jpg', type: 'image/jpeg' });

      await api.put(`/rooms/${room._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Updated', 'Room updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Edit Room {room.roomNumber}</Text>
        <Text style={styles.headerSub}>Update the room details below</Text>
      </View>

      <View style={styles.formCard}>
        <Field label="Room Number"     keyName="roomNumber"    placeholder="e.g. 101"              form={form} onChange={set} />
        <Field label="Price Per Night" keyName="pricePerNight" placeholder="e.g. 75"  keyboard="numeric" form={form} onChange={set} />
        <Field label="Capacity"        keyName="capacity"      placeholder="e.g. 2"   keyboard="numeric" form={form} onChange={set} />
        <Field label="Floor"           keyName="floor"         placeholder="e.g. 3"   keyboard="numeric" form={form} onChange={set} />
        <Field label="Description"     keyName="description"   placeholder="Describe the room..." multiline form={form} onChange={set} />

        {/* Room type chip selector */}
        <Text style={styles.label}>Room Type</Text>
        <View style={styles.chipRow}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, form.roomType === t && styles.chipActive]}
              onPress={() => set('roomType', t)}
            >
              <Text style={[styles.chipText, form.roomType === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Availability status chip selector */}
        <Text style={styles.label}>Availability Status</Text>
        <View style={styles.chipRow}>
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, form.availabilityStatus === s && styles.chipActive]}
              onPress={() => set('availabilityStatus', s)}
            >
              <Text style={[styles.chipText, form.availabilityStatus === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amenity multi-select chips */}
        <Text style={styles.label}>Amenities</Text>
        <View style={styles.chipRow}>
          {AMENITIES.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.chip, amenities.includes(a) && styles.chipActive]}
              onPress={() => toggleAmenity(a)}
            >
              <Text style={[styles.chipText, amenities.includes(a) && styles.chipTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional new image — leave untouched to keep the existing one */}
        <Text style={styles.label}>Change Room Image (optional)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image
            ? <Image source={{ uri: image.uri }} style={styles.previewImage} />
            : <View style={styles.imagePlaceholder}>
                <Text style={{ fontSize: 28 }}>📷</Text>
                <Text style={styles.imagePickerText}>Tap to change image</Text>
              </View>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleUpdate} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>✓  Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#EFF6FF' },
  scroll:           { padding: 16, paddingBottom: 60 },
  headerCard:       { backgroundColor: '#1D4ED8', borderRadius: 18, padding: 20, marginBottom: 16 },
  headerTitle:      { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub:        { fontSize: 13, color: '#BFDBFE', marginTop: 4 },
  formCard:         {
                      backgroundColor: '#fff', borderRadius: 18, padding: 20,
                      borderWidth: 1, borderColor: '#E5E7EB',
                      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
                    },
  label:            { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:            { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, fontSize: 14, color: '#111', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 2 },
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  // Extra horizontal padding and standard 'bold' weight prevent Android text clipping
  chip:             { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive:       { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  chipText:         { fontSize: 13, color: '#6B7280', fontWeight: 'bold' },
  chipTextActive:   { color: '#fff' },
  imagePicker:      { borderRadius: 14, overflow: 'hidden', marginBottom: 4, borderWidth: 1.5, borderColor: '#D1D5DB', borderStyle: 'dashed' },
  imagePlaceholder: { height: 110, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  imagePickerText:  { color: '#9CA3AF', marginTop: 6, fontSize: 13 },
  previewImage:     { width: '100%', height: 180, resizeMode: 'cover' },
  submitBtn:        {
                      backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 17,
                      alignItems: 'center', marginTop: 24,
                      shadowColor: '#1D4ED8', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
                    },
  submitText:       { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});