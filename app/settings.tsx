import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { CosmicBackground } from '@/components/CosmicBackground';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'ml', label: 'മലയാളം (Malayalam)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
];

const AYANAMSA = [
  { value: 'lahiri', label: 'Lahiri (Chitrapaksha)', desc: 'Most widely used' },
  { value: 'kp', label: 'KP (Krishnamurti)', desc: 'Cuspal sub-lord theory' },
  { value: 'raman', label: 'Raman', desc: 'B.V. Raman system' },
];

const CHART_STYLES: Array<{ value: 'north' | 'south'; label: string; desc: string }> = [
  { value: 'north', label: 'North Indian', desc: 'Diamond grid layout' },
  { value: 'south', label: 'South Indian', desc: 'Square grid layout' },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const chartStyle = useStore((s) => s.chartStyle);
  const setChartStyle = useStore((s) => s.setChartStyle);

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [ayanamsa, setAyanamsa] = useState('lahiri');
  const [langExpanded, setLangExpanded] = useState(false);

  const [notifs, setNotifs] = useState({
    dailyHoroscope: true,
    panchangAlerts: false,
    muhurtaReminders: true,
    promotional: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (displayName.trim() && user) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', user.id);
        setUser({ ...user, display_name: displayName.trim() });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all kundli charts, predictions, reports, and credits. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              `All data for ${user?.email ?? 'your account'} will be erased forever.`,
              [
                { text: 'Go Back', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const { error } = await supabase.rpc('delete_my_account');
                      if (error) throw error;
                      await supabase.auth.signOut();
                      setUser(null);
                      router.replace('/login');
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Please try again.';
                      Alert.alert('Delete Failed', msg);
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
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

  const currentLang = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

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
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Personalize your experience</Text>
          </View>
        </MotiView>

        {/* Account */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 80 }}>
          <SectionCard title="Account">
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValueMuted}>{user?.email ?? '—'}</Text>
            </View>
            <View style={styles.fieldSep} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Display Name</Text>
            </View>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
            />
          </SectionCard>
        </MotiView>

        {/* Language */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 140 }}>
          <SectionCard title="Language">
            <Pressable onPress={() => setLangExpanded(!langExpanded)} style={styles.dropdownTrigger}>
              <Text style={styles.dropdownValue}>{currentLang.label}</Text>
              <Text style={styles.dropdownCaret}>{langExpanded ? '▲' : '▼'}</Text>
            </Pressable>
            {langExpanded && (
              <View style={styles.dropdownList}>
                {LANGUAGES.map((l, i) => (
                  <Pressable
                    key={l.value}
                    onPress={() => { setLanguage(l.value); setLangExpanded(false); }}
                    style={[styles.dropdownItem, l.value === language && styles.dropdownItemActive, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
                  >
                    <Text style={[styles.dropdownItemText, l.value === language && { color: colors.primary }]}>{l.label}</Text>
                    {l.value === language && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                ))}
              </View>
            )}
          </SectionCard>
        </MotiView>

        {/* Chart Style */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 200 }}>
          <SectionCard title="Chart Style">
            <View style={styles.chipRow}>
              {CHART_STYLES.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => setChartStyle(s.value)}
                  style={[styles.chartStyleCard, chartStyle === s.value && styles.chartStyleCardActive]}
                >
                  {/* Mini chart preview */}
                  {s.value === 'north' ? (
                    <View style={styles.northPreview}>
                      {[0,1,2,3].map((row) => (
                        <View key={row} style={styles.northRow}>
                          {[0,1,2,3].map((col) => (
                            <View key={col} style={[styles.northCell, (row === 1 || row === 2) && (col === 1 || col === 2) && { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
                          ))}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.southPreview}>
                      {[0,1,2,3].map((row) => (
                        <View key={row} style={styles.northRow}>
                          {[0,1,2,3].map((col) => (
                            <View key={col} style={styles.northCell} />
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={[styles.chartStyleLabel, chartStyle === s.value && { color: colors.primary }]}>{s.label}</Text>
                  <Text style={styles.chartStyleDesc}>{s.desc}</Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>
        </MotiView>

        {/* Ayanamsa */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 260 }}>
          <SectionCard title="Ayanamsa System">
            {AYANAMSA.map((a, i) => (
              <View key={a.value}>
                <Pressable onPress={() => setAyanamsa(a.value)} style={styles.ayanamsaRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ayanamsaLabel, ayanamsa === a.value && { color: colors.primary }]}>{a.label}</Text>
                    <Text style={styles.ayanamsaDesc}>{a.desc}</Text>
                  </View>
                  <View style={[styles.radio, ayanamsa === a.value && styles.radioSelected]}>
                    {ayanamsa === a.value && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
                {i < AYANAMSA.length - 1 && <View style={styles.fieldSep} />}
              </View>
            ))}
          </SectionCard>
        </MotiView>

        {/* Notifications */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 320 }}>
          <SectionCard title="Notifications">
            {[
              { key: 'dailyHoroscope', label: 'Daily Horoscope', desc: 'Morning astrological update' },
              { key: 'panchangAlerts', label: 'Panchang Alerts', desc: 'Auspicious timing reminders' },
              { key: 'muhurtaReminders', label: 'Muhurta Reminders', desc: 'Notify before good windows' },
              { key: 'promotional', label: 'Promotions', desc: 'Offers and new features' },
            ].map((item, i) => (
              <View key={item.key}>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>{item.label}</Text>
                    <Text style={styles.toggleDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={notifs[item.key as keyof typeof notifs]}
                    onValueChange={(v) => setNotifs((prev) => ({ ...prev, [item.key]: v }))}
                    trackColor={{ false: colors.bgElevated, true: 'rgba(212,168,67,0.5)' }}
                    thumbColor={notifs[item.key as keyof typeof notifs] ? colors.primary : colors.textMuted}
                    ios_backgroundColor={colors.bgElevated}
                  />
                </View>
                {i < 3 && <View style={styles.fieldSep} />}
              </View>
            ))}
          </SectionCard>
        </MotiView>

        {/* Save Button */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 400 }}>
          <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, saved && styles.saveBtnSaved]}>
            {saving ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{saved ? '✓ Saved!' : 'Save Settings'}</Text>
            )}
          </Pressable>
        </MotiView>

        {/* Danger Zone */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 460 }}>
          <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>🚪  Sign Out</Text>
          </Pressable>
        </MotiView>

        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 520 }}>
          <View style={styles.dangerSection}>
            <Text style={styles.dangerLabel}>DANGER ZONE</Text>
            <Pressable
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deleteBtnTitle}>Delete Account Permanently</Text>
                    <Text style={styles.deleteBtnSub}>Removes all charts, reports & data</Text>
                  </View>
                  <Text style={styles.deleteChevron}>›</Text>
                </>
              )}
            </Pressable>
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

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  sectionCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, padding: 0, overflow: 'hidden' },

  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  fieldLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  fieldValueMuted: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  fieldSep: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: 16 },
  nameInput: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, paddingHorizontal: 16, paddingVertical: 12 },

  chipRow: { flexDirection: 'row', gap: 10, padding: 12 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  chipSelected: { borderColor: colors.borderAccent, backgroundColor: 'rgba(212,168,67,0.10)' },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textMuted },
  chipTextSelected: { color: colors.primary },

  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  dropdownValue: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  dropdownCaret: { fontSize: 10, color: colors.textMuted },
  dropdownList: { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: 'rgba(212,168,67,0.06)' },
  dropdownItemText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.text },
  checkmark: { fontSize: 14, color: colors.primary },

  chartStyleCard: { flex: 1, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, alignItems: 'center', gap: 6 },
  chartStyleCardActive: { borderColor: colors.borderAccent, backgroundColor: 'rgba(212,168,67,0.08)' },
  chartStyleLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  chartStyleDesc: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  northPreview: { width: 48, height: 48, gap: 1 },
  southPreview: { width: 48, height: 48, gap: 1 },
  northRow: { flex: 1, flexDirection: 'row', gap: 1 },
  northCell: { flex: 1, backgroundColor: 'rgba(212,168,67,0.15)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)', borderRadius: 1 },

  ayanamsaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  ayanamsaLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  ayanamsaDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  toggleLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  toggleDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2 },

  saveBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  saveBtnSaved: { backgroundColor: colors.success },
  saveBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.bg },

  signOutBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.08)', alignItems: 'center' },
  signOutText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.destructive },

  dangerSection: { marginTop: 8 },
  dangerLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: 'rgba(239,68,68,0.5)', letterSpacing: 1, marginBottom: 8 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  deleteIcon: { fontSize: 18 },
  deleteBtnTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#EF4444' },
  deleteBtnSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(239,68,68,0.65)', marginTop: 1 },
  deleteChevron: { fontSize: 20, color: 'rgba(239,68,68,0.5)', lineHeight: 22 },
});
