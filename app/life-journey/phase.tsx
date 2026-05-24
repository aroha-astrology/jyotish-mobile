import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLifeJourneyPhase, submitPhaseFeedback } from '@/lib/api';

const PLANET_COLOR: Record<string, string> = {
  Ketu: '#9B6B9E', Venus: '#E8A87C', Sun: '#F4B942', Moon: '#8BC4E8',
  Mars: '#E8735A', Rahu: '#7BA3B8', Jupiter: '#C4A84F', Saturn: '#8BA89B', Mercury: '#6BBF9E',
};

interface JourneyEvent {
  id: string;
  short: string;
  story: string;
  feedback: 'agree' | 'maybe' | 'disagree' | null;
}

interface PhaseData {
  planet: string;
  title: string;
  tense: 'past' | 'present' | 'future';
  events: JourneyEvent[];
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  name: string;
  phaseIndex: number;
  totalPhases: number;
}

function parsePoints(story: string): string[] {
  try {
    const parsed = JSON.parse(story) as unknown;
    if (Array.isArray(parsed)) return (parsed as unknown[]).map(s => String(s));
  } catch { /* legacy */ }
  return [story];
}

export default function LifePhaseScreen() {
  const router = useRouter();
  const { chart: chartId = '', index: indexParam = '0' } = useLocalSearchParams<{ chart: string; index: string }>();
  const phaseIndex = parseInt(indexParam, 10);
  const queryClient = useQueryClient();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryKey = ['life-journey-phase', chartId, phaseIndex];

  const { data, isLoading, error } = useQuery<PhaseData>({
    queryKey,
    queryFn: async () => {
      const res = await getLifeJourneyPhase(chartId, phaseIndex);
      if (!res.success) throw new Error('Failed to load phase');
      return res.data as PhaseData;
    },
    enabled: !!chartId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  async function handleFeedback(eventId: string, kind: 'agree' | 'maybe' | 'disagree') {
    if (!data || busyId) return;
    setBusyId(eventId);
    try {
      const body = await submitPhaseFeedback(eventId, kind);
      if (!body.success || !body.data) return;
      const updated = body.data;
      queryClient.setQueryData<PhaseData>(queryKey, prev => {
        if (!prev) return prev;
        return {
          ...prev,
          events: prev.events.map(e =>
            e.id === eventId
              ? kind === 'disagree'
                ? { id: updated.id, short: updated.short_text, story: updated.story_text, feedback: updated.feedback }
                : { ...e, feedback: kind }
              : e,
          ),
        };
      });
      if (kind === 'disagree') setExpandedId(null);
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  const goToPhase = (idx: number) => {
    setExpandedId(null);
    router.replace(`/life-journey/phase?chart=${chartId}&index=${idx}` as any);
  };

  const accentColor = data ? (PLANET_COLOR[data.planet] ?? '#d4a843') : '#d4a843';

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={s.backBtn}
        >
          <Text style={s.backText}>← Journey</Text>
        </Pressable>
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={s.loadingText}>Loading phase…</Text>
        </View>
      )}

      {(error || (!isLoading && !data)) && (
        <View style={s.center}>
          <Text style={s.errorText}>{error instanceof Error ? error.message : 'Failed to load'}</Text>
          <Pressable onPress={() => router.back()} style={s.retryBtn}>
            <Text style={s.retryText}>← Go back</Text>
          </Pressable>
        </View>
      )}

      {data && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Phase meta */}
          <View style={s.metaRow}>
            <View style={[s.yearBadge]}>
              <Text style={s.yearText}>{data.startYear}–{String(data.endYear).slice(-2)}</Text>
            </View>
            <Text style={s.ageText}>Age {data.startAge}–{data.endAge}</Text>
            <Text style={s.tenseText}>
              {data.tense === 'future' ? 'will unfold' : data.tense === 'present' ? 'unfolding' : 'likely felt'}
            </Text>
          </View>

          {/* Title with accent bar */}
          <View style={s.titleRow}>
            <View style={[s.accentBar, { backgroundColor: accentColor }]} />
            <Text style={s.phaseTitle}>{data.title}</Text>
          </View>

          {/* Planet pill */}
          <View style={[s.planetPill, { borderColor: accentColor + '66', backgroundColor: accentColor + '18' }]}>
            <Text style={[s.planetPillText, { color: accentColor }]}>{data.planet} Mahadasha</Text>
          </View>

          {/* Events section label */}
          <Text style={s.sectionLabel}>
            {data.tense === 'future' ? "What's Ahead" : data.tense === 'present' ? 'Unfolding Now' : 'Likely Events'}
          </Text>
          <Text style={s.sectionHint}>Tap to expand · Agree or Maybe saves it</Text>

          {/* Events */}
          <View style={s.eventsList}>
            {data.events.map(event => {
              const expanded = expandedId === event.id;
              const busy = busyId === event.id;
              const fb = event.feedback;
              return (
                <View
                  key={event.id}
                  style={[s.eventCard, expanded && s.eventCardExpanded]}
                >
                  <Pressable
                    onPress={() => setExpandedId(expanded ? null : event.id)}
                    disabled={busy}
                    style={s.eventHeader}
                  >
                    {/* Dot */}
                    <View style={[
                      s.eventDot,
                      fb === 'agree' && { backgroundColor: '#22c55e', borderColor: '#22c55e' },
                      fb === 'maybe' && { backgroundColor: '#eab308', borderColor: '#eab308' },
                    ]} />
                    <Text style={s.eventShort}>{event.short}</Text>
                    <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
                  </Pressable>

                  {expanded && (
                    <View style={s.eventBody}>
                      {busy ? (
                        <View style={s.busyRow}>
                          <ActivityIndicator color="#d4a843" size="small" />
                          <Text style={s.busyText}>Getting fresh insights…</Text>
                        </View>
                      ) : (
                        <View style={s.storyList}>
                          {parsePoints(event.story).map((pt, i) => (
                            <View key={i} style={s.storyPoint}>
                              <Text style={s.storyBullet}>◆</Text>
                              <Text style={s.storyText}>{pt}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Feedback buttons */}
                      <View style={s.fbRow}>
                        {([
                          { kind: 'agree' as const, label: 'Agree', color: '#22c55e' },
                          { kind: 'maybe' as const, label: 'Maybe', color: '#eab308' },
                          { kind: 'disagree' as const, label: 'Generate', color: '#f87171' },
                        ]).map(({ kind, label, color }) => (
                          <Pressable
                            key={kind}
                            onPress={() => handleFeedback(event.id, kind)}
                            disabled={!!busyId}
                            style={[
                              s.fbBtn,
                              { borderColor: color + (fb === kind ? '66' : '2A'), backgroundColor: color + (fb === kind ? '33' : '14') },
                            ]}
                          >
                            <Text style={[s.fbBtnText, { color }]}>{label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Navigation */}
          {data.phaseIndex + 1 < data.totalPhases && (
            <Pressable onPress={() => goToPhase(data.phaseIndex + 1)} style={s.nextBtn}>
              <Text style={s.nextLabel}>Next Up:</Text>
              <View style={s.nextRow}>
                <View style={s.nextBadge}>
                  <Text style={s.nextBadgeText}>Phase {data.phaseIndex + 2}/{data.totalPhases}</Text>
                </View>
                <Text style={s.nextAge}>Age {data.endAge + 1}+</Text>
                <Text style={s.nextChevron}>›</Text>
              </View>
            </Pressable>
          )}
          {data.phaseIndex > 0 && (
            <Pressable onPress={() => goToPhase(data.phaseIndex - 1)} style={s.prevBtn}>
              <Text style={s.prevText}>‹ Previous phase</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010a' },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: 'rgba(2,1,10,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  errorText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#f87171', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)', backgroundColor: 'rgba(212,168,67,0.1)' },
  retryText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  yearBadge: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  yearText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  ageText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  tenseText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  accentBar: { width: 4, borderRadius: 2, minHeight: 64, marginTop: 2 },
  phaseTitle: { flex: 1, fontSize: 26, fontFamily: 'Poppins_700Bold', color: '#7a6a90', lineHeight: 34 },
  planetPill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20 },
  planetPillText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  sectionLabel: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 4 },
  sectionHint: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(120,106,144,0.7)', marginBottom: 16 },
  eventsList: { gap: 8 },
  eventCard: { borderRadius: 16, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  eventCardExpanded: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  eventDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, borderWidth: 1.5, borderColor: 'rgba(120,106,144,0.4)', backgroundColor: 'transparent' },
  eventShort: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 22 },
  chevron: { fontSize: 10, color: '#7a6a90', marginTop: 6 },
  eventBody: { padding: 14, paddingTop: 0 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  busyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  storyList: { gap: 8, marginBottom: 14 },
  storyPoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  storyBullet: { fontSize: 10, color: '#d4a843', marginTop: 4 },
  storyText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21 },
  fbRow: { flexDirection: 'row', gap: 8 },
  fbBtn: { flex: 1, borderWidth: 1, borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
  fbBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  nextBtn: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  nextLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginBottom: 8 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextBadge: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  nextBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  nextAge: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', flex: 1 },
  nextChevron: { fontSize: 20, color: 'rgba(120,106,144,0.5)' },
  prevBtn: { marginTop: 8, padding: 12, alignItems: 'center' },
  prevText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
});
