import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { getDivisionalChart } from '@/lib/api';

const VARGAS = [
  { key: 'D1', name: 'Rashi', desc: 'Birth chart — body & self' },
  { key: 'D2', name: 'Hora', desc: 'Wealth & finances' },
  { key: 'D3', name: 'Drekkana', desc: 'Siblings & courage' },
  { key: 'D4', name: 'Chaturthamsha', desc: 'Property & home' },
  { key: 'D5', name: 'Panchamsha', desc: 'Past life & spirituality' },
  { key: 'D6', name: 'Shashtamsha', desc: 'Health & debts' },
  { key: 'D7', name: 'Saptamsha', desc: 'Children & creativity' },
  { key: 'D8', name: 'Ashtamsha', desc: 'Obstacles & longevity' },
  { key: 'D9', name: 'Navamsha', desc: 'Marriage & dharma' },
  { key: 'D10', name: 'Dashamsha', desc: 'Career & profession' },
  { key: 'D12', name: 'Dvadashamsha', desc: 'Parents & ancestry' },
  { key: 'D16', name: 'Shodashamsha', desc: 'Vehicles & happiness' },
  { key: 'D20', name: 'Vimshamsha', desc: 'Spiritual practice' },
  { key: 'D24', name: 'Chaturvimshamsha', desc: 'Education & learning' },
  { key: 'D27', name: 'Saptavimshamsha', desc: 'Strength & vitality' },
  { key: 'D30', name: 'Trimshamsha', desc: 'Misfortunes & evils' },
  { key: 'D40', name: 'Khavedamsha', desc: 'Maternal heritage' },
  { key: 'D45', name: 'Akshavedamsha', desc: 'Paternal heritage' },
  { key: 'D60', name: 'Shashtiamsha', desc: 'Past life karma' },
];

const PLANET_COLOR: Record<string, string> = {
  Sun: '#F4B942', Moon: '#8BC4E8', Mars: '#E8735A', Mercury: '#6BBF9E',
  Jupiter: '#C4A84F', Venus: '#E8A87C', Saturn: '#8BA89B', Rahu: '#7BA3B8', Ketu: '#9B6B9E',
};

interface PlanetPlacement {
  planet: string;
  sign: string;
  house: number;
  degree: string;
  dignity: string;
}
interface VargaData {
  varga: string;
  ascendant: string;
  planets: PlanetPlacement[];
  analysis: string;
  keyThemes: string[];
}

export default function VargasScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');
  const [selectedVarga, setSelectedVarga] = useState('D9');

  const { data, isLoading, error } = useQuery<VargaData>({
    queryKey: ['varga', chartId, selectedVarga],
    queryFn: async () => {
      const res = await getDivisionalChart(chartId, selectedVarga);
      if (!res.success) throw new Error('Failed to load chart');
      return res.data as VargaData;
    },
    enabled: !!chartId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const dignityColor = (dignity: string) => {
    if (dignity === 'exalted') return '#22c55e';
    if (dignity === 'own sign') return '#6BBF9E';
    if (dignity === 'debilitated') return '#f87171';
    return '#7a6a90';
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Divisional Charts</Text>
        <View style={{ width: 60 }} />
      </View>

      {charts && charts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
          {charts.map((c: any) => (
            <Pressable key={c.id} onPress={() => setChartId(c.id)} style={[s.chip, chartId === c.id && s.chipActive]}>
              <Text style={[s.chipText, chartId === c.id && s.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Varga tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
        {VARGAS.map(v => (
          <Pressable
            key={v.key}
            onPress={() => setSelectedVarga(v.key)}
            style={[s.tab, selectedVarga === v.key && s.tabActive]}
          >
            <Text style={[s.tabKey, selectedVarga === v.key && s.tabKeyActive]}>{v.key}</Text>
            <Text style={[s.tabName, selectedVarga === v.key && s.tabNameActive]}>{v.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Description strip */}
      <View style={s.descStrip}>
        <Text style={s.descText}>
          {VARGAS.find(v => v.key === selectedVarga)?.desc ?? ''}
        </Text>
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={s.loadingText}>Computing {selectedVarga}…</Text>
        </View>
      )}

      {!!error && (
        <View style={s.center}>
          <Text style={s.errorText}>Failed to load chart</Text>
        </View>
      )}

      {data && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Ascendant */}
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 320 }}
            style={s.ascCard}
          >
            <Text style={s.ascLabel}>ASCENDANT</Text>
            <Text style={s.ascValue}>{data.ascendant}</Text>
          </MotiView>

          {/* Planet table */}
          <Text style={s.sectionLabel}>PLANET PLACEMENTS</Text>
          <View style={s.tableCard}>
            <View style={s.tableHeader}>
              <Text style={[s.th, { flex: 1.2 }]}>Planet</Text>
              <Text style={[s.th, { flex: 1.1 }]}>Sign</Text>
              <Text style={[s.th, { flex: 0.5 }]}>H</Text>
              <Text style={[s.th, { flex: 0.8 }]}>°</Text>
              <Text style={[s.th, { flex: 1 }]}>Dignity</Text>
            </View>
            {data.planets?.map((p, i) => {
              const color = PLANET_COLOR[p.planet] ?? '#d4a843';
              const dc = dignityColor(p.dignity);
              return (
                <MotiView
                  key={p.planet}
                  from={{ opacity: 0, translateX: -5 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 250, delay: i * 30 }}
                >
                  <View style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                    <Text style={[s.td, { flex: 1.2, color, fontFamily: 'Poppins_600SemiBold' }]}>{p.planet}</Text>
                    <Text style={[s.td, { flex: 1.1 }]}>{p.sign}</Text>
                    <Text style={[s.td, { flex: 0.5 }]}>{p.house}</Text>
                    <Text style={[s.td, { flex: 0.8 }]}>{p.degree}</Text>
                    <Text style={[s.td, { flex: 1, color: dc, textTransform: 'capitalize' }]}>{p.dignity || '—'}</Text>
                  </View>
                </MotiView>
              );
            })}
          </View>

          {/* Analysis */}
          {data.analysis && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 150 }}
              style={s.analysisCard}
            >
              <Text style={s.analysisLabel}>ANALYSIS</Text>
              <Text style={s.analysisText}>{data.analysis}</Text>
            </MotiView>
          )}

          {/* Key themes */}
          {data.keyThemes?.length > 0 && (
            <View style={s.themesRow}>
              {data.keyThemes.map((t, i) => (
                <View key={i} style={s.themePill}>
                  <Text style={s.themePillText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010a' },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { width: 60 },
  backText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  chipScroll: { maxHeight: 52 },
  chipRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  chipText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  chipTextActive: { color: '#d4a843' },
  tabScroll: { maxHeight: 68, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row' },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)',
    minWidth: 56,
  },
  tabActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  tabKey: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  tabKeyActive: { color: '#d4a843' },
  tabName: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: '#4a3a60', marginTop: 1 },
  tabNameActive: { color: '#d4a843' },
  descStrip: {
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: 'rgba(212,168,67,0.06)', borderBottomWidth: 1, borderBottomColor: 'rgba(212,168,67,0.12)',
  },
  descText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#b8a898' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  errorText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#f87171', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  ascCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(212,168,67,0.08)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)', marginBottom: 16,
  },
  ascLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', letterSpacing: 1.2 },
  ascValue: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 10 },
  tableCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  th: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', letterSpacing: 0.6 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center' },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.025)' },
  td: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  analysisCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 14, gap: 8,
  },
  analysisLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', letterSpacing: 1.2 },
  analysisText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21 },
  themesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themePill: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
    backgroundColor: 'rgba(212,168,67,0.1)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)',
  },
  themePillText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#d4a843' },
});
