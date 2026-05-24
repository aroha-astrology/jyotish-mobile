import { Linking, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

const WEB_URL = 'https://jyotish-ai-v2.vercel.app/login';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔮</Text>
      <Text style={styles.title}>Astrologer Portal</Text>
      <Text style={styles.subtitle}>
        Sign in with your mobile number on the web portal. We&apos;ll bring the
        full mobile app online soon.
      </Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => Linking.openURL(WEB_URL)}
        activeOpacity={0.8}
      >
        <Text style={styles.btnText}>Open web portal</Text>
      </TouchableOpacity>

      <Text style={styles.note}>Phone + OTP only · No Google account needed</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  icon: { fontSize: 52, marginBottom: 8 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: colors.primary, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: { width: '100%', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.bg },
  note: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
