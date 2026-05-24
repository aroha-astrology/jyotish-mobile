import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { getPanchang } from '@/lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

type ToneKey = 'auspicious' | 'neutral' | 'inauspicious';
const TONE_COLOR: Record<ToneKey, string> = {
  auspicious: '#22c55e',
  neutral: '#eab308',
  inauspicious: '#f87171',
};

interface DayData {
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  vara: string;
  rahukaal: string;
  abhijitMuhurta: string;
  tone: ToneKey;
  festivals: string[];
  auspiciousFor: string[];
  avoidFor: string[];
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const cells = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const dateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;

  const { data, isLoading } = useQuery<DayData>({
    queryKey: ['panchang-day', dateStr],
    queryFn: async () => {
      const res = await getPanchang(dateStr!);
      if (!res.success) throw new Error('Failed');
      return res.data as unknown as DayData;
    },
    enabled: !!dateStr,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Panchang Calendar</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320 }}
          style={s.monthNav}
        >
          <Pressable onPress={prevMonth} style={s.navBtn}>
            <Text style={s.navBtnText}>‹</Text>
          </Pressable>
          <Text style={s.monthLabel}>{MONTHS[month]} {year}</Text>
          <Pressable onPress={nextMonth} style={s.navBtn}>
            <Text style={s.navBtnText}>›</Text>
          </Pressable>
        </MotiView>

        {/* Weekday headers */}
        <View style={s.weekRow}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={[s.weekDay, d === 'Sun' && s.weekDaySun]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {cells.map((day, idx) => {
            if (day === null) return <View key={`empty-${idx}`} style={s.dayCell} />;
            const selected = day === selectedDay;
            const todayMark = isToday(day);
            const isSunday = (idx % 7) === 0;
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  s.dayCell,
                  s.dayCellActive,
                  selected && s.dayCellSelected,
                  todayMark && !selected && s.dayCellToday,
                ]}
              >
                <Text style={[
                  s.dayNum,
                  isSunday && s.dayNumSun,
                  selected && s.dayNumSelected,
                  todayMark && !selected && s.dayNumToday,
                ]}>
                  {day}
                </Text>
                {todayMark && <View style={s.todayDot} />}
              </Pressable>
            );
          })}
        </View>

        {/* Day detail */}
        {selectedDay && (
          <View style={s.detailSection}>
            <Text style={s.detailDateText}>
              {WEEKDAYS[new Date(year, month, selectedDay).getDay()]},{' '}
              {selectedDay} {MONTHS[month]} {year}
            </Text>

            {isLoading && (
              <View style={s.detailLoading}>
                <ActivityIndicator color="#d4a843" size="small" />
                <Text style={s.detailLoadingText}>Loading panchang…</Text>
              </View>
            )}

            {data && (
              <MotiView
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                {/* Tone banner */}
                <View style={[s.toneBanner, { borderColor: TONE_COLOR[data.tone] + '44', backgroundColor: TONE_COLOR[data.tone] + '10' }]}>
                  <View style={[s.toneDot, { backgroundColor: TONE_COLOR[data.tone] }]} />
                  <Text style={[s.toneText, { color: TONE_COLOR[data.tone] }]}>
                    {data.tone.charAt(0).toUpperCase() + data.tone.slice(1)} Day
                  </Text>
                  {data.festivals?.map((f, i) => (
                    <View key={i} style={s.festivalPill}>
                      <Text style={s.festivalText}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* Panchang details */}
                <View style={s.panchangGrid}>
                  {[
                    { label: 'Tithi', value: data.tithi },
                    { label: 'Nakshatra', value: data.nakshatra },
                    { label: 'Yoga', value: data.yoga },
                    { label: 'Karana', value: data.karana },
                    { label: 'Vara', value: data.vara },
                    { label: 'Rahu Kaal', value: data.rahukaal },
                  ].map(item => (
                    <View key={item.label} style={s.panchangItem}>
                      <Text style={s.panchangLabel}>{item.label}</Text>
                      <Text style={s.panchangValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                {data.abhijitMuhurta && (
                  <View style={s.muhurtaCard}>
                    <Text style={s.muhurtaLabel}>⭐ Abhijit Muhurta</Text>
                    <Text style={s.muhurtaValue}>{data.abhijitMuhurta}</Text>
                  </View>
                )}

                {data.auspiciousFor?.length > 0 && (
                  <View style={s.listCard}>
                    <Text style={s.listCardTitle}>✓ Auspicious For</Text>
                    {data.auspiciousFor.map((item, i) => (
                      <Text key={i} style={[s.listItem, { color: '#22c55e' }]}>• {item}</Text>
                    ))}
                  </View>
                )}

                {data.avoidFor?.length > 0 && (
                  <View style={[s.listCard, s.listCardAvoid]}>
                    <Text style={s.listCardTitle}>✗ Avoid</Text>
                    {data.avoidFor.map((item, i) => (
                      <Text key={i} style={[s.listItem, { color: '#f87171' }]}>• {item}</Text>
                    ))}
                  </View>
                )}
              </MotiView>
            )}
          </View>
        )}
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
  scrollContent: { paddingBottom: 60 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  navBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 22, color: '#d4a843', lineHeight: 28 },
  monthLabel: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  weekRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', paddingVertical: 4 },
  weekDaySun: { color: '#f87171' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellActive: { borderRadius: 10 },
  dayCellSelected: { backgroundColor: '#d4a843' },
  dayCellToday: { backgroundColor: 'rgba(212,168,67,0.15)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)' },
  dayNum: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#7a6a90' },
  dayNumSun: { color: '#f87171' },
  dayNumSelected: { color: '#02010a', fontFamily: 'Poppins_700Bold' },
  dayNumToday: { color: '#d4a843' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#d4a843', position: 'absolute', bottom: 3 },
  detailSection: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 8 },
  detailDateText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 14 },
  detailLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  detailLoadingText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#7a6a90' },
  toneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 14,
  },
  toneDot: { width: 8, height: 8, borderRadius: 4 },
  toneText: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  festivalPill: {
    backgroundColor: 'rgba(212,168,67,0.15)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  festivalText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#d4a843' },
  panchangGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  panchangItem: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4,
  },
  panchangLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90', letterSpacing: 0.6 },
  panchangValue: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#7a6a90' },
  muhurtaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(212,168,67,0.08)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)', marginBottom: 12,
  },
  muhurtaLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#d4a843' },
  muhurtaValue: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#7a6a90' },
  listCard: {
    backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', marginBottom: 10, gap: 6,
  },
  listCardAvoid: { backgroundColor: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.2)' },
  listCardTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#7a6a90', marginBottom: 4 },
  listItem: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 21 },
});
