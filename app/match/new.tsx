import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { calculateMatch, lookupPincode, type MatchPersonPayload } from '@/lib/api';

type MatchSystem = 'ashtakoota' | 'dashakoota';

interface PersonForm {
  name: string;
  dob: string;
  tob: string;
  pincode: string;
  pob: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: 'male' | 'female';
  pobReady: boolean;
}

interface KootaScore { name: string; obtained: number; max: number; description: string }
interface MatchResult {
  totalScore: number;
  maxScore: number;
  verdict: string;
  verdictColor: string;
  kootas: KootaScore[];
  narrative: string;
  remedies: string[];
  mangalText: string;
}

function emptyPerson(gender: 'male' | 'female'): PersonForm {
  return { name: '', dob: '', tob: '', pincode: '', pob: '', latitude: 0, longitude: 0, timezone: 'Asia/Kolkata', gender, pobReady: false };
}

function verdictColor(v: string) {
  const low = v.toLowerCase();
  if (low.includes('excellent')) return '#22c55e';
  if (low.includes('good')) return '#d4a843';
  if (low.includes('average')) return '#f59e0b';
  return '#ef4444';
}

function PersonCard({
  title, emoji, person, onChange,
  onPincodeBlur,
}: {
  title: string;
  emoji: string;
  person: PersonForm;
  onChange: (p: PersonForm) => void;
  onPincodeBlur: () => void;
}) {
  return (
    <View style={f.card}>
      <View style={f.cardHeader}>
        <Text style={f.cardHeaderText}>{emoji} {title}</Text>
      </View>
      <View style={f.cardBody}>
        <Text style={f.label}>Full Name</Text>
        <TextInput style={f.input} placeholder="Enter name" placeholderTextColor="#4a3a60" value={person.name} onChangeText={v => onChange({ ...person, name: v })} />

        <Text style={f.label}>Date of Birth (YYYY-MM-DD)</Text>
        <TextInput style={f.input} placeholder="e.g. 1995-06-20" placeholderTextColor="#4a3a60" value={person.dob} onChangeText={v => onChange({ ...person, dob: v })} keyboardType="numbers-and-punctuation" />

        <Text style={f.label}>Time of Birth (HH:MM)</Text>
        <TextInput style={f.input} placeholder="e.g. 10:30" placeholderTextColor="#4a3a60" value={person.tob} onChangeText={v => onChange({ ...person, tob: v })} keyboardType="numbers-and-punctuation" />

        <Text style={f.label}>Birth City Pincode (6-digit)</Text>
        <View style={f.pincodeRow}>
          <TextInput
            style={[f.input, { flex: 1 }]}
            placeholder="Enter 6-digit pincode"
            placeholderTextColor="#4a3a60"
            value={person.pincode}
            onChangeText={v => onChange({ ...person, pincode: v, pobReady: false })}
            onBlur={onPincodeBlur}
            keyboardType="numeric"
            maxLength={6}
          />
          {person.pobReady && (
            <View style={f.pobReadyBadge}>
              <Text style={f.pobReadyText}>✓</Text>
            </View>
          )}
        </View>
        {person.pob !== '' && (
          <Text style={f.pobText}>{person.pob}</Text>
        )}

        <Text style={f.label}>Gender</Text>
        <View style={f.genderRow}>
          {(['male', 'female'] as const).map(g => (
            <Pressable
              key={g}
              onPress={() => onChange({ ...person, gender: g })}
              style={[f.genderBtn, person.gender === g && f.genderBtnActive]}
            >
              <Text style={[f.genderBtnText, person.gender === g && f.genderBtnTextActive]}>
                {g === 'male' ? '♂ Male' : '♀ Female'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function MatchNewScreen() {
  const router = useRouter();
  const [system, setSystem] = useState<MatchSystem>('ashtakoota');
  const [boy, setBoy] = useState<PersonForm>(emptyPerson('male'));
  const [girl, setGirl] = useState<PersonForm>(emptyPerson('female'));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');

  const canSubmit = boy.name && boy.dob && boy.tob && boy.pobReady && girl.name && girl.dob && girl.tob && girl.pobReady;

  async function lookupPob(person: PersonForm, setPerson: (p: PersonForm) => void) {
    if (!/^\d{6}$/.test(person.pincode.trim())) return;
    try {
      const res = await lookupPincode(person.pincode.trim());
      const d = res.data;
      setPerson({ ...person, pob: `${d.city}, ${d.state}`, latitude: d.latitude, longitude: d.longitude, timezone: d.timezone, pobReady: true });
    } catch { /* user will retry */ }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const profile1: MatchPersonPayload = { name: boy.name, dob: boy.dob, tob: boy.tob, pob: boy.pob, latitude: boy.latitude, longitude: boy.longitude, timezone: boy.timezone, gender: boy.gender };
      const profile2: MatchPersonPayload = { name: girl.name, dob: girl.dob, tob: girl.tob, pob: girl.pob, latitude: girl.latitude, longitude: girl.longitude, timezone: girl.timezone, gender: girl.gender };
      const res = await calculateMatch({ profile1, profile2, system });
      const raw = res.data;
      const verdictRaw = raw.detailedAnalysis?.overallVerdict ?? '';
      const verdict = verdictRaw.toLowerCase().includes('excellent') ? 'Excellent'
        : verdictRaw.toLowerCase().includes('good') ? 'Good'
        : verdictRaw.toLowerCase().includes('average') ? 'Average'
        : verdictRaw.toLowerCase().includes('poor') ? 'Poor'
        : raw.totalScore >= 28 ? 'Excellent' : raw.totalScore >= 18 ? 'Good' : raw.totalScore >= 10 ? 'Average' : 'Poor';
      const kootas: KootaScore[] = Object.entries(raw.scores ?? {}).map(([name, val]) => ({
        name,
        obtained: typeof val === 'object' && val !== null ? (val.obtained ?? 0) : 0,
        max: typeof val === 'object' && val !== null ? (val.max ?? 0) : 0,
        description: typeof val === 'object' && val !== null ? (val.description ?? '') : '',
      }));
      setResult({
        totalScore: raw.totalScore,
        maxScore: raw.maxScore,
        verdict,
        verdictColor: verdictColor(verdict),
        kootas,
        narrative: raw.detailedAnalysis?.summaryNarrative ?? '',
        remedies: raw.detailedAnalysis?.remediesIfNeeded ?? [],
        mangalText: raw.detailedAnalysis?.mangalDoshaAnalysis ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Kundli Matching</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.heroSub}>Check compatibility using traditional Vedic matching systems</Text>

        {/* System selector */}
        {!result && (
          <>
            <View style={s.sysCard}>
              <Text style={s.sysLabel}>Matching System</Text>
              <View style={s.sysRow}>
                {([
                  { id: 'ashtakoota', label: 'Ashtakoota', sub: '36 Gun Milan (North)' },
                  { id: 'dashakoota', label: 'Dashakoota', sub: '10 Porutham (South)' },
                ] as const).map(sys => (
                  <Pressable
                    key={sys.id}
                    onPress={() => setSystem(sys.id)}
                    style={[s.sysBtn, system === sys.id && s.sysBtnActive]}
                  >
                    <Text style={[s.sysBtnLabel, system === sys.id && s.sysBtnLabelActive]}>{sys.label}</Text>
                    <Text style={s.sysBtnSub}>{sys.sub}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <PersonCard title="Husband's Details" emoji="🤵" person={boy} onChange={setBoy} onPincodeBlur={() => lookupPob(boy, setBoy)} />
            <PersonCard title="Wife's Details" emoji="👰" person={girl} onChange={setGirl} onPincodeBlur={() => lookupPob(girl, setGirl)} />

            {error !== '' && <Text style={s.errorText}>{error}</Text>}

            <Pressable onPress={handleSubmit} disabled={!canSubmit || loading} style={[s.submitBtn, (!canSubmit || loading) && s.submitBtnDisabled]}>
              {loading
                ? <ActivityIndicator color="#02010a" />
                : <Text style={s.submitBtnText}>Check Compatibility</Text>
              }
            </Pressable>
          </>
        )}

        {/* Results */}
        {result && (
          <View style={s.resultsWrap}>
            {/* Score overview */}
            <View style={[s.scoreCard, { borderColor: result.verdictColor + '44' }]}>
              <View style={[s.scoreRing, { borderColor: result.verdictColor }]}>
                <Text style={[s.scoreNumber, { color: result.verdictColor }]}>{result.totalScore}</Text>
                <Text style={s.scoreMax}>/ {result.maxScore}</Text>
              </View>
              <View style={[s.verdictPill, { backgroundColor: result.verdictColor + '22', borderColor: result.verdictColor + '44' }]}>
                <Text style={[s.verdictText, { color: result.verdictColor }]}>{result.verdict}</Text>
              </View>
              <Text style={s.coupleNames}>{boy.name} & {girl.name}</Text>
            </View>

            {/* Koota bars */}
            <View style={s.kootaCard}>
              <Text style={s.kootaTitle}>Koota-wise Scores</Text>
              {result.kootas.map(k => {
                const pct = k.max > 0 ? k.obtained / k.max : 0;
                const barColor = pct >= 0.75 ? '#22c55e' : pct >= 0.5 ? '#d4a843' : '#ef4444';
                return (
                  <View key={k.name} style={s.kootaRow}>
                    <View style={s.kootaHeader}>
                      <Text style={s.kootaName}>{k.name}</Text>
                      <Text style={[s.kootaScore, { color: barColor }]}>{k.obtained}/{k.max}</Text>
                    </View>
                    <View style={s.kootaBarBg}>
                      <View style={[s.kootaBarFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
                    </View>
                    {k.description !== '' && <Text style={s.kootaDesc}>{k.description}</Text>}
                  </View>
                );
              })}
            </View>

            {/* Mangal Dosha */}
            {result.mangalText !== '' && (
              <View style={s.mangalCard}>
                <Text style={s.mangalTitle}>Mangal Dosha Analysis</Text>
                <Text style={s.mangalText}>{result.mangalText}</Text>
              </View>
            )}

            {/* Narrative */}
            {result.narrative !== '' && (
              <View style={s.narrativeCard}>
                <Text style={s.narrativeTitle}>Detailed Analysis</Text>
                <Text style={s.narrativeText}>{result.narrative}</Text>
              </View>
            )}

            {/* Remedies */}
            {result.remedies.length > 0 && (
              <View style={s.remediesCard}>
                <Text style={s.remediesTitle}>🙏 Suggested Remedies</Text>
                {result.remedies.map((r, i) => (
                  <View key={i} style={s.remedyRow}>
                    <Text style={s.remedyBullet}>✦</Text>
                    <Text style={s.remedyText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable onPress={() => setResult(null)} style={s.analyzeAgainBtn}>
              <Text style={s.analyzeAgainText}>← Check Another Couple</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const f = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.16)', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 16, overflow: 'hidden' },
  cardHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(212,168,67,0.12)' },
  cardHeaderText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  cardBody: { padding: 16 },
  label: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90', backgroundColor: 'rgba(255,255,255,0.04)' },
  pincodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pobReadyBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  pobReadyText: { fontSize: 14, color: '#22c55e', fontFamily: 'Poppins_700Bold' },
  pobText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#22c55e', marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  genderBtnActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  genderBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  genderBtnTextActive: { color: '#d4a843' },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010a' },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,1,10,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 60 },
  backText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  heroSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginBottom: 20, lineHeight: 21 },
  sysCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.16)', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, marginBottom: 16 },
  sysLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1, marginBottom: 12 },
  sysRow: { flexDirection: 'row', gap: 10 },
  sysBtn: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, alignItems: 'center' },
  sysBtnActive: { borderColor: 'rgba(212,168,67,0.45)', backgroundColor: 'rgba(212,168,67,0.15)' },
  sysBtnLabel: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  sysBtnLabelActive: { color: '#d4a843' },
  sysBtnSub: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginTop: 2, textAlign: 'center' },
  errorText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#f87171', marginBottom: 12 },
  submitBtn: { backgroundColor: '#d4a843', borderRadius: 20, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  resultsWrap: { gap: 14 },
  scoreCard: { borderRadius: 24, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)', padding: 28, alignItems: 'center', gap: 12 },
  scoreRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  scoreNumber: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  scoreMax: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  verdictPill: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 8 },
  verdictText: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  coupleNames: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  kootaCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.16)', backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  kootaTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#7a6a90', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(212,168,67,0.12)' },
  kootaRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  kootaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  kootaName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  kootaScore: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  kootaBarBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  kootaBarFill: { height: '100%', borderRadius: 4 },
  kootaDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginTop: 6, lineHeight: 18 },
  mangalCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 16 },
  mangalTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 8 },
  mangalText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21 },
  narrativeCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.16)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 16 },
  narrativeTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 8 },
  narrativeText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 22 },
  remediesCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)', backgroundColor: 'rgba(212,168,67,0.05)', padding: 16 },
  remediesTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#d4a843', marginBottom: 12 },
  remedyRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  remedyBullet: { fontSize: 12, color: '#d4a843', marginTop: 2 },
  remedyText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21 },
  analyzeAgainBtn: { borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 14, alignItems: 'center' },
  analyzeAgainText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
});
