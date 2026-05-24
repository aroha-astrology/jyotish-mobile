import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useStore } from '@/store/useStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Muhurta {
  date: string;
  time: string;
  tithi: string;
  nakshatra: string;
  reasoning: string[];
  warnings: string[];
  score: number;
}

interface MuhurtaResult {
  muhurtas: Muhurta[];
}

// ── API stub (wire to real endpoint when available) ───────────────────────────

async function getMuhurta(params: {
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  chartId?: string;
}): Promise<{ success: boolean; data: MuhurtaResult }> {
  const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const res = await fetch(`${BASE_URL}/api/muhurta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { id: 'marriage',        label: 'Marriage',        emoji: '💒' },
  { id: 'griha_pravesh',   label: 'Griha Pravesh',   emoji: '🏠' },
  { id: 'business_launch', label: 'Business Launch', emoji: '💼' },
  { id: 'namkaran',        label: 'Namkaran',        emoji: '👶' },
  { id: 'vehicle',         label: 'Vehicle',         emoji: '🚗' },
  { id: 'gold_purchase',   label: 'Gold Purchase',   emoji: '💛' },
  { id: 'travel',          label: 'Travel',          emoji: '✈️' },
  { id: 'surgery',         label: 'Surgery',         emoji: '🏥' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const barColor =
    score >= 80 ? colors.success : score >= 60 ? colors.primary : colors.destructive;
  const label =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Avoid';
  return (
    <View style={scoreStyles.wrap}>
      <View style={scoreStyles.row}>
        <Text style={scoreStyles.label}>Muhurta Score</Text>
        <Text style={[scoreStyles.value, { color: barColor }]}>
          {score}/100
        </Text>
      </View>
      <View style={scoreStyles.track}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'timing', duration: 600 }}
          style={[scoreStyles.fill, { backgroundColor: barColor }]}
        />
      </View>
      <Badge
        variant={score >= 80 ? 'teal' : score >= 60 ? 'gold' : 'red'}
        style={{ marginTop: 4 }}
      >
        {label}
      </Badge>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  wrap: { marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textMuted },
  value: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3 },
});

function MuhurtaCard({ item, index }: { item: Muhurta; index: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 380, delay: index * 80 }}
    >
      <Card
        style={[
          styles.muhurtaCard,
          {
            borderColor:
              item.score >= 80
                ? `${colors.success}44`
                : item.score >= 60
                ? `${colors.primary}44`
                : `${colors.destructive}44`,
          },
        ]}
      >
        {/* Date + time */}
        <View style={styles.muhurtaHeader}>
          <View>
            <Text style={styles.muhurtaDate}>{item.date}</Text>
            <Text style={styles.muhurtaTime}>{item.time}</Text>
          </View>
          <View style={styles.muhurtaScoreBadge}>
            <Text
              style={[
                styles.muhurtaScoreNum,
                {
                  color:
                    item.score >= 80
                      ? colors.success
                      : item.score >= 60
                      ? colors.primary
                      : colors.destructive,
                },
              ]}
            >
              {item.score}
            </Text>
            <Text style={styles.muhurtaScoreUnit}>/100</Text>
          </View>
        </View>

        {/* Tithi + Nakshatra */}
        <View style={styles.badgeRow}>
          <Badge variant="gold">{item.tithi}</Badge>
          <Badge variant="accent">{item.nakshatra}</Badge>
        </View>

        {/* Score bar */}
        <ScoreBar score={item.score} />

        {/* Reasoning */}
        {item.reasoning.length > 0 && (
          <View style={styles.reasoningWrap}>
            <Text style={styles.subSectionLabel}>Why this time?</Text>
            {item.reasoning.map((r, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warnings */}
        {item.warnings.length > 0 && (
          <View style={styles.warningsWrap}>
            <Text style={[styles.subSectionLabel, { color: '#f87171' }]}>
              ⚠️ Cautions
            </Text>
            {item.warnings.map((w, i) => (
              <View key={i} style={styles.warningRow}>
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </MotiView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MuhurtaScreen() {
  const router = useRouter();
  const charts = useStore((s) => s.charts);

  const [selectedEvent, setSelectedEvent] = useState<string>('marriage');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('New Delhi');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Muhurta[] | null>(null);
  const [error, setError] = useState('');

  const handleFind = async () => {
    if (!startDate || !endDate) {
      setError('Please enter both start and end dates.');
      return;
    }
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const chartId = charts[0]?.id;
      const res = await getMuhurta({
        eventType: selectedEvent,
        startDate,
        endDate,
        location,
        chartId,
      });
      if (res.success) {
        const sorted = [...res.data.muhurtas].sort((a, b) => b.score - a.score);
        setResults(sorted);
      } else {
        setError('Could not find muhurtas. Please try again.');
      }
    } catch {
      setError('Failed to connect. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const canSearch = selectedEvent && startDate.length === 10 && endDate.length === 10;

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.eyebrow}>Vedic Astrology</Text>
            <Text style={styles.title}>Muhurta Finder</Text>
            <Text style={styles.subtitle}>Find Your Auspicious Time</Text>
          </View>
        </MotiView>

        {/* Event Type Picker */}
        <Text style={styles.sectionTitle}>Select Event</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {EVENT_TYPES.map((evt) => {
            const active = selectedEvent === evt.id;
            return (
              <Pressable
                key={evt.id}
                onPress={() => {
                  setSelectedEvent(evt.id);
                  setResults(null);
                }}
                style={[
                  styles.eventChip,
                  active && styles.eventChipActive,
                ]}
              >
                <Text style={styles.eventChipEmoji}>{evt.emoji}</Text>
                <Text
                  style={[
                    styles.eventChipLabel,
                    active && styles.eventChipLabelActive,
                  ]}
                >
                  {evt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Date Range */}
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={startDate}
              onChangeText={(t) => {
                setStartDate(t);
                setResults(null);
              }}
              maxLength={10}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.inputLabel}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={endDate}
              onChangeText={(t) => {
                setEndDate(t);
                setResults(null);
              }}
              maxLength={10}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Location */}
        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Location</Text>
        <TextInput
          style={[styles.input, styles.locationInput]}
          placeholder="City name"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={(t) => {
            setLocation(t);
            setResults(null);
          }}
        />

        {/* Error */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Find Button */}
        <Pressable
          onPress={handleFind}
          disabled={!canSearch || loading}
          style={[
            styles.findBtn,
            (!canSearch || loading) && { opacity: 0.45 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.findBtnText}>🔮 Find Muhurta</Text>
          )}
        </Pressable>

        {/* Loading state */}
        {loading && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.loadingCard}
          >
            <Text style={styles.loadingText}>Consulting the planetary positions…</Text>
            <Text style={styles.loadingSubText}>
              Checking tithi, nakshatra, and yoga for your event
            </Text>
          </MotiView>
        )}

        {/* Results */}
        {results !== null && !loading && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 350 }}
          >
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>
                {results.length > 0
                  ? `${results.length} Muhurta${results.length !== 1 ? 's' : ''} Found`
                  : 'Results'}
              </Text>
              {results.length > 0 && (
                <Badge variant="gold">Sorted by Score</Badge>
              )}
            </View>

            {results.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🌑</Text>
                <Text style={styles.emptyTitle}>No Auspicious Times Found</Text>
                <Text style={styles.emptyText}>
                  No good muhurtas were found in this date range for{' '}
                  {EVENT_TYPES.find((e) => e.id === selectedEvent)?.label}.
                  Try extending the date range or choose a different location.
                </Text>
              </Card>
            ) : (
              results.map((item, i) => (
                <MuhurtaCard key={`${item.date}-${item.time}`} item={item} index={i} />
              ))
            )}
          </MotiView>
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
    marginBottom: 22,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  backArrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  eyebrow: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Event chips
  chipScroll: { gap: 8, paddingBottom: 4, marginBottom: 6 },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  eventChipActive: {
    backgroundColor: 'rgba(212,168,67,0.14)',
    borderColor: colors.primary,
  },
  eventChipEmoji: { fontSize: 16 },
  eventChipLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  eventChipLabelActive: { color: colors.primary },

  // Date inputs
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
  },
  locationInput: { marginTop: 0 },

  // Error
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.destructive,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  // Button
  findBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  findBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.bg,
  },

  // Loading
  loadingCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Results header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Muhurta card
  muhurtaCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    marginBottom: 14,
    gap: 0,
  },
  muhurtaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  muhurtaDate: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  muhurtaTime: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
    marginTop: 2,
  },
  muhurtaScoreBadge: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
  },
  muhurtaScoreNum: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 24,
  },
  muhurtaScoreUnit: {
    fontSize: 9,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },

  // Badge row
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },

  // Reasoning
  reasoningWrap: { marginTop: 12 },
  subSectionLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bulletDot: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 20,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Warnings
  warningsWrap: {
    marginTop: 10,
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    padding: 10,
  },
  warningRow: { marginBottom: 4 },
  warningText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#fca5a5',
    lineHeight: 18,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 4 },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
