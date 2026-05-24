import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { ASTRO_PLANS } from '@aroha-astrology/shared';
import { colors } from '@/constants/theme';

interface Customer { id: string; name: string; dob: string; }

export default function DashboardTab() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const { supabase } = require('@/lib/supabase');
    supabase
      .from('astrologer_customers')
      .select('id, name, dob')
      .eq('astrologer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: Customer[] | null }) => {
        setCustomers(data ?? []);
        setLoading(false);
      });
  }, [profile]);

  const plan = profile?.astro_plan ? ASTRO_PLANS[profile.astro_plan] : null;
  const used = customers.length;
  const limit = profile?.customer_limit ?? 0;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Astrologer Portal</Text>
            <Text style={styles.subtitle}>Welcome, {profile?.name ?? 'Astrologer'}</Text>
          </View>
          {plan && (
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{plan.label}</Text>
            </View>
          )}
        </View>

        {/* Quota card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>CLIENTS</Text>
            <Text style={styles.cardMeta}>{used} / {limit}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/customers')}>
              <Text style={styles.primaryBtnText}>View Clients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/customers')}>
              <Text style={styles.secondaryBtnText}>+ Add Client</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.grid}>
          {[
            { emoji: '📅', label: 'Muhurta', sub: 'Auspicious timing', onPress: () => {} },
            { emoji: '📦', label: 'Upgrade', sub: 'Add more slots', onPress: () => router.push('/(tabs)/upgrade') },
          ].map(({ emoji, label, sub, onPress }) => (
            <TouchableOpacity key={label} style={styles.gridCard} onPress={onPress} activeOpacity={0.7}>
              <Text style={styles.gridEmoji}>{emoji}</Text>
              <Text style={styles.gridLabel}>{label}</Text>
              <Text style={styles.gridSub}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent clients */}
        {!loading && customers.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>RECENT CLIENTS</Text>
            {customers.slice(0, 5).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.clientRow}
                onPress={() => router.push(`/customer/${c.id}` as never)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.clientName}>{c.name}</Text>
                  <Text style={styles.clientDob}>
                    {new Date(c.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.clientArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: 16, gap: 14, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  planBadge: { backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: colors.primary, letterSpacing: 1 },
  card: { backgroundColor: colors.bgSurface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  cardMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textSecondary },
  progressBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.bg },
  secondaryBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  secondaryBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.text },
  grid: { flexDirection: 'row', gap: 10 },
  gridCard: { flex: 1, backgroundColor: colors.bgSurface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  gridEmoji: { fontSize: 24, marginBottom: 6 },
  gridLabel: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: colors.text },
  gridSub: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  clientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  clientName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  clientDob: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  clientArrow: { fontSize: 20, color: colors.textSecondary },
});
