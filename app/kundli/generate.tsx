import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Star, MapPin, User, Calendar } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';
import { generateKundli, lookupPincode, type GenerateKundliPayload } from '@/lib/api';

const CONCERNS = [
  'Career & Finance', 'Love & Marriage', 'Health', 'Education',
  'Family & Children', 'Spirituality', 'Property & Wealth', 'General Life Reading',
];

const GENDERS = ['Male', 'Female', 'Other'];

type Step = 1 | 2 | 3;

interface FormState {
  name: string;
  dob: string;         // DD/MM/YYYY
  tob: string;         // HH:MM
  pob: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  gender: string;
  primaryConcern: string;
  harshMode: boolean;
}

const EMPTY: FormState = {
  name: '', dob: '', tob: '', pob: '', pincode: '',
  latitude: null, longitude: null, timezone: 'Asia/Kolkata',
  gender: '', primaryConcern: '', harshMode: false,
};

export default function KundliGenerateScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const set = (key: keyof FormState, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Format DOB as DD/MM/YYYY while typing
  const handleDobChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    set('dob', formatted);
  };

  // Format TOB as HH:MM while typing
  const handleTobChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    set('tob', formatted);
  };

  // Lookup pincode → coordinates + place name
  const handlePincodeLookup = async () => {
    if (form.pincode.length < 6) return;
    setPincodeLoading(true);
    try {
      const res = await lookupPincode(form.pincode);
      setForm((f) => ({
        ...f,
        pob: `${res.data.city}, ${res.data.state}`,
        latitude: res.data.latitude,
        longitude: res.data.longitude,
        timezone: res.data.timezone,
      }));
    } catch {
      Alert.alert('Pincode Not Found', 'Please enter your city name manually.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Name is required';
    if (form.dob.length < 10) return 'Enter a valid date (DD/MM/YYYY)';
    if (form.tob.length < 5) return 'Enter a valid time (HH:MM)';
    if (!form.gender) return 'Select a gender';
    return null;
  };

  const validateStep2 = () => {
    if (!form.pob.trim()) return 'Place of birth is required';
    if (form.latitude === null) return 'Could not resolve location. Try pincode lookup.';
    return null;
  };

  const nextStep = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { Alert.alert('Missing Info', err); return; }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) { Alert.alert('Missing Info', err); return; }
    }
    setStep((s) => (s < 3 ? (s + 1) as Step : s));
  };

  const prevStep = () => setStep((s) => (s > 1 ? (s - 1) as Step : s));

  // DD/MM/YYYY → YYYY-MM-DD
  const parseDate = (dob: string) => {
    const [dd, mm, yyyy] = dob.split('/');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleGenerate = async () => {
    if (!form.primaryConcern) {
      Alert.alert('Select a concern', 'Choose what you would like insights on.');
      return;
    }

    setGenerating(true);
    try {
      const payload: GenerateKundliPayload = {
        name: form.name,
        dob: parseDate(form.dob),
        tob: form.tob,
        pob: form.pob,
        latitude: form.latitude!,
        longitude: form.longitude!,
        timezone: form.timezone,
        gender: form.gender.toLowerCase(),
        primaryConcern: form.primaryConcern,
        harshMode: form.harshMode,
      };

      const result = await generateKundli(payload);
      if (result.success) {
        router.replace(`/kundli/${result.data.chartId}` as any);
      }
    } catch (err: any) {
      Alert.alert('Generation Failed', err?.message ?? 'Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={step === 1 ? () => router.back() : prevStep} style={styles.backBtn}>
              <ChevronLeft size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Generate Kundli</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Step progress */}
          <View style={styles.progressRow}>
            {([1, 2, 3] as Step[]).map((s) => (
              <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]}>
                {step > s ? (
                  <Text style={styles.progressCheck}>✓</Text>
                ) : (
                  <Text style={[styles.progressNum, step === s && styles.progressNumActive]}>{s}</Text>
                )}
              </View>
            ))}
            <View style={styles.progressLine} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Step 1: Birth Details ── */}
            {step === 1 && (
              <MotiView from={{ opacity: 0, translateX: 24 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350 }}>
                <View style={styles.stepHeader}>
                  <User size={20} color={colors.primary} />
                  <Text style={styles.stepTitle}>Birth Details</Text>
                </View>

                <Input
                  label="Full Name"
                  placeholder="As it appears on birth record"
                  value={form.name}
                  onChangeText={(v) => set('name', v)}
                  autoCapitalize="words"
                />

                <Input
                  label="Date of Birth (DD/MM/YYYY)"
                  placeholder="e.g. 15/08/1990"
                  value={form.dob}
                  onChangeText={handleDobChange}
                  keyboardType="numeric"
                />

                <Input
                  label="Time of Birth (HH:MM, 24hr)"
                  placeholder="e.g. 14:30"
                  value={form.tob}
                  onChangeText={handleTobChange}
                  keyboardType="numeric"
                />

                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => set('gender', g)}
                      style={[styles.chip, form.gender === g && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </MotiView>
            )}

            {/* ── Step 2: Place of Birth ── */}
            {step === 2 && (
              <MotiView from={{ opacity: 0, translateX: 24 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350 }}>
                <View style={styles.stepHeader}>
                  <MapPin size={20} color={colors.primary} />
                  <Text style={styles.stepTitle}>Place of Birth</Text>
                </View>

                <View style={styles.pincodeRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Pincode (India)"
                      placeholder="e.g. 110001"
                      value={form.pincode}
                      onChangeText={(v) => set('pincode', v.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="numeric"
                      containerStyle={{ marginBottom: 0 }}
                    />
                  </View>
                  <Pressable
                    onPress={handlePincodeLookup}
                    style={styles.lookupBtn}
                    disabled={pincodeLoading || form.pincode.length < 6}
                  >
                    {pincodeLoading
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Text style={styles.lookupBtnText}>Lookup</Text>
                    }
                  </Pressable>
                </View>

                <View style={styles.orDivider}>
                  <View style={styles.divLine} />
                  <Text style={styles.orText}>or enter manually</Text>
                  <View style={styles.divLine} />
                </View>

                <Input
                  label="City / Place of Birth"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={form.pob}
                  onChangeText={(v) => set('pob', v)}
                />

                {form.latitude !== null && (
                  <Card style={styles.coordCard}>
                    <Text style={styles.coordText}>
                      📍 {form.pob} ({form.latitude.toFixed(4)}°N, {form.longitude!.toFixed(4)}°E)
                    </Text>
                    <Text style={styles.coordTz}>Timezone: {form.timezone}</Text>
                  </Card>
                )}
              </MotiView>
            )}

            {/* ── Step 3: Concerns & Preferences ── */}
            {step === 3 && (
              <MotiView from={{ opacity: 0, translateX: 24 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350 }}>
                <View style={styles.stepHeader}>
                  <Star size={20} color={colors.primary} />
                  <Text style={styles.stepTitle}>What would you like to know?</Text>
                </View>

                <View style={styles.concernsGrid}>
                  {CONCERNS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => set('primaryConcern', c)}
                      style={[styles.concernCard, form.primaryConcern === c && styles.concernCardActive]}
                    >
                      <Text style={[styles.concernText, form.primaryConcern === c && styles.concernTextActive]}>
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={() => set('harshMode', !form.harshMode)}
                  style={styles.harshRow}
                >
                  <View style={[styles.toggle, form.harshMode && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, form.harshMode && styles.toggleThumbActive]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.harshLabel}>Unfiltered Mode</Text>
                    <Text style={styles.harshDesc}>Receive direct, unvarnished astrological insights without softening</Text>
                  </View>
                </Pressable>
              </MotiView>
            )}

            <View style={styles.actions}>
              {step < 3 ? (
                <Button onPress={nextStep} style={styles.actionBtn}>
                  Continue <ChevronRight size={15} color="#0a0600" />
                </Button>
              ) : (
                <Button onPress={handleGenerate} isLoading={generating} style={styles.actionBtn}>
                  {generating ? 'Generating Chart…' : 'Generate My Kundli'}
                </Button>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },

  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 20, position: 'relative' },
  progressLine: { position: 'absolute', top: 18, left: '25%', right: '25%', height: 1, backgroundColor: colors.border, zIndex: -1 },
  progressDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSurface, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { borderColor: colors.primary, backgroundColor: 'rgba(212,168,67,0.12)' },
  progressNum: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted },
  progressNumActive: { color: colors.primary },
  progressCheck: { fontSize: 14, color: colors.primary },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  stepTitle: { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: colors.text },

  fieldLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface },
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(212,168,67,0.12)' },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  chipTextActive: { color: colors.primary },

  pincodeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginBottom: 16 },
  lookupBtn: { height: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.35)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  lookupBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  coordCard: { marginBottom: 16, backgroundColor: 'rgba(212,168,67,0.06)', borderColor: 'rgba(212,168,67,0.20)', padding: 12 },
  coordText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  coordTz: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 3 },

  concernsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  concernCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface },
  concernCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(212,168,67,0.10)' },
  concernText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  concernTextActive: { color: colors.primary, fontFamily: 'Poppins_600SemiBold' },

  harshRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 2, marginTop: 2 },
  toggleActive: { backgroundColor: 'rgba(212,168,67,0.25)', borderColor: colors.primary },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textMuted },
  toggleThumbActive: { backgroundColor: colors.primary, transform: [{ translateX: 20 }] },
  harshLabel: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 3 },
  harshDesc: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 18 },

  actions: { marginTop: 24 },
  actionBtn: { width: '100%' },
});
