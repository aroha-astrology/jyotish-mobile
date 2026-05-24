import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

const PLANET_COLOR: Record<string, string> = {
  Sun: '#F4B942', Moon: '#8BC4E8', Mars: '#E8735A', Mercury: '#6BBF9E',
  Jupiter: '#C4A84F', Venus: '#E8A87C', Saturn: '#8BA89B', Rahu: '#7BA3B8', Ketu: '#9B6B9E',
};

interface GemstoneEntry {
  planet: string;
  emoji: string;
  primaryGem: string;
  alternates: string[];
  metal: string;
  finger: string;
  day: string;
  weight: string;
  mantra: string;
  benefit: string;
}

const GEMSTONES: GemstoneEntry[] = [
  {
    planet: 'Sun', emoji: '☉', primaryGem: 'Ruby (Manik)', alternates: ['Red Spinel', 'Red Zircon'],
    metal: 'Gold', finger: 'Ring finger', day: 'Sunday', weight: '3–5 carats',
    mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    benefit: 'Enhances confidence, leadership, vitality, and self-expression.',
  },
  {
    planet: 'Moon', emoji: '☽', primaryGem: 'Pearl (Moti)', alternates: ['Moonstone', 'White Coral'],
    metal: 'Silver', finger: 'Little finger', day: 'Monday', weight: '2–4 carats',
    mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    benefit: 'Calms emotions, strengthens intuition, and improves mental peace.',
  },
  {
    planet: 'Mars', emoji: '♂', primaryGem: 'Red Coral (Moonga)', alternates: ['Carnelian', 'Blood Stone'],
    metal: 'Gold or Copper', finger: 'Ring finger', day: 'Tuesday', weight: '6–9 carats',
    mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    benefit: 'Boosts courage, energy, stamina, and overcomes obstacles.',
  },
  {
    planet: 'Mercury', emoji: '☿', primaryGem: 'Emerald (Panna)', alternates: ['Green Tourmaline', 'Peridot'],
    metal: 'Gold', finger: 'Little finger', day: 'Wednesday', weight: '3–5 carats',
    mantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    benefit: 'Sharpens intellect, communication, memory, and business acumen.',
  },
  {
    planet: 'Jupiter', emoji: '♃', primaryGem: 'Yellow Sapphire (Pukhraj)', alternates: ['Topaz', 'Citrine'],
    metal: 'Gold', finger: 'Index finger', day: 'Thursday', weight: '3–6 carats',
    mantra: 'Om Graam Greem Graum Sah Gurave Namah',
    benefit: 'Attracts wisdom, prosperity, spiritual growth, and good fortune.',
  },
  {
    planet: 'Venus', emoji: '♀', primaryGem: 'Diamond (Heera)', alternates: ['White Sapphire', 'Zircon'],
    metal: 'Gold or Platinum', finger: 'Middle finger', day: 'Friday', weight: '0.5–1 carat',
    mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    benefit: 'Enhances beauty, luxury, love, creativity, and artistic talent.',
  },
  {
    planet: 'Saturn', emoji: '♄', primaryGem: 'Blue Sapphire (Neelam)', alternates: ['Amethyst', 'Blue Spinel'],
    metal: 'Silver or Gold', finger: 'Middle finger', day: 'Saturday', weight: '3–5 carats',
    mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    benefit: 'Removes obstacles, brings discipline, career success, and longevity.',
  },
  {
    planet: 'Rahu', emoji: '☊', primaryGem: "Hessonite (Gomed)", alternates: ['Zircon', 'Spessartite'],
    metal: 'Silver', finger: 'Middle finger', day: 'Saturday', weight: '6–9 carats',
    mantra: 'Om Raam Rahave Namah',
    benefit: 'Neutralizes Rahu\'s negative effects; enhances ambition and focus.',
  },
  {
    planet: 'Ketu', emoji: '☋', primaryGem: "Cat's Eye (Lehsunia)", alternates: ['Beryl', 'Tourmaline'],
    metal: 'Silver', finger: 'Middle finger', day: 'Thursday', weight: '3–5 carats',
    mantra: 'Om Hreem Ketave Namah',
    benefit: 'Promotes spirituality, intuition, and protects from hidden enemies.',
  },
];

export default function GemstoneScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Gemstone Guide</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={s.introCard}
        >
          <Text style={s.introText}>
            Each planet responds to a specific gemstone. Wearing the right stone can strengthen
            a planet's positive influence. Tap any planet to see full details.
          </Text>
        </MotiView>

        <Text style={s.sectionLabel}>NAVAGRAHA GEMSTONES</Text>

        {GEMSTONES.map((gem, i) => {
          const color = PLANET_COLOR[gem.planet] ?? '#d4a843';
          const isOpen = expanded === gem.planet;
          return (
            <MotiView
              key={gem.planet}
              from={{ opacity: 0, translateX: -6 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 280, delay: i * 40 }}
              style={[s.card, isOpen && s.cardOpen, { borderColor: isOpen ? color + '44' : 'rgba(255,255,255,0.08)' }]}
            >
              <Pressable
                onPress={() => setExpanded(isOpen ? null : gem.planet)}
                style={s.cardHeader}
              >
                <View style={[s.planetBadge, { borderColor: color + '55', backgroundColor: color + '18' }]}>
                  <Text style={[s.planetEmoji, { color }]}>{gem.emoji}</Text>
                </View>
                <View style={s.cardHeaderText}>
                  <Text style={s.planetName}>{gem.planet}</Text>
                  <Text style={s.primaryGemName}>{gem.primaryGem}</Text>
                </View>
                <Text style={s.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </Pressable>

              <AnimatePresence>
                {isOpen && (
                  <MotiView
                    key="body"
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' as any }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={s.cardBody}
                  >
                    <Text style={s.benefit}>{gem.benefit}</Text>

                    <View style={s.detailGrid}>
                      <View style={s.detailItem}>
                        <Text style={s.detailLabel}>Alternates</Text>
                        <Text style={s.detailValue}>{gem.alternates.join(', ')}</Text>
                      </View>
                      <View style={s.detailItem}>
                        <Text style={s.detailLabel}>Metal</Text>
                        <Text style={s.detailValue}>{gem.metal}</Text>
                      </View>
                      <View style={s.detailItem}>
                        <Text style={s.detailLabel}>Finger</Text>
                        <Text style={s.detailValue}>{gem.finger}</Text>
                      </View>
                      <View style={s.detailItem}>
                        <Text style={s.detailLabel}>Day</Text>
                        <Text style={s.detailValue}>{gem.day}</Text>
                      </View>
                      <View style={s.detailItem}>
                        <Text style={s.detailLabel}>Weight</Text>
                        <Text style={s.detailValue}>{gem.weight}</Text>
                      </View>
                    </View>

                    <View style={[s.mantraCard, { borderColor: color + '33', backgroundColor: color + '10' }]}>
                      <Text style={[s.mantraLabel, { color }]}>Mantra</Text>
                      <Text style={s.mantraText}>{gem.mantra}</Text>
                    </View>
                  </MotiView>
                )}
              </AnimatePresence>
            </MotiView>
          );
        })}
      </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  introCard: {
    backgroundColor: 'rgba(212,168,67,0.07)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.18)', marginBottom: 20,
  },
  introText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#b8a898', lineHeight: 21 },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#7a6a90', letterSpacing: 1.2, marginBottom: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18,
    borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  cardOpen: { backgroundColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  planetBadge: {
    width: 44, height: 44, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  planetEmoji: { fontSize: 22 },
  cardHeaderText: { flex: 1 },
  planetName: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  primaryGemName: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', marginTop: 2 },
  chevron: { fontSize: 10, color: '#7a6a90' },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  benefit: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 21 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailItem: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minWidth: '45%', flex: 1,
  },
  detailLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', letterSpacing: 0.6, marginBottom: 3 },
  detailValue: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  mantraCard: { borderRadius: 12, padding: 14, borderWidth: 1 },
  mantraLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 1, marginBottom: 6 },
  mantraText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#7a6a90', lineHeight: 20, fontStyle: 'italic' },
});
