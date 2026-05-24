import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { getKundliCharts, getProfiles, getReports } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ReportStatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge variant="teal">Done</Badge>;
  if (status === 'pending' || status === 'processing') return <Badge variant="gold">Processing</Badge>;
  return <Badge variant="muted">{status}</Badge>;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const credits = useStore((s) => s.credits);
  const setUser = useStore((s) => s.setUser);
  const [activeReportTab, setActiveReportTab] = useState<'reports'>('reports');

  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ['kundli-charts'],
    queryFn: getKundliCharts,
    staleTime: 5 * 60 * 1000,
  });

  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: getReports,
    staleTime: 60 * 1000,
    refetchInterval: 30000,
  });

  const charts = chartsData?.data ?? [];
  const profiles = profilesData?.data ?? [];
  const reports = reportsData?.data ?? [];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
          router.replace('/login');
        },
      },
    ]);
  };

  const initial = (user?.display_name ?? user?.email ?? 'U')[0].toUpperCase();
  const initials = (user?.display_name ?? user?.email ?? 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar Header */}
        <MotiView from={{ opacity: 0, translateY: -14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 480 }} style={styles.avatarSection}>
          <LinearGradient colors={['rgba(212,168,67,0.45)', 'rgba(168,127,255,0.30)']} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.userName}>{user?.display_name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          <View style={styles.badgeRow}>
            <Badge variant={user?.plan === 'premium' ? 'gold' : 'muted'}>
              {user?.plan === 'premium' ? '✦ Premium' : 'Free Plan'}
            </Badge>
            <Badge variant="accent">✦ {credits} credits</Badge>
          </View>
          <Pressable onPress={() => router.push('/settings' as never)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </MotiView>

        {/* Birth Profiles */}
        <SectionHeader title="Birth Profiles" count={profiles.length} onAdd={() => router.push('/onboarding' as never)} />
        {profilesLoading ? (
          <LoadingRow />
        ) : profiles.length === 0 ? (
          <EmptySection
            emoji="🌟"
            text="No birth profiles yet"
            ctaText="Add Profile"
            onCta={() => router.push('/onboarding' as never)}
          />
        ) : (
          <>
            {profiles.map((profile: any, i: number) => (
              <MotiView key={profile.id} from={{ opacity: 0, translateX: -12 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350, delay: i * 50 }}>
                <Card style={styles.listCard}>
                  <View style={styles.listRow}>
                    <View style={styles.listIcon}>
                      <Text style={{ fontSize: 16 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>{profile.name}</Text>
                      <Text style={styles.listSub}>{profile.date_of_birth} · {profile.place_of_birth}</Text>
                    </View>
                  </View>
                </Card>
              </MotiView>
            ))}
          </>
        )}

        {/* Generated Kundlis */}
        <SectionHeader title="My Kundlis" count={charts.length} onAdd={() => router.push('/kundli/generate' as never)} />
        {chartsLoading ? (
          <LoadingRow />
        ) : charts.length === 0 ? (
          <EmptySection
            emoji="🪐"
            text="No kundlis generated yet"
            ctaText="Generate Kundli"
            onCta={() => router.push('/kundli/generate' as never)}
          />
        ) : (
          <>
            {charts.map((chart: any, i: number) => (
              <MotiView key={chart.id} from={{ opacity: 0, translateX: -12 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350, delay: i * 50 }}>
                <Pressable onPress={() => router.push(`/kundli/${chart.id}` as never)}>
                  <Card style={styles.listCard}>
                    <View style={styles.listRow}>
                      <View style={styles.listIcon}>
                        <Text style={{ fontSize: 16 }}>🔮</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listTitle}>{chart.profile_name ?? 'Kundli Chart'}</Text>
                        <Text style={styles.listSub}>{formatDate(chart.created_at)}</Text>
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
                    </View>
                  </Card>
                </Pressable>
              </MotiView>
            ))}
          </>
        )}

        {/* Reports */}
        <SectionHeader title="Reports" count={reports.length} />

        {reportsLoading ? (
          <LoadingRow />
        ) : reports.length === 0 ? (
          <EmptySection emoji="📜" text="No reports yet" />
        ) : (
          <>
            {reports.map((report: any, i: number) => (
              <MotiView key={report.id} from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 300, delay: i * 40 }}>
                <Card style={styles.listCard}>
                  <View style={styles.listRow}>
                    <View style={styles.listIcon}>
                      <Text style={{ fontSize: 16 }}>📋</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>{report.subject_name ?? 'Report'}</Text>
                      <Text style={styles.listSub}>{report.type} · {formatDate(report.created_at)}</Text>
                    </View>
                    <ReportStatusBadge status={report.status} />
                  </View>
                </Card>
              </MotiView>
            ))}
          </>
        )}

        {/* Sign Out */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 500 }}>
          <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>🚪  Sign Out</Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, count, onAdd }: { title: string; count?: number; onAdd?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {count !== undefined && count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
        {onAdd && (
          <Pressable onPress={onAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function LoadingRow() {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );
}

function EmptySection({ emoji, text, ctaText, onCta }: { emoji: string; text: string; ctaText?: string; onCta?: () => void }) {
  return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {ctaText && onCta && (
        <Pressable onPress={onCta} style={styles.emptyCta}>
          <Text style={styles.emptyCtaText}>{ctaText}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },

  avatarSection: { alignItems: 'center', marginBottom: 30, paddingTop: 4 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, padding: 3, marginBottom: 14 },
  avatarInner: { flex: 1, borderRadius: 42, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: colors.text },
  userName: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 3 },
  userEmail: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  editBtn: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
  editBtnText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  countBadge: { backgroundColor: 'rgba(212,168,67,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  addBtn: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  addBtnText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  listCard: { marginBottom: 8, backgroundColor: colors.bgSurface, borderColor: colors.border },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  listSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2 },

  reportTabBar: { flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: 10, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  reportTab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  reportTabActive: { backgroundColor: 'rgba(212,168,67,0.14)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)' },
  reportTabText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textMuted },

  loadingRow: { paddingVertical: 20, alignItems: 'center', marginBottom: 8 },

  emptyRow: { alignItems: 'center', paddingVertical: 20, gap: 8, marginBottom: 12 },
  emptyEmoji: { fontSize: 28, opacity: 0.6 },
  emptyText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  emptyCta: { backgroundColor: 'rgba(212,168,67,0.10)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.28)', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 7 },
  emptyCtaText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.08)', marginTop: 12 },
  signOutText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.destructive },
});
