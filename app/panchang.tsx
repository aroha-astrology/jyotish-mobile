import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { getPanchang } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function fmtDisplay(d: Date) {
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isInRange(now: Date, start: string, end: string): boolean {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const h = now.getHours(), m = now.getMinutes();
  const nowMins = h * 60 + m;
  return nowMins >= sh * 60 + sm && nowMins < eh * 60 + em;
}

function InfoRow({ label, value, sub, active }: { label: string; value: string; sub?: string; active?: boolean }) {
  return (
    <View style={[styles.infoRow, active && styles.infoRowActive]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.infoValue, active && { color: colors.primary }]}>{value}</Text>
        {sub && <Text style={styles.infoSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const LIMB_ICONS: Record<string, string> = {
  tithi: '🌙', nakshatra: '⭐', yoga: '🔱', karana: '☀️', vara: '📅',
};

export default function PanchangScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = fmtDate(selectedDate);
  const now = new Date();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['panchang', dateStr],
    queryFn: () => getPanchang(dateStr),
    staleTime: 10 * 60 * 1000,
  });

  const p = data?.data;

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 450 }} style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Panchang</Text>
            <Text style={styles.subtitle}>Daily Almanac</Text>
          </View>
        </MotiView>

        {/* Date Navigation */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 80 }}>
          <View style={styles.dateNav}>
            <Pressable onPress={() => setSelectedDate(addDays(selectedDate, -1))} style={styles.navBtn}>
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.dateText}>{fmtDisplay(selectedDate)}</Text>
              {fmtDate(selectedDate) !== fmtDate(now) && (
                <Pressable onPress={() => setSelectedDate(new Date())} style={styles.todayPill}>
                  <Text style={styles.todayText}>Today</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => setSelectedDate(addDays(selectedDate, 1))}
              style={[styles.navBtn, fmtDate(selectedDate) >= fmtDate(now) && { opacity: 0.3 }]}
              disabled={fmtDate(selectedDate) >= fmtDate(now)}
            >
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>
        </MotiView>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Reading the stars...</Text>
          </View>
        ) : isError || !p ? (
          <View style={styles.loadingWrap}>
            <Text style={{ fontSize: 32 }}>⚠️</Text>
            <Text style={styles.loadingText}>Could not load panchang data</Text>
          </View>
        ) : (
          <>
            {/* Five Limbs */}
            <Text style={styles.sectionTitle}>Pancha Anga · Five Limbs</Text>
            <View style={styles.limbGrid}>
              {[
                { key: 'tithi', label: 'Tithi', value: p.tithi },
                { key: 'nakshatra', label: 'Nakshatra', value: p.nakshatra },
                { key: 'yoga', label: 'Yoga', value: p.yoga },
                { key: 'karana', label: 'Karana', value: p.karana },
                { key: 'vara', label: 'Vara (Day)', value: p.vara },
              ].map((limb, i) => (
                <MotiView
                  key={limb.key}
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: i * 60 + 150 }}
                  style={styles.limbCardWrap}
                >
                  <Card style={styles.limbCard}>
                    <Text style={styles.limbIcon}>{LIMB_ICONS[limb.key]}</Text>
                    <Text style={styles.limbLabel}>{limb.label}</Text>
                    <Text style={styles.limbValue} numberOfLines={2}>{limb.value}</Text>
                  </Card>
                </MotiView>
              ))}
            </View>

            {/* Sun & Moon */}
            <Text style={styles.sectionTitle}>Sun & Moon Timings</Text>
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 200 }}>
              <Card style={styles.timingsCard}>
                <View style={styles.timingRow}>
                  <View style={styles.timingCell}>
                    <Text style={styles.timingEmoji}>🌅</Text>
                    <Text style={styles.timingLabel}>Sunrise</Text>
                    <Text style={styles.timingValue}>{p.sunrise}</Text>
                  </View>
                  <View style={styles.timingDivider} />
                  <View style={styles.timingCell}>
                    <Text style={styles.timingEmoji}>🌇</Text>
                    <Text style={styles.timingLabel}>Sunset</Text>
                    <Text style={styles.timingValue}>{p.sunset}</Text>
                  </View>
                </View>
              </Card>
            </MotiView>

            {/* Inauspicious Periods */}
            <Text style={styles.sectionTitle}>Inauspicious Periods</Text>
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 280 }}>
              <Card style={styles.inausCard}>
                {[
                  { label: 'Rahu Kaal', icon: '☊', data: p.rahuKaal },
                  { label: 'Gulika Kaal', icon: '⚡', data: p.gulikaKaal },
                  { label: 'Yamaganda', icon: '☠️', data: p.yamagandaKaal },
                ].map((item, i) => {
                  const active = isInRange(now, item.data.start, item.data.end);
                  return (
                    <View key={item.label}>
                      <View style={[styles.inausRow, active && styles.inausRowActive]}>
                        <View style={styles.inausLeft}>
                          <Text style={styles.inausIcon}>{item.icon}</Text>
                          <View>
                            <Text style={styles.inausLabel}>{item.label}</Text>
                            <Text style={styles.inausTime}>{item.data.display ?? `${item.data.start} – ${item.data.end}`}</Text>
                          </View>
                        </View>
                        {active && <Badge variant="red">Now</Badge>}
                      </View>
                      {i < 2 && <View style={styles.separator} />}
                    </View>
                  );
                })}
              </Card>
            </MotiView>

            {/* Abhijit Muhurta */}
            <Text style={styles.sectionTitle}>Auspicious Window</Text>
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 360 }}>
              <Card style={styles.abhijitCard}>
                <View style={styles.abhijitRow}>
                  <View style={styles.abhijitLeft}>
                    <Text style={styles.abhijitEmoji}>✨</Text>
                    <View>
                      <Text style={styles.abhijitTitle}>Abhijit Muhurta</Text>
                      <Text style={styles.abhijitDesc}>Most auspicious 48-minute window</Text>
                    </View>
                  </View>
                  <Badge variant="gold">Auspicious</Badge>
                </View>
                <View style={styles.abhijitTimeRow}>
                  <Text style={styles.abhijitTime}>{p.abhijitMuhurta.start}</Text>
                  <Text style={styles.abhijitTimeDash}>—</Text>
                  <Text style={styles.abhijitTime}>{p.abhijitMuhurta.end}</Text>
                </View>
              </Card>
            </MotiView>

            {/* Ayanamsa */}
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 440 }}>
              <Card style={styles.ayanamsaCard}>
                <InfoRow label="Ayanamsa" value={p.ayanamsa ?? 'Lahiri'} />
                {p.ayanamsaValue && <InfoRow label="Ayanamsa Value" value={`${p.ayanamsaValue.toFixed(4)}°`} />}
              </Card>
            </MotiView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  dateNav: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 6, marginBottom: 22 },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 24, color: colors.primary },
  dateText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center' },
  todayPill: { marginTop: 4, backgroundColor: 'rgba(212,168,67,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2 },
  todayText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  loadingWrap: { alignItems: 'center', paddingTop: 60, gap: 14 },
  loadingText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 },

  limbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  limbCardWrap: { width: '30%', flexGrow: 1 },
  limbCard: { alignItems: 'center', padding: 12, backgroundColor: colors.bgSurface, borderColor: colors.border, gap: 4 },
  limbIcon: { fontSize: 22 },
  limbLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: colors.textMuted, textAlign: 'center' },
  limbValue: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center' },

  timingsCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, marginBottom: 6 },
  timingRow: { flexDirection: 'row', alignItems: 'center' },
  timingCell: { flex: 1, alignItems: 'center', gap: 4 },
  timingDivider: { width: 1, height: 56, backgroundColor: colors.border },
  timingEmoji: { fontSize: 24 },
  timingLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  timingValue: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.primary },

  inausCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, padding: 0, overflow: 'hidden', marginBottom: 6 },
  inausRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  inausRowActive: { backgroundColor: 'rgba(239,68,68,0.06)' },
  inausLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inausIcon: { fontSize: 20 },
  inausLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  inausTime: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
  separator: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: 16 },

  abhijitCard: { backgroundColor: 'rgba(212,168,67,0.06)', borderColor: 'rgba(212,168,67,0.25)', marginBottom: 6 },
  abhijitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  abhijitLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  abhijitEmoji: { fontSize: 24 },
  abhijitTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  abhijitDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 1 },
  abhijitTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  abhijitTime: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.primary },
  abhijitTimeDash: { fontSize: 18, color: colors.textMuted },

  ayanamsaCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, padding: 0, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  infoRowActive: { backgroundColor: 'rgba(212,168,67,0.05)' },
  infoLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  infoValue: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  infoSub: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
});
