import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated, Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Animation values
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const logoScale   = useRef(new Animated.Value(0.8)).current;

  // Run entrance animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1,  duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,  duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1,  friction: 5,   useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('Missing Fields', 'Please enter your email and password.');
    try {
      setLoading(true);
      await login(email.trim(), password);
      // AuthContext state change → App.jsx auto-navigates to MainTabs
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Decorative top blob */}
      <View style={styles.topBlob} />

      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Animated logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
          <Text style={styles.logoIcon}>🏨</Text>
        </Animated.View>

        <Text style={styles.title}>StayEase</Text>
        <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>

        {/* Email input */}
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password input with show/hide toggle */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Text style={styles.toggleText}>{showPass ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register link */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkBtn}>
          <Text style={styles.linkText}>Don't have an account? </Text>
          <Text style={styles.linkBold}>Register</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom decorative blob */}
      <View style={styles.bottomBlob} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#EFF6FF', justifyContent: 'center', padding: 20 },
  topBlob:      { position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: '#BFDBFE', opacity: 0.6 },
  bottomBlob:   { position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: '#93C5FD', opacity: 0.4 },
  card:         { backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#1D4ED8', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  logoWrap:     { alignItems: 'center', marginBottom: 8 },
  logoIcon:     { fontSize: 48 },
  title:        { fontSize: 30, fontWeight: '800', color: '#1D4ED8', textAlign: 'center' },
  subtitle:     { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 28, marginTop: 4 },
  label:        { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 },
  inputIcon:    { fontSize: 16, marginRight: 8 },
  input:        { flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' },
  toggleText:   { color: '#1D4ED8', fontWeight: '600', fontSize: 13 },
  button:       { backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#1D4ED8', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  buttonText:   { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  divider:      { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText:  { marginHorizontal: 12, color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  linkBtn:      { flexDirection: 'row', justifyContent: 'center' },
  linkText:     { color: '#6B7280', fontSize: 14 },
  linkBold:     { color: '#1D4ED8', fontSize: 14, fontWeight: '700' },
});