import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { ChevronLeft, Send, Sparkles } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { streamChat, createChatSession, getChatMessages } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { CosmicBackground } from '@/components/CosmicBackground';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const ASTROLOGERS: Record<string, { name: string; specialty: string; color: string }> = {
  '1': { name: 'Pandit Sharma',  specialty: 'Vedic Astrology',      color: '#f5a623' },
  '2': { name: 'Dr. Priya Nair', specialty: 'Kundli & Predictions', color: '#c4b5fd' },
  '3': { name: 'Guru Raghavan',  specialty: 'Numerology & Tarot',   color: '#00d4b8' },
};

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250 }}
      style={[styles.bubbleWrapper, isUser && styles.bubbleWrapperUser]}
    >
      {!isUser && (
        <View style={styles.botAvatar}>
          <Sparkles size={14} color={colors.primary} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
          {message.streaming && <Text style={styles.cursor}>▋</Text>}
        </Text>
      </View>
    </MotiView>
  );
}

export default function AstrologerChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useStore((s) => s.user);
  const astrologer = ASTROLOGERS[id ?? '1'] ?? ASTROLOGERS['1'];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const listRef = useRef<FlatList>(null);
  const streamingIdRef = useRef<string | null>(null);

  // Create or resume session on mount
  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    try {
      // Get primary kundli chart if available
      const { data: charts } = await supabase
        .from('kundli_charts')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .limit(1)
        .single();

      const session = await createChatSession(charts?.id);
      setSessionId(session.id);

      // Load existing messages
      const history = await getChatMessages(session.id);
      if (history.data?.length) {
        setMessages(
          history.data.map((m: any) => ([
            { id: `${m.id}-q`, role: 'user' as const, content: m.question },
            { id: `${m.id}-a`, role: 'assistant' as const, content: m.response },
          ])).flat()
        );
      } else {
        // Welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Namaste! I am ${astrologer.name}, your ${astrologer.specialty} guide. How may I help you on your cosmic journey today?`,
        }]);
      }
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('chat_ready')) {
        Alert.alert(
          'Kundli Required',
          'Please generate your Kundli first to unlock AI chat.',
          [
            { text: 'Generate Kundli', onPress: () => router.push('/kundli/generate' as any) },
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          ]
        );
      }
      // If session creation fails for other reasons, start with welcome anyway
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Namaste! I am ${astrologer.name}. How may I assist you today?`,
      }]);
    } finally {
      setInitializing(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = useCallback(async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;
    streamingIdRef.current = assistantMsgId;

    setInput('');
    setLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: question },
      { id: assistantMsgId, role: 'assistant', content: '', streaming: true },
    ]);
    scrollToBottom();

    // Build history for context
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    await streamChat({
      question,
      language: 'en',
      userName: user?.display_name ?? undefined,
      history,
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + token, streaming: true }
              : m
          )
        );
        scrollToBottom();
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, streaming: false } : m
          )
        );
        setLoading(false);
        streamingIdRef.current = null;
      },
      onError: (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: 'Sorry, I could not respond. Please try again.', streaming: false }
              : m
          )
        );
        setLoading(false);
        streamingIdRef.current = null;
      },
    });
  }, [input, loading, messages, user]);

  const QUICK_QUESTIONS = [
    'What does my current dasha indicate?',
    'How is my career looking this year?',
    'What remedies do you suggest for me?',
  ];

  return (
    <View style={styles.root}>
      <CosmicBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerInfo}>
            <View style={[styles.headerAvatar, { backgroundColor: `${astrologer.color}22`, borderColor: `${astrologer.color}55` }]}>
              <Text style={[styles.headerAvatarText, { color: astrologer.color }]}>
                {astrologer.name[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.headerName}>{astrologer.name}</Text>
              <Text style={styles.headerSpec}>{astrologer.specialty}</Text>
            </View>
          </View>
          <Badge variant="teal">Online</Badge>
        </View>

        {/* Messages */}
        {initializing ? (
          <View style={styles.initLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.initText}>Connecting…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            style={styles.messageListContainer}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            ListFooterComponent={() => (
              messages.length <= 1 ? (
                <View style={styles.quickQuestions}>
                  <Text style={styles.quickTitle}>Quick questions</Text>
                  {QUICK_QUESTIONS.map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => { setInput(q); }}
                      style={styles.quickBtn}
                    >
                      <Text style={styles.quickBtnText}>{q}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null
            )}
          />
        )}

        {/* Input bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your question…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              maxLength={500}
              editable={!loading && !initializing}
            />
            <Pressable
              onPress={sendMessage}
              disabled={!input.trim() || loading}
              style={[styles.sendBtn, input.trim() && !loading && styles.sendBtnActive]}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Send size={18} color={input.trim() ? colors.primary : colors.textMuted} />
              }
            </Pressable>
          </View>
          <Text style={styles.creditNote}>1 credit per message</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(10,7,21,0.80)' },
  backBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  headerName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  headerSpec: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  initLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  initText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  messageListContainer: { flex: 1 },
  messageList: { padding: 14, paddingBottom: 8, gap: 10 },
  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '88%' },
  bubbleWrapperUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubble: { borderRadius: 16, padding: 12, maxWidth: '100%' },
  bubbleBot: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: 'rgba(212,168,67,0.18)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 22 },
  bubbleTextUser: { color: '#e8d9b0' },
  cursor: { color: colors.primary },

  quickQuestions: { paddingTop: 16, gap: 8 },
  quickTitle: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  quickBtn: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  quickBtnText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(10,7,21,0.92)' },
  input: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { borderColor: 'rgba(212,168,67,0.40)', backgroundColor: 'rgba(212,168,67,0.10)' },
  creditNote: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center', paddingBottom: 6, backgroundColor: 'rgba(10,7,21,0.92)' },
});
