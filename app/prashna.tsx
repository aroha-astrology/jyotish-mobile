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

// ── Types ─────────────────────────────────────────────────────────────────────

type Favorability = 'favorable' | 'unfavorable' | 'mixed';

interface PrashnaChartRow {
  planet: string;
  sign: string;
  degree: string;
  house: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
}

interface PrashnaResult {
  answer: string;
  favorability: Favorability;
  chart: PrashnaChartRow[];
  analysis: string;
  keyFactors: string[];
  advice: string;
}

// ── API stub ──────────────────────────────────────────────────────────────────

async function getPrashna(
  question: string,
  city: string,
): Promise<{ success: boolean; data: PrashnaResult }> {
  const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const res = await fetch(`${BASE_URL}/api/prashna`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, city }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CITIES = [
  'Delhi',
  'Mumbai',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Jaipur',
];

const FAVORABILITY_CONFIG: Record<
  Favorability,
  { label: string; emoji: string; badgeVariant: 'teal' | 'gold' | 'red'; color: string }
> = {
  favorable:   { label: 'Favorable',   emoji: '✅', badgeVariant: 'teal', color: colors.success },
  mixed:       { label: 'Mixed',       emoji: '⚠️', badgeVariant: 'gold', color: colors.primary },
  unfavorable: { label: 'Unfavorable', emoji: '❌', badgeVariant: 'red',  color: colors.destructive },
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋', Ascendant: '↑',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function FavorabilityBadge({ value }: { value: Favorability }) {
  const cfg = FAVORABILITY_CONFIG[value];
  return (
    <View
      style={[
        favStyles.wrap,
        {
          backgroundColor: `${cfg.color}14`,
          borderColor: `${cfg.color}40`,
        },
      ]}
    >
      <Text style={favStyles.emoji}>{cfg.emoji}</Text>
      <Text style={[favStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const favStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  emoji: { fontSize: 16 },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

function ChartTable({ rows }: { rows: PrashnaChartRow[] }) {
  return (
    <View style={tableStyles.wrap}>
      {/* Header */}
      <View style={[tableStyles.row, tableStyles.headerRow]}>
        {['Planet', 'Sign', 'House', 'Nakshatra', 'R'].map((h) => (
          <Text key={h} style={[tableStyles.cell, tableStyles.headerCell]}>
            {h}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {rows.map((r, i) => (
        <View
          key={r.planet}
          style={[tableStyles.row, i % 2 === 0 && tableStyles.rowAlt]}
        >
          <Text style={[tableStyles.cell, tableStyles.planetCell]} numberOfLines={1}>
            {PLANET_SYMBOLS[r.planet] ?? ''} {r.planet}
          </Text>
          <Text style={[tableStyles.cell, tableStyles.dataCell]} numberOfLines={1}>
            {r.sign}
          </Text>
          <Text style={[tableStyles.cell, tableStyles.dataCell]}>{r.house}</Text>
          <Text style={[tableStyles.cell, tableStyles.dataCell]} numberOfLines={1}>
            {r.nakshatra}
          </Text>
          <Text
            style={[
              tableStyles.cell,
              tableStyles.dataCell,
              r.retrograde && { color: colors.destructive },
            ]}
          >
            {r.retrograde ? 'R' : '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const tableStyles = StyleSheet.create({
  wrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerRow: {
    backgroundColor: 'rgba(212,168,67,0.10)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  cell: { flex: 1 },
  headerCell: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  planetCell: {
    flex: 1.4,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  dataCell: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PrashnaScreen() {
  const router = useRouter();

  const [question, setQuestion] = useState('');
  const [city, setCity] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrashnaResult | null>(null);
  const [error, setError] = useState('');

  const canAsk = question.trim().length >= 10;

  const handleAsk = async () => {
    if (!canAsk) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await getPrashna(question.trim(), city);
      if (res.success) {
        setResult(res.data);
      } else {
        setError('Could not cast the prashna chart. Please try again.');
      }
    } catch {
      setError('Failed to connect. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskAnother = () => {
    setResult(null);
    setQuestion('');
    setError('');
  };

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
            <Text style={styles.eyebrow}>Horary Astrology</Text>
            <Text style={styles.title}>Prashna Jyotish</Text>
            <Text style={styles.subtitle}>Ask the Stars</Text>
          </View>
        </MotiView>

        {!result && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 350 }}
          >
            {/* Question input */}
            <Text style={styles.sectionTitle}>Your Question</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="What is your question for the stars? Be specific and sincere…"
              placeholderTextColor={colors.textMuted}
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            <View style={styles.charCountRow}>
              <Text style={styles.charCount}>
                Min 10 chars · {question.length}/300
              </Text>
              {question.length >= 10 && (
                <Badge variant="teal">Ready</Badge>
              )}
            </View>

            {/* City selector */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Your Location</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityScroll}
            >
              {CITIES.map((c) => {
                const active = city === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCity(c)}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                  >
                    <Text
                      style={[
                        styles.cityChipLabel,
                        active && styles.cityChipLabelActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Error */}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Ask button */}
            <Pressable
              onPress={handleAsk}
              disabled={!canAsk || loading}
              style={[
                styles.askBtn,
                (!canAsk || loading) && { opacity: 0.45 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.askBtnText}>🔮 Ask the Stars</Text>
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
                <Text style={styles.loadingText}>Casting prashna chart…</Text>
                <Text style={styles.loadingSubText}>
                  Calculating lagna and planetary positions for this moment
                </Text>
              </MotiView>
            )}
          </MotiView>
        )}

        {/* Results */}
        {result && !loading && (
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 420 }}
          >
            {/* Answer card */}
            <Card
              style={[
                styles.answerCard,
                {
                  borderColor:
                    result.favorability === 'favorable'
                      ? `${colors.success}44`
                      : result.favorability === 'unfavorable'
                      ? `${colors.destructive}44`
                      : `${colors.primary}44`,
                },
              ]}
            >
              <Text style={styles.questionDisplay}>
                "{question}"
              </Text>
              <Text style={styles.answerText}>{result.answer}</Text>
              <FavorabilityBadge value={result.favorability} />
            </Card>

            {/* Prashna Chart */}
            <Text style={styles.sectionTitle}>Prashna Chart</Text>
            <ChartTable rows={result.chart} />

            {/* Key Factors */}
            {result.keyFactors.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
                  Key Factors
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.factorsScroll}
                >
                  {result.keyFactors.map((f, i) => (
                    <Badge key={i} variant="accent" style={{ marginRight: 6 }}>
                      {f}
                    </Badge>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Detailed Analysis */}
            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
              Detailed Analysis
            </Text>
            <Card style={styles.analysisCard}>
              <Text style={styles.analysisText}>{result.analysis}</Text>
            </Card>

            {/* Advice */}
            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Advice</Text>
            <View style={styles.adviceBox}>
              <View style={styles.adviceAccent} />
              <Text style={styles.adviceText}>{result.advice}</Text>
            </View>

            {/* Ask Another */}
            <Pressable onPress={handleAskAnother} style={styles.askAnotherBtn}>
              <Text style={styles.askAnotherText}>✦ Ask Another Question</Text>
            </Pressable>
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

  // Question input
  questionInput: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    minHeight: 110,
    lineHeight: 22,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },

  // City chips
  cityScroll: { gap: 8, paddingBottom: 4 },
  cityChip: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cityChipActive: {
    backgroundColor: 'rgba(212,168,67,0.14)',
    borderColor: colors.primary,
  },
  cityChipLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  cityChipLabelActive: { color: colors.primary },

  // Error
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.destructive,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  // Ask button
  askBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  askBtnText: {
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

  // Answer card
  answerCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    gap: 12,
    marginBottom: 20,
  },
  questionDisplay: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  answerText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    lineHeight: 26,
  },

  // Key factors
  factorsScroll: { paddingBottom: 4 },

  // Analysis
  analysisCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
  },
  analysisText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Advice
  adviceBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212,168,67,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    overflow: 'hidden',
  },
  adviceAccent: {
    width: 4,
    backgroundColor: colors.primary,
    borderRadius: 4,
    margin: 4,
    marginRight: 0,
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    lineHeight: 22,
    padding: 14,
    paddingLeft: 12,
  },

  // Ask another
  askAnotherBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(212,168,67,0.07)',
  },
  askAnotherText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
});
