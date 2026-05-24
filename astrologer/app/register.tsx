import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';
import { ASTRO_PLANS } from '@aroha-astrology/shared';

const WA_NUMBER = '919535960988';

export default function RegisterScreen() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!profile) return;
    setLoading(true);
    try {
      // Append 'astrologer' to roles[] (preserves any existing roles).
      const { data: existing } = await supabase
        .from('users')
        .select('roles')
        .eq('id', profile.id)
        .single();
      const current: string[] = (existing?.roles ?? ['personal']) as string[];
      const next = current.includes('astrologer')
        ? current
        : [...current.filter((r) => r !== 'personal'), 'astrologer'];

      const { error } = await supabase
        .from('users')
        .update({ roles: next, astro_status: 'pending' })
        .eq('id', profile.id);

      if (error) { Alert.alert('Error', error.message); return; }

      setProfile({ ...profile, astro_status: 'pending' });

      const msg = `🔮 New Astrologer Registration%0AName: ${profile.name ?? 'Unknown'}%0AEmail: ${profile.email}%0AUser ID: ${profile.id}%0A%0APlease review at:%0Ahttps://jyotish-ai-v2.vercel.app/admin`;
      await Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${msg}`);

      router.replace('/pending');
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.icon}>🔮</Text>
      <Text style={styles.title}>Join as Astrologer</Text>
      <Text style={styles.subtitle}>
        Register to manage clients, run kundli reports and find auspicious timings — all in one place.
      </Text>

      {/* Plans preview */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>AVAILABLE PLANS</Text>
        {(Object.entries(ASTRO_PLANS) as [string, { price: number; customers: number; label: string }][]).map(([, plan]) => (
          <View key={plan.label} style={styles.planRow}>
            <Text style={styles.planName}>{plan.label}</Text>
            <Text style={styles.planDetail}>{plan.customers} clients · ₹{plan.price}/mo</Text>
          </View>
        ))}
        <Text style={styles.addonNote}>Add-ons: ₹250 (+5) · ₹500 (+11) · ₹1,000 (+25)</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
        <Text style={styles.btnText}>{loading ? 'Registering…' : 'Register & Contact Admin'}</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        After registering, WhatsApp will open so you can send your details to the admin for approval.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 16 },
  icon: { fontSize: 52, marginBottom: 4 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: colors.primary, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: { width: '100%', backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  sectionLabel: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  planDetail: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textSecondary },
  addonNote: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  btn: { width: '100%', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  btnText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.bg },
  note: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
