import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useMantras, useClaimedTodayKeys, type Mantra } from '@/lib/useMantras';
import { useFeatureLock } from '@/lib/useFeatureLock';

interface RewardTile {
  emoji: string;
  title: string;
  desc: string;
  points: string;
  route?: string;
  disabled?: boolean;
  color: string;
}

const REWARD_TILES: RewardTile[] = [
  {
    emoji: '🌅',
    title: 'Daily Check-in',
    desc: 'Visit every day to earn bonus credits',
    points: '+5',
    color: colors.primary,
    disabled: true,
  },
  {
    emoji: '👥',
    title: 'Refer a Friend',
    desc: 'Earn 50 credits for each friend you invite',
    points: '+50',
    color: '#c4b5fd',
    route: '/referral',
  },
  {
    emoji: '🔥',
    title: '7-Day Streak',
    desc: 'Check in 7 days in a row for a bonus',
    points: '+35',
    color: '#f5a623',
    disabled: true,
  },
  {
    emoji: '⭐',
    title: 'Rate the App',
    desc: 'Share your experience on the store',
    points: '+20',
    color: '#00d4b8',
    disabled: true,
  },
  {
    emoji: '👤',
    title: 'Complete Profile',
    desc: 'Fill in your birth details to get started',
    points: '+10',
    color: '#ff80ab',
    route: '/(tabs)/profile',
  },
];

const PLANET_HALO: Record<string, [string, string]> = {
  sun:       ['#f5a623', '#a06310'],
  moon:      ['#b0c4de', '#5a6a85'],
  mars:      ['#e53935', '#7a1b18'],
  mercury:   ['#4caf50', '#1f5a23'],
  jupiter:   ['#ff9800', '#7a4500'],
  venus:     ['#ff80ab', '#7a3653'],
  saturn:    ['#607d8b', '#2a3a44'],
  rahu:      ['#9c27b0', '#4a0e57'],
  ketu:      ['#795548', '#3a261d'],
  ganesha:   ['#f5a623', '#a06310'],
  saraswati: ['#ffd1e8', '#a07090'],
  shiva:     ['#b0c4de', '#5a6a85'],
};

const DEITY_GLYPH: Record<string, string> = {
  sun: '☀', moon: '🌙', mars: '♂', mercury: '☿', jupiter: '♃',
  venus: '♀', saturn: '♄', rahu: '☊', ketu: '☋',
  ganesha: 'ॐ', saraswati: '✦', shiva: 'ॐ',
};

export default function RewardsScreen() {
  const router = useRouter();
  const credits = useStore((s) => s.credits);
  const { data: mantras } = useMantras();
  const { data: claimedKeys } = useClaimedTodayKeys();
  const jaapLock = useFeatureLock('mantra-jaap');

  const totalMantras = mantras?.length ?? 0;
  const claimedCount = claimedKeys?.size ?? 0;

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450 }}
          style={styles.header}
        >
          <Text style={styles.title}>Rewards</Text>
          <Text style={styles.subtitle}>Earn credits, unlock the cosmos</Text>
        </MotiView>

        {/* Wallet Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 80 }}
        >
          <LinearGradient
            colors={['rgba(139,90,43,0.55)', 'rgba(80,40,10,0.75)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <View style={styles.walletInner}>
              <View>
                <Text style={styles.walletLabel}>Your Balance</Text>
                <Text style={styles.walletAmount}>{credits}</Text>
                <Text style={styles.walletSuffix}>Cosmic Credits</Text>
              </View>
              <View style={styles.walletRight}>
                <Text style={styles.walletStarBig}>✦</Text>
                <Pressable onPress={() => router.push('/credits' as never)} style={styles.topUpBtn}>
                  <Text style={styles.topUpText}>Top Up →</Text>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Mantra Jaap section */}
        {totalMantras > 0 && (
          <View style={styles.mantraHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Mantra Jaap</Text>
              <Text style={styles.mantraSubtitle}>
                Chant and find peace · earn as you stay consistent
              </Text>
            </View>
            {jaapLock.locked ? (
              <View style={styles.comingSoonBadgeLg}>
                <Text style={styles.comingSoonTextLg}>Coming Soon</Text>
              </View>
            ) : (
              <View style={styles.claimedPill}>
                <Text style={styles.claimedPillText}>
                  Claimed: {claimedCount}/{totalMantras}
                </Text>
              </View>
            )}
          </View>
        )}

        {mantras?.map((mantra, i) => (
          <MantraTile
            key={mantra.key}
            mantra={mantra}
            claimed={claimedKeys?.has(mantra.key) ?? false}
            locked={jaapLock.locked}
            index={i}
            onPress={() => {
              if (jaapLock.locked) {
                const justUnlocked = jaapLock.recordTap();
                if (justUnlocked) {
                  router.push({ pathname: '/mantra-jaap', params: { key: mantra.key } } as never);
                }
                return;
              }
              router.push({ pathname: '/mantra-jaap', params: { key: mantra.key } } as never);
            }}
          />
        ))}

        {/* Ways to Earn */}
        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Ways to Earn</Text>

        {REWARD_TILES.map((tile, i) => (
          <MotiView
            key={tile.title}
            from={{ opacity: 0, translateX: 18 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 380, delay: i * 70 + 180 }}
          >
            <Card style={[styles.tileCard, tile.disabled && styles.tileCardDisabled]}>
              <View style={styles.tileRow}>
                <View style={[styles.tileIcon, { backgroundColor: `${tile.color}18` }]}>
                  <Text style={styles.tileEmoji}>{tile.emoji}</Text>
                </View>

                <View style={styles.tileText}>
                  <Text style={[styles.tileTitle, tile.disabled && { color: colors.textMuted }]}>{tile.title}</Text>
                  <Text style={styles.tileDesc}>{tile.desc}</Text>
                </View>

                <View style={styles.tileRight}>
                  <View style={[styles.pointsBadge, { backgroundColor: `${tile.color}18`, borderColor: `${tile.color}44` }]}>
                    <Text style={[styles.pointsText, { color: tile.color }]}>{tile.points}</Text>
                  </View>
                  {tile.disabled ? (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => router.push(tile.route! as never)}
                      style={[styles.earnBtn, { borderColor: `${tile.color}44`, backgroundColor: `${tile.color}12` }]}
                    >
                      <Text style={[styles.earnBtnText, { color: tile.color }]}>Earn</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Card>
          </MotiView>
        ))}

        {/* Referral CTA banner */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 560 }}
        >
          <Pressable onPress={() => router.push('/referral' as never)}>
            <LinearGradient
              colors={['rgba(168,127,255,0.18)', 'rgba(212,168,67,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.referralBanner}
            >
              <Text style={styles.referralEmoji}>🎁</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.referralTitle}>Invite Friends</Text>
                <Text style={styles.referralDesc}>Share your link · 50 credits per referral</Text>
              </View>
              <Text style={styles.referralArrow}>→</Text>
            </LinearGradient>
          </Pressable>
        </MotiView>
      </ScrollView>
    </View>
  );
}

function MantraTile({
  mantra,
  claimed,
  locked,
  index,
  onPress,
}: {
  mantra: Mantra;
  claimed: boolean;
  locked: boolean;
  index: number;
  onPress: () => void;
}) {
  const halo = PLANET_HALO[mantra.key] ?? ['#D4AF37', '#A07820'];
  const glyph = DEITY_GLYPH[mantra.key] ?? '✦';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 360, delay: index * 50 + 100 }}
    >
      <Pressable onPress={onPress} disabled={claimed}>
        <Card style={[styles.mantraCard, (claimed || locked) && styles.mantraCardClaimed]}>
          <View style={styles.tileRow}>
            <LinearGradient
              colors={[halo[0], halo[1]]}
              start={{ x: 0.2, y: 0.1 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.mantraBadge}
            >
              <Text style={styles.mantraBadgeGlyph}>{glyph}</Text>
            </LinearGradient>

            <View style={styles.tileText}>
              <Text style={styles.mantraTitle}>{mantra.name}</Text>
              <Text style={styles.mantraSubText} numberOfLines={1}>
                {mantra.mantra_text}
              </Text>
            </View>

            <View>
              {locked ? (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>🔒 Soon</Text>
                </View>
              ) : claimed ? (
                <View style={styles.claimedBadge}>
                  <Text style={styles.claimedBadgeText}>Claimed ✓</Text>
                </View>
              ) : (
                <View style={styles.claimBadge}>
                  <Text style={styles.claimBadgeText}>Claim ₹{mantra.reward_credits}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },

  header: { marginBottom: 22 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },

  walletCard: { borderRadius: 20, padding: 22, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(212,168,67,0.22)' },
  walletInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(240,232,208,0.6)', letterSpacing: 0.8, textTransform: 'uppercase' },
  walletAmount: { fontSize: 48, fontFamily: 'Poppins_700Bold', color: colors.primary, lineHeight: 56 },
  walletSuffix: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(240,232,208,0.55)' },
  walletRight: { alignItems: 'center', gap: 14 },
  walletStarBig: { fontSize: 36, color: colors.primary, opacity: 0.4 },
  topUpBtn: { backgroundColor: 'rgba(212,168,67,0.18)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  topUpText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },

  mantraHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mantraSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(225,226,235,0.55)',
    marginTop: -4,
    marginBottom: 8,
    maxWidth: 220,
  },
  claimedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(242,202,80,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.35)',
  },
  claimedPillText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#F2CA50',
  },

  mantraCard: { marginBottom: 10, backgroundColor: colors.bgSurface, borderColor: colors.border },
  mantraCardClaimed: { opacity: 0.65 },
  mantraBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.35)',
  },
  mantraBadgeGlyph: { fontSize: 22, color: '#1E0E07' },
  mantraTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 3 },
  mantraSubText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(225,226,235,0.55)' },
  claimBadge: {
    backgroundColor: 'rgba(242,202,80,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  claimBadgeText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#F2CA50' },
  claimedBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  claimedBadgeText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(225,226,235,0.55)' },
  lockBadge: {
    backgroundColor: 'rgba(168,127,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(168,127,255,0.32)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lockBadgeText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#c4b5fd' },
  comingSoonBadgeLg: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(168,127,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(168,127,255,0.32)',
  },
  comingSoonTextLg: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#c4b5fd',
    letterSpacing: 0.4,
  },

  tileCard: { marginBottom: 10, backgroundColor: colors.bgSurface, borderColor: colors.border },
  tileCardDisabled: { opacity: 0.7 },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tileIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tileEmoji: { fontSize: 22 },
  tileText: { flex: 1 },
  tileTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 3 },
  tileDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 16 },
  tileRight: { alignItems: 'center', gap: 7, flexShrink: 0 },
  pointsBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  pointsText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  comingSoonBadge: { backgroundColor: colors.bgElevated, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  comingSoonText: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: colors.textMuted },
  earnBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  earnBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  referralBanner: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: 'rgba(168,127,255,0.22)', marginTop: 6 },
  referralEmoji: { fontSize: 28 },
  referralTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 3 },
  referralDesc: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  referralArrow: { fontSize: 18, color: colors.primary },
});
