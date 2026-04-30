import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';

export default function IndexScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />

      <View style={s.inner}>

        {/* Top section — logo + headline */}
        <View style={s.hero}>
          <View style={s.logoBox}>
            <View style={s.logoInner} />
          </View>

          <Text style={s.brandName}>YourBrand</Text>
          <Text style={s.headline}>Your perfect stay{'\n'}starts here</Text>
          <Text style={s.subtext}>
            Premium rooms, seamless bookings, and instant support — all in one app.
          </Text>
        </View>

        {/* Feature pills */}
        <View style={s.pillRow}>
          <View style={[s.pill, s.pillBlue]}>
            <View style={[s.pillDot, { backgroundColor: '#1D4ED8' }]} />
            <Text style={[s.pillText, { color: '#1D4ED8' }]}>Luxury Rooms</Text>
          </View>
          <View style={[s.pill, s.pillGreen]}>
            <View style={[s.pillDot, { backgroundColor: '#15803D' }]} />
            <Text style={[s.pillText, { color: '#15803D' }]}>Instant Booking</Text>
          </View>
          <View style={[s.pill, s.pillPurple]}>
            <View style={[s.pillDot, { backgroundColor: '#6D28D9' }]} />
            <Text style={[s.pillText, { color: '#6D28D9' }]}>24/7 Support</Text>
          </View>
        </View>

        {/* Card with buttons */}
        <View style={s.card}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
          >
            <Text style={s.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.9}
          >
            <Text style={s.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={s.note}>
            Guests register here · Admin accounts are set up separately
          </Text>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          By continuing you agree to our{' '}
          <Text style={s.footerLink}>Terms</Text>
          {' '}and{' '}
          <Text style={s.footerLink}>Privacy Policy</Text>
        </Text>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  logoInner: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  pillGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pillPurple: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
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
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 16,
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  footerLink: {
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
}); 