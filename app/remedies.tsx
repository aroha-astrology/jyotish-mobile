import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MotiView, AnimatePresence } from 'moti';
import { useStore } from '@/store/useStore';
import { getKundliRemedies } from '@/lib/api';

const GENERAL_REMEDIES = [
  { planet: 'Sun', emoji: '☉', color: '#F4B942', remedies: ['Offer water to the Sun every morning', 'Wear Ruby on Sundays', 'Chant Aditya Hridayam Stotra'] },
  { planet: 'Moon', emoji: '☽', color: '#8BC4E8', remedies: ['Offer milk to Lord Shiva on Mondays', 'Wear Pearl in silver', 'Fast on Mondays'] },
  { planet: 'Mars', emoji: '♂', color: '#E8735A', remedies: ['Donate red lentils on Tuesdays', 'Chant Hanuman Chalisa', 'Offer red flowers to Lord Hanuman'] },
  { planet: 'Mercury', emoji: '☿', color: '#6BBF9E', remedies: ['Feed green fodder to cows on Wednesdays', 'Wear Emerald in gold', 'Chant Budha Beej Mantra'] },
  { planet: 'Jupiter', emoji: '♃', color: '#C4A84F', remedies: ['Visit temple on Thursdays', 'Wear Yellow Sapphire', 'Donate turmeric and yellow sweets'] },
  { planet: 'Venus', emoji: '♀', color: '#E8A87C', remedies: ['Offer white flowers to Goddess Lakshmi on Fridays', 'Wear Diamond or White Sapphire', 'Keep your home clean and fragrant'] },
  { planet: 'Saturn', emoji: '♄', color: '#8BA89B', remedies: ['Light sesame oil lamp on Saturdays', 'Donate black sesame seeds', 'Chant Shani Mantra 108 times'] },
  { planet: 'Rahu', emoji: '☊', color: '#7BA3B8', remedies: ['Wear Hessonite in silver on Saturdays', 'Feed stray dogs on Saturdays', 'Chant Rahu Beej Mantra'] },
  { planet: 'Ketu', emoji: '☋', color: '#9B6B9E', remedies: ['Donate blankets to the poor', 'Wear Cat\'s Eye in silver', 'Chant Ketu Beej Mantra'] },
];

interface KundliRemedy {
  planet: string;
  issue: string;
  remedies: string[];
  priority: 'high' | 'medium' | 'low';
}

export default function RemediesScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: kundliRemedies, isLoading } = useQuery<KundliRemedy[]>({
    queryKey: ['kundli-remedies', chartId],
    queryFn: async () => {
      const res = await getKundliRemedies(chartId);
      if (!res.success) throw new Error('Failed');
      return res.data as KundliRemedy[];
    },
    enabled: !!chartId,
    staleTime: Infinity,
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Remedies</Text>
        <View style={{ width: 60 }} />
      </View>

      {charts && charts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
          {charts.map((c: any) => (
            <Pressable key={c.id} onPress={() => setChartId(c.id)} style={[s.chip, chartId === c.id && s.chipActive]}>
              <Text style={[s.chipText, chartId === c.id && s.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Personalized remedies */}
        {isLoading && (
          <View style={s.loadingRow}>
            <ActivityIndicator color="#d4a843" size="small" />
            <Text style={s.loadingText}>Loading personalized remedies…</Text>
          </View>
        )}

        {kundliRemedies && kundliRemedies.length > 0 && (
          <>
            <Text style={s.sectionLabel}>PERSONALIZED FOR YOUR CHART</Text>
            {kundliRemedies.map((rem, i) => {
              const priorityColor = rem.priority === 'high' ? '#f87171' : rem.priority === 'medium' ? '#eab308' : '#22c55e';
              return (
                <MotiView
                  key={i}
                  from={{ opacity: 0, translateX: -6 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 280, delay: i * 50 }}
                  style={[s.personalCard, { borderColor: priorityColor + '33' }]}
                >
                  <View style={s.personalHeader}>
                    <View style={[s.priorityBadge, { borderColor: priorityColor + '55', backgroundColor: priorityColor + '15' }]}>
                      <Text style={[s.priorityText, { color: priorityColor }]}>{rem.priority}</Text>
                    </View>
                    <Text style={s.personalPlanet}>{rem.planet}</Text>
                    <Text style={s.personalIssue} numberOfLines={1}>{rem.issue}</Text>
                  </View>
                  <View style={s.personalRemedies}>
                    {rem.remedies.map((r, j) => (
                      <View key={j} style={s.remedyLine}>
                        <Text style={s.remedyBullet}>•</Text>
                        <Text style={s.remedyLineText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </MotiView>
              );
            })}
          </>
        )}

        {/* General remedies by planet */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>PLANETARY REMEDIES</Text>
        {GENERAL_REMEDIES.map((entry, i) => {
          const isOpen = expanded === entry.planet;
          return (
            <MotiView
              key={entry.planet}
              from={{ opacity: 0, translateX: -6 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 260, delay: i * 35 }}
              style={[s.planetCard, isOpen && s.planetCardOpen, { borderColor: isOpen ? entry.color + '44' : 'rgba(255,255,255,0.08)' }]}
            >
              <Pressable onPress={() => setExpanded(isOpen ? null : entry.planet)} style={s.planetCardHeader}>
                <View style={[s.planetBadge, { borderColor: entry.color + '55', backgroundColor: entry.color + '18' }]}>
                  <Text style={[s.planetEmoji, { color: entry.color }]}>{entry.emoji}</Text>
                </View>
                <Text style={s.planetName}>{entry.planet}</Text>
                <Text style={s.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </Pressable>

              <AnimatePresence>
                {isOpen && (
                  <MotiView
                    key="body"
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'timing', duration: 220 }}
                    style={s.planetBody}
                  >
                    {entry.remedies.map((r, j) => (
                      <View key={j} style={[s.remedyLine, j < entry.remedies.length - 1 && s.remedyLineDivider]}>
                        <Text style={s.remedyBulletGold}>🙏</Text>
                        <Text style={s.remedyLineText}>{r}</Text>
                      </View>
                    ))}
                  </MotiView>
                )}
              </AnimatePresence>
            </MotiView>
          );
        })}
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
  chipScroll: { maxHeight: 56 },
  chipRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  chipTextActive: { color: '#d4a843' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  loadingText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 12 },
  personalCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14,
    borderWidth: 1, marginBottom: 10, gap: 10,
  },
  personalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priorityBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
  personalPlanet: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  personalIssue: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  personalRemedies: { gap: 6 },
  remedyLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  remedyLineDivider: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  remedyBullet: { fontSize: 14, color: '#7a6a90', marginTop: 2 },
  remedyBulletGold: { fontSize: 15, marginTop: 1 },
  remedyLineText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21 },
  planetCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18,
    borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  planetCardOpen: { backgroundColor: 'rgba(255,255,255,0.06)' },
  planetCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  planetBadge: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  planetEmoji: { fontSize: 20 },
  planetName: { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  chevron: { fontSize: 10, color: '#7a6a90' },
  planetBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
});
