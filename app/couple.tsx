import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { analyzeCouple } from '@/lib/api';

const PLANET_COLOR: Record<string, string> = {
  Ketu: '#9B6B9E', Venus: '#E8A87C', Sun: '#F4B942', Moon: '#8BC4E8',
  Mars: '#E8735A', Rahu: '#7BA3B8', Jupiter: '#C4A84F', Saturn: '#8BA89B', Mercury: '#6BBF9E',
};

function compatColor(level: string) {
  if (level.includes('excellent')) return '#22c55e';
  if (level.includes('good')) return '#d4a843';
  if (level.includes('average')) return '#f59e0b';
  return '#ef4444';
}

interface KootaScore { koota: string; score: number; maxScore: number; description: string; compatibility: string }
interface ForecastItem { timeframe: string; icon: string; narrative: string }
interface CompatZone { score: number; analysis: string }
interface ConflictArea { area: string; description: string; severity: 'low' | 'medium' | 'high' }
interface SharedRemedy { remedy: string; purpose: string; frequency: string }

interface CoupleResult {
  husbandName: string;
  wifeName: string;
  partner1: { name: string; planets: any[]; ascendant: { sign: string; degree: number } };
  partner2: { name: string; planets: any[]; ascendant: { sign: string; degree: number } };
  ashtakoota: {
    scores: KootaScore[];
    totalScore: number;
    maxTotal: number;
    overallCompatibility: string;
    mangalMatch: { boyManglik: boolean; girlManglik: boolean; compatible: boolean };
  };
  aiAnalysis: {
    sharedForecast?: ForecastItem[] | string;
    compatibilityZones?: { career?: CompatZone; romance?: CompatZone; finances?: CompatZone; family?: CompatZone };
    conflictAreas?: ConflictArea[];
    sharedRemedies?: SharedRemedy[];
    strengthAreas?: string[];
    storyOfThem?: string;
  };
}

const KOOTA_REMEDIES: Record<string, { ritual: string; mantra: string }> = {
  Nadi: { ritual: 'Perform Maha Mrityunjaya Homa before marriage', mantra: 'Chant Maha Mrityunjaya Mantra daily' },
  Bhakoot: { ritual: 'Perform Lakshmi-Narayan puja monthly', mantra: 'Chant "Om Shri Lakshmi Narayanaya Namah"' },
  Gana: { ritual: 'Recite Vishnu Sahasranama together on Sundays', mantra: 'Chant "Om Vishnave Namah" 108 times' },
  Yoni: { ritual: 'Offer milk to a Shiva Linga on Mondays', mantra: 'Chant "Om Namah Shivaya" together at dusk' },
};

export default function CoupleScreen() {
  const router = useRouter();
  const charts = useStore(s => s.charts);
  const profiles = useStore(s => s.profiles);

  const chartOptions = useMemo(() => charts.map(c => {
    const p = profiles.find(pr => pr.id === c.profile_id);
    return { value: c.id, label: p ? p.name : `Chart ${c.id.slice(0, 6)}` };
  }), [charts, profiles]);

  const [chart1, setChart1] = useState('');
  const [chart2, setChart2] = useState('');
  const [husbandChart, setHusbandChart] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoupleResult | null>(null);
  const [error, setError] = useState('');
  const [expandedKoota, setExpandedKoota] = useState<string | null>(null);

  const canSubmit = chart1 && chart2 && chart1 !== chart2;

  async function handleAnalyze() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await analyzeCouple({ chart1Id: chart1, chart2Id: chart2, husbandChartId: husbandChart || chart1 });
      setResult(res.data as CoupleResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const forecasts: ForecastItem[] = useMemo(() => {
    if (!result?.aiAnalysis?.sharedForecast) return [];
    const sf = result.aiAnalysis.sharedForecast;
    if (Array.isArray(sf)) return sf as ForecastItem[];
    return String(sf).split('\n').filter(Boolean).map((line, i) => ({
      timeframe: i === 0 ? 'This Week' : i === 1 ? 'This Month' : '3-Month Outlook',
      icon: i === 0 ? '🌙' : i === 1 ? '🌟' : '🔮',
      narrative: line.replace(/^[-*•]\s*/, ''),
    }));
  }, [result]);

  const accentColor = result ? compatColor(result.ashtakoota.overallCompatibility) : '#d4a843';

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Match Making</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.heroSub}>Deep Kundli compatibility for husband & wife</Text>

        {/* Chart selector */}
        {!result && (
          <View style={s.selectorCard}>
            {chartOptions.length < 2 ? (
              <View style={s.needMoreWrap}>
                <Text style={s.needMoreText}>You need at least 2 saved Kundli charts.</Text>
                <Pressable onPress={() => router.push('/kundli/generate')} style={s.genBtn}>
                  <Text style={s.genBtnText}>Generate Kundli →</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={s.selectorSectionLabel}>🤵 HUSBAND</Text>
                <View style={s.chipRow}>
                  {chartOptions.map(opt => (
                    <Pressable
                      key={opt.value}
                      onPress={() => { setChart1(opt.value); setHusbandChart(opt.value); }}
                      style={[s.chip, chart1 === opt.value && s.chipHusband]}
                    >
                      <Text style={[s.chipText, chart1 === opt.value && s.chipTextHusband]}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[s.selectorSectionLabel, { marginTop: 16 }]}>👰 WIFE</Text>
                <View style={s.chipRow}>
                  {chartOptions.map(opt => (
                    <Pressable
                      key={opt.value}
                      onPress={() => setChart2(opt.value)}
                      disabled={opt.value === chart1}
                      style={[s.chip, chart2 === opt.value && s.chipWife, opt.value === chart1 && s.chipDisabled]}
                    >
                      <Text style={[s.chipText, chart2 === opt.value && s.chipTextWife]}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {error !== '' && <Text style={s.errorText}>{error}</Text>}

                <Pressable
                  onPress={handleAnalyze}
                  disabled={!canSubmit || loading}
                  style={[s.analyzeBtn, (!canSubmit || loading) && s.analyzeBtnDisabled]}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.analyzeBtnText}>Reveal Compatibility</Text>
                  }
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Results */}
        {result && !loading && (
          <View style={s.resultsWrap}>
            {/* Hero score */}
            <View style={[s.heroCard, { borderColor: accentColor + '33' }]}>
              <Text style={s.heroNames}>
                {result.husbandName || result.partner1.name}  💕  {result.wifeName || result.partner2.name}
              </Text>
              <View style={[s.scoreRing, { borderColor: accentColor }]}>
                <Text style={[s.scoreNumber, { color: accentColor }]}>{result.ashtakoota.totalScore}</Text>
                <Text style={s.scoreMax}>/ {result.ashtakoota.maxTotal}</Text>
              </View>
              <View style={[s.compatPill, { backgroundColor: accentColor + '22', borderColor: accentColor + '44' }]}>
                <Text style={[s.compatPillText, { color: accentColor }]}>
                  {result.ashtakoota.overallCompatibility.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </View>
              {result.aiAnalysis.storyOfThem && (
                <Text style={s.storyOfThem}>"{result.aiAnalysis.storyOfThem}"</Text>
              )}
              <View style={s.mangalRow}>
                <View style={s.mangalBadge}>
                  <Text style={s.mangalBadgeText}>
                    {result.husbandName || 'Husband'}: {result.ashtakoota.mangalMatch.boyManglik ? '🔴 Manglik' : '✅ Non-Manglik'}
                  </Text>
                </View>
                <View style={s.mangalBadge}>
                  <Text style={s.mangalBadgeText}>
                    {result.wifeName || 'Wife'}: {result.ashtakoota.mangalMatch.girlManglik ? '🔴 Manglik' : '✅ Non-Manglik'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Strengths */}
            {result.aiAnalysis.strengthAreas && result.aiAnalysis.strengthAreas.length > 0 && (
              <View style={s.strengthsCard}>
                <Text style={s.strengthsTitle}>✨ RELATIONSHIP STRENGTHS</Text>
                <View style={s.strengthsChips}>
                  {result.aiAnalysis.strengthAreas.map((st, i) => (
                    <View key={i} style={s.strengthChip}>
                      <Text style={s.strengthChipText}>{st}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Shared Forecast */}
            {forecasts.length > 0 && (
              <View>
                <Text style={s.sectionTitle}>🔭 YOUR STORY TOGETHER</Text>
                {forecasts.map((item, i) => (
                  <View key={i} style={s.forecastCard}>
                    <View style={s.forecastIconWrap}>
                      <Text style={s.forecastIcon}>{item.icon}</Text>
                    </View>
                    <View style={s.forecastBody}>
                      <Text style={s.forecastTimeframe}>{item.timeframe.toUpperCase()}</Text>
                      <Text style={s.forecastNarrative}>{item.narrative}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Compatibility Zones */}
            {result.aiAnalysis.compatibilityZones && (
              <View style={s.zonesCard}>
                <Text style={s.sectionTitle}>❤️ LIFE AREAS</Text>
                {([ ['Romance', '💑', result.aiAnalysis.compatibilityZones.romance], ['Career', '💼', result.aiAnalysis.compatibilityZones.career], ['Finances', '💰', result.aiAnalysis.compatibilityZones.finances], ['Family', '🏡', result.aiAnalysis.compatibilityZones.family] ] as [string, string, CompatZone | undefined][]).map(([label, icon, zone]) => {
                  if (!zone) return null;
                  const c = zone.score >= 8 ? '#22c55e' : zone.score >= 6 ? '#d4a843' : zone.score >= 4 ? '#f59e0b' : '#ef4444';
                  return (
                    <View key={label} style={s.zoneRow}>
                      <View style={s.zoneHeader}>
                        <Text style={s.zoneName}>{icon} {label}</Text>
                        <Text style={[s.zoneScore, { color: c }]}>{zone.score}/10</Text>
                      </View>
                      <View style={s.zoneBarBg}>
                        <View style={[s.zoneBarFill, { width: `${(zone.score / 10) * 100}%` as any, backgroundColor: c }]} />
                      </View>
                      <Text style={s.zoneAnalysis}>{zone.analysis}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Ashtakoota Breakdown */}
            <View style={s.kootaCard}>
              <Text style={s.kootaCardTitle}>🪐 ASHTAKOOTA HARMONY</Text>
              <Text style={s.kootaCardSub}>Tap any to see remedies</Text>
              {result.ashtakoota.scores.map(k => {
                const pct = k.maxScore > 0 ? k.score / k.maxScore : 0;
                const kColor = pct >= 0.75 ? '#22c55e' : pct >= 0.5 ? '#d4a843' : '#ef4444';
                const isOpen = expandedKoota === k.koota;
                const remedy = pct < 0.6 ? Object.entries(KOOTA_REMEDIES).find(([key]) => k.koota.toLowerCase().includes(key.toLowerCase()))?.[1] : null;
                return (
                  <View key={k.koota} style={s.kootaItem}>
                    <Pressable onPress={() => setExpandedKoota(isOpen ? null : k.koota)} style={s.kootaItemHeader}>
                      <View style={s.kootaItemLeft}>
                        <View style={s.kootaNameRow}>
                          <Text style={s.kootaItemName}>{k.koota}</Text>
                          <Text style={[s.kootaItemScore, { color: kColor }]}>{k.score}/{k.maxScore}</Text>
                        </View>
                        <View style={s.kootaItemBarBg}>
                          <View style={[s.kootaItemBarFill, { width: `${pct * 100}%` as any, backgroundColor: kColor }]} />
                        </View>
                      </View>
                      <Text style={s.kootaChevron}>{isOpen ? '▲' : '▼'}</Text>
                    </Pressable>
                    {isOpen && (
                      <View style={s.kootaExpanded}>
                        <Text style={s.kootaExpandedDesc}>{k.description || k.compatibility}</Text>
                        {remedy && (
                          <View style={s.remedyInline}>
                            <Text style={s.remedyInlineTitle}>🙏 Remedy</Text>
                            <Text style={s.remedyInlineText}>🪔 {remedy.ritual}</Text>
                            <Text style={s.remedyInlineText}>📿 {remedy.mantra}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Conflict Areas */}
            {result.aiAnalysis.conflictAreas && result.aiAnalysis.conflictAreas.length > 0 && (
              <View style={s.conflictCard}>
                <Text style={s.conflictTitle}>⚡ AREAS TO WATCH</Text>
                {result.aiAnalysis.conflictAreas.map((c, i) => (
                  <View key={i} style={s.conflictRow}>
                    <Text style={s.conflictSeverityIcon}>{c.severity === 'high' ? '🔴' : c.severity === 'medium' ? '🟡' : '🟢'}</Text>
                    <View style={s.conflictBody}>
                      <Text style={s.conflictArea}>{c.area}</Text>
                      <Text style={s.conflictDesc}>{c.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Shared Remedies */}
            {result.aiAnalysis.sharedRemedies && result.aiAnalysis.sharedRemedies.length > 0 && (
              <View style={s.sharedRemediesCard}>
                <Text style={s.sharedRemediesTitle}>🙏 SHARED REMEDIES</Text>
                {result.aiAnalysis.sharedRemedies.map((r, i) => (
                  <View key={i} style={s.sharedRemedyRow}>
                    <Text style={s.sharedRemedyBullet}>✦</Text>
                    <View style={s.sharedRemedyBody}>
                      <Text style={s.sharedRemedyName}>{r.remedy}</Text>
                      <Text style={s.sharedRemedyPurpose}>{r.purpose}</Text>
                      <View style={s.frequencyPill}><Text style={s.frequencyText}>{r.frequency}</Text></View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable onPress={() => setResult(null)} style={s.analyzeAgainBtn}>
              <Text style={s.analyzeAgainText}>← Analyze Another Couple</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010a' },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,1,10,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 60 },
  backText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  heroSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginBottom: 20, lineHeight: 21 },
  selectorCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, marginBottom: 16 },
  needMoreWrap: { alignItems: 'center', gap: 12 },
  needMoreText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center' },
  genBtn: { backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 },
  genBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  selectorSectionLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.5, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipHusband: { borderColor: 'rgba(212,168,67,0.5)', backgroundColor: 'rgba(212,168,67,0.25)' },
  chipWife: { borderColor: 'rgba(236,72,153,0.4)', backgroundColor: 'rgba(236,72,153,0.20)' },
  chipDisabled: { opacity: 0.3 },
  chipText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  chipTextHusband: { color: '#d4a843' },
  chipTextWife: { color: '#f472b6' },
  errorText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#f87171', marginTop: 10 },
  analyzeBtn: { marginTop: 18, backgroundColor: '#d4a843', borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  analyzeBtnDisabled: { opacity: 0.45 },
  analyzeBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  resultsWrap: { gap: 14 },
  heroCard: { borderRadius: 28, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)', padding: 28, alignItems: 'center', gap: 12 },
  heroNames: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#7a6a90', textAlign: 'center' },
  scoreRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  scoreNumber: { fontSize: 32, fontFamily: 'Poppins_700Bold' },
  scoreMax: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  compatPill: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 8 },
  compatPillText: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  storyOfThem: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center', fontStyle: 'italic', lineHeight: 21 },
  mangalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  mangalBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)' },
  mangalBadgeText: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  strengthsCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34,197,94,0.20)', backgroundColor: 'rgba(34,197,94,0.07)', padding: 16 },
  strengthsTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#22c55e', letterSpacing: 1.5, marginBottom: 10 },
  strengthsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  strengthChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' },
  strengthChipText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#4ade80' },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.5, marginBottom: 12 },
  forecastCard: { flexDirection: 'row', gap: 12, borderRadius: 20, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
  forecastIconWrap: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(212,168,67,0.12)', alignItems: 'center', justifyContent: 'center' },
  forecastIcon: { fontSize: 20 },
  forecastBody: { flex: 1 },
  forecastTimeframe: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#d4a843', marginBottom: 4 },
  forecastNarrative: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 20 },
  zonesCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 16 },
  zoneRow: { marginBottom: 16 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  zoneName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  zoneScore: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  zoneBarBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 6 },
  zoneBarFill: { height: '100%', borderRadius: 4 },
  zoneAnalysis: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 18 },
  kootaCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  kootaCardTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.5, padding: 16, paddingBottom: 4 },
  kootaCardSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', paddingHorizontal: 16, paddingBottom: 8 },
  kootaItem: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  kootaItemHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  kootaItemLeft: { flex: 1 },
  kootaNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  kootaItemName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  kootaItemScore: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  kootaItemBarBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  kootaItemBarFill: { height: '100%', borderRadius: 3 },
  kootaChevron: { fontSize: 10, color: '#7a6a90' },
  kootaExpanded: { paddingHorizontal: 14, paddingBottom: 14 },
  kootaExpandedDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21, marginBottom: 10 },
  remedyInline: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(212,168,67,0.20)', backgroundColor: 'rgba(212,168,67,0.07)', padding: 12, gap: 6 },
  remedyInlineTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#d4a843', marginBottom: 4 },
  remedyInlineText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 20 },
  conflictCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)', backgroundColor: 'rgba(239,68,68,0.06)', padding: 16 },
  conflictTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: 'rgba(239,68,68,0.8)', letterSpacing: 1.5, marginBottom: 12 },
  conflictRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  conflictSeverityIcon: { fontSize: 18 },
  conflictBody: { flex: 1 },
  conflictArea: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', marginBottom: 4 },
  conflictDesc: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 18 },
  sharedRemediesCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.18)', backgroundColor: 'rgba(212,168,67,0.06)', padding: 16 },
  sharedRemediesTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: 'rgba(212,168,67,0.8)', letterSpacing: 1.5, marginBottom: 12 },
  sharedRemedyRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sharedRemedyBullet: { fontSize: 18, color: '#d4a843' },
  sharedRemedyBody: { flex: 1 },
  sharedRemedyName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', marginBottom: 4 },
  sharedRemedyPurpose: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginBottom: 6 },
  frequencyPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(212,168,67,0.15)' },
  frequencyText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  analyzeAgainBtn: { borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 14, alignItems: 'center' },
  analyzeAgainText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
});
