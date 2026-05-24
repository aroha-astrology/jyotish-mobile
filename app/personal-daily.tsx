import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { getPersonalDaily } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useStore } from '@/store/useStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PersonalDailyData {
  headline: string;
  general: string;
  career: string;
  love: string;
  health: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
  remedy: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Map a color name to a rough hex for the swatch
const COLOR_SWATCHES: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  pink: '#ec4899',
  white: '#7a6a90',
  black: '#1e1b2e',
  gold: '#d4a843',
  silver: '#94a3b8',
  brown: '#78350f',
  saffron: '#f59e0b',
};

function colorSwatch(colorName: string): string {
  const lower = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_SWATCHES)) {
    if (lower.includes(key)) return hex;
  }
  return colors.primary;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChartSelector({
  charts,
  profiles,
  selectedId,
  onSelect,
}: {
  charts: { id: string; profile_id: string }[];
  profiles: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (charts.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chartSelectorScroll}
    >
      {charts.map((chart) => {
        const profile = profiles.find((p) => p.id === chart.profile_id);
        const isActive = chart.id === selectedId;
        return (
          <Pressable
            key={chart.id}
            onPress={() => onSelect(chart.id)}
            style={[styles.chartChip, isActive && styles.chartChipActive]}
          >
            <Text
              style={[
                styles.chartChipText,
                isActive && styles.chartChipTextActive,
              ]}
            >
              {profile?.name ?? 'Chart'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function LoadingSkeleton() {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 250 }}
    >
      {/* Headline skeleton */}
      <View style={styles.skeletonHeadline}>
        <Skeleton width="80%" height={22} borderRadius={10} style={{ marginBottom: 10 }} />
        <Skeleton width="60%" height={14} borderRadius={8} />
      </View>

      {/* General skeleton */}
      <Skeleton height={80} borderRadius={14} style={{ marginBottom: 12 }} />

      {/* Life areas */}
      <View style={styles.areasRow}>
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            width="31%"
            height={90}
            borderRadius={14}
          />
        ))}
      </View>

      {/* Lucky picks */}
      <Skeleton height={52} borderRadius={14} style={{ marginTop: 12 }} />
    </MotiView>
  );
}

function LifeAreaCard({
  emoji,
  label,
  text,
  index,
}: {
  emoji: string;
  label: string;
  text: string;
  index: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 80 + 150 }}
      style={styles.areaCardWrap}
    >
      <Card style={styles.areaCard}>
        <Text style={styles.areaEmoji}>{emoji}</Text>
        <Text style={styles.areaLabel}>{label}</Text>
        <Text style={styles.areaText} numberOfLines={5}>
          {text}
        </Text>
      </Card>
    </MotiView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PersonalDailyScreen() {
  const router = useRouter();
  const charts = useStore((s) => s.charts);
  const profiles = useStore((s) => s.profiles);

  const [selectedChartId, setSelectedChartId] = useState<string>(
    charts[0]?.id ?? ''
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['personal-daily', selectedChartId],
    queryFn: () => getPersonalDaily(selectedChartId),
    enabled: !!selectedChartId,
    staleTime: 10 * 60 * 1000,
  });

  const handleChartSelect = useCallback((id: string) => {
    setSelectedChartId(id);
  }, []);

  const daily = data?.data as PersonalDailyData | undefined;
  const swatchHex = daily ? colorSwatch(daily.luckyColor) : colors.primary;

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.headerRow}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Personal Daily</Text>
            <Text style={styles.subtitle}>{fmtToday()}</Text>
          </View>
          <Pressable
            onPress={() => refetch()}
            style={[styles.refreshBtn, isFetching && { opacity: 0.4 }]}
            disabled={isFetching}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </Pressable>
        </MotiView>

        {/* Chart selector */}
        <ChartSelector
          charts={charts}
          profiles={profiles}
          selectedId={selectedChartId}
          onSelect={handleChartSelect}
        />

        {/* No chart state */}
        {charts.length === 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
            style={styles.emptyWrap}
          >
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={styles.emptyTitle}>No Kundli Found</Text>
            <Text style={styles.emptySub}>
              Generate your birth chart to receive personalised daily guidance.
            </Text>
            <Pressable
              onPress={() => router.push('/kundli/generate')}
              style={styles.emptyBtn}
            >
              <Text style={styles.emptyBtnText}>Generate Kundli →</Text>
            </Pressable>
          </MotiView>
        )}

        {/* Loading */}
        {isLoading && <LoadingSkeleton />}

        {/* Error */}
        {isError && !isLoading && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.errorWrap}
          >
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>
              Could not load your daily insights.
            </Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </MotiView>
        )}

        {/* Results */}
        {daily && !isLoading && (
          <>
            {/* Headline card */}
            <MotiView
              from={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 60 }}
            >
              <View style={styles.headlineCard}>
                <Badge variant="gold" style={{ marginBottom: 10 }}>
                  Today's Headline
                </Badge>
                <Text style={styles.headlineText}>{daily.headline}</Text>
              </View>
            </MotiView>

            {/* General guidance */}
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 380, delay: 120 }}
            >
              <Text style={styles.sectionTitle}>General Guidance</Text>
              <Card style={styles.generalCard}>
                <Text style={styles.guidanceText}>{daily.general}</Text>
              </Card>
            </MotiView>

            {/* Life areas */}
            <Text style={styles.sectionTitle}>Life Areas</Text>
            <View style={styles.areasRow}>
              <LifeAreaCard emoji="💼" label="Career" text={daily.career} index={0} />
              <LifeAreaCard emoji="❤️" label="Love" text={daily.love} index={1} />
              <LifeAreaCard emoji="🌿" label="Health" text={daily.health} index={2} />
            </View>

            {/* Lucky picks */}
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 360, delay: 300 }}
            >
              <Text style={styles.sectionTitle}>Lucky Picks</Text>
              <Card style={styles.luckyCard}>
                <View style={styles.luckyRow}>
                  {/* Color */}
                  <View style={styles.luckyItem}>
                    <View
                      style={[styles.colorSwatch, { backgroundColor: swatchHex }]}
                    />
                    <Text style={styles.luckyItemLabel}>Color</Text>
                    <Text style={styles.luckyItemValue} numberOfLines={1}>
                      {daily.luckyColor}
                    </Text>
                  </View>
                  <View style={styles.luckyDivider} />
                  {/* Number */}
                  <View style={styles.luckyItem}>
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberBadgeText}>
                        {daily.luckyNumber}
                      </Text>
                    </View>
                    <Text style={styles.luckyItemLabel}>Number</Text>
                    <Text style={styles.luckyItemValue}>Lucky No.</Text>
                  </View>
                  <View style={styles.luckyDivider} />
                  {/* Direction */}
                  <View style={styles.luckyItem}>
                    <Text style={styles.directionEmoji}>🧭</Text>
                    <Text style={styles.luckyItemLabel}>Direction</Text>
                    <Text style={styles.luckyItemValue} numberOfLines={1}>
                      {daily.luckyDirection}
                    </Text>
                  </View>
                </View>
              </Card>
            </MotiView>

            {/* Daily Remedy */}
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 360, delay: 380 }}
            >
              <Text style={styles.sectionTitle}>Daily Remedy</Text>
              <Card style={styles.remedyCard}>
                <View style={styles.remedyHeader}>
                  <Text style={styles.remedyEmoji}>🙏</Text>
                  <Text style={styles.remedyTitle}>Cosmic Remedy</Text>
                  <Badge variant="gold">Today</Badge>
                </View>
                <Text style={styles.remedyText}>{daily.remedy}</Text>
              </Card>
            </MotiView>

            {/* Refresh button */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 450 }}
            >
              <Pressable
                onPress={() => refetch()}
                style={styles.refreshFullBtn}
                disabled={isFetching}
              >
                {isFetching ? (
                  <ActivityIndicator color={colors.bg} size="small" />
                ) : (
                  <Text style={styles.refreshFullBtnText}>↻  Refresh Insights</Text>
                )}
              </Pressable>
            </MotiView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 60 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  refreshIcon: { fontSize: 20, color: colors.primary },

  // Chart selector
  chartSelectorScroll: { gap: 8, paddingBottom: 4, marginBottom: 16 },
  chartChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartChipActive: {
    backgroundColor: 'rgba(212,168,67,0.12)',
    borderColor: colors.borderAccent,
  },
  chartChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  chartChipTextActive: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Section title
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },

  // Headline card
  headlineCard: {
    backgroundColor: 'rgba(212,168,67,0.10)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.30)',
    padding: 20,
    marginBottom: 4,
  },
  headlineText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    lineHeight: 28,
  },

  // General
  generalCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
  },
  guidanceText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    lineHeight: 22,
  },

  // Life areas
  areasRow: {
    flexDirection: 'row',
    gap: 10,
  },
  areaCardWrap: { flex: 1 },
  areaCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
    minHeight: 130,
  },
  areaEmoji: { fontSize: 22 },
  areaLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    letterSpacing: 0.3,
  },
  areaText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },

  // Lucky picks
  luckyCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    padding: 0,
  },
  luckyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  luckyItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  luckyDivider: {
    width: 1,
    height: 56,
    backgroundColor: colors.border,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212,168,67,0.15)',
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  directionEmoji: { fontSize: 26 },
  luckyItemLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  luckyItemValue: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // Remedy
  remedyCard: {
    backgroundColor: 'rgba(212,168,67,0.07)',
    borderColor: 'rgba(212,168,67,0.28)',
  },
  remedyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  remedyEmoji: { fontSize: 22 },
  remedyTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  remedyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    lineHeight: 22,
  },

  // Refresh full-width button
  refreshFullBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  refreshFullBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.bg,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.bg,
  },

  // Error
  errorWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.destructive,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  retryBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.destructive,
  },

  // Skeleton
  skeletonHeadline: {
    backgroundColor: 'rgba(212,168,67,0.07)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
});
