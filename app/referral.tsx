import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet, Share, Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { getReferral, redeemReferral } from '@/lib/api';

interface ReferralHistory {
  name: string;
  date: string;
  status: 'pending' | 'completed';
}
interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  creditsEarned: number;
  pendingCredits: number;
  history: ReferralHistory[];
}

export default function ReferralScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [redeemCode, setRedeemCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ['referral'],
    queryFn: async () => {
      const res = await getReferral();
      if (!res.success) throw new Error('Failed');
      return res.data as ReferralData;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { mutate: redeem, isPending: redeeming, data: redeemResult, error: redeemError } = useMutation<
    { success: boolean; message: string }, Error, string
  >({
    mutationFn: (code) => redeemReferral(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral'] });
      setRedeemCode('');
    },
  });

  const handleCopy = () => {
    if (!data?.referralCode) return;
    Clipboard.setString(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data?.referralCode) return;
    await Share.share({
      message: `Join me on Aroha Astrology and get free credits! Use my referral code: ${data.referralCode}\nhttps://arohaastrology.in/signup`,
      title: 'Join Aroha Astrology',
    });
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={s.loadingText}>Loading…</Text>
        </View>
      )}

      {data && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 380 }}
            style={s.heroCard}
          >
            <Text style={s.heroEmoji}>🎁</Text>
            <Text style={s.heroTitle}>Earn Free Credits</Text>
            <Text style={s.heroDesc}>
              Share your code with friends. You both earn credits when they sign up and generate their first chart.
            </Text>
          </MotiView>

          {/* Stats row */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 80 }}
            style={s.statsRow}
          >
            <View style={s.statCard}>
              <Text style={s.statValue}>{data.totalReferrals}</Text>
              <Text style={s.statLabel}>Referrals</Text>
            </View>
            <View style={[s.statCard, s.statCardCenter]}>
              <Text style={[s.statValue, { color: '#22c55e' }]}>{data.creditsEarned}</Text>
              <Text style={s.statLabel}>Credits Earned</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: '#eab308' }]}>{data.pendingCredits}</Text>
              <Text style={s.statLabel}>Pending</Text>
            </View>
          </MotiView>

          {/* Referral code */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 120 }}
            style={s.codeCard}
          >
            <Text style={s.codeLabel}>YOUR REFERRAL CODE</Text>
            <View style={s.codeRow}>
              <Text style={s.codeText}>{data.referralCode}</Text>
              <Pressable onPress={handleCopy} style={[s.copyBtn, copied && s.copyBtnDone]}>
                <Text style={[s.copyBtnText, copied && s.copyBtnTextDone]}>
                  {copied ? '✓ Copied' : 'Copy'}
                </Text>
              </Pressable>
            </View>
            <Pressable onPress={handleShare} style={s.shareBtn}>
              <Text style={s.shareBtnText}>📤 Share with Friends</Text>
            </Pressable>
          </MotiView>

          {/* Redeem a code */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 160 }}
            style={s.redeemCard}
          >
            <Text style={s.redeemTitle}>Have a Referral Code?</Text>
            <View style={s.redeemInputRow}>
              <TextInput
                style={s.redeemInput}
                placeholder="Enter code…"
                placeholderTextColor="#4a3a60"
                value={redeemCode}
                onChangeText={setRedeemCode}
                autoCapitalize="characters"
                maxLength={12}
              />
              <Pressable
                onPress={() => redeem(redeemCode)}
                disabled={redeeming || redeemCode.trim().length < 4}
                style={[s.redeemBtn, (redeeming || redeemCode.trim().length < 4) && s.redeemBtnDisabled]}
              >
                {redeeming ? <ActivityIndicator color="#02010a" size="small" /> : <Text style={s.redeemBtnText}>Redeem</Text>}
              </Pressable>
            </View>
            {redeemResult && (
              <Text style={s.redeemSuccess}>✓ {redeemResult.message}</Text>
            )}
            {redeemError && (
              <Text style={s.redeemError}>{redeemError.message}</Text>
            )}
          </MotiView>

          {/* History */}
          {data.history?.length > 0 && (
            <>
              <Text style={s.sectionLabel}>REFERRAL HISTORY</Text>
              <View style={s.historyCard}>
                {data.history.map((h, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, translateX: -6 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 260, delay: i * 40 }}
                  >
                    <View style={[s.historyRow, i < data.history.length - 1 && s.historyDivider]}>
                      <View style={s.historyAvatar}>
                        <Text style={s.historyAvatarText}>{h.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                      </View>
                      <View style={s.historyInfo}>
                        <Text style={s.historyName}>{h.name}</Text>
                        <Text style={s.historyDate}>{h.date}</Text>
                      </View>
                      <View style={[
                        s.historyStatus,
                        { borderColor: h.status === 'completed' ? 'rgba(34,197,94,0.35)' : 'rgba(234,179,8,0.35)',
                          backgroundColor: h.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)' }
                      ]}>
                        <Text style={[s.historyStatusText, { color: h.status === 'completed' ? '#22c55e' : '#eab308' }]}>
                          {h.status}
                        </Text>
                      </View>
                    </View>
                  </MotiView>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  heroCard: {
    backgroundColor: 'rgba(212,168,67,0.07)', borderRadius: 22, padding: 24,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  heroDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 4,
  },
  statCardCenter: { borderColor: 'rgba(34,197,94,0.2)', backgroundColor: 'rgba(34,197,94,0.05)' },
  statValue: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#7a6a90', textAlign: 'center' },
  codeCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 14, gap: 14,
  },
  codeLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeText: { flex: 1, fontSize: 22, fontFamily: 'Poppins_700Bold', color: '#d4a843', letterSpacing: 3 },
  copyBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.35)', backgroundColor: 'rgba(212,168,67,0.1)',
  },
  copyBtnDone: { borderColor: 'rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.12)' },
  copyBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  copyBtnTextDone: { color: '#22c55e' },
  shareBtn: {
    backgroundColor: '#d4a843', borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  redeemCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 12, marginBottom: 20,
  },
  redeemTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  redeemInputRow: { flexDirection: 'row', gap: 10 },
  redeemInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#d4a843', letterSpacing: 2,
  },
  redeemBtn: {
    paddingHorizontal: 18, borderRadius: 12,
    backgroundColor: '#d4a843', alignItems: 'center', justifyContent: 'center',
  },
  redeemBtnDisabled: { opacity: 0.45 },
  redeemBtnText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#02010a' },
  redeemSuccess: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#22c55e' },
  redeemError: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#f87171' },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 12 },
  historyCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  historyAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(212,168,67,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  historyAvatarText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#d4a843' },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  historyDate: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginTop: 2 },
  historyStatus: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  historyStatusText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' },
});
