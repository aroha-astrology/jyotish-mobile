import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { analyzeVastu, type VastuResult, type VastuRoomScore } from '@/lib/api';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CosmicBackground } from '@/components/CosmicBackground';

const ROOM_TYPES = [
  { id: 'entrance',   label: 'Main Door',   emoji: '🚪', color: '#f5a623' },
  { id: 'living',     label: 'Living Room', emoji: '🛋️', color: '#4caf50' },
  { id: 'kitchen',    label: 'Kitchen',     emoji: '🍳', color: '#ef4444' },
  { id: 'master_bed', label: 'Bedroom',     emoji: '🛏️', color: '#9c27b0' },
  { id: 'bathroom',   label: 'Bathroom',    emoji: '🚿', color: '#2196f3' },
  { id: 'study',      label: 'Study',       emoji: '📚', color: '#607d8b' },
  { id: 'pooja',      label: 'Puja Room',   emoji: '🪔', color: '#ff9800' },
  { id: 'dining',     label: 'Dining',      emoji: '🍽️', color: '#795548' },
  { id: 'store',      label: 'Store Room',  emoji: '📦', color: '#8bc34a' },
  { id: 'guest',      label: 'Guest Room',  emoji: '🛌', color: '#00bcd4' },
  { id: 'toilet',     label: 'Toilet',      emoji: '🚽', color: '#3f51b5' },
  { id: 'balcony',    label: 'Balcony',     emoji: '🌿', color: '#cddc39' },
  { id: 'garden',     label: 'Garden',      emoji: '🌳', color: '#66bb6a' },
  { id: 'garage',     label: 'Garage',      emoji: '🚗', color: '#9e9e9e' },
];

const GRID_CELLS = [
  { dir: 'NW', label: 'NW', element: 'Air',   color: '#80cbc4' },
  { dir: 'N',  label: 'N',  element: 'Water',  color: '#42a5f5' },
  { dir: 'NE', label: 'NE', element: 'Space',  color: '#ce93d8' },
  { dir: 'W',  label: 'W',  element: 'Water',  color: '#4fc3f7' },
  { dir: 'C',  label: 'Ctr', element: 'Space', color: colors.primary },
  { dir: 'E',  label: 'E',  element: 'Air',    color: '#a5d6a7' },
  { dir: 'SW', label: 'SW', element: 'Earth',  color: '#a1887f' },
  { dir: 'S',  label: 'S',  element: 'Fire',   color: '#ef9a9a' },
  { dir: 'SE', label: 'SE', element: 'Fire',   color: '#ffcc80' },
];

function ScoreGauge({ score }: { score: number }) {
  const scoreColor = score >= 75 ? colors.success : score >= 50 ? colors.primary : colors.destructive;
  const label = score >= 75 ? 'Good Vastu' : score >= 50 ? 'Needs Work' : 'Major Issues';
  return (
    <View style={styles.gaugeWrap}>
      <View style={[styles.gaugeRing, { borderColor: scoreColor }]}>
        <Text style={[styles.gaugeScore, { color: scoreColor }]}>{score}</Text>
        <Text style={styles.gaugeUnit}>/ 100</Text>
      </View>
      <Text style={styles.gaugeTitle}>Vastu Score</Text>
      <Badge variant={score >= 75 ? 'teal' : score >= 50 ? 'gold' : 'red'}>{label}</Badge>
    </View>
  );
}

function RoomScoreCard({ item }: { item: VastuRoomScore }) {
  const good = item.score >= 60;
  const room = ROOM_TYPES.find((r) => r.id === item.room || r.label.toLowerCase() === item.room.toLowerCase());
  return (
    <Card style={[styles.roomScoreCard, { borderColor: good ? `${colors.success}44` : `${colors.destructive}44` }]}>
      <View style={styles.roomScoreHeader}>
        <View style={styles.roomScoreLeft}>
          <Text style={styles.roomScoreEmoji}>{room?.emoji ?? '🏠'}</Text>
          <View>
            <Text style={styles.roomScoreName}>{room?.label ?? item.room}</Text>
            <Text style={styles.roomScoreDir}>{item.currentDirection} → Ideal: {item.idealDirections.join('/')}</Text>
          </View>
        </View>
        <View style={[styles.roomScoreBadge, { backgroundColor: good ? `${colors.success}18` : `${colors.destructive}18`, borderColor: good ? `${colors.success}44` : `${colors.destructive}44` }]}>
          <Text style={[styles.roomScoreNum, { color: good ? colors.success : colors.destructive }]}>{item.score}</Text>
        </View>
      </View>
      {item.suggestion ? (
        <Text style={styles.roomScoreSuggestion}>💡 {item.suggestion}</Text>
      ) : null}
    </Card>
  );
}

export default function VastuScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - 64) / 3);

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VastuResult | null>(null);
  const [error, setError] = useState('');

  const placeRoom = (dir: string) => {
    if (!selectedRoom) return;
    setPlacements((prev) => ({ ...prev, [dir]: selectedRoom }));
    setSelectedRoom(null);
    setResult(null);
  };

  const removeRoom = (dir: string) => {
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[dir];
      return next;
    });
    setResult(null);
  };

  const handleAnalyze = async () => {
    const roomLayout: Record<string, string[]> = {};
    Object.entries(placements).forEach(([dir, roomId]) => {
      roomLayout[roomId] = [...(roomLayout[roomId] ?? []), dir];
    });
    setLoading(true);
    setError('');
    try {
      const res = await analyzeVastu({ roomLayout });
      if (res.success) setResult(res.data);
      else setError('Analysis failed. Please try again.');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const placedCount = Object.keys(placements).length;
  const selectedRoomData = ROOM_TYPES.find((r) => r.id === selectedRoom);

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
            <Text style={styles.eyebrow}>Sacred Architecture</Text>
            <Text style={styles.title}>Vastu Shastra</Text>
            <Text style={styles.subtitle}>Place rooms on the grid and get AI analysis</Text>
          </View>
        </MotiView>

        {/* Room Palette */}
        <Text style={styles.sectionTitle}>Select a Room to Place</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
          {ROOM_TYPES.map((room) => {
            const placed = Object.values(placements).includes(room.id);
            const active = selectedRoom === room.id;
            return (
              <Pressable
                key={room.id}
                onPress={() => setSelectedRoom(active ? null : placed ? null : room.id)}
                style={[
                  styles.roomChip,
                  active && { borderColor: room.color, backgroundColor: `${room.color}22` },
                  placed && { opacity: 0.45 },
                ]}
              >
                <Text style={styles.roomChipEmoji}>{room.emoji}</Text>
                <Text style={[styles.roomChipLabel, active && { color: room.color }]}>{room.label}</Text>
                {placed && <Text style={styles.roomChipCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedRoomData && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 250 }}>
            <View style={[styles.hintBanner, { borderColor: `${selectedRoomData.color}44`, backgroundColor: `${selectedRoomData.color}10` }]}>
              <Text style={styles.hintText}>{selectedRoomData.emoji}  Tap a grid cell to place {selectedRoomData.label}</Text>
            </View>
          </MotiView>
        )}

        {/* 3×3 Grid */}
        <Text style={styles.sectionTitle}>Floor Plan · Vastu Grid</Text>
        <View style={styles.compassTop}><Text style={styles.compassLabel}>NORTH</Text></View>
        <View style={styles.gridRow}>
          <Text style={styles.compassLabelSide}>WEST</Text>
          <View style={styles.grid}>
            {GRID_CELLS.map((cell) => {
              const placedRoomId = placements[cell.dir];
              const placedRoom = ROOM_TYPES.find((r) => r.id === placedRoomId);
              const canPlace = !!selectedRoom && !placedRoomId;
              return (
                <Pressable
                  key={cell.dir}
                  onPress={() => canPlace ? placeRoom(cell.dir) : undefined}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    canPlace && styles.cellPlaceable,
                    placedRoom && { borderColor: `${placedRoom.color}55` },
                  ]}
                >
                  {placedRoom ? (
                    <>
                      <Text style={styles.cellEmoji}>{placedRoom.emoji}</Text>
                      <Text style={[styles.cellRoomLabel, { color: placedRoom.color }]} numberOfLines={1}>{placedRoom.label}</Text>
                      <Pressable onPress={() => removeRoom(cell.dir)} style={styles.removeBtn} hitSlop={8}>
                        <Text style={styles.removeBtnText}>×</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.cellDir, { color: cell.color }]}>{cell.label}</Text>
                      <Text style={styles.cellElement}>{cell.element}</Text>
                      {canPlace && <Text style={styles.cellPlaceTip}>+ Place</Text>}
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.compassLabelSide}>EAST</Text>
        </View>
        <View style={styles.compassTop}><Text style={styles.compassLabel}>SOUTH</Text></View>

        {/* Stats + Analyze */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{placedCount}</Text>
            <Text style={styles.statLabel}>Placed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{ROOM_TYPES.length - placedCount}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </Card>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={handleAnalyze}
          disabled={placedCount === 0 || loading}
          style={[styles.analyzeBtn, (placedCount === 0 || loading) && { opacity: 0.45 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.analyzeBtnText}>🔮 Analyze Vastu · {placedCount} room{placedCount !== 1 ? 's' : ''}</Text>
          )}
        </Pressable>

        {/* Vastu Tips */}
        <Text style={styles.sectionTitle}>Vastu Tips</Text>
        <Card style={styles.tipsCard}>
          {[
            '🚪 Main entrance ideally faces North, East, or NE',
            '🍳 Kitchen belongs in SE — the Agni corner',
            '🪔 Puja room in NE for divine energy',
            '🛏️ Master bedroom best in SW for stability',
            '📚 Study in N or E for better concentration',
            '⛲ Water bodies in N or NE only',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipText}>{tip}</Text>
          ))}
        </Card>

        {/* Results */}
        {result && (
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }}>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Analysis Results</Text>
            <Card style={styles.resultsCard}>
              <ScoreGauge score={result.overallScore} />
            </Card>

            {result.analysis.vastuScores && result.analysis.vastuScores.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Room Analysis</Text>
                {result.analysis.vastuScores.map((item, i) => (
                  <MotiView key={i} from={{ opacity: 0, translateX: -10 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 350, delay: i * 60 }}>
                    <RoomScoreCard item={item} />
                  </MotiView>
                ))}
              </>
            )}

            {result.analysis.generalRemedies && result.analysis.generalRemedies.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>General Remedies</Text>
                <Card style={styles.tipsCard}>
                  {result.analysis.generalRemedies.map((r, i) => (
                    <Text key={i} style={styles.tipText}>💡 {r}</Text>
                  ))}
                </Card>
              </>
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

  paletteScroll: { gap: 8, paddingBottom: 4, marginBottom: 10 },
  roomChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  roomChipEmoji: { fontSize: 16 },
  roomChipLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.text },
  roomChipCheck: { fontSize: 12, color: colors.success, marginLeft: 2 },

  hintBanner: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12, alignItems: 'center' },
  hintText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },

  compassTop: { alignItems: 'center', marginVertical: 4 },
  compassLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 1.5 },
  compassLabelSide: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 1, writingDirection: 'ltr', textAlign: 'center', width: 20, alignSelf: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },

  cell: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: 4, position: 'relative', gap: 2 },
  cellPlaceable: { borderColor: `${colors.success}66`, backgroundColor: `${colors.success}08` },
  cellDir: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  cellElement: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center' },
  cellPlaceTip: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: colors.success },
  cellEmoji: { fontSize: 18 },
  cellRoomLabel: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  removeBtn: { position: 'absolute', top: 2, right: 4 },
  removeBtnText: { fontSize: 15, color: colors.destructive, fontFamily: 'Poppins_700Bold' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 12 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: colors.bgSurface, borderColor: colors.border, paddingVertical: 14 },
  statNum: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: colors.primary },
  statLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  errorText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.destructive, textAlign: 'center', marginBottom: 10 },
  analyzeBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  analyzeBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.bg },

  tipsCard: { backgroundColor: colors.bgSurface, borderColor: 'rgba(212,168,67,0.20)', gap: 8 },
  tipText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20 },

  resultsCard: { backgroundColor: colors.bgSurface, borderColor: colors.border, alignItems: 'center', marginBottom: 8 },
  gaugeWrap: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  gaugeRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 8, alignItems: 'center', justifyContent: 'center', gap: 2 },
  gaugeScore: { fontSize: 34, fontFamily: 'Poppins_700Bold', lineHeight: 38 },
  gaugeUnit: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  gaugeTitle: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  roomScoreCard: { backgroundColor: colors.bgSurface, borderWidth: 1, marginBottom: 8 },
  roomScoreHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  roomScoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  roomScoreEmoji: { fontSize: 22 },
  roomScoreName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  roomScoreDir: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
  roomScoreBadge: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roomScoreNum: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  roomScoreSuggestion: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 18 },
});
