'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';
import { getPanchang, getKundliCharts, getDailyHoroscope } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

// ── Constants ─────────────────────────────────────────────────────────────────

const RASHI_DATA = [
  { sign: 'Aries',       symbol: '♈', rashi: 'Mesha',     element: 'Fire'  },
  { sign: 'Taurus',      symbol: '♉', rashi: 'Vrishabha', element: 'Earth' },
  { sign: 'Gemini',      symbol: '♊', rashi: 'Mithuna',   element: 'Air'   },
  { sign: 'Cancer',      symbol: '♋', rashi: 'Karka',     element: 'Water' },
  { sign: 'Leo',         symbol: '♌', rashi: 'Simha',     element: 'Fire'  },
  { sign: 'Virgo',       symbol: '♍', rashi: 'Kanya',     element: 'Earth' },
  { sign: 'Libra',       symbol: '♎', rashi: 'Tula',      element: 'Air'   },
  { sign: 'Scorpio',     symbol: '♏', rashi: 'Vrischika', element: 'Water' },
  { sign: 'Sagittarius', symbol: '♐', rashi: 'Dhanu',     element: 'Fire'  },
  { sign: 'Capricorn',   symbol: '♑', rashi: 'Makara',    element: 'Earth' },
  { sign: 'Aquarius',    symbol: '♒', rashi: 'Kumbha',    element: 'Air'   },
  { sign: 'Pisces',      symbol: '♓', rashi: 'Meena',     element: 'Water' },
] as const;

const SIGN_RASHI: Record<string, string> = {
  Aries:'mesha',Taurus:'vrishabha',Gemini:'mithuna',Cancer:'karka',Leo:'simha',Virgo:'kanya',
  Libra:'tula',Scorpio:'vrischika',Sagittarius:'dhanu',Capricorn:'makara',Aquarius:'kumbha',Pisces:'meena',
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#FF6B4A', Earth: '#4CAF50', Air: '#a87fff', Water: '#3B82F6',
};
const ELEMENT_ICON_BG: Record<string, string> = {
  Fire: '#B71C1C', Earth: '#1B5E20', Air: '#4527A0', Water: '#0D47A1',
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_W = 88;
const CARD_GAP = 10;
const CAROUSEL_SIDE_PAD = (SCREEN_WIDTH - CARD_W) / 2;

const PLANET_BLURB: Record<string, string> = {
  Sun: 'Identity, authority, and self-expression take centre stage.',
  Moon: 'Emotional depth, home life, and intuitive shifts dominate.',
  Mars: 'Drive, courage, and bold action — but watch the temper.',
  Mercury: 'Communication, learning, and clever moves come naturally.',
  Jupiter: 'Growth, expansion, and wisdom — trust your inner compass.',
  Venus: 'Love, beauty, creativity, and pleasure flow through life now.',
  Saturn: 'Discipline, patience, and slow karmic gains shape this period.',
  Rahu: 'Unconventional ambitions and sudden shifts — buckle up.',
  Ketu: 'Detachment, spiritual insight, and quiet inner work.',
};

const REPORTS = [
  { name: 'Love & Relationships', emoji: '💕', accent: '#E91E63', href: '/couple' },
  { name: 'Vastu Shastra',        emoji: '🏛️', accent: '#d4a843', href: '/vastu' },
  { name: 'Divisional Charts',    emoji: '🔭', accent: '#a87fff', href: '/vargas' },
  { name: 'Wealth Report',        emoji: '💎', accent: '#059669', href: '/reports/premium', locked: true },
  { name: 'Past Life Report',     emoji: '🌙', accent: '#7C3AED', href: '/reports/premium', locked: true },
  { name: 'Career Report',        emoji: '⭐', accent: '#2563EB', href: '/reports/career',  locked: false },
] as const;

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const rashiListRef = useRef<FlatList>(null);

  const firstName = user?.display_name?.split(' ')[0] ?? 'Seeker';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const initial = user?.display_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '✦';

  // Data
  const { data: chartsResp } = useQuery({
    queryKey: queryKeys.kundliCharts(),
    queryFn: getKundliCharts,
    enabled: !!user,
  });
  const { data: panchangResp } = useQuery({
    queryKey: queryKeys.panchangToday(),
    queryFn: () => getPanchang(),
    staleTime: 1000 * 60 * 60 * 4,
    enabled: !!user,
  });
  const { data: horoscopeResp } = useQuery({
    queryKey: queryKeys.horoscopeDaily(),
    queryFn: () => getDailyHoroscope(),
    staleTime: 1000 * 60 * 60 * 4,
    enabled: !!user,
  });

  const charts = chartsResp?.data ?? [];
  const activeChart = charts[0] as Record<string, unknown> | undefined;
  const panchang = panchangResp?.data;
  // horoscopeResp is { success, data: { mesha: {...}, vrishabha: {...}, ... } }
  const horoscope = (horoscopeResp as { data?: Record<string, unknown> })?.data ?? {};

  // Dasha info from chart
  const dashaInfo = useMemo(() => {
    if (!activeChart) return null;
    const v = (activeChart.dasha_data as Record<string, unknown> | undefined)
      ?.vimshottari as Record<string, unknown> | undefined;
    const md = v?.currentMahadasha as Record<string, unknown> | undefined;
    const ad = v?.currentAntardasha as Record<string, unknown> | undefined;
    if (!md?.planet) return null;
    return {
      mahadasha: md.planet as string,
      antardasha: (ad?.planet as string) ?? null,
      mdEnd: md.endDate as string | undefined,
      adEnd: ad?.endDate as string | undefined,
    };
  }, [activeChart]);

  // Moon sign from chart
  const userMoonSign = useMemo(() => {
    if (!activeChart) return null;
    const planets = ((activeChart.chart_data as Record<string, unknown> | undefined)?.planets ?? []) as Array<{planet?: string; name?: string; sign?: string}>;
    const moon = planets.find((p) => (p.planet ?? p.name) === 'Moon');
    const sign = moon?.sign;
    return sign && RASHI_DATA.some((r) => r.sign === sign) ? sign : null;
  }, [activeChart]);

  useEffect(() => {
    if (userMoonSign && !selectedSign) setSelectedSign(userMoonSign);
  }, [userMoonSign]);

  useEffect(() => {
    const sign = selectedSign ?? userMoonSign;
    if (!sign) return;
    const idx = RASHI_DATA.findIndex((r) => r.sign === sign);
    if (idx >= 0) {
      setTimeout(() => {
        rashiListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      }, 350);
    }
  }, [selectedSign, userMoonSign]);

  const activeSign = selectedSign ?? userMoonSign;
  const activeRashi = activeSign ? SIGN_RASHI[activeSign] : null;
  const activeHoroscope = activeRashi ? (horoscope as Record<string, {general?: string; career?: string; love?: string; health?: string}>)[activeRashi] : null;

  const handleReportPress = useCallback((href: string) => {
    router.push(href as never);
  }, [router]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── DARK COSMIC TOP SECTION ── */}
      <View style={styles.darkSection}>

        {/* Greeting */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }}>
          <View style={styles.greetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <View>
              <Text style={styles.greetingName}>Namaste, {firstName}!</Text>
              <Text style={styles.greetingTime}>{greeting}</Text>
            </View>
          </View>
        </MotiView>

        {/* Dasha Widget */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 550, delay: 80 }}>
          <TouchableOpacity
            style={styles.dashaCard}
            onPress={() => router.push('/life-journey/index' as never)}
            activeOpacity={0.85}
          >
            <View style={styles.dashaHeader}>
              <Text style={styles.dashaTitle}>🌙 YOUR CURRENT DASHA</Text>
              {dashaInfo ? (
                <View style={styles.dashaBadge}>
                  <View style={styles.dashaDot} />
                  <Text style={styles.dashaBadgeText}>
                    🪐 {dashaInfo.mahadasha}{dashaInfo.antardasha ? ` · ${dashaInfo.antardasha}` : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.dashaBadge}>
                  <Text style={styles.dashaBadgeText}>Generate Chart →</Text>
                </View>
              )}
            </View>
            {dashaInfo ? (
              <>
                <Text style={styles.dashaBody}>
                  <Text style={styles.dashaBold}>{dashaInfo.mahadasha} Mahadasha</Text>
                  {dashaInfo.antardasha ? <Text> · <Text style={styles.dashaBold}>{dashaInfo.antardasha} Antardasha</Text></Text> : null}
                  {' '}— {PLANET_BLURB[dashaInfo.mahadasha] ?? 'A significant cosmic chapter is active.'}
                </Text>
                <View style={styles.dashaStats}>
                  {dashaInfo.adEnd && (
                    <View style={styles.dashaStat}>
                      <Text style={styles.dashaStatLabel}>Antardasha ends in</Text>
                      <Text style={styles.dashaStatValue}>{daysUntil(dashaInfo.adEnd) ?? '—'} days</Text>
                    </View>
                  )}
                  {dashaInfo.mdEnd && (
                    <View style={styles.dashaStat}>
                      <Text style={styles.dashaStatLabel}>Mahadasha ends</Text>
                      <Text style={styles.dashaStatValue}>{new Date(dashaInfo.mdEnd).getFullYear()}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dashaTap}>Tap to see full dasha journey →</Text>
              </>
            ) : (
              <Text style={styles.dashaBody}>Generate your Kundli to unlock personalised Dasha insights and life predictions.</Text>
            )}
          </TouchableOpacity>
        </MotiView>

        {/* Horoscope header */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 150 }}>
          <View style={styles.horoscopeHeader}>
            <Text style={styles.horoscopeLabel}>— YOUR DAILY HOROSCOPE —</Text>
            <Text style={styles.horoscopeDate}>
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>

          {/* Rashi Carousel */}
          <FlatList
            ref={rashiListRef}
            horizontal
            data={RASHI_DATA as unknown as Array<{ sign: string; symbol: string; rashi: string; element: string }>}
            keyExtractor={(r) => r.sign}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: CAROUSEL_SIDE_PAD, gap: CARD_GAP, paddingBottom: 6 }}
            style={{ marginBottom: 14 }}
            getItemLayout={(_, index) => ({ length: CARD_W, offset: (CARD_W + CARD_GAP) * index, index })}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item: r }) => {
              const isSelected = activeSign === r.sign;
              const isMoon = userMoonSign === r.sign;
              const elemColor = ELEMENT_COLORS[r.element] ?? '#FFA07A';
              const iconBg = ELEMENT_ICON_BG[r.element] ?? '#333';
              return (
                <TouchableOpacity
                  onPress={() => setSelectedSign(r.sign)}
                  style={[styles.rashiCard, isSelected && styles.rashiCardSelected, isMoon && !isSelected && styles.rashiCardMoon]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.rashiIconBox, { backgroundColor: iconBg }]}>
                    <Text style={styles.rashiSymbol}>{r.symbol}</Text>
                  </View>
                  <Text style={styles.rashiSign}>{r.sign.toUpperCase()}</Text>
                  <Text style={[styles.rashiElement, { color: elemColor }]}>{r.element}</Text>
                  <View style={[styles.rashiPill, isSelected && styles.rashiPillActive]}>
                    <Text style={[styles.rashiPillText, isSelected && styles.rashiPillTextActive]}>{r.rashi.toUpperCase()}</Text>
                  </View>
                  {isMoon && <View style={styles.moonDot} />}
                </TouchableOpacity>
              );
            }}
          />

          {/* Horoscope card */}
          {activeSign && (
            <View style={styles.horoscopeCard}>
              <View style={styles.horoscopeCardHeader}>
                <Text style={{ fontSize: 18 }}>{RASHI_DATA.find((r) => r.sign === activeSign)?.symbol}</Text>
                <Text style={styles.horoscopeCardSign}>{activeSign}</Text>
                <Text style={styles.horoscopeCardRashi}>· {RASHI_DATA.find((r) => r.sign === activeSign)?.rashi}</Text>
                {userMoonSign === activeSign && (
                  <View style={styles.moonBadge}><Text style={styles.moonBadgeText}>☽ Moon Sign</Text></View>
                )}
              </View>
              {activeHoroscope?.general ? (
                <Text style={styles.horoscopeText} numberOfLines={4}>{activeHoroscope.general}</Text>
              ) : (
                <View style={{ paddingVertical: 8 }}><ActivityIndicator color={colors.primary} size="small" /></View>
              )}
              <TouchableOpacity onPress={() => router.push('/horoscope/daily' as never)} style={styles.horoscopeMore}>
                <Text style={styles.horoscopeMoreText}>Full reading →</Text>
              </TouchableOpacity>
            </View>
          )}
        </MotiView>
      </View>

      {/* ── REPORTS GRID ── */}
      <View style={styles.lightSection}>
        <Text style={styles.sectionTitle}>✦ Reports & Insights</Text>
        <View style={styles.reportsGrid}>
          {REPORTS.map((r, i) => (
            <MotiView
              key={r.name}
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: i * 60 }}
              style={{ width: '48%' }}
            >
              <TouchableOpacity
                style={[styles.reportCard, { borderColor: r.accent + '40' }]}
                onPress={() => handleReportPress(r.href)}
                activeOpacity={0.82}
              >
                <View style={[styles.reportEmoji, { backgroundColor: r.accent + '18' }]}>
                  <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                </View>
                <Text style={styles.reportName}>{r.name}</Text>
                {'locked' in r && r.locked && (
                  <View style={styles.lockedBadge}><Text style={styles.lockedText}>🔒 Premium</Text></View>
                )}
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {/* ── PANCHANG ── */}
        {panchang && (
          <TouchableOpacity style={styles.panchangCard} onPress={() => router.push('/panchang' as never)} activeOpacity={0.88}>
            <View style={styles.panchangHeader}>
              <Text style={styles.panchangTitle}>📅 Today's Panchang</Text>
              <Text style={styles.panchangDate}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.panchangGrid}>
              {[
                { label: 'Tithi',     value: panchang.tithi },
                { label: 'Nakshatra', value: panchang.nakshatra },
                { label: 'Yoga',      value: panchang.yoga },
                { label: 'Karana',    value: panchang.karana },
              ].map((item) => (
                <View key={item.label} style={styles.panchangCell}>
                  <Text style={styles.panchangLabel}>{item.label}</Text>
                  <Text style={styles.panchangValue} numberOfLines={2}>{item.value ?? '—'}</Text>
                </View>
              ))}
            </View>
            <View style={styles.panchangFooter}>
              <Text style={styles.panchangFooterText}>🌅 {panchang.sunrise ?? '—'}</Text>
              <Text style={styles.panchangFooterText}>🌇 {panchang.sunset ?? '—'}</Text>
              <Text style={styles.panchangFooterText}>⚠️ Rahu: {panchang.rahuKaal?.display ?? '—'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>⚡ Quick Actions</Text>
        <View style={styles.quickGrid}>
          {[
            { emoji: '⭐', label: 'Kundli',    route: '/kundli/generate' },
            { emoji: '💕', label: 'Match',      route: '/match/new' },
            { emoji: '☀️', label: 'Horoscope', route: '/horoscope/daily' },
            { emoji: '📅', label: 'Panchang',  route: '/panchang' },
            { emoji: '🌙', label: 'Dreams',    route: '/dreams' },
            { emoji: '🕐', label: 'Muhurta',   route: '/muhurta' },
            { emoji: '💊', label: 'Remedies',  route: '/remedies' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickCard}
              onPress={() => router.push(action.route as never)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22, marginBottom: 4 }}>{action.emoji}</Text>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },

  // Dark top section
  darkSection: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },

  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(139,98,64,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff' },
  greetingName: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  greetingTime: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.55)' },

  // Dasha card
  dashaCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    padding: 14, marginBottom: 20,
  },
  dashaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 },
  dashaTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },
  dashaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(218,165,32,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  dashaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DAA520' },
  dashaBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#DAA520' },
  dashaBody: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.72)', lineHeight: 18, marginBottom: 10 },
  dashaBold: { fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.95)' },
  dashaStats: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  dashaStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dashaStatLabel: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  dashaStatValue: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff' },
  dashaTap: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.35)', textAlign: 'right' },

  // Horoscope
  horoscopeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  horoscopeLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#FFA07A', letterSpacing: 1 },
  horoscopeDate: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.35)' },

  rashiCard: {
    width: CARD_W, height: 128, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10,
  },
  rashiCardSelected: {
    backgroundColor: 'rgba(20,10,40,0.9)', borderColor: '#D4A843',
    shadowColor: '#D4A843', shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  rashiCardMoon: { borderColor: 'rgba(212,168,67,0.5)', borderWidth: 1.5 },
  rashiIconBox: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  rashiSymbol: { fontSize: 20, color: '#fff', lineHeight: 24 },
  rashiSign: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: '#fff', textAlign: 'center', letterSpacing: 0.4 },
  rashiElement: { fontSize: 7, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  rashiPill: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  rashiPillActive: { backgroundColor: 'rgba(212,168,67,0.18)', borderColor: 'rgba(212,168,67,0.5)' },
  rashiPillText: { fontSize: 7, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.5)' },
  rashiPillTextActive: { color: '#D4A843' },
  moonDot: {
    position: 'absolute', top: 6, right: 6, width: 6, height: 6,
    borderRadius: 3, backgroundColor: '#D4A843',
  },

  horoscopeCard: {
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,107,74,0.12)',
  },
  horoscopeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  horoscopeCardSign: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff' },
  horoscopeCardRashi: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.45)' },
  moonBadge: { marginLeft: 'auto' as never, backgroundColor: 'rgba(212,168,67,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)' },
  moonBadgeText: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  horoscopeText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#fff', lineHeight: 20, marginBottom: 10 },
  horoscopeMore: { alignSelf: 'flex-end' },
  horoscopeMoreText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  // Light parchment section
  lightSection: { backgroundColor: '#F5EFE0', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#3E2723', marginBottom: 14, letterSpacing: 0.5 },

  // Reports
  reportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  reportCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2, minHeight: 110,
  },
  reportEmoji: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  reportName: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#3E2723', lineHeight: 16 },
  lockedBadge: { marginTop: 6, backgroundColor: 'rgba(92,46,14,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  lockedText: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: '#8B7355' },

  // Panchang
  panchangCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)',
    shadowColor: '#d4a843', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 },
  },
  panchangHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  panchangTitle: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#3E2723' },
  panchangDate: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8B7355' },
  panchangGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1, marginBottom: 10 },
  panchangCell: { width: '50%', paddingVertical: 8, paddingHorizontal: 4 },
  panchangLabel: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: '#8B7355', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  panchangValue: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#5C2E0E' },
  panchangFooter: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: 'rgba(212,168,67,0.15)', paddingTop: 10 },
  panchangFooterText: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#8B7355' },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  quickLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#5C2E0E' },
});
