import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { getBabyNames } from '@/lib/api';

interface BabyName {
  name: string;
  meaning: string;
  numerology: number;
  nakshatra: string;
}
interface BabyNamesData {
  nakshatra: string;
  nakshatraLord: string;
  suggestedLetters: string[];
  names: BabyName[];
  nakshatraDesc: string;
}

function NumerologyDot({ score }: { score: number }) {
  const color = score >= 7 ? '#22c55e' : score >= 4 ? '#eab308' : '#f87171';
  return (
    <View style={[nd.wrap, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={[nd.text, { color }]}>{score}</Text>
    </View>
  );
}
const nd = StyleSheet.create({
  wrap: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
});

export default function BabyNamesScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');

  const { data, isPending, mutate } = useMutation<BabyNamesData, Error, void>({
    mutationFn: async () => {
      const genderParam = gender === 'neutral' ? 'male' : gender;
      const res = await getBabyNames({ dob, gender: genderParam, count: 20, chartId: chartId || undefined });
      if (!res.success) throw new Error('Failed to fetch names');
      return res.data as BabyNamesData;
    },
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Baby Names</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={s.formCard}
        >
          <Text style={s.formTitle}>Find Nakshatra-Based Names</Text>
          <Text style={s.formDesc}>Enter the baby's birth details to find names aligned with their birth star.</Text>

          <Text style={s.fieldLabel}>Date of Birth</Text>
          <TextInput
            style={s.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#4a3a60"
            value={dob}
            onChangeText={setDob}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Gender</Text>
          <View style={s.genderRow}>
            {(['male', 'female', 'neutral'] as const).map(g => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={[s.genderChip, gender === g && s.genderChipActive]}
              >
                <Text style={s.genderEmoji}>{g === 'male' ? '👦' : g === 'female' ? '👧' : '🌟'}</Text>
                <Text style={[s.genderText, gender === g && s.genderTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {charts && charts.length > 0 && (
            <>
              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Parent's Chart (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
                <Pressable onPress={() => setChartId('')} style={[s.chip, !chartId && s.chipActive]}>
                  <Text style={[s.chipText, !chartId && s.chipTextActive]}>None</Text>
                </Pressable>
                {charts.map((c: any) => (
                  <Pressable key={c.id} onPress={() => setChartId(c.id)} style={[s.chip, chartId === c.id && s.chipActive]}>
                    <Text style={[s.chipText, chartId === c.id && s.chipTextActive]}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <Pressable
            onPress={() => mutate()}
            disabled={isPending || !dob}
            style={[s.findBtn, (!dob || isPending) && s.findBtnDisabled]}
          >
            {isPending ? (
              <ActivityIndicator color="#02010a" size="small" />
            ) : (
              <Text style={s.findBtnText}>👶 Find Names</Text>
            )}
          </Pressable>
        </MotiView>

        {isPending && (
          <View style={s.loadingWrap}>
            <ActivityIndicator color="#d4a843" size="large" />
            <Text style={s.loadingText}>Consulting the birth star…</Text>
          </View>
        )}

        {data && (
          <>
            {/* Nakshatra info */}
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 380 }}
              style={s.nakshatraCard}
            >
              <View style={s.nakshatraTop}>
                <View>
                  <Text style={s.nakshatraLabel}>BIRTH STAR</Text>
                  <Text style={s.nakshatraName}>{data.nakshatra}</Text>
                </View>
                <View style={s.lordPill}>
                  <Text style={s.lordText}>Lord: {data.nakshatraLord}</Text>
                </View>
              </View>
              <Text style={s.nakshatraDesc}>{data.nakshatraDesc}</Text>
              {data.suggestedLetters?.length > 0 && (
                <View style={s.lettersRow}>
                  <Text style={s.lettersLabel}>Suggested starting letters: </Text>
                  <Text style={s.lettersValue}>{data.suggestedLetters.join(' · ')}</Text>
                </View>
              )}
            </MotiView>

            {/* Names grid */}
            <Text style={s.sectionLabel}>{data.names?.length ?? 0} NAMES FOUND</Text>
            <View style={s.namesGrid}>
              {data.names?.map((n, i) => (
                <MotiView
                  key={i}
                  from={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: 260, delay: i * 30 }}
                  style={s.nameCard}
                >
                  <View style={s.nameTop}>
                    <Text style={s.nameText}>{n.name}</Text>
                    <NumerologyDot score={n.numerology} />
                  </View>
                  <Text style={s.nameMeaning} numberOfLines={2}>{n.meaning}</Text>
                </MotiView>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20,
  },
  formTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 6 },
  formDesc: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 19, marginBottom: 18 },
  fieldLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', letterSpacing: 0.8, marginBottom: 8 },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    fontFamily: 'Poppins_400Regular', color: '#7a6a90',
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  genderChipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  genderEmoji: { fontSize: 18 },
  genderText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  genderTextActive: { color: '#d4a843' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  chipText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  chipTextActive: { color: '#d4a843' },
  findBtn: {
    backgroundColor: '#d4a843', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  findBtnDisabled: { opacity: 0.45 },
  findBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  loadingWrap: { paddingTop: 40, alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  nakshatraCard: {
    backgroundColor: 'rgba(212,168,67,0.07)', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)', marginBottom: 20, gap: 10,
  },
  nakshatraTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nakshatraLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', letterSpacing: 1.2, marginBottom: 4 },
  nakshatraName: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  lordPill: {
    backgroundColor: 'rgba(212,168,67,0.15)', borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5,
  },
  lordText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  nakshatraDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 20 },
  lettersRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  lettersLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  lettersValue: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 12 },
  namesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nameCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, gap: 6,
  },
  nameTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#7a6a90', flex: 1 },
  nameMeaning: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 17 },
});
