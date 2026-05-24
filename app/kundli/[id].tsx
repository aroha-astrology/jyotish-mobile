import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface ChartData {
  id: string;
  profile: {
    name: string;
    date_of_birth: string;
    time_of_birth: string;
    place_of_birth: string;
  };
  ascendant: string;
  moon_sign: string;
  sun_sign: string;
  nakshatra: string;
  planets: Array<{
    name: string;
    sign: string;
    house: number;
    degree: string;
    retrograde: boolean;
  }>;
  houses: Array<{
    number: number;
    sign: string;
    planets: string[];
  }>;
  predictions: Array<{
    category: string;
    title: string;
    content: string;
  }>;
  remedies: Array<{
    type: string;
    description: string;
  }>;
  doshas: Array<{
    name: string;
    present: boolean;
    severity: string;
    description: string;
  }>;
}

export default function KundliResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chart, setChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChart();
  }, [id]);

  const fetchChart = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-kundli', {
        body: { chart_id: id },
      });
      if (error) throw error;
      setChart(data);
    } catch (err) {
      console.error('Failed to fetch chart:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading Kundli...
        </Text>
      </View>
    );
  }

  if (!chart) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Failed to load Kundli
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Badges */}
      <Card style={styles.card}>
        <Text style={[styles.profileName, { color: colors.text }]}>
          {chart.profile.name}
        </Text>
        <Text style={[styles.profileDetails, { color: colors.textSecondary }]}>
          {chart.profile.date_of_birth} | {chart.profile.time_of_birth}
        </Text>
        <Text style={[styles.profileDetails, { color: colors.textSecondary }]}>
          {chart.profile.place_of_birth}
        </Text>

        <View style={styles.badgeRow}>
          <Badge label="Ascendant" value={chart.ascendant} colors={colors} />
          <Badge label="Moon Sign" value={chart.moon_sign} colors={colors} />
          <Badge label="Nakshatra" value={chart.nakshatra} colors={colors} />
        </View>
      </Card>

      {/* Chart Display (Text-based) */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {'\uD83D\uDCCA'} Birth Chart
        </Text>
        <View style={styles.chartGrid}>
          {(chart.houses || Array.from({ length: 12 }, (_, i) => ({
            number: i + 1,
            sign: ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'][i],
            planets: [],
          }))).map((house) => (
            <View
              key={house.number}
              style={[styles.houseCell, { borderColor: colors.border }]}
            >
              <Text style={[styles.houseNumber, { color: colors.primary }]}>
                H{house.number}
              </Text>
              <Text style={[styles.houseSign, { color: colors.textSecondary }]}>
                {house.sign}
              </Text>
              {house.planets.length > 0 && (
                <Text style={[styles.housePlanets, { color: colors.text }]}>
                  {house.planets.join(', ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      </Card>

      {/* Planet Positions */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {'\uD83C\uDF0C'} Planet Positions
        </Text>
        {(chart.planets || []).map((planet, idx) => (
          <View
            key={idx}
            style={[styles.planetRow, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.planetName, { color: colors.text }]}>
              {planet.name} {planet.retrograde ? '(R)' : ''}
            </Text>
            <Text style={[styles.planetSign, { color: colors.textSecondary }]}>
              {planet.sign}
            </Text>
            <Text style={[styles.planetHouse, { color: colors.primary }]}>
              H{planet.house}
            </Text>
            <Text style={[styles.planetDegree, { color: colors.textSecondary }]}>
              {planet.degree}
            </Text>
          </View>
        ))}
      </Card>

      {/* Doshas */}
      {chart.doshas && chart.doshas.length > 0 && (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {'\u26A0\uFE0F'} Dosha Analysis
          </Text>
          {chart.doshas.map((dosha, idx) => (
            <View key={idx} style={styles.doshaItem}>
              <View style={styles.doshaHeader}>
                <Text style={[styles.doshaName, { color: colors.text }]}>
                  {dosha.name}
                </Text>
                <Text
                  style={[
                    styles.doshaBadge,
                    {
                      color: dosha.present ? '#EF4444' : '#22C55E',
                      backgroundColor: dosha.present ? '#EF444420' : '#22C55E20',
                    },
                  ]}
                >
                  {dosha.present ? `Present (${dosha.severity})` : 'Not Present'}
                </Text>
              </View>
              <Text style={[styles.doshaDesc, { color: colors.textSecondary }]}>
                {dosha.description}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Collapsible Predictions */}
      {(chart.predictions || []).map((pred, idx) => {
        const key = `pred-${idx}`;
        const isExpanded = expandedSections.has(key);

        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={() => toggleSection(key)}
          >
            <Card style={styles.card}>
              <View style={styles.collapsibleHeader}>
                <Text style={[styles.predCategory, { color: colors.primary }]}>
                  {pred.category}
                </Text>
                <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </Text>
              </View>
              <Text style={[styles.predTitle, { color: colors.text }]}>
                {pred.title}
              </Text>
              {isExpanded && (
                <Text style={[styles.predContent, { color: colors.textSecondary }]}>
                  {pred.content}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        );
      })}

      {/* Remedies */}
      {chart.remedies && chart.remedies.length > 0 && (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {'\uD83D\uDC8E'} Remedies
          </Text>
          {chart.remedies.map((remedy, idx) => (
            <View key={idx} style={styles.remedyItem}>
              <View style={[styles.remedyBullet, { backgroundColor: colors.primary }]} />
              <View style={styles.remedyContent}>
                <Text style={[styles.remedyType, { color: colors.primary }]}>
                  {remedy.type}
                </Text>
                <Text style={[styles.remedyDesc, { color: colors.textSecondary }]}>
                  {remedy.description}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Badge({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={[badgeStyles.badge, { backgroundColor: colors.primary + '15' }]}>
      <Text style={[badgeStyles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[badgeStyles.value, { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: { fontSize: 11, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 16 },
  errorText: { fontSize: 18, fontWeight: '600' },
  card: { marginBottom: 12 },
  profileName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileDetails: { fontSize: 14, marginBottom: 2 },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  houseCell: {
    width: '25%',
    aspectRatio: 1,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  houseNumber: { fontSize: 12, fontWeight: '700' },
  houseSign: { fontSize: 10, marginTop: 2 },
  housePlanets: { fontSize: 9, textAlign: 'center', marginTop: 2 },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planetName: { flex: 2, fontSize: 14, fontWeight: '600' },
  planetSign: { flex: 2, fontSize: 14 },
  planetHouse: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  planetDegree: { flex: 1.5, fontSize: 13, textAlign: 'right' },
  doshaItem: { marginBottom: 14 },
  doshaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  doshaName: { fontSize: 15, fontWeight: '600' },
  doshaBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  doshaDesc: { fontSize: 13, lineHeight: 20 },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expandIcon: { fontSize: 12 },
  predCategory: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  predTitle: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  predContent: { fontSize: 14, lineHeight: 22, marginTop: 10 },
  remedyItem: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  remedyBullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  remedyContent: { flex: 1 },
  remedyType: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  remedyDesc: { fontSize: 14, lineHeight: 20 },
});
