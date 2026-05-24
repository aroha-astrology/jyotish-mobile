import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { getLifeJourney, getKundliCharts, type LifeJourneyPhase } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';

const PLANET_EMOJI: Record<string, string> = {
  Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿', Jupiter: '♃',
  Venus: '♀️', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const PLANET_COLOR: Record<string, string> = {
  Sun: colors.planetSun, Moon: colors.planetMoon, Mars: colors.planetMars,
  Mercury: colors.planetMercury, Jupiter: colors.planetJupiter, Venus: colors.planetVenus,
  Saturn: colors.planetSaturn, Rahu: colors.planetRahu, Ketu: colors.planetKetu,
};

const LIFE_AREAS = [
  { key: 'career', label: 'Career', emoji: '💼' },
  { key: 'love', label: 'Love', emoji: '❤️' },
  { key: 'money', label: 'Money', emoji: '💰' },
  { key: 'health', label: 'Health', emoji: '🌿' },
];

type TabKey = 'present' | 'past' | 'future';

function PhaseCard({ phase, index, dimmed }: { phase: LifeJourneyPhase; index: number; dimmed?: boolean }) {
  const color = PLANET_COLOR[phase.planet] ?? colors.primary;
  const emoji = PLANET_emoji(phase.planet);
  return (
    <MotiView
      from={{ opacity: 0, translateX: -16 }}
      animate={{ opacity: dimmed ? 0.45 : 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 380, delay: index * 70 }}
    >
      <View style={styles.phaseRow}>
        <View style={styles.timelineCol}>
          <View style={[styles.dot, {
            backgroundColor: phase.status === 'current' ? color : 'transparent',
            borderColor: color,
          }]} />
          <View style={styles.line} />
        </View>
        <Card style={[styles.phaseCard, phase.status === 'current' && { borderColor: `${color}55` }]}>
          <View style={styles.phaseTop}>
            <Text style={styles.phaseEmoji}>{emoji}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.phaseHeaderRow}>
                <Text style={[styles.phasePlanet, { color }]}>{phase.planet} Dasha</Text>
                <Badge variant={phase.status === 'current' ? 'gold' : phase.status === 'past' ? 'muted' : 'default'}>
                  {phase.status}
                </Badge>
              </View>
              <Text style={styles.phaseTheme}>{phase.theme}</Text>
              <Text style={styles.phasePeriod}>{phase.startYear}–{phase.endYear} · Age {phase.startAge}–{phase.endAge}</Text>
            </View>
          </View>
        </Card>
      </View>
    </MotiView>
  );
}

function PLANET_emoji(planet: string) {
  return PLANET_EMOJI[planet] ?? '✦';
}

function PresentTab({ currentPhase, phases }: { currentPhase: LifeJourneyPhase | null; phases: LifeJourneyPhase[] }) {
  const router = useRouter();
  const [activeArea, setActiveArea] = useState<string | null>(null);

  if (!currentPhase) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🪐</Text>
        <Text style={styles.emptyText}>Generate a kundli to see your current life phase</Text>
        <Pressable onPress={() => router.push('/kundli/generate' as never)} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Generate Kundli →</Text>
        </Pressable>
      </View>
    );
  }

  const color = PLANET_COLOR[currentPhase.planet] ?? colors.primary;
  const emoji = PLANET_emoji(currentPhase.planet);

  return (
    <>
      {/* Current Dasha Card */}
      <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 450 }}>
        <Card style={[styles.dashaCard, { borderColor: `${color}44` }]}>
          <View style={styles.dashaHeader}>
            <View style={[styles.dashaEmojiWrap, { backgroundColor: `${color}18` }]}>
              <Text style={styles.dashaEmoji}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashaTitle}>{currentPhase.planet} Mahadasha</Text>
              <Text style={styles.dashaTheme}>{currentPhase.theme}</Text>
              <Text style={styles.dashaPeriod}>{currentPhase.startYear}–{currentPhase.endYear}</Text>
            </View>
            <Badge variant="gold">Active</Badge>
          </View>
          {currentPhase.description && (
            <Text style={styles.dashaDesc}>{currentPhase.description}</Text>
          )}
        </Card>
      </MotiView>

      {/* Life Areas Grid */}
      <Text style={styles.sectionLabel}>Life Areas</Text>
      <View style={styles.areaGrid}>
        {LIFE_AREAS.map((area, i) => (
          <MotiView
            key={area.key}
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: i * 60 + 150 }}
            style={{ width: '48%' }}
          >
            <Pressable
              onPress={() => setActiveArea(activeArea === area.key ? null : area.key)}
              style={({ pressed }) => [styles.areaCard, activeArea === area.key && styles.areaCardActive, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.areaEmoji}>{area.emoji}</Text>
              <Text style={styles.areaLabel}>{area.label}</Text>
              <View style={[styles.statusDot, { backgroundColor: color }]} />
            </Pressable>
          </MotiView>
        ))}
      </View>

      {/* Full Journey CTA */}
      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 500, delay: 400 }}>
        <Pressable onPress={() => router.push('/reports/premium' as never)} style={styles.ctaRow}>
          <Text style={styles.ctaRowText}>✦ Unlock Full Life Report</Text>
        </Pressable>
      </MotiView>
    </>
  );
}

function TimelineTab({ phases, type }: { phases: LifeJourneyPhase[]; type: 'past' | 'future' }) {
  const filtered = phases.filter((p) => p.status === type || (type === 'past' && p.status === 'current'));
  const router = useRouter();

  if (filtered.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>{type === 'past' ? '⏮️' : '⏭️'}</Text>
        <Text style={styles.emptyText}>
          {type === 'past' ? 'No past phases recorded' : 'Generate a kundli to see future phases'}
        </Text>
        {type === 'future' && (
          <Pressable onPress={() => router.push('/kundli/generate' as never)} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Generate Kundli →</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <>
      {type === 'future' && (
        <View style={styles.youAreHereBanner}>
          <View style={styles.youAreHereLine} />
          <Text style={styles.youAreHereText}>YOU ARE HERE</Text>
          <View style={styles.youAreHereLine} />
        </View>
      )}
      {filtered.map((phase, i) => (
        <PhaseCard key={phase.id} phase={phase} index={i} dimmed={type === 'future' && i > 2} />
      ))}
    </>
  );
}

export default function LifeJourneyScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('present');
  const storeCharts = useStore((s) => s.charts);

  const { data: chartsData } = useQuery({
    queryKey: ['kundli-charts'],
    queryFn: getKundliCharts,
    staleTime: 5 * 60 * 1000,
    enabled: storeCharts.length === 0,
  });

  const primaryChartId = storeCharts[0]?.id ?? chartsData?.data?.[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['life-journey', primaryChartId],
    queryFn: () => getLifeJourney(primaryChartId!),
    enabled: !!primaryChartId,
    staleTime: 5 * 60 * 1000,
  });

  const journeyData = data?.data;
  const phases = journeyData?.phases ?? [];
  const currentPhase = journeyData?.currentPhase ?? null;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'past', label: 'Past' },
    { key: 'present', label: 'Present' },
    { key: 'future', label: 'Future' },
  ];

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 450 }} style={styles.header}>
          <Text style={styles.title}>Life Journey</Text>
          <Text style={styles.subtitle}>Your Vimshottari Dasha timeline</Text>
        </MotiView>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Reading your stars...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'present' && (
              <PresentTab currentPhase={currentPhase} phases={phases} />
            )}
            {activeTab === 'past' && (
              <TimelineTab phases={phases} type="past" />
            )}
            {activeTab === 'future' && (
              <TimelineTab phases={phases} type="future" />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },

  header: { marginBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },

  tabBar: { flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: 12, padding: 4, marginBottom: 22, borderWidth: 1, borderColor: colors.border },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabBtnActive: { backgroundColor: 'rgba(212,168,67,0.18)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.35)' },
  tabLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textMuted },
  tabLabelActive: { color: colors.primary, fontFamily: 'Poppins_600SemiBold' },

  loadingWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  // Phase timeline
  phaseRow: { flexDirection: 'row', marginBottom: 4 },
  timelineCol: { width: 28, alignItems: 'center', paddingTop: 16 },
  dot: { width: 11, height: 11, borderRadius: 6, borderWidth: 2, zIndex: 1 },
  line: { flex: 1, width: 2, backgroundColor: colors.borderSubtle, marginTop: 4, minHeight: 20 },
  phaseCard: { flex: 1, marginLeft: 10, marginBottom: 12, backgroundColor: colors.bgSurface, borderColor: colors.border },
  phaseTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  phaseEmoji: { fontSize: 22, marginTop: 2 },
  phaseHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  phasePlanet: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  phaseTheme: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 2 },
  phasePeriod: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  // Present Tab
  dashaCard: { marginBottom: 20, borderWidth: 1, backgroundColor: colors.bgSurface },
  dashaHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dashaEmojiWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  dashaEmoji: { fontSize: 26 },
  dashaTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text },
  dashaTheme: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 1 },
  dashaPeriod: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
  dashaDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 12, lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  areaCard: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6 },
  areaCardActive: { borderColor: 'rgba(212,168,67,0.45)', backgroundColor: 'rgba(212,168,67,0.08)' },
  areaEmoji: { fontSize: 24 },
  areaLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  ctaRow: { backgroundColor: 'rgba(212,168,67,0.10)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.28)', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaRowText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  // Future tab
  youAreHereBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  youAreHereLine: { flex: 1, height: 1, backgroundColor: colors.primary, opacity: 0.4 },
  youAreHereText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.primary, letterSpacing: 1 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.32)', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
});
