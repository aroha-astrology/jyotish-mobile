import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { getVarshaphal } from '@/lib/api';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - 3 + i);

interface LifeArea {
  area: string;
  score: number;
  summary: string;
}
interface MonthHighlight {
  month: string;
  highlight: string;
  tone: 'positive' | 'neutral' | 'challenging';
}
interface VarshaphalData {
  year: number;
  ascendant: string;
  yearLord: string;
  overview: string;
  themes: string[];
  lifeAreas: LifeArea[];
  monthlyHighlights: MonthHighlight[];
  remedies: string[];
  overviewCards: { label: string; value: string; icon: string }[];
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#f87171';
  return (
    <View style={sb.track}>
      <View style={[sb.fill, { width: `${score}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const sb = StyleSheet.create({
  track: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', flex: 1 },
  fill: { height: 5, borderRadius: 3 },
});

export default function VarshaphalScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');
  const [year, setYear] = useState(CURRENT_YEAR);

  const { data, isLoading, error, refetch } = useQuery<VarshaphalData>({
    queryKey: ['varshaphal', chartId, year],
    queryFn: async () => {
      const res = await getVarshaphal(chartId, year);
      if (!res.success) throw new Error('Failed to load Varshaphal');
      return res.data as VarshaphalData;
    },
    enabled: !!chartId,
    staleTime: Infinity,
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Varshaphal</Text>
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

      {/* Year selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.yearScroll} contentContainerStyle={s.yearRow}>
        {YEARS.map(y => (
          <Pressable key={y} onPress={() => setYear(y)} style={[s.yearChip, year === y && s.yearChipActive]}>
            <Text style={[s.yearChipText, year === y && s.yearChipTextActive]}>{y}</Text>
            {y === CURRENT_YEAR && <Text style={s.nowTag}>now</Text>}
          </Pressable>
        ))}
      </ScrollView>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={s.loadingText}>Casting solar return…</Text>
        </View>
      )}

      {!!error && (
        <View style={s.center}>
          <Text style={s.errorText}>Failed to load Varshaphal</Text>
          <Pressable onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {data && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Overview cards */}
          {data.overviewCards?.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350 }}
              style={s.cardsRow}
            >
              {data.overviewCards.map((card, i) => (
                <View key={i} style={s.overviewCard}>
                  <Text style={s.overviewIcon}>{card.icon}</Text>
                  <Text style={s.overviewValue}>{card.value}</Text>
                  <Text style={s.overviewLabel}>{card.label}</Text>
                </View>
              ))}
            </MotiView>
          )}

          {/* Overview text */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 80 }}
            style={s.overviewTextCard}
          >
            <Text style={s.overviewTextTitle}>Year Overview {year}</Text>
            <Text style={s.overviewTextBody}>{data.overview}</Text>
            {data.themes?.length > 0 && (
              <View style={s.themesRow}>
                {data.themes.map((t, i) => (
                  <View key={i} style={s.themePill}>
                    <Text style={s.themePillText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </MotiView>

          {/* Life Areas */}
          {data.lifeAreas?.length > 0 && (
            <>
              <Text style={s.sectionLabel}>LIFE AREAS</Text>
              <View style={s.lifeAreasGrid}>
                {data.lifeAreas.map((area, i) => (
                  <MotiView
                    key={area.area}
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 280, delay: i * 50 }}
                    style={s.lifeAreaCard}
                  >
                    <View style={s.lifeAreaHeader}>
                      <Text style={s.lifeAreaName}>{area.area}</Text>
                      <Text style={s.lifeAreaScore}>{area.score}%</Text>
                    </View>
                    <ScoreBar score={area.score} />
                    <Text style={s.lifeAreaSummary}>{area.summary}</Text>
                  </MotiView>
                ))}
              </View>
            </>
          )}

          {/* Monthly Highlights */}
          {data.monthlyHighlights?.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 24 }]}>MONTHLY HIGHLIGHTS</Text>
              <View style={s.monthsCard}>
                {data.monthlyHighlights.map((m, i) => {
                  const dotColor = m.tone === 'positive' ? '#22c55e' : m.tone === 'neutral' ? '#eab308' : '#f87171';
                  return (
                    <MotiView
                      key={i}
                      from={{ opacity: 0, translateX: -6 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 260, delay: i * 35 }}
                    >
                      <View style={[s.monthRow, i < data.monthlyHighlights.length - 1 && s.monthDivider]}>
                        <View style={[s.monthDot, { backgroundColor: dotColor }]} />
                        <Text style={s.monthName}>{m.month}</Text>
                        <Text style={s.monthHighlight}>{m.highlight}</Text>
                      </View>
                    </MotiView>
                  );
                })}
              </View>
            </>
          )}

          {/* Remedies */}
          {data.remedies?.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 24 }]}>REMEDIES</Text>
              <View style={s.remediesCard}>
                {data.remedies.map((r, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 260, delay: i * 40 }}
                  >
                    <View style={[s.remedyRow, i < data.remedies.length - 1 && s.remedyDivider]}>
                      <Text style={s.remedyBullet}>🙏</Text>
                      <Text style={s.remedyText}>{r}</Text>
                    </View>
                  </MotiView>
                ))}
              </View>
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
  chipScroll: { maxHeight: 56 },
  chipRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  chipTextActive: { color: '#d4a843' },
  yearScroll: { maxHeight: 58, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  yearRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  yearChip: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  yearChipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.18)' },
  yearChipText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  yearChipTextActive: { color: '#d4a843' },
  nowTag: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', backgroundColor: 'rgba(212,168,67,0.2)', borderRadius: 4, paddingHorizontal: 4 },
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
  cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  overviewCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, alignItems: 'center', gap: 4,
  },
  overviewIcon: { fontSize: 22, marginBottom: 2 },
  overviewValue: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  overviewLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center' },
  overviewTextCard: {
    backgroundColor: 'rgba(212,168,67,0.07)', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.18)', marginBottom: 20,
  },
  overviewTextTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 8 },
  overviewTextBody: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21, marginBottom: 12 },
  themesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  themePill: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)',
  },
  themePillText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#d4a843' },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 12 },
  lifeAreasGrid: { gap: 10, marginBottom: 4 },
  lifeAreaCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8,
  },
  lifeAreaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lifeAreaName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  lifeAreaScore: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  lifeAreaSummary: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 18 },
  monthsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  monthRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  monthDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  monthDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  monthName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', width: 36 },
  monthHighlight: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 20 },
  remediesCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  remedyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  remedyDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  remedyBullet: { fontSize: 16, marginTop: 1 },
  remedyText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 20 },
});
