import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { interpretDream } from '@/lib/api';

interface DreamSymbol {
  symbol: string;
  vedic_meaning: string;
  psychological_meaning: string;
}
interface DreamResult {
  auspiciousness: 'auspicious' | 'inauspicious' | 'neutral';
  overall_interpretation: string;
  astrological_connection: string;
  symbols: DreamSymbol[];
  remedies: string[];
  lucky_numbers: number[];
}

const AUSP_CONFIG: Record<string, { color: string; bg: string; emoji: string; label: string }> = {
  auspicious:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  emoji: '✨', label: 'Auspicious' },
  inauspicious: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', emoji: '⚠️', label: 'Inauspicious' },
  neutral:      { color: '#d4a843', bg: 'rgba(212,168,67,0.1)',  emoji: '⚖️', label: 'Neutral' },
};

const SYMBOL_EMOJIS = ['🔮', '🌙', '🌊', '🐍', '🦅', '🌳', '🔥', '⭐'];

export default function DreamsScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');
  const [dreamText, setDreamText] = useState('');

  const { data, isPending, mutate, reset } = useMutation<DreamResult, Error, { text: string; chartId: string }>({
    mutationFn: async ({ text, chartId: cid }) => {
      const res = await interpretDream(text, cid || undefined);
      if (!res.success) throw new Error('Interpretation failed');
      return res.data as DreamResult;
    },
  });

  const cfg = data ? (AUSP_CONFIG[data.auspiciousness] ?? AUSP_CONFIG.neutral) : null;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>🌙 Dream Analysis</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── INPUT ── */}
        {!data && !isPending && (
          <>
            <MotiView from={{ opacity: 0, translateY: -6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 350 }} style={s.introCard}>
              <Text style={s.introText}>
                🕉️ Describe your dream in detail. Swapna Shastra — the ancient Vedic science of dreams — will reveal what the cosmos is telling you.
              </Text>
            </MotiView>

            {charts && charts.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
                {charts.map((c: any) => (
                  <Pressable key={c.id} onPress={() => setChartId(c.id)} style={[s.chip, chartId === c.id && s.chipActive]}>
                    <Text style={[s.chipText, chartId === c.id && s.chipTextActive]}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Text style={s.sectionLabel}>✍️ DESCRIBE YOUR DREAM</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="I saw a snake chasing my friend, it bit him on the nose…"
                placeholderTextColor="#4a3a60"
                multiline
                value={dreamText}
                onChangeText={setDreamText}
                maxLength={600}
                textAlignVertical="top"
              />
              <Text style={s.charCount}>{dreamText.length}/600</Text>
            </View>

            <Pressable
              onPress={() => mutate({ text: dreamText, chartId })}
              disabled={dreamText.trim().length < 20}
              style={[s.interpretBtn, dreamText.trim().length < 20 && s.interpretBtnDisabled]}
            >
              <Text style={s.interpretBtnText}>🌙 Interpret Dream</Text>
            </Pressable>

            <View style={s.tipsCard}>
              <Text style={s.tipsTitle}>💡 Tips for better readings</Text>
              {[
                '🌓 Dreams before sunrise are most prophetic',
                '🎨 Mention colours, animals, and emotions',
                '👥 Include people you saw — known or unknown',
                '🔮 Link your Kundli chart above for personalised insights',
              ].map((tip, i) => (
                <Text key={i} style={s.tipText}>{tip}</Text>
              ))}
            </View>
          </>
        )}

        {/* ── LOADING ── */}
        {isPending && (
          <View style={s.loadingWrap}>
            <Text style={s.loadingEmoji}>🌙</Text>
            <ActivityIndicator color="#d4a843" size="large" />
            <Text style={s.loadingText}>Reading your dream…</Text>
            <Text style={s.loadingSubtext}>Consulting Swapna Shastra & modern psychology</Text>
          </View>
        )}

        {/* ── RESULTS ── */}
        {data && !isPending && cfg && (
          <>
            {/* Auspiciousness banner */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
              style={[s.auspCard, { borderColor: cfg.color + '44', backgroundColor: cfg.bg }]}
            >
              <View style={s.auspTop}>
                <Text style={s.auspEmoji}>{cfg.emoji}</Text>
                <View style={s.auspInfo}>
                  <Text style={[s.auspLabel, { color: cfg.color }]}>{cfg.label} Dream</Text>
                  <Text style={s.auspSub}>
                    {data.auspiciousness === 'auspicious'
                      ? 'Positive energies & blessings are indicated.'
                      : data.auspiciousness === 'inauspicious'
                      ? 'Challenges ahead — see remedies below.'
                      : 'Balanced cosmic energies are at play.'}
                  </Text>
                </View>
              </View>
              {data.lucky_numbers?.length > 0 && (
                <View style={s.luckyRow}>
                  <Text style={s.luckyLabel}>🍀 Lucky Numbers:</Text>
                  {data.lucky_numbers.map((n) => (
                    <View key={n} style={[s.luckyNum, { borderColor: cfg.color + '55', backgroundColor: cfg.color + '18' }]}>
                      <Text style={[s.luckyNumText, { color: cfg.color }]}>{n}</Text>
                    </View>
                  ))}
                </View>
              )}
            </MotiView>

            {/* Overall Interpretation */}
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300, delay: 80 }} style={s.interpCard}>
              <Text style={s.interpTitle}>🔮 Overall Interpretation</Text>
              <Text style={s.interpText}>{data.overall_interpretation}</Text>
            </MotiView>

            {/* Astrological Connection */}
            {data.astrological_connection ? (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 300, delay: 120 }} style={s.astroCard}>
                <View style={s.astroHeader}>
                  <Text style={s.astroEmoji}>🪐</Text>
                  <Text style={s.astroTitle}>Astrological Connection</Text>
                </View>
                <Text style={s.astroText}>{data.astrological_connection}</Text>
              </MotiView>
            ) : null}

            {/* Symbols */}
            {data.symbols?.length > 0 && (
              <>
                <Text style={s.sectionLabel}>✨ DREAM SYMBOLS</Text>
                {data.symbols.map((sym, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, translateX: -6 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 280, delay: i * 60 }}
                    style={s.symbolCard}
                  >
                    <View style={s.symbolHeader}>
                      <Text style={s.symbolEmoji}>{SYMBOL_EMOJIS[i % SYMBOL_EMOJIS.length]}</Text>
                      <Text style={s.symbolName}>{sym.symbol}</Text>
                    </View>
                    <View style={s.symbolVedic}>
                      <Text style={s.symbolVedicLabel}>🕉️ Vedic</Text>
                      <Text style={s.symbolVedicText}>{sym.vedic_meaning}</Text>
                    </View>
                    <View style={s.symbolPsych}>
                      <Text style={s.symbolPsychLabel}>🧠 Psychology</Text>
                      <Text style={s.symbolPsychText}>{sym.psychological_meaning}</Text>
                    </View>
                  </MotiView>
                ))}
              </>
            )}

            {/* Remedies */}
            {data.remedies?.length > 0 && (
              <>
                <Text style={[s.sectionLabel, { marginTop: 8 }]}>🙏 VEDIC REMEDIES</Text>
                <View style={s.remediesCard}>
                  {data.remedies.map((r, i) => (
                    <View key={i} style={[s.remedyRow, i < data.remedies.length - 1 && s.remedyDivider]}>
                      <View style={s.remedyNum}><Text style={s.remedyNumText}>{i + 1}</Text></View>
                      <Text style={s.remedyText}>{r}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Pressable onPress={() => { reset(); setDreamText(''); }} style={s.newBtn}>
              <Text style={s.newBtnText}>🌙 Interpret Another Dream</Text>
            </Pressable>
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
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  introCard: {
    backgroundColor: 'rgba(212,168,67,0.07)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.18)', marginBottom: 16,
  },
  introText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21 },

  chipScroll: { maxHeight: 52, marginBottom: 16 },
  chipRow: { gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  chipTextActive: { color: '#d4a843' },

  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 10 },

  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 14, marginBottom: 16,
  },
  input: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#c8b8d8', minHeight: 120 },
  charCount: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#4a3a60', textAlign: 'right', marginTop: 6 },

  interpretBtn: {
    backgroundColor: '#d4a843', borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  interpretBtnDisabled: { opacity: 0.4 },
  interpretBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#02010a' },

  tipsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 8,
  },
  tipsTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', marginBottom: 4 },
  tipText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#5a4a70', lineHeight: 19 },

  loadingWrap: { paddingTop: 80, alignItems: 'center', gap: 14 },
  loadingEmoji: { fontSize: 48 },
  loadingText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  loadingSubtext: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center' },

  auspCard: { borderRadius: 20, padding: 18, borderWidth: 1.5, marginBottom: 16 },
  auspTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  auspEmoji: { fontSize: 36 },
  auspInfo: { flex: 1 },
  auspLabel: { fontSize: 15, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  auspSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 18 },
  luckyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  luckyLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#b8a898' },
  luckyNum: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  luckyNumText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },

  interpCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12,
  },
  interpTitle: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#d4a843', marginBottom: 10 },
  interpText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#c8b8d8', lineHeight: 23 },

  astroCard: {
    backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#7C3AED',
  },
  astroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  astroEmoji: { fontSize: 20 },
  astroTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#a87fff', letterSpacing: 0.8, textTransform: 'uppercase' },
  astroText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21 },

  symbolCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10, gap: 10,
  },
  symbolHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  symbolEmoji: { fontSize: 24 },
  symbolName: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#d4a843', flex: 1 },
  symbolVedic: {
    backgroundColor: 'rgba(124,58,237,0.07)', borderRadius: 10, padding: 10,
  },
  symbolVedicLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#a87fff', letterSpacing: 1, marginBottom: 4 },
  symbolVedicText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#c8b8d8', lineHeight: 20 },
  symbolPsych: {
    backgroundColor: 'rgba(245,158,11,0.07)', borderRadius: 10, padding: 10,
  },
  symbolPsychLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#d97706', letterSpacing: 1, marginBottom: 4 },
  symbolPsychText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#c8b8d8', lineHeight: 20 },

  remediesCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12,
  },
  remedyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  remedyDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  remedyNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#d97706',
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  remedyNumText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },
  remedyText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21 },

  newBtn: {
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(212,168,67,0.08)', marginTop: 8,
  },
  newBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
});
