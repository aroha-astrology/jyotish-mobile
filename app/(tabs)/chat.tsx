import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { getChatSessions, createChatSession } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';

const PERSONAS = [
  {
    id: 'baba',
    name: 'Baba Ji',
    desc: 'Traditional Vedic wisdom, spiritual depth',
    emoji: '🧘',
    color: '#f5a623',
    accent: 'rgba(245,166,35,0.15)',
  },
  {
    id: 'scholar',
    name: 'Jyotisha Scholar',
    desc: 'Classical texts, precise calculations',
    emoji: '📚',
    color: '#c4b5fd',
    accent: 'rgba(196,181,253,0.15)',
  },
  {
    id: 'friend',
    name: 'Cosmic Friend',
    desc: 'Modern, relatable guidance',
    emoji: '✨',
    color: '#00d4b8',
    accent: 'rgba(0,212,184,0.12)',
  },
];

const ASTROLOGERS = [
  { id: '1', name: 'Pandit Sharma',  specialty: 'Vedic Astrology',    rating: 4.9, online: true,  color: '#f5a623' },
  { id: '2', name: 'Dr. Priya Nair', specialty: 'Kundli & Predictions', rating: 4.8, online: true,  color: '#c4b5fd' },
  { id: '3', name: 'Guru Raghavan',  specialty: 'Numerology & Tarot',  rating: 4.7, online: false, color: '#00d4b8' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
];

function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 168) return `${Math.floor(diffH / 24)}d ago`;
  return d.toLocaleDateString();
}

export default function ChatScreen() {
  const router = useRouter();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const [langOpen, setLangOpen] = useState(false);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: getChatSessions,
    staleTime: 60 * 1000,
  });
  const sessions = sessionsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (_personaId?: string) => createChatSession(),
    onSuccess: (session) => {
      router.push(`/chat/${session.id}` as never);
    },
  });

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 450 }} style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Chat</Text>
            <Text style={styles.subtitle}>Ask the cosmos anything</Text>
          </View>
          {/* Language Picker */}
          <Pressable onPress={() => setLangOpen(!langOpen)} style={styles.langBtn}>
            <Text style={styles.langText}>{currentLang.label}</Text>
            <Text style={styles.langCaret}>{langOpen ? '▲' : '▼'}</Text>
          </Pressable>
        </MotiView>

        {langOpen && (
          <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 200 }} style={styles.langDropdown}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => { setLanguage(l.code); setLangOpen(false); }}
                style={[styles.langOption, l.code === language && styles.langOptionActive]}
              >
                <Text style={[styles.langOptionText, l.code === language && { color: colors.primary }]}>{l.label}</Text>
              </Pressable>
            ))}
          </MotiView>
        )}

        {/* AI Persona Cards */}
        <Text style={styles.sectionTitle}>Choose Your Guide</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personaScroll}>
          {PERSONAS.map((p, i) => (
            <MotiView
              key={p.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: i * 80 }}
            >
              <Pressable
                onPress={() => createMutation.mutate(p.id)}
                style={({ pressed }) => [styles.personaCard, { backgroundColor: p.accent, borderColor: `${p.color}44` }, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.personaEmoji}>{p.emoji}</Text>
                <Text style={[styles.personaName, { color: p.color }]}>{p.name}</Text>
                <Text style={styles.personaDesc}>{p.desc}</Text>
                <View style={[styles.personaBtn, { borderColor: `${p.color}55`, backgroundColor: `${p.color}18` }]}>
                  <Text style={[styles.personaBtnText, { color: p.color }]}>Chat →</Text>
                </View>
              </Pressable>
            </MotiView>
          ))}
        </ScrollView>

        {/* New Chat button */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 250 }}>
          <Pressable
            onPress={() => createMutation.mutate(undefined)}
            style={({ pressed }) => [styles.newChatBtn, pressed && { opacity: 0.8 }]}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.newChatText}>✦ New Chat Session</Text>
            )}
          </Pressable>
        </MotiView>

        {/* Past Sessions */}
        {sessionsLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : sessions.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessions.slice(0, 5).map((session: any, i: number) => (
              <MotiView
                key={session.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 350, delay: i * 60 + 200 }}
              >
                <Pressable onPress={() => router.push(`/chat/${session.id}` as never)} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
                  <Card style={styles.sessionCard}>
                    <View style={styles.sessionRow}>
                      <View style={styles.sessionIcon}>
                        <Text style={{ fontSize: 16 }}>💬</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>{session.title ?? 'Chat Session'}</Text>
                        <Text style={styles.sessionTime}>{formatSessionTime(session.created_at ?? new Date().toISOString())}</Text>
                      </View>
                      <Text style={styles.sessionArrow}>›</Text>
                    </View>
                  </Card>
                </Pressable>
              </MotiView>
            ))}
          </>
        ) : null}

        {/* Live Astrologers */}
        <Text style={styles.sectionTitle}>Live Astrologers</Text>
        {ASTROLOGERS.map((a, i) => (
          <MotiView
            key={a.id}
            from={{ opacity: 0, translateX: -14 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 380, delay: i * 80 + 300 }}
          >
            <Pressable onPress={() => router.push(`/chat/astrologer/${a.id}` as never)} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
              <Card style={styles.astroCard}>
                <View style={styles.astroRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: `${a.color}1a`, borderColor: `${a.color}44` }]}>
                    <Text style={[styles.avatarInitial, { color: a.color }]}>{a.name[0]}</Text>
                    {a.online && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.astroInfo}>
                    <Text style={styles.astroName}>{a.name}</Text>
                    <Text style={styles.astroSpec}>{a.specialty}</Text>
                    <View style={styles.astroMeta}>
                      <Text style={styles.astroRating}>★ {a.rating}</Text>
                      <Badge variant={a.online ? 'teal' : 'muted'}>{a.online ? 'Online' : 'Offline'}</Badge>
                    </View>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
                </View>
              </Card>
            </Pressable>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },

  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  langText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.text },
  langCaret: { fontSize: 9, color: colors.textMuted },
  langDropdown: { backgroundColor: '#0d0a1a', borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  langOption: { paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  langOptionActive: { backgroundColor: 'rgba(212,168,67,0.08)' },
  langOptionText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },

  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },

  personaScroll: { gap: 12, paddingBottom: 4, marginBottom: 16 },
  personaCard: { width: 150, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 8 },
  personaEmoji: { fontSize: 30 },
  personaName: { fontSize: 14, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  personaDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  personaBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  personaBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  newChatBtn: { backgroundColor: 'rgba(212,168,67,0.10)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 8 },
  newChatText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  loadingRow: { paddingVertical: 16, alignItems: 'center' },

  sessionCard: { marginBottom: 8, backgroundColor: colors.bgSurface, borderColor: colors.border },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  sessionTitle: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  sessionTime: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2 },
  sessionArrow: { fontSize: 20, color: colors.textMuted },

  astroCard: { marginBottom: 10, backgroundColor: colors.bgSurface, borderColor: colors.border },
  astroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#4caf50', borderWidth: 2, borderColor: colors.bgSurface },
  astroInfo: { flex: 1, gap: 3 },
  astroName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  astroSpec: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  astroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  astroRating: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.primary },
});
