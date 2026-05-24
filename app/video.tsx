import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { generateVideo, getVideoHistory, getVideoStatus } from '@/lib/api';

const VIDEO_TYPES = [
  { id: 'birth_chart', label: 'Birth Chart', emoji: '🔮' },
  { id: 'yearly', label: 'Year Ahead', emoji: '🗓️' },
  { id: 'compatibility', label: 'Compatibility', emoji: '💑' },
  { id: 'career', label: 'Career', emoji: '💼' },
];
const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'te', label: 'Telugu' },
  { id: 'ta', label: 'Tamil' },
  { id: 'bn', label: 'Bengali' },
  { id: 'mr', label: 'Marathi' },
];
const FOCUS_AREAS = ['Overall Life', 'Career', 'Love & Marriage', 'Health', 'Finance', 'Spirituality'];

interface VideoJob {
  id: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  title?: string;
  created_at?: string;
}

function StatusChip({ status }: { status: string }) {
  const color = status === 'ready' ? '#22c55e' : status === 'failed' ? '#f87171' : '#eab308';
  return (
    <View style={[sc.wrap, { borderColor: color + '44', backgroundColor: color + '12' }]}>
      <Text style={[sc.text, { color }]}>{status}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  text: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6 },
});

export default function VideoScreen() {
  const router = useRouter();
  const charts = useStore((st: any) => st.charts);
  const [tab, setTab] = useState<'create' | 'history'>('create');
  const [chartId, setChartId] = useState(charts?.[0]?.id ?? '');
  const [videoType, setVideoType] = useState('birth_chart');
  const [language, setLanguage] = useState('en');
  const [focusArea, setFocusArea] = useState('Overall Life');
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);
  const pollCount = useRef(0);

  const { mutate: createVideo, isPending: creating } = useMutation<{ data: { video_id: string } }, Error, void>({
    mutationFn: async () => {
      const res = await generateVideo({ type: videoType, language, focusArea, chartId: chartId || undefined });
      if (!res.success) throw new Error('Failed to start video');
      return res as any;
    },
    onSuccess: (res) => {
      setPendingVideoId((res as any).data?.video_id ?? null);
      pollCount.current = 0;
      setTab('history');
    },
  });

  // Poll pending video every 8s up to 30 polls
  const { data: polledStatus } = useQuery<{ data: { status: string; video_url?: string } }>({
    queryKey: ['video-status', pendingVideoId],
    queryFn: () => getVideoStatus(pendingVideoId!),
    enabled: !!pendingVideoId,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.data?.status;
      pollCount.current += 1;
      if (status === 'ready' || status === 'failed' || pollCount.current > 30) {
        return false;
      }
      return 8000;
    },
  });

  useEffect(() => {
    if ((polledStatus as any)?.data?.status === 'ready') {
      setPendingVideoId(null);
    }
  }, [polledStatus]);

  const { data: history, isLoading: historyLoading } = useQuery<{ data: VideoJob[] }>({
    queryKey: ['video-history'],
    queryFn: getVideoHistory,
    enabled: tab === 'history',
    staleTime: 1000 * 30,
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Video Reading</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        <Pressable onPress={() => setTab('create')} style={[s.tabItem, tab === 'create' && s.tabItemActive]}>
          <Text style={[s.tabText, tab === 'create' && s.tabTextActive]}>Create</Text>
        </Pressable>
        <Pressable onPress={() => setTab('history')} style={[s.tabItem, tab === 'history' && s.tabItemActive]}>
          <Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>My Videos</Text>
        </Pressable>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'create' && (
          <>
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350 }}
              style={s.infoCard}
            >
              <Text style={s.infoText}>
                Generate a personalized AI video narration of your birth chart with voice-over in your language.
                Takes 2–5 minutes to render.
              </Text>
            </MotiView>

            {charts && charts.length > 0 && (
              <>
                <Text style={s.fieldLabel}>CHART</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRowInner} style={s.chipScrollSmall}>
                  {charts.map((c: any) => (
                    <Pressable key={c.id} onPress={() => setChartId(c.id)} style={[s.chip, chartId === c.id && s.chipActive]}>
                      <Text style={[s.chipText, chartId === c.id && s.chipTextActive]}>{c.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={s.fieldLabel}>VIDEO TYPE</Text>
            <View style={s.typeGrid}>
              {VIDEO_TYPES.map(vt => (
                <Pressable key={vt.id} onPress={() => setVideoType(vt.id)} style={[s.typeCard, videoType === vt.id && s.typeCardActive]}>
                  <Text style={s.typeEmoji}>{vt.emoji}</Text>
                  <Text style={[s.typeLabel, videoType === vt.id && s.typeLabelActive]}>{vt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>LANGUAGE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRowInner} style={s.chipScrollSmall}>
              {LANGUAGES.map(l => (
                <Pressable key={l.id} onPress={() => setLanguage(l.id)} style={[s.chip, language === l.id && s.chipActive]}>
                  <Text style={[s.chipText, language === l.id && s.chipTextActive]}>{l.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>FOCUS AREA</Text>
            <View style={s.focusRow}>
              {FOCUS_AREAS.map(fa => (
                <Pressable key={fa} onPress={() => setFocusArea(fa)} style={[s.focusChip, focusArea === fa && s.focusChipActive]}>
                  <Text style={[s.focusText, focusArea === fa && s.focusTextActive]}>{fa}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => createVideo()} disabled={creating} style={[s.genBtn, creating && s.genBtnDisabled]}>
              {creating ? <ActivityIndicator color="#02010a" size="small" /> : <Text style={s.genBtnText}>🎬 Generate Video</Text>}
            </Pressable>
          </>
        )}

        {tab === 'history' && (
          <>
            {pendingVideoId && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 300 }}
                style={s.pendingCard}
              >
                <ActivityIndicator color="#eab308" size="small" />
                <View style={{ flex: 1 }}>
                  <Text style={s.pendingTitle}>Rendering your video…</Text>
                  <Text style={s.pendingSubtitle}>This usually takes 2–5 minutes.</Text>
                </View>
              </MotiView>
            )}

            {historyLoading && (
              <View style={s.center}>
                <ActivityIndicator color="#d4a843" size="large" />
                <Text style={s.loadingText}>Loading videos…</Text>
              </View>
            )}

            {(history as any)?.data?.length === 0 && (
              <View style={s.emptyWrap}>
                <Text style={s.emptyEmoji}>🎬</Text>
                <Text style={s.emptyTitle}>No videos yet</Text>
                <Text style={s.emptySub}>Create your first AI video reading above.</Text>
              </View>
            )}

            {(history as any)?.data?.map((v: VideoJob, i: number) => (
              <MotiView
                key={v.id}
                from={{ opacity: 0, translateX: -6 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 260, delay: i * 40 }}
                style={s.videoCard}
              >
                <View style={s.videoCardTop}>
                  <Text style={s.videoTitle}>{v.title ?? 'Birth Chart Reading'}</Text>
                  <StatusChip status={v.status} />
                </View>
                {v.created_at && <Text style={s.videoDate}>{v.created_at}</Text>}
                {v.status === 'ready' && v.video_url && (
                  <Pressable onPress={() => Linking.openURL(v.video_url!)} style={s.watchBtn}>
                    <Text style={s.watchBtnText}>▶ Watch Video</Text>
                  </Pressable>
                )}
              </MotiView>
            ))}
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
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tabItem: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#d4a843' },
  tabText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  tabTextActive: { color: '#d4a843', fontFamily: 'Poppins_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  infoCard: {
    backgroundColor: 'rgba(212,168,67,0.07)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.18)', marginBottom: 20,
  },
  infoText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21 },
  fieldLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 10 },
  chipScrollSmall: { maxHeight: 44, marginBottom: 4 },
  chipRowInner: { gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  chipTextActive: { color: '#d4a843' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 6,
  },
  typeCardActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.12)' },
  typeEmoji: { fontSize: 28 },
  typeLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', textAlign: 'center' },
  typeLabelActive: { color: '#d4a843' },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  focusChipActive: { borderColor: '#d4a843', backgroundColor: 'rgba(212,168,67,0.15)' },
  focusText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  focusTextActive: { color: '#d4a843' },
  genBtn: {
    backgroundColor: '#d4a843', borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  genBtnDisabled: { opacity: 0.5 },
  genBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  pendingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(234,179,8,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(234,179,8,0.25)', marginBottom: 16,
  },
  pendingTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  pendingSubtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginTop: 2 },
  center: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  emptyWrap: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  emptySub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center' },
  videoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12, gap: 8,
  },
  videoCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  videoTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', flex: 1, marginRight: 10 },
  videoDate: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  watchBtn: {
    backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
  },
  watchBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
});
