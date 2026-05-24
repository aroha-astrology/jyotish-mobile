import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { getCreditHistory, getCreditsBalance, redeemCoupon, type CreditTransaction } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';

const CREDIT_PACKS = [
  {
    id: 'starter',
    credits: 10,
    price: '₹99',
    priceNum: 99,
    label: 'Starter',
    desc: 'Try it out',
    badge: null,
    color: colors.textSecondary,
  },
  {
    id: 'standard',
    credits: 30,
    price: '₹249',
    priceNum: 249,
    label: 'Standard',
    desc: 'Most popular',
    badge: 'Popular',
    color: colors.primary,
  },
  {
    id: 'premium',
    credits: 100,
    price: '₹699',
    priceNum: 699,
    label: 'Premium',
    desc: 'Best value',
    badge: 'Best Value',
    color: '#c4b5fd',
  },
  {
    id: 'ultimate',
    credits: 500,
    price: '₹2,499',
    priceNum: 2499,
    label: 'Ultimate',
    desc: 'Power user',
    badge: null,
    color: '#00d4b8',
  },
];

const COST_GUIDE = [
  { feature: 'Kundli Generation', cost: 'Free', icon: '🔮' },
  { feature: 'Detailed Report', cost: '3 credits', icon: '📜' },
  { feature: 'AI Chat (per Q)', cost: '1 credit', icon: '💬' },
  { feature: 'Palm Reading', cost: '5 credits', icon: '🤚' },
  { feature: 'Numerology Report', cost: '3 credits', icon: '🔢' },
  { feature: 'Compatibility Match', cost: '5 credits', icon: '💑' },
];

function formatTxDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CreditsScreen() {
  const router = useRouter();
  const credits = useStore((s) => s.credits);
  const setCredits = useStore((s) => s.setCredits);
  const [selectedPack, setSelectedPack] = useState('standard');
  const [coupon, setCoupon] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['credit-history'],
    queryFn: getCreditHistory,
    staleTime: 2 * 60 * 1000,
  });

  const transactions = historyData?.data ?? [];

  const handleRedeem = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setCouponSuccess('');
    setCouponLoading(true);
    try {
      const res = await redeemCoupon(code);
      if (res.success) {
        setCouponSuccess(`✓ ${res.message ?? `${res.credits} credits added!`}`);
        setCoupon('');
        setCredits(credits + (res.credits ?? 0));
      } else {
        setCouponError('Invalid or expired coupon');
      }
    } catch {
      setCouponError('Invalid or expired coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleBuy = () => {
    Alert.alert(
      'Buy Credits',
      'Payment integration coming soon! We\'ll notify you when Razorpay is live.',
      [{ text: 'OK' }]
    );
  };

  const pack = CREDIT_PACKS.find((p) => p.id === selectedPack)!;

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 450 }} style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Credits & Plans</Text>
            <Text style={styles.subtitle}>Fuel your cosmic journey</Text>
          </View>
        </MotiView>

        {/* Balance Card */}
        <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 80 }}>
          <LinearGradient
            colors={['rgba(139,90,43,0.6)', 'rgba(80,40,10,0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceInner}>
              <View>
                <Text style={styles.balanceLabel}>Your Balance</Text>
                <Text style={styles.balanceAmount}>{credits}</Text>
                <Text style={styles.balanceSuffix}>Cosmic Credits</Text>
              </View>
              <Text style={styles.balanceStar}>✦</Text>
            </View>
            <Text style={styles.balanceNote}>1 credit = 1 cosmic feature · Never expires</Text>
          </LinearGradient>
        </MotiView>

        {/* Credit Pack Selector */}
        <Text style={styles.sectionTitle}>Buy Credits</Text>
        <View style={styles.packGrid}>
          {CREDIT_PACKS.map((p, i) => (
            <MotiView
              key={p.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350, delay: i * 60 + 150 }}
              style={{ width: '48%' }}
            >
              <Pressable
                onPress={() => setSelectedPack(p.id)}
                style={[styles.packCard, selectedPack === p.id && { borderColor: p.color, backgroundColor: `${p.color}0d` }]}
              >
                {p.badge && (
                  <View style={[styles.packBadge, { backgroundColor: `${p.color}22`, borderColor: `${p.color}44` }]}>
                    <Text style={[styles.packBadgeText, { color: p.color }]}>{p.badge}</Text>
                  </View>
                )}
                <Text style={[styles.packCredits, { color: selectedPack === p.id ? p.color : colors.text }]}>{p.credits}</Text>
                <Text style={styles.packCreditsLabel}>credits</Text>
                <Text style={styles.packPrice}>{p.price}</Text>
                <Text style={styles.packDesc}>{p.desc}</Text>
                {selectedPack === p.id && (
                  <View style={[styles.selectedDot, { backgroundColor: p.color }]} />
                )}
              </Pressable>
            </MotiView>
          ))}
        </View>

        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 350 }}>
          <Pressable onPress={handleBuy} style={styles.buyBtn}>
            <Text style={styles.buyBtnText}>Buy {pack.credits} Credits for {pack.price}</Text>
          </Pressable>
          <Text style={styles.buyNote}>Secure payment via Razorpay · Instant delivery</Text>
        </MotiView>

        {/* Redeem Coupon */}
        <Text style={styles.sectionTitle}>Redeem Coupon</Text>
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 400 }}>
          <Card style={styles.couponCard}>
            <View style={styles.couponRow}>
              <TextInput
                value={coupon}
                onChangeText={(t) => { setCoupon(t.toUpperCase()); setCouponError(''); setCouponSuccess(''); }}
                placeholder="ENTER CODE"
                placeholderTextColor={colors.textMuted}
                style={styles.couponInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Pressable
                onPress={handleRedeem}
                disabled={!coupon.trim() || couponLoading}
                style={[styles.couponBtn, (!coupon.trim() || couponLoading) && { opacity: 0.5 }]}
              >
                {couponLoading ? (
                  <ActivityIndicator color={colors.bg} size="small" />
                ) : (
                  <Text style={styles.couponBtnText}>Redeem</Text>
                )}
              </Pressable>
            </View>
            {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
            {couponSuccess ? <Text style={styles.couponSuccess}>{couponSuccess}</Text> : null}
          </Card>
        </MotiView>

        {/* Cost Guide */}
        <Text style={styles.sectionTitle}>Credit Cost Guide</Text>
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 500 }}>
          <Card style={styles.guideCard}>
            {COST_GUIDE.map((item, i) => (
              <View key={item.feature}>
                <View style={styles.guideRow}>
                  <View style={styles.guideLeft}>
                    <Text style={styles.guideIcon}>{item.icon}</Text>
                    <Text style={styles.guideFeature}>{item.feature}</Text>
                  </View>
                  <Badge variant={item.cost === 'Free' ? 'teal' : 'gold'}>{item.cost}</Badge>
                </View>
                {i < COST_GUIDE.length - 1 && <View style={styles.guideSep} />}
              </View>
            ))}
          </Card>
        </MotiView>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {historyLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 600 }}>
            <Card style={styles.txCard}>
              {transactions.slice(0, 10).map((tx: CreditTransaction, i: number) => (
                <View key={tx.id}>
                  <View style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <Text style={styles.txIcon}>
                        {tx.type === 'purchase' ? '➕' : tx.type === 'reward' ? '🎁' : tx.type === 'refund' ? '↩️' : '➖'}
                      </Text>
                      <View>
                        <Text style={styles.txDesc}>{tx.description}</Text>
                        <Text style={styles.txDate}>{formatTxDate(tx.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.txAmount, tx.amount > 0 ? styles.txPos : styles.txNeg]}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Text>
                  </View>
                  {i < transactions.length - 1 && <View style={styles.guideSep} />}
                </View>
              ))}
            </Card>
          </MotiView>
        )}

        {/* Guarantees */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 700 }}>
          <View style={styles.guaranteeRow}>
            {['🔒 Razorpay Secure', '⚡ Instant Delivery', '♾️ No Expiry', '0 Hidden Charges'].map((g) => (
              <View key={g} style={styles.guaranteePill}>
                <Text style={styles.guaranteeText}>{g}</Text>
              </View>
            ))}
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  balanceCard: { borderRadius: 20, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)' },
  balanceInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(240,232,208,0.55)', letterSpacing: 0.8, textTransform: 'uppercase' },
  balanceAmount: { fontSize: 52, fontFamily: 'Poppins_700Bold', color: colors.primary, lineHeight: 60 },
  balanceSuffix: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(240,232,208,0.55)' },
  balanceStar: { fontSize: 40, color: colors.primary, opacity: 0.35 },
  balanceNote: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(240,232,208,0.45)', textAlign: 'center' },

  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },

  packGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  packCard: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, alignItems: 'center', gap: 3, position: 'relative' },
  packBadge: { position: 'absolute', top: -8, alignSelf: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  packBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  packCredits: { fontSize: 32, fontFamily: 'Poppins_700Bold', lineHeight: 38, marginTop: 8 },
  packCreditsLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  packPrice: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.text, marginTop: 4 },
  packDesc: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  selectedDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },

  buyBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  buyBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.bg },
  buyNote: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center', marginBottom: 8 },

  couponCard: { backgroundColor: colors.bgSurface, borderColor: colors.border },
  couponRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  couponInput: { flex: 1, fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, backgroundColor: colors.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, letterSpacing: 1.5 },
  couponBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  couponBtnText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.bg },
  couponError: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.destructive, marginTop: 8 },
  couponSuccess: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.success, marginTop: 8 },

  guideCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, padding: 0, overflow: 'hidden' },
  guideRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  guideLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideIcon: { fontSize: 18 },
  guideFeature: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.text },
  guideSep: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: 16 },

  txCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, padding: 0, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIcon: { fontSize: 18 },
  txDesc: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.text },
  txDate: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
  txAmount: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  txPos: { color: colors.success },
  txNeg: { color: colors.destructive },

  loadingRow: { paddingVertical: 20, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  guaranteeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  guaranteePill: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  guaranteeText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
});
