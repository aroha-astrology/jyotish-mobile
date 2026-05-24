import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';

const WA_NUMBER = '919535960988';

export default function PendingScreen() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);

  // Poll every 10s for approval
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('users')
        .select('astro_status, astro_plan, customer_limit')
        .eq('id', profile.id)
        .single();

      if (!data) return;
      if (data.astro_status === 'approved') {
        setProfile({ ...profile, astro_status: 'approved', astro_plan: data.astro_plan, customer_limit: data.customer_limit });
        router.replace('/(tabs)');
      } else if (data.astro_status === 'rejected') {
        setProfile({ ...profile, astro_status: 'rejected' });
        router.replace('/rejected');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [profile, setProfile, router]);

  function openWhatsApp() {
    const msg = `Hi, I just registered as an astrologer on Jyotish AI. Please review and approve my account.%0AName: ${profile?.name ?? 'Unknown'}%0AEmail: ${profile?.email ?? ''}`;
    Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${msg}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Account Under Review</Text>
      <Text style={styles.subtitle}>
        Your registration is being reviewed by the admin. Message us on WhatsApp to speed up approval.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>CONTACT FOR APPROVAL</Text>
        <Text style={styles.phone}>+91 95359 60988</Text>
        <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.8}>
          <Text style={styles.waBtnText}>Message on WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>This screen checks automatically every 10 seconds.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  icon: { fontSize: 52, marginBottom: 4 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: { width: '100%', backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10, alignItems: 'center' },
  cardLabel: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  phone: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: colors.text },
  waBtn: { width: '100%', backgroundColor: colors.whatsapp, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  waBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' },
  note: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});
