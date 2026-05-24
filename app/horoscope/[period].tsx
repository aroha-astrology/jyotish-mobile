import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Briefcase, Heart, Activity, Sun, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { getDailyHoroscope, type DailyHoroscopeData } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { CosmicBackground } from '@/components/CosmicBackground';

const RASHIS = [
  { id: 'aries',       name: 'Mesha',      english: 'Aries',       symbol: '♈', color: '#e53935' },
  { id: 'taurus',      name: 'Vrishabha',  english: 'Taurus',      symbol: '♉', color: '#4caf50' },
  { id: 'gemini',      name: 'Mithuna',    english: 'Gemini',      symbol: '♊', color: '#f5a623' },
  { id: 'cancer',      name: 'Karka',      english: 'Cancer',      symbol: '♋', color: '#b0c4de' },
  { id: 'leo',         name: 'Simha',      english: 'Leo',         symbol: '♌', color: '#ffd700' },
  { id: 'virgo',       name: 'Kanya',      english: 'Virgo',       symbol: '♍', color: '#00d4b8' },
  { id: 'libra',       name: 'Tula',       english: 'Libra',       symbol: '♎', color: '#ff80ab' },
  { id: 'scorpio',     name: 'Vrishchika', english: 'Scorpio',     symbol: '♏', color: '#9c27b0' },
  { id: 'sagittarius', name: 'Dhanu',      english: 'Sagittarius', symbol: '♐', color: '#607d8b' },
  { id: 'capricorn',   name: 'Makara',     english: 'Capricorn',   symbol: '♑', color: '#795548' },
  { id: 'aquarius',    name: 'Kumbha',     english: 'Aquarius',    symbol: '♒', color: '#c4b5fd' },
  { id: 'pisces',      name: 'Meena',      english: 'Pisces',      symbol: '♓', color: '#00d4b8' },
];

function RashiCard({ rashi, selected, onPress }: { rashi: typeof RASHIS[0]; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
      <Card style={[styles.rashiCard, selected && { borderColor: rashi.color, borderWidth: 2 }]}>
        <Text style={[styles.rashiSymbol, { color: rashi.color }]}>{rashi.symbol}</Text>
        <Text style={styles.rashiName}>{rashi.name}</Text>
        <Text style={styles.rashiEnglish}>{rashi.english}</Text>
      </Card>
    </Pressable>
  );
}

function HoroscopeDetail({ data, rashiColor }: { data: DailyHoroscopeData; rashiColor: string }) {
  const sections = [
    { icon: Sun,      label: 'General',  content: data.general,  color: '#ffd700' },
    { icon: Briefcase, label: 'Career',  content: data.career,   color: '#00d4b8' },
    { icon: Heart,    label: 'Love',     content: data.love,     color: '#ff80ab' },
    { icon: Activity, label: 'Health',   content: data.health,   color: '#4caf50' },
  ];

  return (
    <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }}>
      {sections.map((s, i) => {
        const Icon = s.icon;
        return (
          <MotiView key={s.label} from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 350, delay: i * 80 }}>
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: `${s.color}18` }]}>
                  <Icon size={16} color={s.color} />
                </View>
                <Text style={styles.sectionLabel}>{s.label}</Text>
              </View>
              <Text style={styles.sectionText}>{s.content}</Text>
            </Card>
          </MotiView>
        );
      })}

      <Card style={styles.luckyCard}>
        <Text style={styles.luckyTitle}>Lucky Today</Text>
        <View style={styles.luckyRow}>
          <View style={styles.luckyItem}>
            <Text style={styles.luckyLabel}>Color</Text>
            <Text style={styles.luckyValue}>{data.luckyColor}</Text>
          </View>
          <View style={styles.luckyItem}>
            <Text style={styles.luckyLabel}>Number</Text>
            <Text style={styles.luckyValue}>{data.luckyNumber}</Text>
          </View>
          <View style={styles.luckyItem}>
            <Text style={styles.luckyLabel}>Direction</Text>
            <Text style={styles.luckyValue}>{data.luckyDirection}</Text>
          </View>
        </View>
      </Card>
    </MotiView>
  );
}

export default function DailyHoroscopeScreen() {
  const router = useRouter();
  const [selectedRashi, setSelectedRashi] = useState<string>('aries');

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.horoscopeDaily(),
    queryFn: () => getDailyHoroscope(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const selected = RASHIS.find((r) => r.id === selectedRashi)!;
  const horoscope = data?.[selectedRashi];

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Daily Horoscope</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Badge variant="gold">Today</Badge>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Rashi grid */}
          <Text style={styles.gridTitle}>Select Your Rashi</Text>
          <View style={styles.rashiGrid}>
            {RASHIS.map((r, i) => (
              <MotiView
                key={r.id}
                from={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: i * 40 }}
              >
                <RashiCard
                  rashi={r}
                  selected={selectedRashi === r.id}
                  onPress={() => setSelectedRashi(r.id)}
                />
              </MotiView>
            ))}
          </View>

          {/* Selected rashi banner */}
          <Card variant="glass" style={[styles.selectedBanner, { borderColor: `${selected.color}44` }]}>
            <Text style={[styles.selectedSymbol, { color: selected.color }]}>{selected.symbol}</Text>
            <View>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Text style={styles.selectedEnglish}>{selected.english}</Text>
            </View>
          </Card>

          {/* Horoscope content */}
          {isLoading && (
            <View style={{ gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} style={{ gap: 10 }}>
                  <Skeleton height={14} width="40%" />
                  <Skeleton height={13} />
                  <Skeleton height={13} width="85%" />
                </Card>
              ))}
            </View>
          )}

          {isError && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>Horoscope not available yet. Check back after midnight IST.</Text>
            </Card>
          )}

          {!isLoading && !isError && horoscope && (
            <HoroscopeDetail data={horoscope} rashiColor={selected.color} />
          )}

          {!isLoading && !isError && !horoscope && data && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>No data for {selected.english} today.</Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  headerDate: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  scroll: { padding: 16, paddingBottom: 40 },

  gridTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  rashiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  rashiCard: { width: 70, padding: 8, alignItems: 'center', gap: 3, backgroundColor: colors.bgSurface, borderColor: colors.border },
  rashiSymbol: { fontSize: 22 },
  rashiName: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center' },
  rashiEnglish: { fontSize: 8, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center' },

  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18, padding: 14 },
  selectedSymbol: { fontSize: 36 },
  selectedName: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },
  selectedEnglish: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  sectionCard: { marginBottom: 10, backgroundColor: colors.bgSurface, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  sectionText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 21 },

  luckyCard: { marginTop: 4, backgroundColor: colors.bgSurface, borderColor: colors.border },
  luckyTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 14 },
  luckyRow: { flexDirection: 'row' },
  luckyItem: { flex: 1, alignItems: 'center' },
  luckyLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 4 },
  luckyValue: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  errorCard: { padding: 20, alignItems: 'center', backgroundColor: colors.bgSurface, borderColor: colors.border },
  errorText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
