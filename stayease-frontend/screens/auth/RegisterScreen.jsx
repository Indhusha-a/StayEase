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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  // ── Password strength ──────────────────────────────────────────────────
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
  };
  const strengthScore = Object.values(checks).filter(Boolean).length; // 0-4

  // ── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    const next = {};

    if (!fullName.trim())
      next.fullName = 'Full name is required';

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail)
      next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail))
      next.email = 'Enter a valid email address';

    if (!phone.trim())
      next.phone = 'Phone number is required';

    if (!password)
      next.password = 'Password is required';
    else if (strengthScore < 3)
      next.password = 'Password is too weak';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await register({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password });
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ── Strength bar color ─────────────────────────────────────────────────
  const barColor = (index) => {
    if (index >= strengthScore) return OUTLINE_VAR;
    if (strengthScore <= 1) return ERROR;
    if (strengthScore === 2) return '#854F0B';  // amber
    if (strengthScore === 3) return '#3B6D11';  // green
    return PRIMARY;                              // full = primary blue
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

        {/* ── Title section ── */}
        <View style={s.titleSection}>
          <Text style={s.h1}>Create your{'\n'}account</Text>
          <Text style={s.subtitle}>
            Join our community and start planning your perfect getaway today.
          </Text>
        </View>

        {/* ── Full name ── */}
        <View style={s.fieldWrapper}>
          <Text style={s.label}>Full Name</Text>
          <TextInput
            style={[s.input, !!errors.fullName && s.inputError]}
            value={fullName}
            onChangeText={val => {
              setFullName(val);
              if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
            }}
            placeholder="John Doe"
            placeholderTextColor={OUTLINE}
            autoCapitalize="words"
          />
          {!!errors.fullName && <Text style={s.errorText}>{errors.fullName}</Text>}
        </View>

        {/* ── Email ── */}
        <View style={s.fieldWrapper}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={[s.input, !!errors.email && s.inputError]}
            value={email}
            onChangeText={val => {
              setEmail(val);
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
            placeholder="name@example.com"
            placeholderTextColor={OUTLINE}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {!!errors.email && <Text style={s.errorText}>{errors.email}</Text>}
        </View>

        {/* ── Phone ── */}
        <View style={s.fieldWrapper}>
          <Text style={s.label}>Phone Number</Text>
          <View style={[s.phoneRow, !!errors.phone && s.inputError]}>
            <View style={s.phonePrefix}>
              <Text style={s.phonePrefixText}>+1</Text>
            </View>
            <TextInput
              style={s.phoneInput}
              value={phone}
              onChangeText={val => {
                setPhone(val);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder="(555) 000-0000"
              placeholderTextColor={OUTLINE}
              keyboardType="phone-pad"
            />
          </View>
          {!!errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}
        </View>

        {/* ── Password ── */}
        <View style={s.fieldWrapper}>
          <Text style={s.label}>Password</Text>
          <View style={[s.inputRow, !!errors.password && s.inputError]}>
            <TextInput
              style={s.textInput}
              value={password}
              onChangeText={val => {
                setPassword(val);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••"
              placeholderTextColor={OUTLINE}
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

          {/* Strength bars */}
          {password.length > 0 && (
            <View style={s.strengthSection}>
              <View style={s.barsRow}>
                {[0, 1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[s.bar, { backgroundColor: barColor(i) }]}
                  />
                ))}
              </View>

              {/* Checklist */}
              <View style={s.checkGrid}>
                {[
                  { key: 'length',    label: '8+ characters' },
                  { key: 'uppercase', label: 'Uppercase letter' },
                  { key: 'lowercase', label: 'Lowercase letter' },
                  { key: 'number',    label: 'One number' },
                ].map(({ key, label }) => (
                  <View key={key} style={s.checkItem}>
                    <View style={[
                      s.checkDot,
                      checks[key] ? s.checkDotActive : s.checkDotInactive
                    ]} />
                    <Text style={[
                      s.checkLabel,
                      { color: checks[key] ? ON_SURFACE : OUTLINE }
                    ]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading
            ? <ActivityIndicator color="#ffffff" />
            : <Text style={s.primaryBtnText}>Create Account</Text>
          }
        </TouchableOpacity>

        {/* ── Sign in redirect ── */}
        <View style={s.signinRow}>
          <Text style={s.signinText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.signinLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View style={s.footerLinks}>
            <TouchableOpacity><Text style={s.footerLink}>Terms of Service</Text></TouchableOpacity>
            <TouchableOpacity><Text style={s.footerLink}>Privacy Policy</Text></TouchableOpacity>
          </View>
          <Text style={s.copyright}>© 2024 EASYSTAY INTERNATIONAL</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PRIMARY     = '#0037b0';
const SURFACE     = '#faf8ff';
const SEC_CONT    = '#d0e1fb';
const ON_SEC_CONT = '#54647a';
const ON_SURFACE  = '#1a1b23';
const ON_VARIANT  = '#434655';
const OUTLINE     = '#747686';
const OUTLINE_VAR = '#c4c5d7';
const ERROR       = '#ba1a1a';
const WHITE       = '#ffffff';

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 88,
    paddingBottom: 48,
  },

  // Title
  titleSection: {
    marginBottom: 32,
  },
  h1: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.02 * 36,
    color: ON_SURFACE,
    lineHeight: 44,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: ON_VARIANT,
    lineHeight: 24,
  },

  // Fields
  fieldWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: ON_VARIANT,
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: 0.1,
  },
  input: {
    height: 48,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: ON_SURFACE,
  },
  inputError: {
    borderColor: ERROR,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
    marginTop: 4,
    marginLeft: 2,
  },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 8,
    overflow: 'hidden',
  },
  phonePrefix: {
    backgroundColor: SEC_CONT,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: OUTLINE_VAR,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: ON_SEC_CONT,
    letterSpacing: 0.1,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    fontSize: 16,
    color: ON_SURFACE,
  },

  // Password row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: ON_SURFACE,
    height: '100%',
  },
  visibilityBtn: {
    paddingLeft: 8,
  },
  visibilityText: {
    fontSize: 13,
    fontWeight: '500',
    color: OUTLINE,
  },

  // Strength
  strengthSection: {
    marginTop: 12,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  bar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '47%',
  },
  checkDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  checkDotActive: {
    backgroundColor: PRIMARY,
  },
  checkDotInactive: {
    backgroundColor: OUTLINE_VAR,
  },
  checkLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Button
  primaryBtn: {
    height: 48,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    letterSpacing: 0.1,
  },

  // Sign in
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 40,
  },
  signinText: {
    fontSize: 16,
    color: ON_VARIANT,
  },
  signinLink: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
    marginLeft: 2,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    color: ON_VARIANT,
    textDecorationLine: 'underline',
  },
  copyright: {
    fontSize: 10,
    fontWeight: '600',
    color: OUTLINE,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
});