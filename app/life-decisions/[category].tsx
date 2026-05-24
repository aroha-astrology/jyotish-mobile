import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { getLifeDecision } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useStore } from '@/store/useStore';

// ── Category registry ─────────────────────────────────────────────────────────

interface CategoryMeta {
  title: string;
  emoji: string;
  subtitle: string;
}

const LIFE_DECISIONS_CATEGORIES: Record<string, CategoryMeta> = {
  vehicle: {
    title: 'Vehicle Purchase',
    emoji: '🚗',
    subtitle: 'Best time to buy your new vehicle',
  },
  property: {
    title: 'Property / Home',
    emoji: '🏠',
    subtitle: 'Auspicious timing for property decisions',
  },
  business: {
    title: 'Business Launch',
    emoji: '💼',
    subtitle: 'Muhurta for starting a new venture',
  },
  wedding: {
    title: 'Wedding Date',
    emoji: '💒',
    subtitle: 'Find the most auspicious wedding muhurta',
  },
  baby: {
    title: 'Baby Planning',
    emoji: '👶',
    subtitle: 'Planetary guidance for family planning',
  },
  job: {
    title: 'Job Change',
    emoji: '💼',
    subtitle: 'Right timing for a career transition',
  },
  education: {
    title: 'Education',
    emoji: '📚',
    subtitle: 'Best period to begin studies or courses',
  },
  investment: {
    title: 'Investment',
    emoji: '📈',
    subtitle: 'Planetary cycles for financial decisions',
  },
  travel: {
    title: 'Major Travel',
    emoji: '✈️',
    subtitle: 'Auspicious windows for long journeys',
  },
  surgery: {
    title: 'Surgery / Medical',
    emoji: '🏥',
    subtitle: 'Favorable timings for medical procedures',
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface DecisionOption {
  title: string;
  description: string;
  outcome: string;
  favorable: boolean;
}

interface LifeDecisionData {
  categoryInfo: {
    title: string;
    description: string;
    icon: string;
  };
  guidance: string;
  bestMuhurta: string;
  proTips: string[];
  options: DecisionOption[];
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
      <Skeleton height={90} borderRadius={16} style={{ marginBottom: 12 }} />
      <Skeleton height={70} borderRadius={16} style={{ marginBottom: 12 }} />
      <Skeleton height={60} borderRadius={16} style={{ marginBottom: 12 }} />
      <View style={{ gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={20} width={`${90 - i * 10}%` as any} borderRadius={8} />
        ))}
      </View>
    </MotiView>
  );
}

function ProTipItem({ tip, index }: { tip: string; index: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -6 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 320, delay: index * 60 }}
    >
      <View style={styles.proTipRow}>
        <View style={styles.proTipNumber}>
          <Text style={styles.proTipNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.proTipText}>{tip}</Text>
      </View>
    </MotiView>
  );
}

function DecisionOptionCard({
  option,
  index,
}: {
  option: DecisionOption;
  index: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 80 }}
    >
      <Card
        style={[
          styles.optionCard,
          option.favorable
            ? styles.optionCardFavorable
            : styles.optionCardUnfavorable,
        ]}
      >
        <View style={styles.optionHeader}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          <Badge variant={option.favorable ? 'teal' : 'red'}>
            {option.favorable ? 'Favorable' : 'Caution'}
          </Badge>
        </View>
        <Text style={styles.optionDesc}>{option.description}</Text>
        {option.outcome ? (
          <View style={styles.outcomeRow}>
            <Text style={styles.outcomeLabel}>Outcome: </Text>
            <Text style={styles.outcomeText}>{option.outcome}</Text>
          </View>
        ) : null}
      </Card>
    </MotiView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function LifeDecisionScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const charts = useStore((s) => s.charts);
  const profiles = useStore((s) => s.profiles);

  const [selectedChartId, setSelectedChartId] = useState<string>(
    charts[0]?.id ?? ''
  );

  const meta = category ? LIFE_DECISIONS_CATEGORIES[category] : undefined;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['life-decision', category, selectedChartId],
    queryFn: () => getLifeDecision(category!, selectedChartId),
    enabled: !!category && !!selectedChartId,
    staleTime: 15 * 60 * 1000,
  });

  const handleChartSelect = useCallback((id: string) => {
    setSelectedChartId(id);
  }, []);

  const decision = data?.data as LifeDecisionData | undefined;

  // Unknown category fallback
  if (!meta) {
    return (
      <View style={styles.root}>
        <CosmicBackground />
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>❓</Text>
          <Text style={styles.emptyTitle}>Unknown Category</Text>
          <Pressable onPress={() => router.back()} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>← Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{meta.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{meta.title}</Text>
              <Text style={styles.subtitle}>{meta.subtitle}</Text>
            </View>
          </View>
          {charts.length > 0 && (
            <Pressable
              onPress={() => refetch()}
              style={[styles.refreshBtn, isFetching && { opacity: 0.4 }]}
              disabled={isFetching}
            >
              <Text style={styles.refreshIcon}>↻</Text>
            </Pressable>
          )}
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
            <Text style={styles.emptyEmoji}>{meta.emoji}</Text>
            <Text style={styles.emptyTitle}>No Kundli Found</Text>
            <Text style={styles.emptySub}>
              Generate your birth chart to receive personalised life decision
              guidance.
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
              Could not load guidance. Please try again.
            </Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </MotiView>
        )}

        {/* Results */}
        {decision && !isLoading && (
          <>
            {/* Category info card */}
            <MotiView
              from={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 60 }}
            >
              <Card style={styles.categoryInfoCard}>
                <View style={styles.categoryInfoHeader}>
                  <Text style={styles.categoryInfoIcon}>
                    {decision.categoryInfo.icon || meta.emoji}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.categoryInfoTitle}>
                      {decision.categoryInfo.title || meta.title}
                    </Text>
                    <Text style={styles.categoryInfoDesc}>
                      {decision.categoryInfo.description}
                    </Text>
                  </View>
                </View>
              </Card>
            </MotiView>

            {/* Guidance for You */}
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 360, delay: 130 }}
            >
              <Text style={styles.sectionTitle}>Guidance for You</Text>
              <Card style={styles.guidanceCard}>
                <Text style={styles.guidanceText}>{decision.guidance}</Text>
              </Card>
            </MotiView>

            {/* Best Muhurta */}
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 360, delay: 200 }}
            >
              <Text style={styles.sectionTitle}>Best Muhurta</Text>
              <Card style={styles.muhurtaCard}>
                <View style={styles.muhurtaHeader}>
                  <Text style={styles.muhurtaEmoji}>✨</Text>
                  <Text style={styles.muhurtaTitle}>Auspicious Timing</Text>
                  <Badge variant="gold">Recommended</Badge>
                </View>
                <Text style={styles.muhurtaText}>{decision.bestMuhurta}</Text>
              </Card>
            </MotiView>

            {/* Pro Tips */}
            {decision.proTips && decision.proTips.length > 0 && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 320, delay: 260 }}
              >
                <Text style={styles.sectionTitle}>Pro Tips</Text>
                <Card style={styles.proTipsCard}>
                  {decision.proTips.map((tip, i) => (
                    <View key={i}>
                      <ProTipItem tip={tip} index={i} />
                      {i < decision.proTips.length - 1 && (
                        <View style={styles.tipDivider} />
                      )}
                    </View>
                  ))}
                </Card>
              </MotiView>
            )}

            {/* Decision Options */}
            {decision.options && decision.options.length > 0 && (
              <>
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 300, delay: 320 }}
                >
                  <Text style={styles.sectionTitle}>Decision Options</Text>
                </MotiView>
                {decision.options.map((option, i) => (
                  <DecisionOptionCard key={i} option={option} index={i} />
                ))}
              </>
            )}

            {/* Refresh CTA */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 400 }}
            >
              <Pressable
                onPress={() => refetch()}
                style={styles.refreshFullBtn}
                disabled={isFetching}
              >
                {isFetching ? (
                  <ActivityIndicator color={colors.bg} size="small" />
                ) : (
                  <Text style={styles.refreshFullBtnText}>
                    ↻  Refresh Guidance
                  </Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 18,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  backArrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: { fontSize: 28 },
  title: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: {
    fontSize: 11,
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

  // Category info
  categoryInfoCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
  },
  categoryInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryInfoIcon: { fontSize: 32 },
  categoryInfoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 4,
  },
  categoryInfoDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Guidance
  guidanceCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
  },
  guidanceText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    lineHeight: 22,
  },

  // Muhurta
  muhurtaCard: {
    backgroundColor: 'rgba(212,168,67,0.07)',
    borderColor: 'rgba(212,168,67,0.28)',
  },
  muhurtaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  muhurtaEmoji: { fontSize: 22 },
  muhurtaTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  muhurtaText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    lineHeight: 22,
  },

  // Pro Tips
  proTipsCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    padding: 0,
    overflow: 'hidden',
  },
  proTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  proTipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212,168,67,0.15)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  proTipNumberText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  proTipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    lineHeight: 20,
  },
  tipDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 16,
  },

  // Decision Options
  optionCard: {
    marginBottom: 12,
  },
  optionCardFavorable: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderColor: 'rgba(16,185,129,0.28)',
  },
  optionCardUnfavorable: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.22)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  optionTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  outcomeLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
  },
  outcomeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Refresh button
  refreshFullBtn: {
    marginTop: 16,
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

  // Empty / error states
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyEmoji: { fontSize: 52 },
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
});
