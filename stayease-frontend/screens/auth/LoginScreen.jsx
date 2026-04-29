import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong';
      if (message === 'Incorrect password') {
        setErrors((prev) => ({ ...prev, password: message }));
      } else if (message === 'No account found for this email' || message === 'Invalid email format') {
        setErrors((prev) => ({ ...prev, email: message }));
      }
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={s.title}>StayEase</Text>

      <Text style={s.label}>Email</Text>
      <TextInput
        style={s.input}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
        }}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {!!errors.email && <Text style={s.error}>{errors.email}</Text>}

      <Text style={s.label}>Password</Text>
      <View style={s.row}>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
          }}
          placeholder="Password"
          secureTextEntry={!showPass}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPass((p) => !p)} style={s.toggle}>
          <Text>{showPass ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      {!!errors.password && <Text style={s.error}>{errors.password}</Text>}

      <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={s.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#1D4ED8', marginBottom: 32, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  toggle: { padding: 12 },
  error: { color: '#DC2626', fontSize: 12, marginTop: -10, marginBottom: 10 },
  button: { backgroundColor: '#1D4ED8', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: '#1D4ED8', textAlign: 'center', fontSize: 14 },
});
