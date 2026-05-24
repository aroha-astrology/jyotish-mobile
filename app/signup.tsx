import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { colors } from '@/constants/theme';
import { CosmicBackground } from '@/components/CosmicBackground';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  normaliseIndianPhone,
  isValidIndianMobile,
} from '@/lib/firebaseAuth';

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');
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
      const { isNewUser } = await verifyPhoneOTP(confirmation!, otp, referralCode.trim() || undefined);
      router.replace(isNewUser ? '/onboarding' : '/(tabs)');
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message ?? 'Wrong OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600 }}
              style={styles.container}
            >
              <View style={styles.header}>
                <Text style={styles.om}>ॐ</Text>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Begin your Vedic astrology journey</Text>
              </View>

              <View style={styles.formCard}>
                {!otpSent ? (
                  <>
                    <View style={styles.phoneRow}>
                      <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Mobile number"
                        placeholderTextColor={colors.textMuted}
                        value={phone}
                        onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                    <TextInput
                      style={[styles.phoneInput, styles.referralInput]}
                      placeholder="Referral code (optional)"
                      placeholderTextColor={colors.textMuted}
                      value={referralCode}
                      onChangeText={t => setReferralCode(t.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <Pressable
                      onPress={handleSendOTP}
                      disabled={loading}
                      style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
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
                      placeholderTextColor={colors.textMuted}
                      value={otp}
                      onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                    <Pressable
                      onPress={handleVerifyOTP}
                      disabled={loading}
                      style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.primaryBtnText}>Verify & Sign Up</Text>}
                    </Pressable>
                    <Pressable onPress={() => { setOtpSent(false); setOtp(''); }} style={styles.resendBtn}>
                      <Text style={styles.resendText}>Change number / Resend OTP</Text>
                    </Pressable>
                  </>
                )}

              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/login" asChild>
                  <Pressable><Text style={styles.footerLink}>Sign In</Text></Pressable>
                </Link>
              </View>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  container: { width: '100%' },

  header: { alignItems: 'center', marginBottom: 36 },
  om: { fontSize: 52, color: colors.primary, marginBottom: 10 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  formCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 24,
  },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    backgroundColor: colors.bgSurface, overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 12, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: colors.border,
  },
  countryCodeText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  phoneInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.text,
  },

  referralInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.text,
    marginBottom: 12,
  },
  otpHint: {
    textAlign: 'center', fontSize: 13, fontFamily: 'Poppins_400Regular',
    color: colors.textMuted, marginBottom: 12,
  },
  otpInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    backgroundColor: colors.bgSurface, paddingVertical: 14,
    fontSize: 24, fontFamily: 'Poppins_600SemiBold', color: colors.text,
    textAlign: 'center', letterSpacing: 10, marginBottom: 12,
  },
  resendBtn: { alignItems: 'center', marginTop: 6, marginBottom: 4 },
  resendText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.primary, textDecorationLine: 'underline' },

  primaryBtn: {
    paddingVertical: 14, borderRadius: 999, marginBottom: 8,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
});
