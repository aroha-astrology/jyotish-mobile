import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { supabase } from '@/lib/supabase';
import { getNotifications, markNotificationsRead, clearNotifications, getCreditsBalance, type AppNotification } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function iconFor(type: string): string {
  if (type === 'kundli_ready') return '🪐';
  if (type === 'report_ready') return '📜';
  if (type === 'system') return '✦';
  return '🔔';
}

export function TopBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useStore((s) => s.user);
  const credits = useStore((s) => s.credits);
  const setCredits = useStore((s) => s.setCredits);

  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIdsRef = useRef(new Set<string>());

  const initial = user?.display_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

  // Load notifications + credits
  useEffect(() => {
    if (!user) return;
    getNotifications()
      .then((res) => {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
        res.data.forEach((n) => seenIdsRef.current.add(n.id));
      })
      .catch(() => {});

    getCreditsBalance()
      .then((res) => { if (res.success) setCredits(res.data.credits); })
      .catch(() => {});
  }, [user]);

  // Realtime new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`topbar-notifs:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as AppNotification;
          if (seenIdsRef.current.has(n.id)) return;
          seenIdsRef.current.add(n.id);
          setNotifications((prev) => [n, ...prev].slice(0, 30));
          if (!n.read_at) setUnreadCount((c) => c + 1);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleOpenBell = async () => {
    const next = !bellOpen;
    setBellOpen(next);
    if (next && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
      setUnreadCount(0);
      markNotificationsRead().catch(() => {});
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {/* Logo */}
        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.logo}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.right}>
          {/* Bell */}
          <Pressable onPress={handleOpenBell} style={styles.iconBtn}>
            <Text style={{ fontSize: 18, color: unreadCount > 0 ? colors.primary : colors.textSecondary }}>🔔</Text>
            {unreadCount > 0 && (
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </MotiView>
            )}
          </Pressable>

          {/* Credits pill */}
          <Pressable onPress={() => router.push('/credits')} style={styles.creditsPill}>
            <Text style={styles.creditsText}>✦ {credits}</Text>
          </Pressable>

          {/* Avatar */}
          <Pressable onPress={() => setMenuOpen(true)} style={styles.avatar}>
            {user?.avatar_url ? (
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              <Text style={styles.avatarText}>{initial}</Text>
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Notification Sheet */}
      <Modal visible={bellOpen} transparent animationType="fade" onRequestClose={() => setBellOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setBellOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Notifications</Text>
                  {notifications.length > 0 && (
                    <TouchableOpacity onPress={() => { setNotifications([]); setUnreadCount(0); clearNotifications().catch(() => {}); }}>
                      <Text style={styles.clearBtn}>Clear all</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {notifications.length === 0 ? (
                  <View style={styles.emptyNotif}>
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>🔔</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>No notifications yet</Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 360 }}>
                    {notifications.map((n) => (
                      <View key={n.id} style={[styles.notifRow, !n.read_at && styles.notifUnread]}>
                        <View style={styles.notifIcon}>
                          <Text style={{ fontSize: 16 }}>{iconFor(n.type)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.notifTitle}>{n.title}</Text>
                          {n.body && <Text style={styles.notifBody}>{n.body}</Text>}
                          <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
                        </View>
                        {!n.read_at && <View style={styles.unreadDot} />}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Avatar Menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menu}>
                <View style={styles.menuHeader}>
                  <View style={styles.menuAvatar}>
                    <Text style={styles.menuAvatarText}>{initial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{user?.display_name ?? 'User'}</Text>
                    <Text style={styles.menuEmail}>{user?.email}</Text>
                    <Text style={styles.menuCredits}>✦ {credits} credits</Text>
                  </View>
                </View>
                {[
                  { label: '👤  Profile', route: '/(tabs)/profile' as const },
                  { label: '⚙️  Settings', route: '/settings' as const },
                  { label: '✦  Buy Credits', route: '/credits' as const },
                ].map((item) => (
                  <TouchableOpacity key={item.route} style={styles.menuItem} onPress={() => { setMenuOpen(false); router.push(item.route as never); }}>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                  <Text style={[styles.menuItemText, { color: colors.destructive }]}>🚪  Sign out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logo: { flexDirection: 'row', alignItems: 'center' },
  logoImg: { width: 110, height: 38, tintColor: '#FFFFFF' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: {
    position: 'absolute', top: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: colors.bg },
  creditsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.borderAccent,
  },
  creditsText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.primary },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.borderAccent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.primary },

  // Overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 100, paddingRight: 12 },

  // Notification sheet
  sheet: { width: 300, backgroundColor: '#0d0a1a', borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: 1, textTransform: 'uppercase' },
  clearBtn: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  emptyNotif: { alignItems: 'center', paddingVertical: 28 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  notifUnread: { backgroundColor: 'rgba(212,168,67,0.05)' },
  notifIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.glass2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  notifBody: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
  notifTime: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 3 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6, flexShrink: 0 },

  // Avatar menu
  menu: { width: 220, backgroundColor: '#0d0a1a', borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', padding: 4 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
  menuAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.borderAccent, alignItems: 'center', justifyContent: 'center' },
  menuAvatarText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.primary },
  menuName: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  menuEmail: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 1 },
  menuCredits: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.primary, marginTop: 3 },
  menuItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  menuItemText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  menuDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 8, marginVertical: 4 },
});
