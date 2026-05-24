import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { getTarot } from '@/lib/api';

const SPREADS = [
  { id: 'single', label: 'Single Card', desc: 'Quick guidance', emoji: '🃏' },
  { id: 'three_card', label: '3-Card', desc: 'Past · Present · Future', emoji: '🎴' },
  { id: 'celtic_cross', label: 'Celtic Cross', desc: 'Deep reading (10 cards)', emoji: '✡️' },
  { id: 'horseshoe', label: 'Horseshoe', desc: 'Situation overview (7 cards)', emoji: '🧿' },
];

interface TarotCard {
  name: string;
  position: string;
  orientation: 'upright' | 'reversed';
  keywords: string[];
  meaning: string;
  emoji: string;
}
interface TarotData {
  spread: string;
  overallMessage: string;
  cards: TarotCard[];
  advice: string;
}

export default function TarotScreen() {
  const router = useRouter();
  const [spreadType, setSpreadType] = useState('three_card');
  const [question, setQuestion] = useState('');

  const { data, isPending, mutate } = useMutation<TarotData, Error, { question: string; spreadType: string }>({
    mutationFn: async ({ question: q, spreadType: st }) => {
      const res = await getTarot(q, st);
      if (!res.success) throw new Error('Reading failed');
      return res.data as TarotData;
    },
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Tarot Reading</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!data && (
          <>
            {/* Spread selector */}
            <Text style={s.sectionLabel}>CHOOSE SPREAD</Text>
            <View style={s.spreadsGrid}>
              {SPREADS.map(sp => (
                <Pressable
                  key={sp.id}
                  onPress={() => setSpreadType(sp.id)}
                  style={[s.spreadCard, spreadType === sp.id && s.spreadCardActive]}
                >
                  <Text style={s.spreadEmoji}>{sp.emoji}</Text>
                  <Text style={[s.spreadLabel, spreadType === sp.id && s.spreadLabelActive]}>{sp.label}</Text>
                  <Text style={s.spreadDesc}>{sp.desc}</Text>
                </Pressable>
              ))}
            </View>

            {/* Question input */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>YOUR QUESTION</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="Ask the cards anything… (optional)"
                placeholderTextColor="#4a3a60"
                multiline
                value={question}
                onChangeText={setQuestion}
                maxLength={200}
              />
            </View>

            <Pressable
              onPress={() => mutate({ question, spreadType })}
              disabled={isPending}
              style={s.readBtn}
            >
              {isPending ? (
                <ActivityIndicator color="#02010a" size="small" />
              ) : (
                <Text style={s.readBtnText}>🃏 Draw Cards</Text>
              )}
            </Pressable>
          </>
        )}

        {isPending && (
          <View style={s.loadingWrap}>
            <ActivityIndicator color="#d4a843" size="large" />
            <Text style={s.loadingText}>Shuffling the deck…</Text>
          </View>
        )}

        {data && (
          <>
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
              style={s.messageCard}
            >
              <Text style={s.messageLabel}>OVERALL MESSAGE</Text>
              <Text style={s.messageText}>{data.overallMessage}</Text>
            </MotiView>

            <Text style={s.sectionLabel}>YOUR CARDS</Text>
            {data.cards.map((card, i) => (
              <MotiView
                key={i}
                from={{ opacity: 0, translateX: -8 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 320, delay: i * 80 }}
                style={[s.cardItem, card.orientation === 'reversed' && s.cardReversed]}
              >
                <View style={s.cardTopRow}>
                  <Text style={s.cardEmoji}>{card.emoji || '🃏'}</Text>
                  <View style={s.cardInfo}>
                    <View style={s.cardNameRow}>
                      <Text style={s.cardName}>{card.name}</Text>
                      {card.orientation === 'reversed' && (
                        <View style={s.reversedBadge}><Text style={s.reversedBadgeText}>Reversed</Text></View>
                      )}
                    </View>
                    <Text style={s.cardPosition}>{card.position}</Text>
                  </View>
                </View>
                <View style={s.keywordsRow}>
                  {card.keywords.map((kw, j) => (
                    <View key={j} style={s.keywordPill}>
                      <Text style={s.keywordText}>{kw}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.cardMeaning}>{card.meaning}</Text>
              </MotiView>
            ))}

            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 350, delay: data.cards.length * 80 }}
              style={s.adviceCard}
            >
              <Text style={s.adviceLabel}>✨ GUIDANCE</Text>
              <Text style={s.adviceText}>{data.advice}</Text>
            </MotiView>

            <Pressable onPress={() => mutate({ question, spreadType })} style={s.againBtn}>
              <Text style={s.againBtnText}>Draw Again</Text>
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
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 12 },
  spreadsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spreadCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 4,
  },
  spreadCardActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.12)' },
  spreadEmoji: { fontSize: 28, marginBottom: 4 },
  spreadLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', textAlign: 'center' },
  spreadLabelActive: { color: '#d4a843' },
  spreadDesc: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#4a3a60', textAlign: 'center' },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 14, marginBottom: 20,
  },
  input: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90', minHeight: 70, textAlignVertical: 'top' },
  readBtn: {
    backgroundColor: '#d4a843', borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  readBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  loadingWrap: { paddingTop: 80, alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  messageCard: {
    backgroundColor: 'rgba(212,168,67,0.08)', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)', marginBottom: 20,
  },
  messageLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', letterSpacing: 1.2, marginBottom: 8 },
  messageText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 23 },
  cardItem: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12, gap: 10,
  },
  cardReversed: { borderColor: 'rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.04)' },
  cardTopRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  cardEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  reversedBadge: { backgroundColor: 'rgba(248,113,113,0.18)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  reversedBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#f87171' },
  cardPosition: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginTop: 2 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  keywordPill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(212,168,67,0.1)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)',
  },
  keywordText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#d4a843' },
  cardMeaning: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21 },
  adviceCard: {
    backgroundColor: 'rgba(139,196,232,0.08)', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: 'rgba(139,196,232,0.2)', marginBottom: 16,
  },
  adviceLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#8BC4E8', letterSpacing: 1.2, marginBottom: 8 },
  adviceText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 23 },
  againBtn: {
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)', borderRadius: 16,
    paddingVertical: 13, alignItems: 'center', backgroundColor: 'rgba(212,168,67,0.08)',
  },
  againBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
});
