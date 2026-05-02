import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ImageBackground,
  StatusBar,
} from 'react-native';

export default function IndexScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation matching the auth screens
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80' }}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* App name badge */}
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeIcon}>🏨</Text>
            <Text style={styles.badge}>StayEase</Text>
          </View>

          <Text style={styles.title}>Luxury stays by the coast</Text>
          <Text style={styles.subtitle}>
            Discover premium rooms, seamless bookings, and quick support — all in one place.
          </Text>

          {/* Divider before buttons */}
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          {/* Small note below buttons */}
          <Text style={styles.note}>Sign-In and Register Here</Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 25, 47, 0.52)',
    padding: 20,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.18)',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeIcon: { fontSize: 14, marginRight: 6 },
  badge: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: '#0F172A',
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  secondaryBtnText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 15,
  },
  note: {
    marginTop: 16,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
