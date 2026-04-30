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
      } else if (
        message === 'No account found for this email' ||
        message === 'Invalid email format'
      ) {
        setErrors((prev) => ({ ...prev, email: message }));
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
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <View style={s.logoInner} />
          </View>
          <Text style={s.brand}>EasyStay</Text>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your account to continue.</Text>
        </View>

        {/* Card */}
        <View style={s.card}>

          {/* Email */}
          <View style={s.fieldWrapper}>
            <Text style={s.label}>Email Address</Text>
            <TextInput
              style={[s.input, !!errors.email && s.inputError]}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="you@company.com"
              placeholderTextColor="#B0B8C8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!errors.email && <Text style={s.error}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={s.fieldWrapper}>
            <Text style={s.label}>Password</Text>
            <View style={[s.passwordRow, !!errors.password && s.inputError]}>
              <TextInput
                style={s.passwordInput}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="Your password"
                placeholderTextColor="#B0B8C8"
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPass((p) => !p)}
                style={s.toggle}
              >
                <Text style={s.toggleText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {!!errors.password && <Text style={s.error}>{errors.password}</Text>}
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Submit */}
          <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.link}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          By signing in you agree to our{' '}
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
    paddingTop: 80,
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
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },

  // Fields
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.1,
    marginBottom: 6,
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