import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { ASTRO_PLANS } from '@aroha-astrology/shared';
import { colors } from '@/constants/theme';

export default function ProfileTab() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const plan = profile?.astro_plan ? ASTRO_PLANS[profile.astro_plan] : null;

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        router.replace('/login');
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{profile?.name ?? '—'}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{profile?.email ?? '—'}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Plan</Text>
            <Text style={styles.rowValue}>{plan ? `${plan.label} · ${plan.customers} clients` : '—'}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Client slots</Text>
            <Text style={styles.rowValue}>{profile?.customer_limit ?? 0}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={[styles.rowValue, { color: colors.success, textTransform: 'capitalize' }]}>
              {profile?.astro_status ?? '—'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 16, gap: 14 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text },
  card: { backgroundColor: colors.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  rowLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary },
  rowValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text, maxWidth: '60%', textAlign: 'right' },
  signOutBtn: { marginTop: 'auto', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  signOutText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: colors.destructive },
});
