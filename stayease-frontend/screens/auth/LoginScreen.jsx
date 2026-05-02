import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const next = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      next.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      next.email = 'Enter a valid email address';
    }

    if (!password) next.password = 'Password is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong';
      if (message === 'Incorrect password') {
        setErrors(prev => ({ ...prev, password: message }));
      } else if (
        message === 'No account found for this email' ||
        message === 'Invalid email format'
      ) {
        setErrors(prev => ({ ...prev, email: message }));
      }
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.iconCircle}>
            <Text style={s.iconGlyph}>🏨</Text>
          </View>
          <Text style={s.pageTitle}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to manage your bookings</Text>
        </View>

        {/* ── Form card ── */}
        <View style={s.card}>

          {/* Email */}
          <View style={s.fieldWrapper}>
            <Text style={s.label}>Email address</Text>
            <View style={[s.inputRow, !!errors.email && s.inputError]}>
              <Text style={s.inputIcon}>✉</Text>
              <TextInput
                style={s.textInput}
                value={email}
                onChangeText={val => {
                  setEmail(val);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="name@example.com"
                placeholderTextColor="#747686"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {!!errors.email && <Text style={s.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={s.fieldWrapper}>
            <Text style={s.label}>Password</Text>
            <View style={[s.inputRow, !!errors.password && s.inputError]}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.textInput}
                value={password}
                onChangeText={val => {
                  setPassword(val);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                placeholderTextColor="#747686"
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPass(p => !p)}
                style={s.visibilityBtn}
              >
                <Text style={s.visibilityText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {!!errors.password && <Text style={s.errorText}>{errors.password}</Text>}
            <TouchableOpacity style={s.forgotRow}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={s.primaryBtnText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerLabel}>or continue with</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={s.socialRow}>
            <TouchableOpacity style={s.socialBtn} activeOpacity={0.85}>
              <Text style={s.socialIcon}>G</Text>
              <Text style={s.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.socialBtn} activeOpacity={0.85}>
              <Text style={s.socialIcon}></Text>
              <Text style={s.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={s.registerRow}>
            <Text style={s.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.registerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* ── Hotel image card ── */}
        <View style={s.hotelCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80' }}
            style={s.hotelImage}
            resizeMode="cover"
          />
          <View style={s.hotelCaption}>
            <Text style={s.hotelCaptionText}>Inspired stays, tailored for you.</Text>
          </View>
        </View>

        {/* ── Footer links ── */}
        <View style={s.footer}>
          <TouchableOpacity><Text style={s.footerLink}>Privacy Policy</Text></TouchableOpacity>
          <Text style={s.footerDot}>·</Text>
          <TouchableOpacity><Text style={s.footerLink}>Terms of Service</Text></TouchableOpacity>
          <Text style={s.footerDot}>·</Text>
          <TouchableOpacity><Text style={s.footerLink}>Help Center</Text></TouchableOpacity>
        </View>
        <Text style={s.copyright}>© 2024 EasyStay. All rights reserved.</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PRIMARY       = '#0037b0';
const SURFACE       = '#faf8ff';
const SURFACE_HIGH  = '#e8e7f3';
const SURFACE_LOW   = '#f3f2fe';
const ON_SURFACE    = '#1a1b23';
const ON_VARIANT    = '#434655';
const OUTLINE       = '#747686';
const OUTLINE_VAR   = '#c4c5d7';
const ERROR         = '#ba1a1a';
const WHITE         = '#ffffff';

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SURFACE_HIGH,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconGlyph: {
    fontSize: 28,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.02 * 24,
    color: ON_SURFACE,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: ON_VARIANT,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    borderWidth: 0.5,
    borderColor: OUTLINE_VAR,
    marginBottom: 24,
  },

  // Fields
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.01 * 12,
    color: ON_VARIANT,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: ERROR,
  },
  inputIcon: {
    fontSize: 16,
    color: OUTLINE,
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: ON_SURFACE,
    height: '100%',
  },
  visibilityBtn: {
    paddingHorizontal: 4,
  },
  visibilityText: {
    fontSize: 13,
    fontWeight: '500',
    color: OUTLINE,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },

  // Primary button
  primaryBtn: {
    height: 48,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    letterSpacing: 0.01 * 14,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: OUTLINE_VAR,
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: OUTLINE,
    marginHorizontal: 12,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 8,
    backgroundColor: WHITE,
    gap: 8,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: ON_SURFACE,
  },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    fontSize: 14,
    color: ON_VARIANT,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },

  // Hotel image card
  hotelCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: OUTLINE_VAR,
    backgroundColor: WHITE,
    marginBottom: 28,
  },
  hotelImage: {
    width: '100%',
    height: 160,
  },
  hotelCaption: {
    padding: 12,
    alignItems: 'center',
  },
  hotelCaptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: OUTLINE,
    letterSpacing: 0.01 * 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    color: ON_VARIANT,
  },
  footerDot: {
    fontSize: 12,
    color: OUTLINE,
  },
  copyright: {
    fontSize: 12,
    fontWeight: '600',
    color: OUTLINE,
    textAlign: 'center',
  },
});