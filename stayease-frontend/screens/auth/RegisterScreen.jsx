import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const Field = ({ label, value, onChangeText, error, ...props }) => (
  <>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={s.input}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      {...props}
    />
    {error && <Text style={s.error}>{error}</Text>}
  </>
);

const passwordChecks = [
  { test: (v) => v.length >= 8, message: 'At least 8 characters' },
  { test: (v) => /[A-Z]/.test(v), message: 'At least 1 uppercase letter' },
  { test: (v) => /[a-z]/.test(v), message: 'At least 1 lowercase letter' },
  { test: (v) => /\d/.test(v), message: 'At least 1 number' },
];

export default function RegisterScreen({ navigation }) {
  const { register, checkEmailAvailability } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name) e.name = 'Name is required';
    else if (name.length < 2) e.name = 'Name must be at least 2 characters';

    if (!email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Valid email required';

    if (phone && !/^\+?[0-9\s-]{7,15}$/.test(phone)) e.phone = 'Enter a valid phone number';

    const firstFailedPasswordRule = passwordChecks.find((rule) => !rule.test(form.password));
    if (!form.password) e.password = 'Password is required';
    else if (firstFailedPasswordRule) e.password = firstFailedPasswordRule.message;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const availability = await checkEmailAvailability(form.email.trim());
      if (!availability.available) {
        setErrors((prev) => ({ ...prev, email: 'This email is already taken' }));
        return;
      }

      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim());
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const passedPasswordChecks = passwordChecks.filter((rule) => rule.test(form.password)).length;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Create Account</Text>

        <Field label="Full Name" value={form.name} onChangeText={set('name')} error={errors.name} placeholder="John Doe" />
        <Field label="Email" value={form.email} onChangeText={set('email')} error={errors.email} placeholder="you@email.com" keyboardType="email-address" />
        <Field label="Phone (optional)" value={form.phone} onChangeText={set('phone')} error={errors.phone} placeholder="+94 77 123 4567" keyboardType="phone-pad" />

        <Text style={s.label}>Password</Text>
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            value={form.password}
            onChangeText={set('password')}
            placeholder="Create a strong password"
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPass((p) => !p)} style={s.toggle}>
            <Text>{showPass ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={s.error}>{errors.password}</Text>}

        <View style={s.strengthBar}>
          <View
            style={[
              s.strengthFill,
              {
                width: `${(passedPasswordChecks / passwordChecks.length) * 100}%`,
                backgroundColor:
                  passedPasswordChecks <= 1
                    ? '#EF4444'
                    : passedPasswordChecks <= 3
                    ? '#F59E0B'
                    : '#10B981',
              },
            ]}
          />
        </View>

        <TouchableOpacity style={s.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={s.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '800', color: '#1D4ED8', textAlign: 'center', marginBottom: 28, marginTop: 60 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  toggle: { padding: 12 },
  error: { color: '#DC2626', fontSize: 12, marginTop: -10, marginBottom: 10 },
  strengthBar: { height: 5, borderRadius: 4, backgroundColor: '#E5E7EB', marginBottom: 14, overflow: 'hidden' },
  strengthFill: { height: '100%' },
  button: { backgroundColor: '#1D4ED8', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: '#1D4ED8', textAlign: 'center', fontSize: 14 },
});
