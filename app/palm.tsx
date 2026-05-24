import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { getPalmLatest, enqueuePalmReading, type PalmAnalysis } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';

type ViewMode = 'story' | 'full';
type HandSide = 'right' | 'left';

const LINE_ICONS: Record<string, string> = {
  lifeLine: '🌿', heartLine: '❤️', headLine: '🧠', fateLine: '⭐',
  marriageLines: '💑', sunLine: '☀️', healthLine: '🌱', childrenLines: '👶',
};

const LINE_LABELS: Record<string, string> = {
  lifeLine: 'Life Line', heartLine: 'Heart Line', headLine: 'Head Line', fateLine: 'Fate Line',
  marriageLines: 'Marriage Lines', sunLine: 'Sun Line', healthLine: 'Health Line', childrenLines: 'Children Lines',
};

function StoryView({ analysis }: { analysis: PalmAnalysis }) {
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const majorLines = Object.entries(analysis.majorLines ?? {}).filter(([, v]) => v.present !== false);

  return (
    <View style={styles.resultsWrap}>
      {/* Soul vibe */}
      {analysis.handShape && (
        <MotiView from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 50 }}>
          <Card style={styles.soulCard}>
            <Text style={styles.soulEyebrow}>your vibe check ✨</Text>
            <Text style={styles.soulType}>{analysis.handShape.type ?? 'Mystic Hand'}</Text>
            {analysis.handShape.vedic_element && (
              <Badge variant="accent" style={{ alignSelf: 'flex-start', marginTop: 6 }}>{analysis.handShape.vedic_element} Element</Badge>
            )}
            {analysis.soulPurpose && (
              <Text style={styles.soulPurpose}>{analysis.soulPurpose.split('.')[0]}.</Text>
            )}
          </Card>
        </MotiView>
      )}

      {/* Major lines */}
      {majorLines.length > 0 && (
        <>
          <Text style={styles.resultsSection}>Your Lines</Text>
          {majorLines.map(([key, line], i) => (
            <MotiView key={key} from={{ opacity: 0, translateX: -10 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350, delay: i * 60 + 100 }}>
              <Pressable
                onPress={() => setExpandedLine(expandedLine === key ? null : key)}
                style={[styles.lineCard, expandedLine === key && styles.lineCardOpen]}
              >
                <View style={styles.lineHeader}>
                  <View style={styles.lineLeft}>
                    <Text style={styles.lineIcon}>{LINE_ICONS[key] ?? '〰️'}</Text>
                    <View>
                      <Text style={styles.lineName}>{LINE_LABELS[key] ?? key}</Text>
                      <Text style={styles.lineVibe}>{line.length ?? 'Present'} · {line.depth ?? ''}</Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 16 }}>{expandedLine === key ? '▲' : '▼'}</Text>
                </View>
                {expandedLine === key && line.interpretation && (
                  <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 250 }}>
                    <Text style={styles.lineInterp}>{line.interpretation}</Text>
                  </MotiView>
                )}
              </Pressable>
            </MotiView>
          ))}
        </>
      )}

      {/* Career & Love */}
      {(analysis.careerSuggestions?.length || analysis.relationshipOutlook) && (
        <View style={styles.twoColRow}>
          {analysis.careerSuggestions && analysis.careerSuggestions.length > 0 && (
            <Card style={[styles.halfCard, { borderColor: 'rgba(168,127,255,0.30)' }]}>
              <Text style={styles.halfCardTitle}>💼 Career</Text>
              <View style={styles.careerChips}>
                {analysis.careerSuggestions.slice(0, 3).map((c, i) => (
                  <View key={i} style={styles.careerChip}>
                    <Text style={styles.careerChipText}>{c}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
          {analysis.relationshipOutlook && (
            <Card style={[styles.halfCard, { borderColor: 'rgba(255,80,167,0.30)' }]}>
              <Text style={styles.halfCardTitle}>❤️ Love</Text>
              <Text style={styles.halfCardText}>{analysis.relationshipOutlook.split('.')[0]}.</Text>
            </Card>
          )}
        </View>
      )}

      {/* Remedies */}
      {analysis.remedies && analysis.remedies.length > 0 && (
        <Card style={styles.remediesCard}>
          <Text style={styles.remediesTitle}>🪷 What the Universe Wants</Text>
          {analysis.remedies.map((r, i) => (
            <Text key={i} style={styles.remedyItem}>✦ {r}</Text>
          ))}
        </Card>
      )}

      {/* Pandit message */}
      {analysis.panditMessage && (
        <Card style={styles.panditCard}>
          <Text style={styles.panditLabel}>🙏 Pandit-ji says</Text>
          <Text style={styles.panditMsg}>{analysis.panditMessage}</Text>
        </Card>
      )}
    </View>
  );
}

function FullView({ analysis }: { analysis: PalmAnalysis }) {
  const allLines = { ...analysis.majorLines, ...((analysis as any).minorLines ?? {}) };

  return (
    <View style={styles.resultsWrap}>
      {/* Hand shape */}
      {analysis.handShape && (
        <Card style={styles.handShapeCard}>
          <View style={styles.handShapeRow}>
            <Badge variant="accent">{analysis.handShape.type ?? 'Unknown'}</Badge>
            {analysis.handShape.vedic_element && <Badge variant="gold">{analysis.handShape.vedic_element} Element</Badge>}
          </View>
          {analysis.handShape.description && (
            <Text style={styles.handShapeDesc}>{analysis.handShape.description}</Text>
          )}
        </Card>
      )}

      {/* All lines */}
      {Object.entries(allLines).length > 0 && (
        <>
          <Text style={styles.resultsSection}>Line Readings</Text>
          {Object.entries(allLines).map(([key, line]: [string, any], i) => (
            <MotiView key={key} from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 300, delay: i * 50 }}>
              <Card style={styles.fullLineCard}>
                <View style={styles.fullLineHeader}>
                  <Text style={styles.lineIcon}>{LINE_ICONS[key] ?? '〰️'}</Text>
                  <Text style={styles.lineName}>{LINE_LABELS[key] ?? key}</Text>
                </View>
                <View style={styles.lineBadgeRow}>
                  {line.length && <Badge variant="muted">{line.length}</Badge>}
                  {line.depth && <Badge variant="muted">{line.depth}</Badge>}
                  {line.strength && <Badge variant="muted">{line.strength}</Badge>}
                </View>
                {line.interpretation && (
                  <Text style={styles.lineInterpFull}>{line.interpretation}</Text>
                )}
              </Card>
            </MotiView>
          ))}
        </>
      )}

      {/* Soul Purpose */}
      {analysis.soulPurpose && (
        <Card style={[styles.soulPurposeCard, { borderColor: 'rgba(212,168,67,0.30)' }]}>
          <Text style={styles.soulPurposeTitle}>🌟 Soul Purpose</Text>
          <Text style={styles.soulPurposeText}>{analysis.soulPurpose}</Text>
        </Card>
      )}

      {/* Personality + Career */}
      {analysis.overallPersonality && (
        <Card style={styles.fullLineCard}>
          <Text style={styles.fullSectionTitle}>🤚 Overall Reading</Text>
          <Text style={styles.lineInterpFull}>{analysis.overallPersonality}</Text>
          {analysis.healthWarnings && analysis.healthWarnings.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.fullSectionTitle}>⚠️ Health Notes</Text>
              {analysis.healthWarnings.map((w, i) => <Text key={i} style={styles.lineInterpFull}>• {w}</Text>)}
            </View>
          )}
          {analysis.luckyPeriods && analysis.luckyPeriods.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.fullSectionTitle}>✦ Lucky Periods</Text>
              {analysis.luckyPeriods.map((p, i) => <Text key={i} style={styles.lineInterpFull}>• {p}</Text>)}
            </View>
          )}
        </Card>
      )}

      {/* Remedies */}
      {analysis.remedies && analysis.remedies.length > 0 && (
        <Card style={styles.remediesCard}>
          <Text style={styles.remediesTitle}>🪷 Remedies</Text>
          {analysis.remedies.map((r, i) => (
            <Text key={i} style={styles.remedyItem}>✦ {r}</Text>
          ))}
        </Card>
      )}

      {/* Pandit */}
      {analysis.panditMessage && (
        <Card style={styles.panditCard}>
          <Text style={styles.panditLabel}>🙏 Pandit Hastamani Shastri says</Text>
          <Text style={styles.panditMsg}>{analysis.panditMessage}</Text>
        </Card>
      )}
    </View>
  );
}

export default function PalmScreen() {
  const router = useRouter();
  const [hand, setHand] = useState<HandSide>('right');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [queued, setQueued] = useState(false);
  const [analysis, setAnalysis] = useState<PalmAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('story');
  const [error, setError] = useState('');

  const { data: savedData } = useQuery({
    queryKey: ['palm-latest'],
    queryFn: getPalmLatest,
    staleTime: 5 * 60 * 1000,
  });
  const savedReading = savedData?.reading;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload your palm.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setAnalysis(null);
      setQueued(false);
      setError('');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setAnalysis(null);
      setQueued(false);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setUploading(true);
    setError('');
    try {
      const res = await enqueuePalmReading(imageBase64, hand);
      if (res.success) {
        if (res.data?.analysis) {
          setAnalysis(res.data.analysis);
        } else {
          setQueued(true);
        }
      } else {
        setError(res.error ?? 'Analysis failed. Please try again.');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const displayAnalysis = analysis ?? (savedReading?.analysis ?? null);

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 450 }} style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Hasta Rekha</Text>
            <Text style={styles.title}>Palm Reading</Text>
            <Text style={styles.subtitle}>Brahma's divine script written in your hand</Text>
          </View>
        </MotiView>

        {/* Pandit intro */}
        <MotiView from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 80 }}>
          <Card style={styles.panditIntroCard}>
            <View style={styles.panditIntroRow}>
              <Text style={styles.panditIntroEmoji}>🙏</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.panditIntroName}>Pandit Hastamani Shastri</Text>
                <Text style={styles.panditIntroDesc}>Varanasi lineage · 60 years of practice · 50,000 palms read</Text>
              </View>
            </View>
          </Card>
        </MotiView>

        {/* Photo tips */}
        <Text style={styles.sectionTitle}>How to Get the Best Reading</Text>
        <View style={styles.tipsGrid}>
          {[
            { icon: '☀️', tip: 'Bright natural light' },
            { icon: '🤚', tip: 'Spread fingers gently' },
            { icon: '📐', tip: 'Camera directly above' },
            { icon: '🔍', tip: 'Keep it sharp & in focus' },
          ].map((t) => (
            <View key={t.tip} style={styles.tipCell}>
              <Text style={styles.tipCellIcon}>{t.icon}</Text>
              <Text style={styles.tipCellText}>{t.tip}</Text>
            </View>
          ))}
        </View>

        {/* Upload section */}
        {!queued && !displayAnalysis && (
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 150 }}>
            <Card style={styles.uploadCard}>
              <Text style={styles.uploadTitle}>👋 Upload Your Palm</Text>
              <Text style={styles.uploadDesc}>JPG/PNG · Right = present life · Left = soul blueprint</Text>

              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <Pressable onPress={pickImage} style={styles.reuploadBtn}>
                    <Text style={styles.reuploadText}>Re-upload</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.uploadBtns}>
                  <Pressable onPress={takePhoto} style={styles.uploadBtn}>
                    <Text style={styles.uploadBtnIcon}>📷</Text>
                    <Text style={styles.uploadBtnText}>Camera</Text>
                  </Pressable>
                  <Pressable onPress={pickImage} style={styles.uploadBtn}>
                    <Text style={styles.uploadBtnIcon}>📁</Text>
                    <Text style={styles.uploadBtnText}>Gallery</Text>
                  </Pressable>
                </View>
              )}

              {/* Hand selector */}
              <Text style={styles.handLabel}>Which hand?</Text>
              <View style={styles.handToggle}>
                {(['left', 'right'] as HandSide[]).map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setHand(h)}
                    style={[styles.handBtn, hand === h && styles.handBtnActive]}
                  >
                    <Text style={[styles.handBtnText, hand === h && { color: colors.primary }]}>
                      {h === 'left' ? '🤛 Left' : 'Right 🤜'}
                    </Text>
                    <Text style={styles.handBtnSub}>{h === 'left' ? 'Soul blueprint' : 'Current life'}</Text>
                  </Pressable>
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={handleAnalyze}
                disabled={!imageUri || uploading}
                style={[styles.analyzeBtn, (!imageUri || uploading) && { opacity: 0.45 }]}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={styles.analyzeBtnText}>Analyze Palm</Text>
                )}
              </Pressable>
            </Card>
          </MotiView>
        )}

        {/* Queued state */}
        {queued && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 500 }}>
            <Card style={styles.queuedCard}>
              <Text style={styles.queuedEmoji}>🙏</Text>
              <Text style={styles.queuedTitle}>Pandit-ji is reading your palm</Text>
              <Text style={styles.queuedDesc}>Analysis running in background. You'll be notified when ready.</Text>
              <Pressable onPress={() => router.replace('/(tabs)')} style={styles.dashBtn}>
                <Text style={styles.dashBtnText}>← Go to Dashboard</Text>
              </Pressable>
            </Card>
          </MotiView>
        )}

        {/* Saved reading banner */}
        {!queued && !analysis && savedReading && (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerText}>Showing your last reading</Text>
            <Pressable onPress={() => { setImageUri(null); setImageBase64(null); }} style={styles.newReadingBtn}>
              <Text style={styles.newReadingText}>+ New reading</Text>
            </Pressable>
          </View>
        )}

        {/* Results */}
        {displayAnalysis && !queued && (
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }}>
            {/* View mode toggle */}
            <View style={styles.modeToggle}>
              {([['story', '✨ Story'], ['full', '📖 Full']] as [ViewMode, string][]).map(([mode, label]) => (
                <Pressable
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  style={[styles.modeBtn, viewMode === mode && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeBtnText, viewMode === mode && { color: colors.primary }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {viewMode === 'story' ? (
              <StoryView analysis={displayAnalysis} />
            ) : (
              <FullView analysis={displayAnalysis} />
            )}
          </MotiView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  backArrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  eyebrow: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.primary, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 },

  panditIntroCard: { backgroundColor: 'rgba(212,168,67,0.07)', borderColor: 'rgba(212,168,67,0.25)', marginBottom: 18 },
  panditIntroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panditIntroEmoji: { fontSize: 28 },
  panditIntroName: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 3 },
  panditIntroDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 16 },

  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tipCell: { width: '47%', backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  tipCellIcon: { fontSize: 22 },
  tipCellText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center' },

  uploadCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, gap: 12 },
  uploadTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text },
  uploadDesc: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  previewWrap: { alignItems: 'center', gap: 10 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: colors.bgElevated },
  reuploadBtn: { backgroundColor: colors.bgElevated, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  reuploadText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  uploadBtns: { flexDirection: 'row', gap: 12 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14 },
  uploadBtnIcon: { fontSize: 20 },
  uploadBtnText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  handLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  handToggle: { flexDirection: 'row', gap: 10 },
  handBtn: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10 },
  handBtnActive: { borderColor: colors.borderAccent, backgroundColor: 'rgba(212,168,67,0.08)' },
  handBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  handBtnSub: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2 },
  errorText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.destructive, textAlign: 'center' },
  analyzeBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  analyzeBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.bg },

  queuedCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, alignItems: 'center', gap: 10, paddingVertical: 32 },
  queuedEmoji: { fontSize: 42 },
  queuedTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text, textAlign: 'center' },
  queuedDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center' },
  dashBtn: { backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  dashBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  savedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  savedBannerText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  newReadingBtn: {},
  newReadingText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  modeToggle: { flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: 12, padding: 3, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  modeBtnActive: { backgroundColor: 'rgba(212,168,67,0.14)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)' },
  modeBtnText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textMuted },

  resultsWrap: { gap: 12 },
  resultsSection: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4, marginTop: 4 },

  soulCard: { backgroundColor: 'rgba(168,127,255,0.08)', borderColor: 'rgba(168,127,255,0.30)', gap: 6 },
  soulEyebrow: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.accent, letterSpacing: 0.8 },
  soulType: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  soulPurpose: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20, marginTop: 4 },

  lineCard: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 4 },
  lineCardOpen: { borderColor: 'rgba(212,168,67,0.35)', backgroundColor: 'rgba(212,168,67,0.05)' },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lineLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineIcon: { fontSize: 20 },
  lineName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  lineVibe: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
  lineInterp: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20, marginTop: 10 },

  twoColRow: { flexDirection: 'row', gap: 10 },
  halfCard: { flex: 1, backgroundColor: colors.bgSurface, borderWidth: 1, gap: 8 },
  halfCardTitle: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.text },
  halfCardText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 18 },
  careerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  careerChip: { backgroundColor: 'rgba(168,127,255,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  careerChipText: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: colors.accent },

  remediesCard: { backgroundColor: 'rgba(212,168,67,0.06)', borderColor: 'rgba(212,168,67,0.25)', borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  remediesTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 4 },
  remedyItem: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20 },

  panditCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  panditLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  panditMsg: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  fullLineCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, marginBottom: 8, gap: 8 },
  fullLineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lineInterpFull: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20 },
  handShapeCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, gap: 8, marginBottom: 8 },
  handShapeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  handShapeDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20 },
  soulPurposeCard: { borderWidth: 1, backgroundColor: 'rgba(212,168,67,0.05)', borderRadius: 14, padding: 14, gap: 8, marginBottom: 8 },
  soulPurposeTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text },
  soulPurposeText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20 },
  fullSectionTitle: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, marginBottom: 4 },
});
