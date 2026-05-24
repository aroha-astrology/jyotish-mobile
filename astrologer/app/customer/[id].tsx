import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';

interface Customer {
  id: string;
  name: string;
  dob: string;
  birth_time: string | null;
  birth_place: string | null;
  gender: string | null;
  notes: string | null;
  created_at: string;
}

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useStore((s) => s.profile);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !profile) return;
    supabase
      .from('astrologer_customers')
      .select('*')
      .eq('id', id)
      .eq('astrologer_id', profile.id)
      .single()
      .then(({ data }) => {
        if (!data) { router.back(); return; }
        setCustomer(data);
        setLoading(false);
      });
  }, [id, profile, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!customer) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Clients</Text>
        </TouchableOpacity>

        <Text style={styles.name}>{customer.name}</Text>

        <View style={styles.card}>
          {[
            ['Date of Birth', new Date(customer.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
            ['Time of Birth', customer.birth_time ?? '—'],
            ['Place of Birth', customer.birth_place ?? '—'],
            ['Gender', customer.gender ?? '—'],
            ['Added On', new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
          ].map(([label, value], i) => (
            <View key={label} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
          {customer.notes && (
            <View style={[styles.notesBlock, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Notes</Text>
              <Text style={styles.notesText}>{customer.notes}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>ACTIONS</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>🔯</Text>
            <Text style={styles.actionLabel}>Generate Kundli</Text>
            <Text style={styles.actionSub}>Birth chart analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>📅</Text>
            <Text style={styles.actionLabel}>Muhurta</Text>
            <Text style={styles.actionSub}>Auspicious timing</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: 16, gap: 14, paddingBottom: 32 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  back: { marginBottom: 4 },
  backText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary },
  name: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: colors.text },
  card: { backgroundColor: colors.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  rowLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textSecondary },
  rowValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.text },
  notesBlock: { paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  notesText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.text, lineHeight: 18 },
  sectionLabel: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: colors.bgSurface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  actionEmoji: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  actionSub: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
