import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Send } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { generateKundli, lookupPincode, saveLifeContext } from '@/lib/api';
import { maybeAskForPushPermission } from '@/lib/push';
import { useStore } from '@/store/useStore';
import { INDIAN_CITIES } from '@aroha-astrology/shared';

interface CityHit {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// WhatsApp-style palette
const C = {
  bg:     '#0b141a',
  header: '#202c33',
  bot:    '#202c33',
  user:   '#005c4b',
  green:  '#00a884',
  text:   '#e9edef',
  sub:    '#8696a0',
  border: '#2a3942',
  input:  '#2a3942',
} as const;

type Question = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Message = { id: string; from: 'bot' | 'user'; text: string; time: string };

interface UserDetails {
  name: string;
  dob: string;      // DD/MM/YYYY
  tob: string;      // HH:MM
  tobSource: string;
  pob: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: string;
  maritalStatus: string;
}

const TIME_SOURCES = ['Birth Certificate', 'Family', 'Memory', 'Hospital Record', 'Approximate'];
const TIME_SOURCE_MAP: Record<string, string> = {
  'Birth Certificate': 'certificate',
  'Family': 'family',
  'Memory': 'approximate',
  'Hospital Record': 'hospital',
  'Approximate': 'approximate',
};
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'dating', label: 'In a relationship' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'married', label: 'Married' },
  { value: 'separated_divorced', label: 'Separated / Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

function msgTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isValidDOB(s: string) {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const [, dd, mm, yyyy] = m;
  const d = +dd, mo = +mm, y = +yyyy;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  if (y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

function isValidTOB(s: string) {
  const m = s.match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  return +m[1] <= 23 && +m[2] <= 59;
}

function toISODate(dd_mm_yyyy: string) {
  const [dd, mm, yyyy] = dd_mm_yyyy.split('/');
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function BotBubble({ text }: { text: string }) {
  return (
    <View style={styles.botRow}>
      <View style={styles.botAvatar}>
        <Text style={styles.botAvatarText}>✦</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleBot]}>
        <Text style={styles.bubbleText}>{text}</Text>
        <Text style={styles.bubbleTime}>{msgTime()}</Text>
      </View>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userRow}>
      <View style={[styles.bubble, styles.bubbleUser]}>
        <Text style={styles.bubbleText}>{text}</Text>
        <Text style={[styles.bubbleTime, { textAlign: 'right' }]}>{msgTime()}</Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.botRow}>
      <View style={styles.botAvatar}>
        <Text style={styles.botAvatarText}>✦</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ translateY: 0 }}
            animate={{ translateY: -5 }}
            transition={{ type: 'timing', duration: 400, loop: true, delay: i * 150 }}
            style={styles.typingDot}
          />
        ))}
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState<Question>(1);
  const [textInput, setTextInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CityHit[]>([]);
  const [step, setStep] = useState<'chat' | 'generating'>('chat');
  const [details, setDetails] = useState<UserDetails>({
    name: '', dob: '', tob: '', tobSource: 'family',
    pob: 'New Delhi', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata',
    gender: 'male', maritalStatus: '',
  });
  const latestDetails = useRef<UserDetails>(details);
  latestDetails.current = details;

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const addMsg = useCallback((msg: Omit<Message, 'id' | 'time'>) => {
    setMessages((prev) => [...prev, { ...msg, id: String(Date.now() + Math.random()), time: msgTime() }]);
  }, []);

  const typeBot = useCallback(async (text: string, ms = 1000) => {
    setBotTyping(true);
    await delay(ms);
    setBotTyping(false);
    addMsg({ from: 'bot', text });
  }, [addMsg]);

  // Boot sequence
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await delay(400);
      if (cancelled) return;
      addMsg({ from: 'bot', text: 'Namaste! Welcome to Aroha Astrology 🌟' });

      await delay(300);
      if (cancelled) return;
      setBotTyping(true);
      await delay(1200);
      if (cancelled) return;
      setBotTyping(false);
      addMsg({ from: 'bot', text: "I need a few details to create your personalised cosmic profile. Let's start!" });

      await delay(300);
      if (cancelled) return;
      setBotTyping(true);
      await delay(900);
      if (cancelled) return;
      setBotTyping(false);
      addMsg({ from: 'bot', text: 'What is your full name?' });
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, botTyping]);

  const handleTextSend = async () => {
    const val = textInput.trim();
    if (!val) return;

    if (question === 2 && !isValidDOB(val)) {
      addMsg({ from: 'user', text: val });
      setTextInput('');
      await typeBot("That date doesn't look right. Please enter in DD/MM/YYYY format (e.g. 17/04/1993).", 700);
      return;
    }
    if (question === 3 && !isValidTOB(val)) {
      addMsg({ from: 'user', text: val });
      setTextInput('');
      await typeBot("That time doesn't look right. Please enter in HH:MM 24-hour format (e.g. 14:30).", 700);
      return;
    }

    addMsg({ from: 'user', text: val });
    setTextInput('');

    if (question === 1) {
      setDetails((d) => ({ ...d, name: val }));
      await typeBot(`Nice to meet you, ${val}! When were you born? (DD/MM/YYYY)`, 900);
      setQuestion(2);
    } else if (question === 2) {
      setDetails((d) => ({ ...d, dob: val }));
      await typeBot('What time were you born? (e.g. 14:30 in 24-hour format)', 900);
      setQuestion(3);
    } else if (question === 3) {
      setDetails((d) => ({ ...d, tob: val }));
      await typeBot('How do you know your birth time?', 900);
      setQuestion(4);
    }
  };

  const handleTimeSource = async (src: string) => {
    addMsg({ from: 'user', text: src });
    setDetails((d) => ({ ...d, tobSource: TIME_SOURCE_MAP[src] ?? 'family' }));
    await typeBot('Where were you born? Enter your city name or 6-digit pincode:', 900);
    setQuestion(5);
  };

  const onCityInputChange = (v: string) => {
    setPincodeInput(v);
    setPincodeError('');
    if (/^\d{6}$/.test(v.trim()) || v.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }
    const q = v.toLowerCase();
    const hits = (INDIAN_CITIES as CityHit[])
      .filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
      .slice(0, 6);
    setCitySuggestions(hits);
  };

  const selectCity = async (c: CityHit) => {
    addMsg({ from: 'user', text: `${c.name}, ${c.state}` });
    setDetails((d) => ({
      ...d,
      pob: `${c.name}, ${c.state}`,
      latitude: c.latitude,
      longitude: c.longitude,
      timezone: c.timezone,
    }));
    setPincodeInput('');
    setCitySuggestions([]);
    await typeBot('Last question! What is your gender?', 900);
    setQuestion(6);
  };

  const handlePincodeLookup = async () => {
    const pin = pincodeInput.trim();
    if (!pin) return;
    setPincodeError('');

    if (/^\d{6}$/.test(pin)) {
      setPincodeLoading(true);
      try {
        const resp = await lookupPincode(pin);
        const loc = resp.data;
        addMsg({ from: 'user', text: `${loc.city}, ${loc.state}` });
        setDetails((d) => ({
          ...d,
          pob: `${loc.city}, ${loc.state}`,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
        }));
        setPincodeInput('');
        setCitySuggestions([]);
        await typeBot('Last question! What is your gender?', 900);
        setQuestion(6);
      } catch {
        setPincodeError('Pincode not found. Please type your city name to see suggestions.');
      } finally {
        setPincodeLoading(false);
      }
      return;
    }

    // Not a pincode — pick the top suggestion if available, else fallback
    if (citySuggestions[0]) {
      await selectCity(citySuggestions[0]);
      return;
    }
    addMsg({ from: 'user', text: pin });
    setDetails((d) => ({ ...d, pob: pin }));
    setPincodeInput('');
    setCitySuggestions([]);
    await typeBot('Last question! What is your gender?', 900);
    setQuestion(6);
  };

  const handleGender = async (gender: string) => {
    addMsg({ from: 'user', text: gender });
    setDetails((d) => ({ ...d, gender: gender.toLowerCase() }));
    setQuestion(7);
    await typeBot('One last thing — what is your relationship status?', 900);
  };

  const handleMaritalStatus = async (value: string, label: string) => {
    addMsg({ from: 'user', text: label });
    setDetails((d) => ({ ...d, maritalStatus: value }));
    setQuestion((8) as any);
    await typeBot('Perfect! Let me analyse your cosmic chart… ✨', 800);
    setTimeout(() => finish({ ...latestDetails.current, maritalStatus: value }), 1200);
  };

  const finish = async (finalDetails: UserDetails) => {
    setStep('generating');
    try {
      await generateKundli({
        name: finalDetails.name,
        dob: toISODate(finalDetails.dob),
        tob: finalDetails.tob,
        tobSource: finalDetails.tobSource,
        pob: finalDetails.pob,
        latitude: finalDetails.latitude,
        longitude: finalDetails.longitude,
        timezone: finalDetails.timezone,
        gender: finalDetails.gender,
        isPrimary: true,
      });
    } catch {
      // proceed anyway — chart might still be created async
    }
    if (finalDetails.maritalStatus) {
      saveLifeContext({ marital_status: finalDetails.maritalStatus }).catch(() => {});
    }
    // Invalidate every cached query so the dashboard refetches the new chart,
    // panchang, horoscope, profiles, etc. on first render.
    await queryClient.invalidateQueries();
    await delay(2800);
    router.replace('/(tabs)');
    maybeAskForPushPermission().catch(() => {});
  };

  if (step === 'generating') {
    return (
      <View style={[styles.root, styles.generatingCenter]}>
        <View style={styles.generatingInner}>
          <View style={styles.spinner}>
            <ActivityIndicator size="large" color={C.green} />
          </View>
          <Text style={styles.generatingTitle}>Analysing Your Chart</Text>
          <Text style={styles.generatingSub}>Creating your personalised cosmic profile…</Text>
          <View style={styles.generatingDots}>
            {[0, 1, 2].map((i) => (
              <MotiView
                key={i}
                from={{ scale: 0.6, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'timing', duration: 600, loop: true, delay: i * 200 }}
                style={[styles.generatingDot, { backgroundColor: C.green }]}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  const allMessages: Array<Message | 'typing'> = botTyping
    ? [...messages, 'typing']
    : messages;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.waHeader}>
          <View style={styles.waAvatar}>
            <Text style={styles.waAvatarText}>✦</Text>
          </View>
          <View style={styles.waHeaderInfo}>
            <Text style={styles.waHeaderName}>Aroha Astrology</Text>
            <Text style={[styles.waHeaderStatus, { color: botTyping ? C.green : C.sub }]}>
              {botTyping ? 'typing...' : 'Setting up your profile'}
            </Text>
          </View>
          {/* Progress dots */}
          <View style={styles.progressDots}>
            {[1, 2, 3, 4, 5, 6, 7].map((q) => (
              <View
                key={q}
                style={[
                  styles.progressDot,
                  q < question
                    ? { width: 8, height: 8, backgroundColor: C.green }
                    : { width: 5, height: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={allMessages}
            keyExtractor={(item, i) => (item === 'typing' ? 'typing' : item.id)}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => {
              if (item === 'typing') return <TypingIndicator />;
              return item.from === 'bot'
                ? <BotBubble text={item.text} />
                : <UserBubble text={item.text} />;
            }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input bar */}
          <View style={[styles.inputBar, { paddingBottom: 10 + insets.bottom }]}>
            {/* Q4 — time source chips */}
            {question === 4 && (
              <View style={styles.chipGrid}>
                {TIME_SOURCES.map((src) => (
                  <Pressable
                    key={src}
                    onPress={() => handleTimeSource(src)}
                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.chipText}>{src}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Q5 — city / pincode with autocomplete */}
            {question === 5 && (
              <>
                {citySuggestions.length > 0 && (
                  <View style={styles.suggestList}>
                    {citySuggestions.map((c) => (
                      <Pressable
                        key={`${c.name}-${c.state}`}
                        onPress={() => selectCity(c)}
                        style={({ pressed }) => [styles.suggestRow, pressed && { backgroundColor: C.input }]}
                      >
                        <Text style={styles.suggestPin}>📍</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestName}>{c.name}</Text>
                          <Text style={styles.suggestState}>{c.state}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={pincodeInput}
                    onChangeText={onCityInputChange}
                    placeholder="Type your city or 6-digit pincode…"
                    placeholderTextColor={C.sub}
                    keyboardType="default"
                    returnKeyType="send"
                    onSubmitEditing={handlePincodeLookup}
                    autoFocus
                  />
                  {pincodeLoading ? (
                    <ActivityIndicator color={C.green} style={styles.sendBtn} />
                  ) : (
                    <Pressable
                      onPress={handlePincodeLookup}
                      style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.7 }]}
                      disabled={!pincodeInput.trim()}
                    >
                      <View style={[styles.sendCircle, !pincodeInput.trim() && { opacity: 0.4 }]}>
                        <Send size={16} color="#fff" />
                      </View>
                    </Pressable>
                  )}
                </View>
              </>
            )}
            {pincodeError ? (
              <Text style={styles.errorText}>{pincodeError}</Text>
            ) : null}

            {/* Q6 — gender chips */}
            {question === 6 && (
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => handleGender(g)}
                    style={({ pressed }) => [styles.genderChip, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.chipText}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Q7 — marital status chips */}
            {question === 7 && (
              <View style={styles.chipGrid}>
                {MARITAL_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleMaritalStatus(opt.value, opt.label)}
                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.chipText}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Q1–3 — text input */}
            {question <= 3 && (
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  value={textInput}
                  onChangeText={(raw) => {
                    if (question === 2) {
                      const d = raw.replace(/\D/g, '').slice(0, 8);
                      let out = d.slice(0, 2);
                      if (d.length > 2) out += '/' + d.slice(2, 4);
                      if (d.length > 4) out += '/' + d.slice(4, 8);
                      setTextInput(out);
                    } else if (question === 3) {
                      const d = raw.replace(/\D/g, '').slice(0, 4);
                      let out = d.slice(0, 2);
                      if (d.length > 2) out += ':' + d.slice(2, 4);
                      setTextInput(out);
                    } else {
                      setTextInput(raw);
                    }
                  }}
                  maxLength={question === 2 ? 10 : question === 3 ? 5 : undefined}
                  keyboardType={question === 2 || question === 3 ? 'numeric' : 'default'}
                  placeholder={
                    question === 1 ? 'Type your name…'
                    : question === 2 ? 'DD/MM/YYYY'
                    : 'HH:MM (24h)'
                  }
                  placeholderTextColor={C.sub}
                  returnKeyType="send"
                  onSubmitEditing={handleTextSend}
                  autoFocus
                />
                <Pressable
                  onPress={handleTextSend}
                  style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.7 }]}
                  disabled={!textInput.trim()}
                >
                  <View style={[styles.sendCircle, !textInput.trim() && { opacity: 0.4 }]}>
                    <Send size={16} color="#fff" />
                  </View>
                </Pressable>
              </View>
            )}

            {/* Waiting */}
            {(question as number) > 7 && (
              <Text style={styles.waitText}>Just a moment…</Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },

  // Generating
  generatingCenter: { justifyContent: 'center', alignItems: 'center' },
  generatingInner: { alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  spinner: { marginBottom: 8 },
  generatingTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: C.text, textAlign: 'center' },
  generatingSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.sub, textAlign: 'center' },
  generatingDots: { flexDirection: 'row', gap: 8, marginTop: 8 },
  generatingDot: { width: 8, height: 8, borderRadius: 4 },

  // WA Header
  waHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.header },
  waAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4a3000' },
  waAvatarText: { fontSize: 18, color: '#DAA520' },
  waHeaderInfo: { flex: 1 },
  waHeaderName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.text },
  waHeaderStatus: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  progressDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  progressDot: { borderRadius: 4 },

  // Messages
  messageList: { paddingHorizontal: 12, paddingVertical: 12, gap: 6 },
  botRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  botAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4a3000', flexShrink: 0, marginBottom: 2 },
  botAvatarText: { fontSize: 12, color: '#DAA520' },
  bubble: { maxWidth: '75%', paddingHorizontal: 12, paddingVertical: 8 },
  bubbleBot: { backgroundColor: C.bot, borderRadius: 12, borderBottomLeftRadius: 3 },
  bubbleUser: { backgroundColor: C.user, borderRadius: 12, borderBottomRightRadius: 3 },
  bubbleText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: C.text, lineHeight: 22 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  typingBubble: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 12 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.sub },

  // Input bar
  inputBar: { backgroundColor: C.header, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textInput: {
    flex: 1, backgroundColor: C.input, color: C.text,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 24, fontSize: 14, fontFamily: 'Poppins_400Regular',
    borderWidth: 1, borderColor: C.border,
  },
  sendBtn: { flexShrink: 0 },
  sendCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.bot, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: C.text },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderChip: {
    flex: 1, paddingVertical: 12,
    backgroundColor: C.bot, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
  },

  errorText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#f87171', paddingHorizontal: 4 },
  waitText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.sub, textAlign: 'center', paddingVertical: 8 },

  suggestList: {
    maxHeight: 240,
    borderRadius: 12,
    backgroundColor: C.bot,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestPin: { fontSize: 16 },
  suggestName: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.text },
  suggestState: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.sub, marginTop: 2 },
});
