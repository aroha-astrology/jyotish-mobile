import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share2, Volume2, VolumeX } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { colors } from '@/constants/theme';
import { CosmicBackground } from '@/components/CosmicBackground';
import { RudrakshaBead, type RudrakshaBeadRef } from '@/components/RudrakshaBead';
import { useMantras } from '@/lib/useMantras';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Visual halo colour per planet (matches existing theme.ts planet tokens)
const PLANET_HALO: Record<string, [string, string]> = {
  sun:     ['#f5a623', '#a06310'],
  moon:    ['#b0c4de', '#5a6a85'],
  mars:    ['#e53935', '#7a1b18'],
  mercury: ['#4caf50', '#1f5a23'],
  jupiter: ['#ff9800', '#7a4500'],
  venus:   ['#ff80ab', '#7a3653'],
  saturn:  ['#607d8b', '#2a3a44'],
  rahu:    ['#9c27b0', '#4a0e57'],
  ketu:    ['#795548', '#3a261d'],
  ganesha: ['#f5a623', '#a06310'],
  saraswati: ['#ffd1e8', '#a07090'],
  shiva:   ['#b0c4de', '#5a6a85'],
};

const DEITY_GLYPH: Record<string, string> = {
  sun: '☀', moon: '🌙', mars: '♂', mercury: '☿', jupiter: '♃',
  venus: '♀', saturn: '♄', rahu: '☊', ketu: '☋',
  ganesha: 'ॐ', saraswati: '✦', shiva: 'ॐ',
};

export default function MantraJaapScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { data: mantras, isLoading } = useMantras();
  const setCredits = useStore((s) => s.setCredits);

  const mantra = mantras?.find((m) => m.key === key);

  const [count, setCount] = useState(0);
  const [canTap, setCanTap] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [muted, setMuted] = useState(false);
  const [claimState, setClaimState] = useState<'idle' | 'claiming' | 'claimed' | 'already' | 'error'>('idle');

  const soundRef = useRef<Audio.Sound | null>(null);
  const beadRef = useRef<RudrakshaBeadRef>(null);

  // Configure audio mode once
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  // Play (or replay) the mantra audio
  async function playMantra() {
    if (!mantra) return;

    if (!mantra.audio_url) {
      setCanTap(true);
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: mantra.audio_url },
        { shouldPlay: !muted, volume: muted ? 0 : 1.0 },
      );
      soundRef.current = sound;
      setCanTap(false);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCanTap(true);
        }
      });

      if (muted) {
        // Treat muted as "audio gate cleared" but visually keep timing using duration if known
        const wait = mantra.audio_duration_ms ?? 3000;
        setTimeout(() => {
          setIsPlaying(false);
          setCanTap(true);
        }, wait);
      }
    } catch (err) {
      console.warn('[MantraJaap] audio failed:', err);
      setCanTap(true);
      setIsPlaying(false);
    }
  }

  // Kick off first recitation once mantra is loaded
  useEffect(() => {
    if (mantra?.audio_url) playMantra();
    else if (mantra) setCanTap(true);
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mantra?.audio_url]);

  function handleCount() {
    if (!mantra || !canTap || isComplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    beadRef.current?.pulse();

    const next = count + 1;
    setCount(next);

    if (next >= mantra.jaap_count) {
      setIsComplete(true);
      setCanTap(false);
      claimReward();
    } else {
      playMantra();
    }
  }

  async function claimReward() {
    if (!mantra) return;
    setClaimState('claiming');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${BASE_URL}/api/credits/jaap-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ key: mantra.key }),
      });

      if (res.status === 409) {
        setClaimState('already');
        return;
      }
      if (!res.ok) {
        setClaimState('error');
        return;
      }
      const json = (await res.json()) as { credits: number };
      setCredits(json.credits);
      setClaimState('claimed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['mantras', 'claimed_today'] });
    } catch {
      setClaimState('error');
    }
  }

  async function handleShare() {
    if (!mantra) return;
    try {
      await Share.share({
        message: `${mantra.name}\n\n${mantra.mantra_text}\n\n— ${mantra.deity}`,
      });
    } catch {}
  }

  if (isLoading || !mantra) {
    return (
      <View style={[styles.root, styles.center]}>
        <CosmicBackground />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const halo = PLANET_HALO[mantra.key] ?? ['#D4AF37', '#A07820'];
  const glyph = DEITY_GLYPH[mantra.key] ?? '✦';
  const progress = Math.min(1, count / mantra.jaap_count);

  return (
    <View style={styles.root}>
      <CosmicBackground />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.topTitle}>Mantra Jaap</Text>
        <Pressable onPress={handleShare} hitSlop={12} style={styles.iconBtn}>
          <Share2 size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Deity / planet badge */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.deityWrap}
        >
          <LinearGradient
            colors={[halo[0], halo[1]]}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.deityCircle}
          >
            <Text style={styles.deityGlyph}>{glyph}</Text>
          </LinearGradient>
        </MotiView>

        <Text style={styles.mantraName}>{mantra.name}</Text>
        <Text style={styles.mantraDesc}>{mantra.description}</Text>

        <View style={styles.rewardPill}>
          <Text style={styles.rewardText}>Reward  ₹{mantra.reward_credits}</Text>
        </View>

        {/* Mantra text divider */}
        <View style={styles.mantraTextRow}>
          <View style={styles.divider} />
          <Text style={styles.mantraTextSparkle}>✦</Text>
          <Text style={styles.mantraText}>{mantra.mantra_text}</Text>
          <Text style={styles.mantraTextSparkle}>✦</Text>
          <View style={styles.divider} />
        </View>

        {/* Audio control */}
        <Pressable onPress={() => setMuted((m) => !m)} style={styles.audioBtn} hitSlop={10}>
          {muted
            ? <VolumeX size={22} color={colors.primary} />
            : <Volume2 size={22} color={colors.primary} />}
        </Pressable>

        {/* Bead counter */}
        <View style={styles.beadArea}>
          <RudrakshaBead
            ref={beadRef}
            mukhi={mantra.mukhi}
            size={240}
            locked={!canTap || isComplete}
            onTap={handleCount}
          />
          <View style={styles.countOverlay} pointerEvents="none">
            <Text style={styles.countNumber}>{count}</Text>
          </View>
        </View>

        <Text style={styles.progressText}>
          {count}/{mantra.jaap_count}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Status / complete state */}
        {!isComplete && (
          <Text style={styles.hintText}>
            {isPlaying ? 'Listen…' : canTap ? 'Tap the bead to count' : 'Loading audio…'}
          </Text>
        )}

        {isComplete && (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 380 }}
            style={styles.completeBox}
          >
            <Text style={styles.completeTitle}>Session Complete</Text>
            <Text style={styles.completeSub}>
              {claimState === 'claiming' && 'Granting reward…'}
              {claimState === 'claimed' && `+₹${mantra.reward_credits} added to your wallet`}
              {claimState === 'already' && 'You already claimed this mantra today'}
              {claimState === 'error' && 'Could not grant reward. Try again later.'}
              {claimState === 'idle' && 'Tap below to claim your reward.'}
            </Text>
            <View style={styles.completeBtnRow}>
              {claimState === 'idle' && (
                <Pressable onPress={claimReward} style={styles.claimBtn}>
                  <Text style={styles.claimBtnText}>Claim ₹{mantra.reward_credits}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => router.back()} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </MotiView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 56, alignItems: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.primary,
    letterSpacing: 1.5,
  },

  deityWrap: { marginTop: 8, marginBottom: 16 },
  deityCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.35)',
  },
  deityGlyph: { fontSize: 52, color: '#1E0E07' },

  mantraName: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#F2CA50',
    marginBottom: 8,
  },
  mantraDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(225,226,235,0.78)',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  rewardPill: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(242,202,80,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.35)',
  },
  rewardText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#F2CA50',
    letterSpacing: 0.4,
  },

  mantraTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 4,
    paddingHorizontal: 4,
    width: '100%',
    justifyContent: 'center',
  },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(212,175,55,0.18)' },
  mantraTextSparkle: { color: '#F2CA50', fontSize: 12 },
  mantraText: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    color: '#F2CA50',
    paddingHorizontal: 4,
    flexShrink: 1,
  },

  audioBtn: {
    marginTop: 14,
    marginBottom: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  beadArea: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  countOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNumber: {
    fontSize: 44,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#F2CA50',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  progressText: {
    marginTop: 18,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(225,226,235,0.85)',
    letterSpacing: 0.4,
  },
  progressBarBg: {
    marginTop: 12,
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212,175,55,0.10)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F2CA50',
  },

  hintText: {
    marginTop: 18,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(225,226,235,0.55)',
    letterSpacing: 0.4,
  },

  completeBox: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.30)',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#F2CA50',
    marginBottom: 6,
  },
  completeSub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(225,226,235,0.85)',
    textAlign: 'center',
    marginBottom: 14,
  },
  completeBtnRow: { flexDirection: 'row', gap: 10 },
  claimBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F2CA50',
  },
  claimBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#1E0E07',
    letterSpacing: 0.4,
  },
  doneBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.45)',
  },
  doneBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#F2CA50',
    letterSpacing: 0.4,
  },
});
