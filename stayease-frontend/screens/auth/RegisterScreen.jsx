import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

function InputRow({ icon, placeholder, value, onChange, keyboard, secure, toggle, onToggle }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard || 'default'}
        autoCapitalize="none"
        secureTextEntry={secure}
      />
      {toggle !== undefined && (
        <TouchableOpacity onPress={onToggle}>
          <Text style={styles.toggleText}>{toggle ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Slide + fade in on mount
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Keep the same entry animation style used across auth screens.
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password)
      return Alert.alert('Missing Fields', 'Name, email and password are required.');
    if (password.length < 6)
      return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password, phone.trim());
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.topBlob} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Header */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>🏨</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join StayEase and start booking</Text>

          {/* Step pill */}
          <View style={styles.stepPill}>
            <Text style={styles.stepText}>Guest Registration</Text>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <InputRow icon="👤" placeholder="John Doe" value={name} onChange={setName} />

          <Text style={styles.label}>Email Address</Text>
          <InputRow icon="✉️" placeholder="you@email.com" value={email} onChange={setEmail} keyboard="email-address" />

          <Text style={styles.label}>Phone (optional)</Text>
          <InputRow icon="📱" placeholder="+94 77 123 4567" value={phone} onChange={setPhone} keyboard="phone-pad" />

          <Text style={styles.label}>Password</Text>
          <InputRow icon="🔒" placeholder="Min 6 characters" value={password} onChange={setPassword} secure={!showPass} toggle={showPass} onToggle={() => setShowPass(!showPass)} />

          {/* Password strength bar */}
          <View style={styles.strengthBar}>
            <View style={[styles.strengthFill, {
              width: password.length === 0 ? '0%' : password.length < 6 ? '33%' : password.length < 10 ? '66%' : '100%',
              backgroundColor: password.length < 6 ? '#EF4444' : password.length < 10 ? '#F59E0B' : '#10B981',
            }]} />
          </View>
          <Text style={styles.strengthLabel}>
            {password.length === 0 ? '' : password.length < 6 ? 'Weak' : password.length < 10 ? 'Good' : 'Strong'}
          </Text>

          {/* Register button */}
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Text style={styles.linkBold}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#EFF6FF' },
  topBlob:        { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#BFDBFE', opacity: 0.5 },
  scroll:         { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 60 },
  card:           { backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#1D4ED8', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  logoWrap:       { alignItems: 'center', marginBottom: 6 },
  logoIcon:       { fontSize: 42 },
  title:          { fontSize: 26, fontWeight: '800', color: '#1D4ED8', textAlign: 'center' },
  subtitle:       { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16, marginTop: 4 },
  stepPill:       { backgroundColor: '#EFF6FF', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, alignSelf: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  stepText:       { color: '#1D4ED8', fontWeight: '600', fontSize: 12 },
  label:          { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 },
  inputIcon:      { fontSize: 16, marginRight: 8 },
  input:          { flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' },
  toggleText:     { color: '#1D4ED8', fontWeight: '600', fontSize: 13 },
  strengthBar:    { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  strengthFill:   { height: '100%', borderRadius: 2 },
  strengthLabel:  { fontSize: 11, color: '#6B7280', marginBottom: 16, textAlign: 'right' },
  button:         { backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4, marginBottom: 16, shadowColor: '#1D4ED8', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  buttonText:     { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  linkBtn:        { flexDirection: 'row', justifyContent: 'center' },
  linkText:       { color: '#6B7280', fontSize: 14 },
  linkBold:       { color: '#1D4ED8', fontSize: 14, fontWeight: '700' },
});