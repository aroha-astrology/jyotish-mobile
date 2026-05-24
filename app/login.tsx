import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  normaliseIndianPhone,
  isValidIndianMobile,
} from '@/lib/firebaseAuth';

const C = {
  bg1:         '#D4B896',
  bg2:         '#E8D5C0',
  bg3:         '#F2E8DA',
  bg4:         '#F5EFE0',
  text:        '#3E2723',
  heading:     '#2C1507',
  brown:       '#5C2E0E',
  gold:        '#8B6914',
  muted:       '#8B7355',
  inputBg:     '#F0E8DD',
  inputBorder: '#D4C4B0',
  btnBot:      '#8B6240',
};

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<Awaited<ReturnType<typeof sendPhoneOTP>> | null>(null);

  const handleSendOTP = async () => {
    if (!isValidIndianMobile(phone)) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const conf = await sendPhoneOTP(normaliseIndianPhone(phone));
      setConfirmation(conf);
      setOtpSent(true);
    } catch (e: any) {
      Alert.alert('Failed to send OTP', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit OTP sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOTP(confirmation!, otp);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message ?? 'Wrong OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[C.bg1, C.bg2, C.bg3, C.bg4]}
        locations={[0, 0.25, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.welcomeLabel}>WELCOME TO</Text>

              <View style={styles.planetWrap}>
                <View style={styles.planetOuter}>
                  <View style={styles.planetInner} />
                </View>
              </View>

              <Text style={styles.appName}>Aroha Astrology</Text>
              <Text style={styles.tagline}>Begin your personal journey</Text>
              <Text style={styles.subtitle}>
                Step into your personalised astrology journey. Made for your life, your chart, your decisions.
              </Text>

              {!otpSent ? (
                <>
                  <View style={styles.phoneRow}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Mobile number"
                      placeholderTextColor={C.muted}
                      value={phone}
                      onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  <Pressable
                    onPress={handleSendOTP}
                    disabled={loading}
                    style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.primaryBtnText}>Send OTP</Text>}
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.otpHint}>OTP sent to +91 {phone}</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="• • • • • •"
                    placeholderTextColor={C.muted}
                    value={otp}
                    onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  <Pressable
                    onPress={handleVerifyOTP}
                    disabled={loading}
                    style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.primaryBtnText}>Verify & Sign In</Text>}
                  </Pressable>
                  <Pressable onPress={() => { setOtpSent(false); setOtp(''); }} style={styles.resendBtn}>
                    <Text style={styles.resendText}>Change number / Resend OTP</Text>
                  </Pressable>
                </>
              )}

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>New user? </Text>
                <Link href="/signup" asChild>
                  <Pressable><Text style={styles.signupLink}>Sign Up</Text></Pressable>
                </Link>
              </View>

              <Text style={styles.termsText}>
                By registering, I agree to{' '}
                <Text style={styles.termsLink}>Aroha Astrology's T&Cs</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  card: { width: '100%', maxWidth: 400, alignSelf: 'center' },

  welcomeLabel: {
    textAlign: 'center', fontSize: 11, fontFamily: 'Poppins_600SemiBold',
    color: C.gold, letterSpacing: 3, marginBottom: 16,
  },
  planetWrap: { alignItems: 'center', marginBottom: 12 },
  planetOuter: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#8B5E3C',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5C2E0E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  planetInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C1507' },
  appName: {
    textAlign: 'center', fontSize: 36, fontFamily: 'PlayfairDisplay_700Bold',
    color: C.brown, marginBottom: 24,
  },
  tagline: {
    textAlign: 'center', fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold',
    color: C.heading, marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center', fontSize: 13, fontFamily: 'Poppins_400Regular',
    color: C.muted, marginBottom: 28, lineHeight: 19, paddingHorizontal: 8,
  },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: C.inputBorder, borderRadius: 12,
    backgroundColor: C.inputBg, overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 12, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: C.inputBorder,
  },
  countryCodeText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.text },
  phoneInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, fontFamily: 'Poppins_400Regular', color: C.text,
  },

  otpHint: {
    textAlign: 'center', fontSize: 13, fontFamily: 'Poppins_400Regular',
    color: C.muted, marginBottom: 12,
  },
  otpInput: {
    borderWidth: 1, borderColor: C.inputBorder, borderRadius: 12,
    backgroundColor: C.inputBg, paddingVertical: 14,
    fontSize: 24, fontFamily: 'Poppins_600SemiBold', color: C.text,
    textAlign: 'center', letterSpacing: 10, marginBottom: 12,
  },
  resendBtn: { alignItems: 'center', marginTop: 6, marginBottom: 4 },
  resendText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: C.gold, textDecorationLine: 'underline' },

  primaryBtn: {
    paddingVertical: 14, borderRadius: 999, marginBottom: 8,
    backgroundColor: C.btnBot, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.muted },
  signupLink: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: C.brown, textDecorationLine: 'underline' },

  termsText: {
    textAlign: 'center', fontSize: 11, fontFamily: 'Poppins_400Regular',
    color: C.muted, marginTop: 8,
  },
  termsLink: { fontFamily: 'Poppins_500Medium', color: C.brown, textDecorationLine: 'underline' },
});
