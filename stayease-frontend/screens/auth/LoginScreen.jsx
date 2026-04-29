import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('Missing Fields', 'Please enter your email and password.');
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={s.title}>StayEase</Text>

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail}
        placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />

      <Text style={s.label}>Password</Text>
      <View style={s.row}>
        <TextInput style={[s.input, { flex: 1 }]} value={password} onChangeText={setPassword}
          placeholder="Password" secureTextEntry={!showPass} />
        <TouchableOpacity onPress={() => setShowPass(p => !p)} style={s.toggle}>
          <Text>{showPass ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

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
  title:     { fontSize: 28, fontWeight: '800', color: '#1D4ED8', marginBottom: 32, textAlign: 'center' },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input:     { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 14 },
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  toggle:    { padding: 12 },
  button:    { backgroundColor: '#1D4ED8', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  link:      { color: '#1D4ED8', textAlign: 'center', fontSize: 14 },
});