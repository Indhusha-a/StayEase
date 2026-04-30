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
  BlurView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const passwordChecks = [
  { test: (v) => v.length >= 8, message: 'At least 8 characters' },
  { test: (v) => /[A-Z]/.test(v), message: 'At least 1 uppercase letter' },
  { test: (v) => /[a-z]/.test(v), message: 'At least 1 lowercase letter' },
  { test: (v) => /\d/.test(v), message: 'At least 1 number' },
];

const Field = ({ label, value, onChangeText, error, optional, ...props }) => (
  <View style={s.fieldWrapper}>
    <View style={s.labelRow}>
      <Text style={s.label}>{label}</Text>
      {optional && <Text style={s.optional}>(optional)</Text>}
    </View>
    <TextInput
      style={[s.input, error && s.inputError]}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      placeholderTextColor="#B0B8C8"
      {...props}
    />
    {error && <Text style={s.error}>{error}</Text>}
  </View>
);

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
  const strengthColor =
    passedPasswordChecks <= 1 ? '#EF4444' : passedPasswordChecks <= 3 ? '#F59E0B' : '#10B981';
  const strengthLabel =
    passedPasswordChecks === 0
      ? ''
      : passedPasswordChecks <= 1
      ? 'Weak'
      : passedPasswordChecks <= 3
      ? 'Fair'
      : 'Strong';

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
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <View style={s.logoInner} />
          </View>
          <Text style={s.brand}>EasyStay</Text>
          <Text style={s.title}>Create your account</Text>
          <Text style={s.subtitle}>Get started — it only takes a minute.</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Field
            label="Full Name"
            value={form.name}
            onChangeText={set('name')}
            error={errors.name}
            placeholder="John Doe"
          />
          <Field
            label="Email Address"
            value={form.email}
            onChangeText={set('email')}
            error={errors.email}
            placeholder="you@company.com"
            keyboardType="email-address"
          />
          <Field
            label="Phone Number"
            value={form.phone}
            onChangeText={set('phone')}
            error={errors.phone}
            placeholder="+94 77 123 4567"
            keyboardType="phone-pad"
            optional
          />

          {/* Password field */}
          <View style={s.fieldWrapper}>
            <Text style={s.label}>Password</Text>
            <View style={[s.passwordRow, errors.password && s.inputError]}>
              <TextInput
                style={s.passwordInput}
                value={form.password}
                onChangeText={set('password')}
                placeholder="Create a strong password"
                placeholderTextColor="#B0B8C8"
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass((p) => !p)} style={s.toggle}>
                <Text style={s.toggleText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.error}>{errors.password}</Text>}

            {/* Strength bar */}
            {form.password.length > 0 && (
              <>
                <View style={s.strengthTrack}>
                  {passwordChecks.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.strengthSegment,
                        { backgroundColor: i < passedPasswordChecks ? strengthColor : '#E5E7EB' },
                      ]}
                    />
                  ))}
                </View>
                {strengthLabel !== '' && (
                  <Text style={[s.strengthLabel, { color: strengthColor }]}>
                    {strengthLabel} password
                  </Text>
                )}

                {/* Requirements checklist */}
                <View style={s.checksGrid}>
                  {passwordChecks.map((rule, i) => {
                    const passed = rule.test(form.password);
                    return (
                      <View key={i} style={s.checkItem}>
                        <View style={[s.checkDot, { backgroundColor: passed ? '#10B981' : '#D1D5DB' }]} />
                        <Text style={[s.checkText, { color: passed ? '#374151' : '#9CA3AF' }]}>
                          {rule.message}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Submit */}
          <TouchableOpacity style={s.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.link}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          By creating an account you agree to our{' '}
          <Text style={s.footerLink}>Terms of Service</Text> and{' '}
          <Text style={s.footerLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 28,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoInner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  brand: {
    fontSize: 15,
    color: '#1D4ED8',
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.08)',
    // iOS shadow
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    // Android
    elevation: 3,
  },

  // Fields
  fieldWrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.1,
  },
  optional: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },

  // Password row
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  toggleText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Strength
  strengthTrack: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  checksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '47%',
  },
  checkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  checkText: {
    fontSize: 11,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },

  // Button
  button: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  link: {
    color: '#1D4ED8',
    textAlign: 'center',
    fontSize: 14,
  },

  // Footer
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  footerLink: {
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});