import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name = 'Name is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 6)       e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim());
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, ...props }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={form[field]} onChangeText={set(field)}
        autoCapitalize="none" {...props} />
      {errors[field] && <Text style={s.error}>{errors[field]}</Text>}
    </>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Create Account</Text>

        <Field label="Full Name" field="name" placeholder="John Doe" />
        <Field label="Email" field="email" placeholder="you@email.com" keyboardType="email-address" />
        <Field label="Phone (optional)" field="phone" placeholder="+94 77 123 4567" keyboardType="phone-pad" />

        <Text style={s.label}>Password</Text>
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={form.password}
            onChangeText={set('password')} placeholder="Min 6 characters" secureTextEntry={!showPass} />
          <TouchableOpacity onPress={() => setShowPass(p => !p)} style={s.toggle}>
            <Text>{showPass ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={s.error}>{errors.password}</Text>}

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
  title:     { fontSize: 26, fontWeight: '800', color: '#1D4ED8', textAlign: 'center', marginBottom: 28, marginTop: 60 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input:     { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 14 },
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  toggle:    { padding: 12 },
  error:     { color: '#DC2626', fontSize: 12, marginTop: -10, marginBottom: 10 },
  button:    { backgroundColor: '#1D4ED8', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  link:      { color: '#1D4ED8', textAlign: 'center', fontSize: 14 },
});