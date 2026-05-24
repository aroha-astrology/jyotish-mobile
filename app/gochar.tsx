import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { getGochar } from '@/lib/api';

const PLANET_EMOJI: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};
const PLANET_COLOR: Record<string, string> = {
  Sun: '#F4B942', Moon: '#8BC4E8', Mars: '#E8735A', Mercury: '#6BBF9E',
  Jupiter: '#C4A84F', Venus: '#E8A87C', Saturn: '#8BA89B', Rahu: '#7BA3B8', Ketu: '#9B6B9E',
};

interface TransitPlanet {
  planet: string;
  sign: string;
  degree: string;
  retrograde: boolean;
  natalHouse: number;
  impact: string;
}
interface UpcomingChange {
  planet: string;
  fromSign: string;
  toSign: string;
  daysUntil: number;
  date: string;
}
interface GocharData {
  transits: TransitPlanet[];
  retrogradeAlerts: string[];
  upcomingChanges: UpcomingChange[];
  overallTone: string;
  summary: string;
}

export default function GocharScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');

  const { data, isLoading, error, refetch } = useQuery<GocharData>({
    queryKey: ['gochar', chartId],
    queryFn: async () => {
      const res = await getGochar(chartId);
      if (!res.success) throw new Error('Failed to load transits');
      return res.data as GocharData;
    },
    enabled: !!chartId,
    staleTime: 1000 * 60 * 15,
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Gochar</Text>
        <View style={{ width: 60 }} />
      </View>

      {charts && charts.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipScroll}
          contentContainerStyle={s.chipRow}
        >
          {charts.map((c: any) => (
            <Pressable
              key={c.id}
              onPress={() => setChartId(c.id)}
              style={[s.chip, chartId === c.id && s.chipActive]}
            >
              <Text style={[s.chipText, chartId === c.id && s.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={s.loadingText}>Scanning the skies…</Text>
        </View>
      )}

      {!!error && (
        <View style={s.center}>
          <Text style={s.errorText}>Failed to load transits</Text>
          <Pressable onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {data && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350 }}
            style={s.summaryCard}
          >
            <Text style={s.summaryLabel}>TODAY'S TONE</Text>
            <Text style={s.summaryTone}>{data.overallTone}</Text>
            <Text style={s.summaryText}>{data.summary}</Text>
          </MotiView>

          {data.retrogradeAlerts?.length > 0 && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 80 }}
              style={s.alertCard}
            >
              <Text style={s.alertTitle}>℞ Retrograde Alerts</Text>
              {data.retrogradeAlerts.map((alert, i) => (
                <Text key={i} style={s.alertItem}>• {alert}</Text>
              ))}
            </MotiView>
          )}

          <Text style={s.sectionLabel}>CURRENT PLANETARY TRANSITS</Text>
          <View style={s.tableCard}>
            <View style={s.tableHeader}>
              <Text style={[s.tableHead, { flex: 1.4 }]}>Planet</Text>
              <Text style={[s.tableHead, { flex: 1.3 }]}>Sign / °</Text>
              <Text style={[s.tableHead, { flex: 0.7 }]}>H</Text>
              <Text style={[s.tableHead, { flex: 1 }]}>Impact</Text>
            </View>
            {data.transits.map((t, i) => {
              const color = PLANET_COLOR[t.planet] ?? '#d4a843';
              const impactColor =
                t.impact === 'favorable' ? '#22c55e' :
                t.impact === 'neutral' ? '#eab308' : '#f87171';
              return (
                <MotiView
                  key={t.planet}
                  from={{ opacity: 0, translateX: -6 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 260, delay: i * 35 }}
                >
                  <View style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                    <View style={[s.tableCell, { flex: 1.4 }]}>
                      <Text style={[s.planetEmoji, { color }]}>{PLANET_EMOJI[t.planet] ?? '●'}</Text>
                      <Text style={s.planetName}>{t.planet}</Text>
                      {t.retrograde && (
                        <View style={s.retBadge}><Text style={s.retBadgeText}>℞</Text></View>
                      )}
                    </View>
                    <Text style={[s.cellText, { flex: 1.3 }]}>{t.sign} {t.degree}</Text>
                    <Text style={[s.cellText, { flex: 0.7 }]}>{t.natalHouse}</Text>
                    <View style={[s.tableCell, { flex: 1 }]}>
                      <View style={[s.impactDot, { backgroundColor: impactColor }]} />
                      <Text style={[s.impactText, { color: impactColor }]}>{t.impact}</Text>
                    </View>
                  </View>
                </MotiView>
              );
            })}
          </View>

          {data.upcomingChanges?.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 24 }]}>UPCOMING SIGN CHANGES</Text>
              <View style={s.changesCard}>
                {[...data.upcomingChanges]
                  .sort((a, b) => a.daysUntil - b.daysUntil)
                  .map((ch, i) => {
                    const color = PLANET_COLOR[ch.planet] ?? '#d4a843';
                    return (
                      <MotiView
                        key={i}
                        from={{ opacity: 0, translateX: -6 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ type: 'timing', duration: 260, delay: i * 45 }}
                      >
                        <View style={[s.changeRow, i < data.upcomingChanges.length - 1 && s.changeDivider]}>
                          <View style={[s.changePill, { borderColor: color + '55', backgroundColor: color + '18' }]}>
                            <Text style={[s.changePillText, { color }]}>{ch.planet}</Text>
                          </View>
                          <View style={s.changeArrow}>
                            <Text style={s.changeFrom}>{ch.fromSign}</Text>
                            <Text style={s.changeArrowText}> → </Text>
                            <Text style={s.changeTo}>{ch.toSign}</Text>
                          </View>
                          <View style={s.changeMeta}>
                            <Text style={s.changeDays}>in {ch.daysUntil}d</Text>
                            <Text style={s.changeDate}>{ch.date}</Text>
                          </View>
                        </View>
                      </MotiView>
                    );
                  })}
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
  summaryCard: {
    backgroundColor: 'rgba(212,168,67,0.08)', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)', marginBottom: 16,
  },
  summaryLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', letterSpacing: 1.2, marginBottom: 4 },
  summaryTone: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 8 },
  summaryText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 20 },
  alertCard: {
    backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', marginBottom: 16,
  },
  alertTitle: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#f87171', marginBottom: 8 },
  alertItem: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 22 },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 10 },
  tableCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tableHead: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center' },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.025)' },
  tableCell: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cellText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  planetEmoji: { fontSize: 15, marginRight: 4 },
  planetName: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  retBadge: { backgroundColor: 'rgba(248,113,113,0.18)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 3 },
  retBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#f87171' },
  impactDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  impactText: { fontSize: 11, fontFamily: 'Poppins_400Regular', textTransform: 'capitalize' },
  changesCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  changeDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  changePill: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  changePillText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  changeArrow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  changeFrom: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  changeArrowText: { fontSize: 12, color: '#d4a843' },
  changeTo: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  changeMeta: { alignItems: 'flex-end' },
  changeDays: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  changeDate: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
});
