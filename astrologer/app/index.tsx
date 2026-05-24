import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';

export default function SplashScreen() {
  const authReady = useStore((s) => s.authReady);
  const profile = useStore((s) => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.astro_status === 'approved') router.replace('/(tabs)');
    else if (profile.astro_status === 'rejected') router.replace('/rejected');
    else if (profile.astro_status === 'pending') router.replace('/pending');
    else router.replace('/register');
  }, [authReady, profile, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔮</Text>
      <Text style={styles.title}>Jyotish AI</Text>
      <Text style={styles.subtitle}>Astrologer Portal</Text>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon: { fontSize: 52, marginBottom: 8 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: colors.primary },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary, marginBottom: 32 },
  spinner: { marginTop: 16 },
});
