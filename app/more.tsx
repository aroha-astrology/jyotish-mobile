import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { colors } from '@/constants/theme';
import { useFeatureLock } from '@/lib/useFeatureLock';

// ── Feature data ──────────────────────────────────────────────────────────────

interface Feature {
  emoji: string;
  name: string;
  description: string;
  route: string;
  /** If set, the feature is hidden behind a 5-tap unlock gate. */
  lockKey?: string;
}

interface FeatureCategory {
  title: string;
  features: Feature[];
}

const CATEGORIES: FeatureCategory[] = [
  {
    title: 'Your Chart',
    features: [
      { emoji: '🔮', name: 'Kundli', description: 'Your Vedic birth chart', route: '/kundli/generate' },
      { emoji: '📊', name: 'Divisional Charts', description: 'Varga charts for deeper insight', route: '/vargas' },
      { emoji: '🔭', name: 'KP System', description: 'Krishnamurti Paddhati analysis', route: '/kp-system' },
      { emoji: '🎂', name: 'Varshaphal', description: 'Annual solar return predictions', route: '/varshaphal' },
      { emoji: '🌍', name: 'Gochar', description: 'Current planetary transits', route: '/gochar' },
    ],
  },
  {
    title: 'Daily Guidance',
    features: [
      { emoji: '📅', name: 'Panchang', description: 'Daily almanac & timings', route: '/panchang' },
      { emoji: '🗓️', name: 'Calendar', description: 'Auspicious days monthly view', route: '/calendar' },
      { emoji: '⏰', name: 'Muhurta', description: 'Find the best time for any event', route: '/muhurta' },
      { emoji: '⭐', name: 'Personal Daily', description: 'Personalized guidance for today', route: '/(tabs)/index' },
      { emoji: '🌟', name: 'Horoscope', description: 'Daily zodiac predictions', route: '/horoscope/daily' },
    ],
  },
  {
    title: 'Compatibility',
    features: [
      { emoji: '💑', name: 'Kundli Match', description: 'Ashtakoota marriage compatibility', route: '/match/new' },
      { emoji: '❤️', name: 'Couple Analysis', description: 'Synastry for two charts', route: '/couple' },
    ],
  },
  {
    title: 'Readings',
    features: [
      { emoji: '🤚', name: 'Palm Reading', description: 'AI-powered palmistry analysis', route: '/palm', lockKey: 'palm' },
      { emoji: '🃏', name: 'Tarot', description: 'Tarot card spread readings', route: '/tarot' },
      { emoji: '💤', name: 'Dreams', description: 'Vedic dream interpretation', route: '/dreams' },
      { emoji: '❓', name: 'Prashna', description: 'Horary astrology answers', route: '/prashna' },
    ],
  },
  {
    title: 'Remedies & Tools',
    features: [
      { emoji: '💎', name: 'Gemstones', description: 'Planetary gemstone guidance', route: '/gemstone' },
      { emoji: '🙏', name: 'Remedies', description: 'Mantras, rituals & remedies', route: '/remedies' },
      { emoji: '🏠', name: 'Vastu', description: 'Home direction analysis', route: '/vastu' },
      { emoji: '👶', name: 'Baby Names', description: 'Nakshatra-based name finder', route: '/baby-names' },
    ],
  },
  {
    title: 'Reports',
    features: [
      { emoji: '📄', name: 'Premium Reports', description: 'Detailed PDF predictions', route: '/reports/premium' },
      { emoji: '🎬', name: 'Video Reading', description: 'AI video with narration', route: '/video' },
      { emoji: '🌿', name: 'Life Journey', description: 'Your Vimshottari dasha timeline', route: '/life-journey/index' },
    ],
  },
  {
    title: 'Account',
    features: [
      { emoji: '💰', name: 'Credits', description: 'Manage your credit balance', route: '/credits' },
      { emoji: '🎁', name: 'Referral', description: 'Earn credits by referring friends', route: '/referral' },
      { emoji: '⚙️', name: 'Settings', description: 'App preferences & account', route: '/settings' },
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureRow({
  feature,
  onPress,
  index,
  locked,
}: {
  feature: Feature;
  onPress: () => void;
  index: number;
  locked: boolean;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 30 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.featureRow,
          pressed && styles.featureRowPressed,
          locked && styles.featureRowLocked,
        ]}
      >
        <View style={styles.featureIcon}>
          <Text style={styles.featureEmoji}>{feature.emoji}</Text>
        </View>
        <View style={styles.featureText}>
          <Text style={[styles.featureName, locked && styles.featureNameLocked]}>
            {feature.name}
          </Text>
          <Text style={styles.featureDesc} numberOfLines={1}>
            {feature.description}
          </Text>
        </View>
        {locked ? (
          <View style={styles.lockPill}>
            <Text style={styles.lockPillText}>Coming Soon</Text>
          </View>
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </Pressable>
    </MotiView>
  );
}

function CategorySection({
  category,
  startIndex,
  onSelect,
  locks,
}: {
  category: FeatureCategory;
  startIndex: number;
  onSelect: (feature: Feature) => void;
  locks: Record<string, boolean>;
}) {
  return (
    <View style={styles.categorySection}>
      <Text style={styles.categoryHeader}>{category.title.toUpperCase()}</Text>
      <View style={styles.categoryCard}>
        {category.features.map((feature, i) => {
          const locked = !!(feature.lockKey && locks[feature.lockKey]);
          return (
            <View key={feature.route}>
              <FeatureRow
                feature={feature}
                index={startIndex + i}
                locked={locked}
                onPress={() => onSelect(feature)}
              />
              {i < category.features.length - 1 && (
                <View style={styles.rowDivider} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MoreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const palmLock = useFeatureLock('palm');

  const locks: Record<string, boolean> = { palm: palmLock.locked };

  const handleSelect = (feature: Feature) => {
    if (feature.lockKey === 'palm' && palmLock.locked) {
      const justUnlocked = palmLock.recordTap();
      if (justUnlocked) router.push(feature.route as never);
      return;
    }
    router.push(feature.route as never);
  };

  const filteredCategories = useMemo<FeatureCategory[]>(() => {
    if (!query.trim()) return CATEGORIES;
    const lower = query.toLowerCase();
    return CATEGORIES.reduce<FeatureCategory[]>((acc, cat) => {
      const filtered = cat.features.filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          f.description.toLowerCase().includes(lower)
      );
      if (filtered.length > 0) {
        acc.push({ ...cat, features: filtered });
      }
      return acc;
    }, []);
  }, [query]);

  let runningIndex = 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 380 }}
          style={styles.header}
        >
          <Text style={styles.title}>All Features</Text>
          <Text style={styles.subtitle}>
            {CATEGORIES.reduce((n, c) => n + c.features.length, 0)} tools &
            readings
          </Text>
        </MotiView>

        {/* Search bar */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 80 }}
          style={styles.searchWrap}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search features…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          )}
        </MotiView>

        {/* Results count while searching */}
        {query.trim().length > 0 && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <Text style={styles.resultCount}>
              {filteredCategories.reduce(
                (n, c) => n + c.features.length,
                0
              )}{' '}
              result
              {filteredCategories.reduce((n, c) => n + c.features.length, 0) !==
              1
                ? 's'
                : ''}
            </Text>
          </MotiView>
        )}

        {/* Category sections */}
        {filteredCategories.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
            style={styles.emptyWrap}
          >
            <Text style={styles.emptyEmoji}>🔭</Text>
            <Text style={styles.emptyTitle}>No features found</Text>
            <Text style={styles.emptySub}>
              Try a different search term.
            </Text>
          </MotiView>
        ) : (
          filteredCategories.map((cat) => {
            const sectionStart = runningIndex;
            runningIndex += cat.features.length;
            return (
              <CategorySection
                key={cat.title}
                category={cat}
                startIndex={sectionStart}
                onSelect={handleSelect}
                locks={locks}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 60 },

  // Header
  header: { marginBottom: 18 },
  title: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { fontSize: 12, color: colors.textMuted },

  resultCount: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginBottom: 12,
  },

  // Category
  categorySection: { marginBottom: 24 },
  categoryHeader: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Feature row
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  featureRowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  featureRowLocked: { opacity: 0.7 },
  featureNameLocked: { color: colors.textMuted },
  lockPill: {
    backgroundColor: 'rgba(168,127,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(168,127,255,0.32)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 4,
  },
  lockPillText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#c4b5fd',
    letterSpacing: 0.3,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureEmoji: { fontSize: 18 },
  featureText: { flex: 1 },
  featureName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  featureDesc: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    marginLeft: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 16,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
