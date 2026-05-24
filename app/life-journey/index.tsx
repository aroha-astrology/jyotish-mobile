import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getLifeJourney } from '@/lib/api';
import { useStore } from '@/store/useStore';

const PLANET_COLOR: Record<string, string> = {
  Ketu: '#9B6B9E', Venus: '#E8A87C', Sun: '#F4B942', Moon: '#8BC4E8',
  Mars: '#E8735A', Rahu: '#7BA3B8', Jupiter: '#C4A84F', Saturn: '#8BA89B', Mercury: '#6BBF9E',
};
const PLANET_EMOJI: Record<string, string> = {
  Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿', Jupiter: '♃',
  Venus: '♀️', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

interface LifePhase {
  index: number;
  planet: string;
  title: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  isActive?: boolean;
  isCurrent?: boolean;
  status?: string;
}

interface JourneyData {
  phases: LifePhase[];
  birthYear: number;
  name: string;
  gender?: string;
  currentPhase?: LifePhase | null;
  currentAge?: number;
}

const AVG_HUMAN_AGE = 80;

type TabType = 'past' | 'present' | 'future';

export default function LifeJourneyDetailScreen() {
  const router = useRouter();
  const { chart: paramChart } = useLocalSearchParams<{ chart: string }>();
  const charts = useStore(s => s.charts);
  const chartId = paramChart || charts[0]?.id || '';

  const [tab, setTab] = useState<TabType>('present');

  const { data, isLoading, error } = useQuery<JourneyData>({
    queryKey: ['life-journey', chartId],
    queryFn: async () => {
      const res = await getLifeJourney(chartId);
      if (!res.success) throw new Error('Failed to load');
      return res.data as unknown as JourneyData;
    },
    enabled: !!chartId,
    staleTime: Infinity,
  });

  const currentYear = new Date().getFullYear();

  const pastPhases = data
    ? data.phases
        .filter(p => p.isCurrent || p.status === 'current' || p.startYear <= currentYear)
        .sort((a, b) => a.startYear - b.startYear)
    : [];

  const futurePhases = data
    ? data.phases
        .filter(p => !p.isCurrent && p.status !== 'current' && p.startYear > currentYear && p.startAge <= 120)
        .sort((a, b) => a.startYear - b.startYear)
    : [];

  const current = data?.currentPhase ?? data?.phases.find(p => p.isCurrent || p.status === 'current');

  if (!chartId) {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>
          <Text style={s.headerTitle}>Life Journey</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🌱</Text>
          <Text style={s.emptyTitle}>No birth chart found</Text>
          <Text style={s.emptySub}>Generate your Kundli to unlock your Life Journey.</Text>
          <Pressable onPress={() => router.push('/kundli/generate')} style={s.ctaBtn}>
            <Text style={s.ctaText}>Generate Kundli →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Sticky header with tab pills */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <View style={s.tabPills}>
          {(['past', 'present', 'future'] as TabType[]).map(t => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[s.tabPill, tab === t && s.tabPillActive]}
            >
              <Text style={[s.tabPillText, tab === t && s.tabPillTextActive]}>
                {t === 'past' ? 'Past' : t === 'present' ? 'My Life' : 'Future'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={s.loadingText}>Loading your journey…</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={s.center}>
          <Text style={s.errorText}>{error instanceof Error ? error.message : 'Failed to load'}</Text>
        </View>
      )}

      {data && !isLoading && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero text */}
          <Text style={s.heroTitle}>
            {tab === 'past'
              ? 'Your past, explained.'
              : tab === 'future'
              ? 'Your future, foretold.'
              : 'Your cosmic moment now.'}
          </Text>
          <Text style={s.heroSub}>
            {tab === 'past'
              ? 'Dasha periods that shaped your story so far.'
              : tab === 'future'
              ? 'Vimshottari wheel turning ahead — periods yet to unfold.'
              : 'Your current planetary period and how it shapes life.'}
          </Text>

          {/* ── PAST TAB ── */}
          {tab === 'past' && (
            <View style={s.phases}>
              <View style={s.birthMarker}>
                <Text style={s.birthEmoji}>👶</Text>
                <Text style={s.birthText}>Born in {data.birthYear}</Text>
              </View>
              {pastPhases.map((phase, i) => {
                const color = PLANET_COLOR[phase.planet] ?? '#d4a843';
                const isCurrent = phase.isCurrent || phase.status === 'current';
                return (
                  <Pressable
                    key={phase.index}
                    onPress={() => router.push(`/life-journey/phase?chart=${chartId}&index=${phase.index}` as any)}
                    style={s.phaseCardWrap}
                  >
                    <View style={[s.phaseIndicator, { marginLeft: i % 2 === 1 ? 'auto' : 0 }]}>
                      <View style={[s.planetDot, { backgroundColor: color + '25', borderColor: color + '50' }]}>
                        <Text style={s.planetDotEmoji}>{PLANET_EMOJI[phase.planet] ?? '✦'}</Text>
                      </View>
                      <Text style={s.duringText}>
                        {i % 2 === 1 ? '' : 'During '}
                        <Text style={s.duringPlanet}>{phase.planet} Mahadasha</Text>
                        {i % 2 === 1 ? ' During' : ''}
                      </Text>
                    </View>
                    <View style={[
                      s.phaseCard,
                      { borderColor: isCurrent ? 'rgba(218,165,32,0.5)' : 'rgba(255,255,255,0.10)', backgroundColor: isCurrent ? 'rgba(218,165,32,0.12)' : 'rgba(255,255,255,0.04)' },
                    ]}>
                      <View style={s.phaseCardLeft}>
                        <View style={s.phaseTitleRow}>
                          <Text style={s.phaseTitle}>{phase.title}</Text>
                          {isCurrent && (
                            <View style={s.currentBadge}><Text style={s.currentBadgeText}>Current</Text></View>
                          )}
                        </View>
                        <Text style={s.phaseMeta}>Age {phase.startAge}–{phase.endAge} · {phase.startYear}–{phase.endYear}</Text>
                      </View>
                      <Text style={s.phaseChevron}>›</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ── PRESENT TAB ── */}
          {tab === 'present' && (
            <View style={s.presentWrap}>
              {current ? (
                <>
                  {/* Current dasha card */}
                  <View style={[s.dashaCard, { borderColor: (PLANET_COLOR[current.planet] ?? '#d4a843') + '44' }]}>
                    <View style={[s.dashaGlobe, { backgroundColor: (PLANET_COLOR[current.planet] ?? '#d4a843') + '30' }]}>
                      <Text style={s.dashaGlobeEmoji}>{PLANET_EMOJI[current.planet] ?? '✦'}</Text>
                    </View>
                    <Text style={s.dashaLabel}>Current Mahadasha</Text>
                    <Text style={s.dashaPlanet}>{current.planet}</Text>
                    <Text style={s.dashaMeta}>{current.startYear}–{current.endYear} · Age {current.startAge}–{current.endAge}</Text>
                    <Text style={s.dashaTheme}>{current.title}</Text>
                  </View>

                  {/* Life areas 2x2 grid */}
                  <Text style={s.areasLabel}>Life Areas in This Dasha</Text>
                  <View style={s.areasGrid}>
                    {[
                      { key: 'Career', icon: '💼' },
                      { key: 'Love', icon: '❤️' },
                      { key: 'Money', icon: '💰' },
                      { key: 'Health', icon: '🌿' },
                    ].map(area => (
                      <View key={area.key} style={s.areaCard}>
                        <Text style={s.areaIcon}>{area.icon}</Text>
                        <Text style={s.areaName}>{area.key}</Text>
                        <Text style={s.areaText}>
                          {PLANET_LIFE_TEXT[current.planet]?.[area.key] ?? 'Planetary influence active.'}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* View full phase CTA */}
                  <Pressable
                    onPress={() => router.push(`/life-journey/phase?chart=${chartId}&index=${current.index}` as any)}
                    style={s.viewPhaseBtn}
                  >
                    <Text style={s.viewPhaseText}>See All Phase Events →</Text>
                  </Pressable>
                </>
              ) : (
                <View style={s.center}>
                  <Text style={s.emptySub}>No current phase found.</Text>
                </View>
              )}
            </View>
          )}

          {/* ── FUTURE TAB ── */}
          {tab === 'future' && (
            <View style={s.phases}>
              <View style={s.todayMarker}>
                <Text style={s.birthEmoji}>📍</Text>
                <Text style={s.birthText}>Today · {currentYear}</Text>
              </View>
              {futurePhases.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyEmoji}>✨</Text>
                  <Text style={s.emptyTitle}>Vimshottari cycle complete</Text>
                  <Text style={s.emptySub}>The 120-year wheel turns onward beyond the dasha map.</Text>
                </View>
              ) : (
                futurePhases.map((phase, i) => {
                  const color = PLANET_COLOR[phase.planet] ?? '#d4a843';
                  const dimmed = phase.startAge > AVG_HUMAN_AGE;
                  return (
                    <Pressable
                      key={phase.index}
                      onPress={() => router.push(`/life-journey/phase?chart=${chartId}&index=${phase.index}` as any)}
                      style={[s.phaseCardWrap, dimmed && s.dimmed]}
                    >
                      <View style={[s.phaseIndicator, { marginLeft: i % 2 === 1 ? 'auto' : 0 }]}>
                        <View style={[s.planetDot, { backgroundColor: color + '25', borderColor: color + '50' }]}>
                          <Text style={s.planetDotEmoji}>{PLANET_EMOJI[phase.planet] ?? '✦'}</Text>
                        </View>
                        <Text style={s.duringText}>
                          Entering <Text style={s.duringPlanet}>{phase.planet} Mahadasha</Text>
                        </Text>
                      </View>
                      <View style={[s.phaseCard, { borderColor: dimmed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.10)', borderStyle: dimmed ? 'dashed' : 'solid', backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                        <View style={s.phaseCardLeft}>
                          <Text style={s.phaseTitle}>{phase.title}</Text>
                          <Text style={s.phaseMeta}>Age {phase.startAge}–{phase.endAge} · {phase.startYear}–{phase.endYear}</Text>
                        </View>
                        <Text style={s.phaseChevron}>›</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const PLANET_LIFE_TEXT: Record<string, Record<string, string>> = {
  Sun: { Career: 'Authority & leadership emerge', Love: 'Pride may affect bonds', Money: 'Steady government-linked gains', Health: 'Strong vitality & immunity' },
  Moon: { Career: 'Creative intuition peaks', Love: 'Deep emotional connections', Money: 'Fluctuating — save wisely', Health: 'Watch mental & emotional health' },
  Mars: { Career: 'Ambitious drive, bold moves', Love: 'Passion, but watch tempers', Money: 'Bold investments, calculated risk', Health: 'High energy; avoid injuries' },
  Mercury: { Career: 'Communication & trade thrive', Love: 'Intellectual bond strengthens', Money: 'Business & commerce favored', Health: 'Mind stays sharp & active' },
  Jupiter: { Career: 'Growth, wisdom & recognition', Love: 'Blessings & harmony abound', Money: 'Abundance flows naturally', Health: 'Robust constitution' },
  Venus: { Career: 'Creative & artistic success', Love: 'Romance & deep harmony', Money: 'Wealth & luxury accrue', Health: 'Overall well-being & beauty' },
  Saturn: { Career: 'Hard work pays slowly but surely', Love: 'Commitment tested; bonds deepen', Money: 'Slow, steady accumulation', Health: 'Bones & joints need attention' },
  Rahu: { Career: 'Sudden breakthroughs possible', Love: 'Unconventional connections', Money: 'Unexpected gains or losses', Health: 'Mysterious ailments — stay vigilant' },
  Ketu: { Career: 'Spiritual detachment from ambition', Love: 'Karmic bonds surface', Money: 'Liberation from materialism', Health: 'Spiritual healing & introspection' },
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010a' },
  header: {
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row',
    alignItems: 'center', backgroundColor: 'rgba(2,1,10,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { width: 60 },
  backText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  tabPills: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: 3, gap: 2 },
  tabPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tabPillActive: { backgroundColor: '#7a6a90' },
  tabPillText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.6)' },
  tabPillTextActive: { color: '#1a1025' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  errorText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#f87171', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  heroTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 6, lineHeight: 32 },
  heroSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(240,232,208,0.6)', marginBottom: 24 },

  // Phase list
  phases: { gap: 0 },
  birthMarker: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  todayMarker: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  birthEmoji: { fontSize: 28 },
  birthText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  phaseCardWrap: { marginBottom: 16 },
  phaseIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  planetDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  planetDotEmoji: { fontSize: 14 },
  duringText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  duringPlanet: { fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  phaseCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1 },
  phaseCardLeft: { flex: 1 },
  phaseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  phaseTitle: { flex: 1, fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  phaseMeta: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  phaseChevron: { fontSize: 22, color: 'rgba(120,106,144,0.6)', marginLeft: 8 },
  currentBadge: { backgroundColor: '#DAA520', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  currentBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#fff' },
  dimmed: { opacity: 0.55 },

  // Present tab
  presentWrap: { gap: 16 },
  dashaCard: {
    borderWidth: 1, borderRadius: 24, padding: 24, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dashaGlobe: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dashaGlobeEmoji: { fontSize: 36 },
  dashaLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.5, marginBottom: 4 },
  dashaPlanet: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 4 },
  dashaMeta: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginBottom: 8 },
  dashaTheme: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', textAlign: 'center' },
  areasLabel: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1 },
  areasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  areaCard: {
    width: '47%', borderRadius: 16, padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  areaIcon: { fontSize: 22, marginBottom: 6 },
  areaName: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 4 },
  areaText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 18 },
  viewPhaseBtn: {
    backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)',
    borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  viewPhaseText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },

  // Empty / CTA
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#7a6a90', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center', lineHeight: 22 },
  ctaBtn: {
    marginTop: 8, backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.30)', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14,
  },
  ctaText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
});
