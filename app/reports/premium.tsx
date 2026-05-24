import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
  StyleSheet, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { generateReport, getReportStatus, generateNumerologyReport, getNumerologyReportStatus } from '@/lib/api';

const REPORT_TIERS = [
  {
    id: 'basic',
    label: 'Basic Report',
    pages: 15,
    features: ['Birth chart (Lagna, Rashi, Navamsa)', 'Planetary positions & aspects', 'Basic Dasha analysis', 'General personality overview', 'Lucky numbers, colors & gemstones'],
  },
  {
    id: 'standard',
    label: 'Standard Report',
    pages: 50,
    popular: true,
    features: ['Everything in Basic', 'Detailed 10-year Dasha', 'Career analysis & yogas', 'Marriage & compatibility', 'Financial outlook', 'Transit analysis'],
  },
  {
    id: 'premium',
    label: 'Premium Report',
    pages: 100,
    features: ['Everything in Standard', 'Full lifetime Dasha', 'KP system analysis', 'D1–D60 divisional charts', 'Ashtakavarga', '5-year predictions', 'Remedies & mantras', 'AI narrative'],
  },
];

const MARITAL_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

const CONCERN_OPTIONS = [
  { value: 'career', label: 'Career & Profession' },
  { value: 'marriage', label: 'Marriage & Relationships' },
  { value: 'wealth', label: 'Wealth & Finance' },
  { value: 'health', label: 'Health & Wellbeing' },
  { value: 'spiritual', label: 'Spiritual Growth' },
  { value: 'overall', label: 'Overall Life Guidance' },
];

type Tab = 'kundli' | 'numerology';
type Status = 'idle' | 'generating' | 'ready' | 'error';

export default function PremiumReportsScreen() {
  const router = useRouter();
  const charts = useStore(s => s.charts);
  const profiles = useStore(s => s.profiles);
  const [tab, setTab] = useState<Tab>('kundli');

  // Kundli state
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedChart, setSelectedChart] = useState('');
  const [kundliStatus, setKundliStatus] = useState<Status>('idle');
  const [kundliProgress, setKundliProgress] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [kundliError, setKundliError] = useState('');
  const kundliPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Numerology state
  const [numName, setNumName] = useState('');
  const [numDob, setNumDob] = useState('');
  const [numGender, setNumGender] = useState<'male' | 'female'>('male');
  const [numMarital, setNumMarital] = useState('single');
  const [numConcern, setNumConcern] = useState('career');
  const [numOccupation, setNumOccupation] = useState('');
  const [numStatus, setNumStatus] = useState<Status>('idle');
  const [numDownloadUrl, setNumDownloadUrl] = useState('');
  const [numError, setNumError] = useState('');
  const numPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chartOptions = charts.map(c => {
    const p = profiles.find(pr => pr.id === c.profile_id);
    return { value: c.id, label: p ? `${p.name}` : `Chart ${c.id.slice(0, 6)}` };
  });

  async function handleKundliGenerate() {
    if (!selectedTier || !selectedChart) {
      setKundliError('Please select a report type and a birth chart.');
      return;
    }
    setKundliStatus('generating');
    setKundliError('');
    setKundliProgress('Starting…');
    try {
      const res = await generateReport({ tier: selectedTier, chartId: selectedChart });
      const reportId = res.data?.report_id;
      if (!reportId) throw new Error('No report ID returned');
      if (kundliPollRef.current) clearInterval(kundliPollRef.current);
      kundliPollRef.current = setInterval(async () => {
        try {
          const statusRes = await getReportStatus(reportId);
          if (statusRes.data.progress) setKundliProgress(statusRes.data.progress);
          if (statusRes.data.status === 'ready' && statusRes.data.download_url) {
            clearInterval(kundliPollRef.current!);
            setKundliStatus('ready');
            setDownloadUrl(statusRes.data.download_url);
          } else if (statusRes.data.status === 'error') {
            clearInterval(kundliPollRef.current!);
            setKundliStatus('error');
            setKundliError('Report generation failed. Please try again.');
          }
        } catch { /* continue polling */ }
      }, 15_000);
    } catch (e) {
      setKundliStatus('error');
      setKundliError(e instanceof Error ? e.message : 'Failed to generate report.');
    }
  }

  async function handleNumGenerate() {
    if (!numName.trim() || !numDob) {
      setNumError('Please enter name and date of birth.');
      return;
    }
    setNumStatus('generating');
    setNumError('');
    try {
      const res = await generateNumerologyReport({
        name: numName.trim(), dob: numDob, gender: numGender,
        maritalStatus: numMarital, concern: numConcern,
        occupation: numOccupation.trim() || undefined,
      });
      const reportId = res.data?.report_id;
      if (!reportId) throw new Error('No report ID');
      if (numPollRef.current) clearInterval(numPollRef.current);
      numPollRef.current = setInterval(async () => {
        try {
          const sData = await getNumerologyReportStatus(reportId);
          if (sData.data.status === 'ready' && sData.data.download_url) {
            clearInterval(numPollRef.current!);
            setNumStatus('ready');
            setNumDownloadUrl(sData.data.download_url);
          } else if (sData.data.status === 'error') {
            clearInterval(numPollRef.current!);
            setNumStatus('error');
            setNumError('Report generation failed. Please try again.');
          }
        } catch { /* continue polling */ }
      }, 10_000);
    } catch (e) {
      setNumStatus('error');
      setNumError(e instanceof Error ? e.message : 'Failed to generate report.');
    }
  }

  const selectedTierData = REPORT_TIERS.find(t => t.id === selectedTier);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Premium Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tab bar */}
        <View style={s.tabBar}>
          {(['kundli', 'numerology'] as Tab[]).map(t => (
            <Pressable key={t} onPress={() => setTab(t)} style={[s.tabBtn, tab === t && s.tabBtnActive]}>
              <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
                {t === 'kundli' ? 'Kundli Reports' : 'Numerology Report'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── KUNDLI TAB ── */}
        {tab === 'kundli' && (
          <>
            {kundliStatus === 'idle' && (
              <>
                {/* Tier cards */}
                <Text style={s.sectionLabel}>Select Report Type</Text>
                {REPORT_TIERS.map(tier => (
                  <Pressable
                    key={tier.id}
                    onPress={() => setSelectedTier(tier.id)}
                    style={[s.tierCard, selectedTier === tier.id && s.tierCardSelected]}
                  >
                    {tier.popular && (
                      <View style={s.popularBadge}><Text style={s.popularBadgeText}>Most Popular</Text></View>
                    )}
                    <View style={s.tierHeader}>
                      <Text style={s.tierLabel}>{tier.label}</Text>
                      <View style={s.tierPagesBadge}><Text style={s.tierPagesText}>{tier.pages} pages</Text></View>
                    </View>
                    <Text style={s.tierFreeLabel}>Free</Text>
                    {tier.features.map((f, i) => (
                      <View key={i} style={s.featureRow}>
                        <Text style={s.featurePlus}>+</Text>
                        <Text style={s.featureText}>{f}</Text>
                      </View>
                    ))}
                    <View style={[s.selectBtn, selectedTier === tier.id && s.selectBtnActive]}>
                      <Text style={[s.selectBtnText, selectedTier === tier.id && s.selectBtnTextActive]}>
                        {selectedTier === tier.id ? '✓ Selected' : 'Select'}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                {/* Chart selector */}
                <Text style={[s.sectionLabel, { marginTop: 20 }]}>Select Birth Chart</Text>
                {chartOptions.length === 0 ? (
                  <View style={s.emptyCard}>
                    <Text style={s.emptyText}>No charts found. </Text>
                    <Pressable onPress={() => router.push('/kundli/generate')}>
                      <Text style={s.linkText}>Generate a Kundli first →</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={s.chartChips}>
                    {chartOptions.map(opt => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setSelectedChart(opt.value)}
                        style={[s.chartChip, selectedChart === opt.value && s.chartChipSelected]}
                      >
                        <Text style={[s.chartChipText, selectedChart === opt.value && s.chartChipTextSelected]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Summary */}
                {selectedTierData && selectedChart && (
                  <View style={s.summaryCard}>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryKey}>Report Type</Text>
                      <Text style={s.summaryVal}>{selectedTierData.label}</Text>
                    </View>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryKey}>Pages</Text>
                      <Text style={s.summaryVal}>{selectedTierData.pages}</Text>
                    </View>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryKey}>Price</Text>
                      <Text style={[s.summaryVal, { color: '#d4a843' }]}>Free</Text>
                    </View>
                  </View>
                )}

                {kundliError !== '' && <Text style={s.errorText}>{kundliError}</Text>}

                <Pressable
                  onPress={handleKundliGenerate}
                  disabled={!selectedTier || !selectedChart || chartOptions.length === 0}
                  style={[s.generateBtn, (!selectedTier || !selectedChart) && s.generateBtnDisabled]}
                >
                  <Text style={s.generateBtnText}>
                    Generate {selectedTierData ? `— ${selectedTierData.label}` : 'Report'}
                  </Text>
                </Pressable>
              </>
            )}

            {kundliStatus === 'generating' && (
              <View style={s.generatingCard}>
                <ActivityIndicator color="#d4a843" size="large" />
                <Text style={s.generatingTitle}>Generating your Kundli report…</Text>
                <Text style={s.generatingDesc}>
                  AI is analyzing your birth chart across 7 sections. This takes 30–60 minutes.
                </Text>
                {kundliProgress !== '' && <Text style={s.progressText}>{kundliProgress}</Text>}
                <Text style={s.notifyHint}>You can close this page — you'll be notified when it's ready.</Text>
              </View>
            )}

            {kundliStatus === 'error' && (
              <View style={s.errorCard}>
                <Text style={s.readyEmoji}>❌</Text>
                <Text style={s.errorCardText}>{kundliError}</Text>
                <Pressable
                  onPress={() => { setKundliStatus('idle'); setKundliError(''); setKundliProgress(''); }}
                  style={s.retryBtn}
                >
                  <Text style={s.retryBtnText}>Try Again</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* ── NUMEROLOGY TAB ── */}
        {tab === 'numerology' && (
          <>
            {(numStatus === 'idle' || numStatus === 'error') && (
              <>
                <View style={s.formCard}>
                  <Text style={s.formTitle}>Generate Numerology Report</Text>
                  <Text style={s.formDesc}>
                    10-section Vedic numerology PDF: Mulank, Bhagyank, Lo Shu Grid, 12-month forecast, remedies & more.
                  </Text>

                  <Text style={s.fieldLabel}>Full Name (as per birth)</Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="e.g. Rahul Kumar Sharma"
                    placeholderTextColor="#4a3a60"
                    value={numName}
                    onChangeText={setNumName}
                  />

                  <Text style={s.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="e.g. 1990-04-15"
                    placeholderTextColor="#4a3a60"
                    value={numDob}
                    onChangeText={setNumDob}
                    keyboardType="numbers-and-punctuation"
                  />

                  <Text style={s.fieldLabel}>Gender</Text>
                  <View style={s.optionRow}>
                    {(['male', 'female'] as const).map(g => (
                      <Pressable
                        key={g}
                        onPress={() => setNumGender(g)}
                        style={[s.optionBtn, numGender === g && s.optionBtnActive]}
                      >
                        <Text style={[s.optionBtnText, numGender === g && s.optionBtnTextActive]}>
                          {g === 'male' ? '♂ Male' : '♀ Female'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={s.fieldLabel}>Occupation (optional)</Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="e.g. Software Engineer"
                    placeholderTextColor="#4a3a60"
                    value={numOccupation}
                    onChangeText={setNumOccupation}
                  />

                  <Text style={s.fieldLabel}>Marital Status</Text>
                  <View style={s.optionRow}>
                    {MARITAL_OPTIONS.map(opt => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setNumMarital(opt.value)}
                        style={[s.optionBtnSm, numMarital === opt.value && s.optionBtnActive]}
                      >
                        <Text style={[s.optionBtnTextSm, numMarital === opt.value && s.optionBtnTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={s.fieldLabel}>Primary Life Concern</Text>
                  <View style={s.optionCol}>
                    {CONCERN_OPTIONS.map(opt => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setNumConcern(opt.value)}
                        style={[s.concernBtn, numConcern === opt.value && s.concernBtnActive]}
                      >
                        <Text style={[s.concernBtnText, numConcern === opt.value && s.concernBtnTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {numError !== '' && <Text style={s.errorText}>{numError}</Text>}

                  <Pressable
                    onPress={handleNumGenerate}
                    disabled={!numName.trim() || !numDob}
                    style={[s.generateBtn, (!numName.trim() || !numDob) && s.generateBtnDisabled]}
                  >
                    <Text style={s.generateBtnText}>Generate Numerology PDF</Text>
                  </Pressable>
                </View>

                {/* What's included */}
                <View style={s.includedCard}>
                  <Text style={s.includedTitle}>What's Included</Text>
                  {[
                    'Mulank (Psychic) & Bhagyank (Destiny) analysis',
                    'Kua Number with Feng Shui lucky directions',
                    'Lo Shu Fortune Grid — missing number analysis',
                    'Compatibility matrix — friendship, business & romance',
                    '12-Month personal forecast with themes & advice',
                    'Sanskrit mantras for career, health & marriage',
                    'Missing number Vastu & Feng Shui remedies',
                  ].map((f, i) => (
                    <View key={i} style={s.includedRow}>
                      <Text style={s.includedBullet}>✦</Text>
                      <Text style={s.includedText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {numStatus === 'generating' && (
              <View style={s.generatingCard}>
                <ActivityIndicator color="#d4a843" size="large" />
                <Text style={s.generatingTitle}>Generating your Numerology Report…</Text>
                <Text style={s.generatingDesc}>
                  AI is analysing your numbers across 10 sections. Usually takes 1-3 minutes.
                </Text>
                <Text style={s.notifyHint}>You can safely close this page — you'll be notified when it's ready.</Text>
              </View>
            )}

            {numStatus === 'ready' && (
              <View style={s.readyCard}>
                <Text style={s.readyEmoji}>✨</Text>
                <Text style={s.readyTitle}>Your Numerology Report is Ready!</Text>
                <Text style={s.readyDesc}>Your comprehensive 10-section Vedic numerology report has been generated.</Text>
                {numDownloadUrl !== '' && (
                  <Pressable onPress={() => Linking.openURL(numDownloadUrl)} style={s.downloadBtn}>
                    <Text style={s.downloadBtnText}>⬇ Download PDF</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => { setNumStatus('idle'); setNumName(''); setNumDob(''); setNumDownloadUrl(''); setNumError(''); }}
                  style={s.anotherBtn}
                >
                  <Text style={s.anotherBtnText}>Generate Another Report</Text>
                </Pressable>
              </View>
            )}

            {numStatus === 'error' && (
              <View style={s.errorCard}>
                <Text style={s.readyEmoji}>❌</Text>
                <Text style={s.errorCardText}>{numError}</Text>
                <Pressable onPress={() => { setNumStatus('idle'); setNumError(''); }} style={s.retryBtn}>
                  <Text style={s.retryBtnText}>Try Again</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  tabBar: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.20)', backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 4, marginBottom: 20, gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#d4a843' },
  tabBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  tabBtnTextActive: { color: '#02010a' },
  sectionLabel: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1, marginBottom: 12 },
  tierCard: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, marginBottom: 14,
  },
  tierCardSelected: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.06)' },
  popularBadge: {
    alignSelf: 'flex-start', backgroundColor: '#d4a843', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10,
  },
  popularBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  tierLabel: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  tierPagesBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tierPagesText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  tierFreeLabel: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#d4a843', marginBottom: 12 },
  featureRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  featurePlus: { fontSize: 13, color: '#22c55e', marginTop: 2 },
  featureText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 20 },
  selectBtn: {
    marginTop: 14, borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    backgroundColor: 'rgba(212,168,67,0.08)',
  },
  selectBtnActive: { backgroundColor: '#d4a843', borderColor: '#d4a843' },
  selectBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  selectBtnTextActive: { color: '#02010a' },
  chartChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chartChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chartChipSelected: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  chartChipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  chartChipTextSelected: { color: '#d4a843' },
  emptyCard: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,168,67,0.20)',
    backgroundColor: 'rgba(212,168,67,0.05)', padding: 16, marginBottom: 16,
  },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  linkText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', marginTop: 4 },
  summaryCard: {
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: 16, marginBottom: 16, gap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  summaryVal: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  generateBtn: {
    backgroundColor: '#d4a843', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  generateBtnDisabled: { opacity: 0.45 },
  generateBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  errorText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#f87171', marginBottom: 8 },
  generatingCard: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.20)',
    backgroundColor: 'rgba(212,168,67,0.05)', padding: 32,
    alignItems: 'center', gap: 12, marginTop: 8,
  },
  generatingTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90', textAlign: 'center' },
  generatingDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center', lineHeight: 21 },
  progressText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', textAlign: 'center' },
  notifyHint: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(120,106,144,0.7)', textAlign: 'center' },
  readyCard: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)',
    backgroundColor: 'rgba(212,168,67,0.06)', padding: 32, alignItems: 'center', gap: 12, marginTop: 8,
  },
  readyEmoji: { fontSize: 52 },
  readyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#7a6a90', textAlign: 'center' },
  readyDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center', lineHeight: 21 },
  downloadBtn: { backgroundColor: '#d4a843', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 },
  downloadBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  anotherBtn: { borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 28 },
  anotherBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  errorCard: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
    backgroundColor: 'rgba(248,113,113,0.05)', padding: 32, alignItems: 'center', gap: 12, marginTop: 8,
  },
  errorCardText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#f87171', textAlign: 'center' },
  retryBtn: { backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  // Numerology form
  formCard: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 6 },
  formDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', marginBottom: 6, marginTop: 12 },
  textInput: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  optionBtnSm: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  optionBtnActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  optionBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  optionBtnTextSm: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  optionBtnTextActive: { color: '#d4a843' },
  optionCol: { gap: 8 },
  concernBtn: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  concernBtnActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  concernBtnText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  concernBtnTextActive: { color: '#d4a843', fontFamily: 'Poppins_600SemiBold' },
  includedCard: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, marginBottom: 16,
  },
  includedTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 12 },
  includedRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  includedBullet: { fontSize: 12, color: '#d4a843', marginTop: 2 },
  includedText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 20 },
});
