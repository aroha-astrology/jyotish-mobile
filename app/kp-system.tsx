import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { getKPSystem } from '@/lib/api';

const LIFE_AREAS = ['Career', 'Marriage', 'Health', 'Finance', 'Travel', 'Children', 'Spirituality'];

const PLANET_COLOR: Record<string, string> = {
  Sun: '#F4B942', Moon: '#8BC4E8', Mars: '#E8735A', Mercury: '#6BBF9E',
  Jupiter: '#C4A84F', Venus: '#E8A87C', Saturn: '#8BA89B', Rahu: '#7BA3B8', Ketu: '#9B6B9E',
};

interface HouseCusp {
  house: number;
  sign: string;
  degree: string;
  lord: string;
  subLord: string;
  subSubLord: string;
}
interface PlanetSignificator {
  planet: string;
  houses: number[];
  starLord: string;
  subLord: string;
  csl: string;
}
interface LifeAreaPrediction {
  area: string;
  significators: string[];
  prediction: string;
  isPromised: boolean;
}
interface KPData {
  ascendant: string;
  cusps: HouseCusp[];
  significators: PlanetSignificator[];
  lifeAreas: LifeAreaPrediction[];
}

export default function KPSystemScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<'cusps' | 'significators' | 'predictions'>('cusps');
  const [selectedArea, setSelectedArea] = useState('Career');

  const { data, isLoading, error, refetch } = useQuery<KPData>({
    queryKey: ['kp-system', chartId],
    queryFn: async () => {
      const res = await getKPSystem(chartId);
      if (!res.success) throw new Error('Failed to load KP data');
      return res.data as KPData;
    },
    enabled: !!chartId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>KP System</Text>
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

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(['cusps', 'significators', 'predictions'] as const).map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[s.tabItem, activeTab === tab && s.tabItemActive]}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'cusps' ? 'House Cusps' : tab === 'significators' ? 'Significators' : 'Predictions'}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={s.loadingText}>Computing KP cusps…</Text>
        </View>
      )}

      {!!error && (
        <View style={s.center}>
          <Text style={s.errorText}>Failed to load KP data</Text>
          <Pressable onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {data && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Ascendant */}
          <View style={s.ascRow}>
            <Text style={s.ascLabel}>Ascendant (Lagna CSL)</Text>
            <Text style={s.ascValue}>{data.ascendant}</Text>
          </View>

          {/* House Cusps */}
          {activeTab === 'cusps' && (
            <>
              <Text style={s.sectionLabel}>HOUSE CUSPS</Text>
              <View style={s.tableCard}>
                <View style={s.tableHeader}>
                  <Text style={[s.th, { width: 28 }]}>H</Text>
                  <Text style={[s.th, { flex: 1.1 }]}>Sign / °</Text>
                  <Text style={[s.th, { flex: 0.9 }]}>Lord</Text>
                  <Text style={[s.th, { flex: 0.9 }]}>Sub-Lord</Text>
                  <Text style={[s.th, { flex: 0.9 }]}>SSL</Text>
                </View>
                {data.cusps?.map((cusp, i) => {
                  const lordColor = PLANET_COLOR[cusp.lord] ?? '#d4a843';
                  const slColor = PLANET_COLOR[cusp.subLord] ?? '#7a6a90';
                  return (
                    <MotiView
                      key={cusp.house}
                      from={{ opacity: 0, translateX: -5 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 240, delay: i * 25 }}
                    >
                      <View style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                        <Text style={[s.td, { width: 28, fontFamily: 'Poppins_700Bold', color: '#d4a843' }]}>{cusp.house}</Text>
                        <Text style={[s.td, { flex: 1.1 }]}>{cusp.sign} {cusp.degree}</Text>
                        <Text style={[s.td, { flex: 0.9, color: lordColor }]}>{cusp.lord}</Text>
                        <Text style={[s.td, { flex: 0.9, color: slColor }]}>{cusp.subLord}</Text>
                        <Text style={[s.td, { flex: 0.9, color: '#4a3a60' }]}>{cusp.subSubLord}</Text>
                      </View>
                    </MotiView>
                  );
                })}
              </View>
            </>
          )}

          {/* Significators */}
          {activeTab === 'significators' && (
            <>
              <Text style={s.sectionLabel}>PLANET SIGNIFICATORS</Text>
              <View style={s.tableCard}>
                <View style={s.tableHeader}>
                  <Text style={[s.th, { flex: 1 }]}>Planet</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Houses Signified</Text>
                  <Text style={[s.th, { flex: 0.9 }]}>Star Lord</Text>
                  <Text style={[s.th, { flex: 0.9 }]}>Sub Lord</Text>
                </View>
                {data.significators?.map((sig, i) => {
                  const color = PLANET_COLOR[sig.planet] ?? '#d4a843';
                  const slColor = PLANET_COLOR[sig.subLord] ?? '#7a6a90';
                  return (
                    <MotiView
                      key={sig.planet}
                      from={{ opacity: 0, translateX: -5 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 240, delay: i * 30 }}
                    >
                      <View style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                        <Text style={[s.td, { flex: 1, color, fontFamily: 'Poppins_600SemiBold' }]}>{sig.planet}</Text>
                        <Text style={[s.td, { flex: 1.5 }]}>{sig.houses?.join(', ')}</Text>
                        <Text style={[s.td, { flex: 0.9, color: PLANET_COLOR[sig.starLord] ?? '#7a6a90' }]}>{sig.starLord}</Text>
                        <Text style={[s.td, { flex: 0.9, color: slColor }]}>{sig.subLord}</Text>
                      </View>
                    </MotiView>
                  );
                })}
              </View>
            </>
          )}

          {/* Life area predictions */}
          {activeTab === 'predictions' && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.areaScroll} contentContainerStyle={s.areaRow}>
                {LIFE_AREAS.map(area => (
                  <Pressable key={area} onPress={() => setSelectedArea(area)} style={[s.areaChip, selectedArea === area && s.areaChipActive]}>
                    <Text style={[s.areaChipText, selectedArea === area && s.areaChipTextActive]}>{area}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {data.lifeAreas?.filter(la => la.area === selectedArea).map((la, i) => (
                <MotiView
                  key={i}
                  from={{ opacity: 0, translateY: -6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300 }}
                  style={[s.predCard, { borderColor: la.isPromised ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }]}
                >
                  <View style={s.predTop}>
                    <Text style={s.predArea}>{la.area}</Text>
                    {la.isPromised && (
                      <View style={s.promisedBadge}>
                        <Text style={s.promisedText}>✓ Promised</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.sigRow}>
                    {la.significators?.map((sig, j) => {
                      const color = PLANET_COLOR[sig] ?? '#7a6a90';
                      return (
                        <View key={j} style={[s.sigPill, { borderColor: color + '55', backgroundColor: color + '15' }]}>
                          <Text style={[s.sigText, { color }]}>{sig}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text style={s.predText}>{la.prediction}</Text>
                </MotiView>
              ))}
            </>
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
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#d4a843' },
  tabText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  tabTextActive: { color: '#d4a843', fontFamily: 'Poppins_600SemiBold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  errorText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#f87171', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)', backgroundColor: 'rgba(212,168,67,0.1)',
  },
  retryText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  ascRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(212,168,67,0.07)', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.18)', marginBottom: 16,
  },
  ascLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  ascValue: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 10 },
  tableCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  th: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', letterSpacing: 0.6 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.025)' },
  td: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  areaScroll: { maxHeight: 52, marginBottom: 14 },
  areaRow: { gap: 8, flexDirection: 'row', alignItems: 'center' },
  areaChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  areaChipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  areaChipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  areaChipTextActive: { color: '#d4a843' },
  predCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 16,
    borderWidth: 1, gap: 12,
  },
  predTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  predArea: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  promisedBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  promisedText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#22c55e' },
  sigRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sigPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  sigText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  predText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21 },
});
