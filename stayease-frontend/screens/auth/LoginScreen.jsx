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
    const next = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      next.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      next.email = 'Enter a valid email address';
    }

    if (!password) {
      next.password = 'Password is required';
    }

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Access your account to manage bookings.</Text>
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="name@example.com"
            placeholderTextColor="#747686"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordRow, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="Enter password"
              placeholderTextColor="#747686"
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass((prev) => !prev)} style={styles.showButton}>
              <Text style={styles.showButtonText}>{showPass ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1b23',
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#434655',
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    marginLeft: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#434655',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#c4c5d7',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1a1b23',
  },
  passwordRow: {
    height: 48,
    borderWidth: 1,
    borderColor: '#c4c5d7',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1b23',
  },
  showButton: {
    paddingLeft: 10,
  },
  showButtonText: {
    fontSize: 13,
    color: '#747686',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ba1a1a',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
    fontSize: 12,
    color: '#ba1a1a',
  },
  button: {
    marginTop: 4,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0037b0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#434655',
    fontSize: 15,
  },
  footerLink: {
    color: '#0037b0',
    fontSize: 15,
    fontWeight: '600',
  },
});
