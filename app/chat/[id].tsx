import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { detectProducts, buildProductSearchUrl, type ProductCategory } from '@aroha-astrology/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { getChatMessages, streamChat } from '@/lib/api';
import { colors } from '@/constants/theme';
import { CosmicBackground } from '@/components/CosmicBackground';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

const PRODUCT_ICON: Record<ProductCategory, string> = {
  gemstone:   '💎',
  rudraksha:  '📿',
  yantra:     '🔱',
  mala:       '🕉️',
  idol:       '🛕',
  'puja-item':'🪔',
};

function ProductChips({ text }: { text: string }) {
  const products = detectProducts(text);
  if (products.length === 0) return null;
  return (
    <View style={styles.productRow}>
      {products.map(p => (
        <Pressable
          key={p.name}
          onPress={() => Linking.openURL(buildProductSearchUrl(p.searchQuery)).catch(() => {})}
          style={styles.productChip}
        >
          <Text style={styles.productIcon}>{PRODUCT_ICON[p.category]}</Text>
          <Text style={styles.productLabel}>{p.name}</Text>
          <Text style={styles.productArrow}>↗</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={{ fontSize: 14 }}>🪐</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {msg.pending ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <>
            <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{msg.content}</Text>
            {!isUser && <ProductChips text={msg.content} />}
          </>
        )}
      </View>
    </View>
  );
}

export default function ChatSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useStore((s) => s.user);
  const language = useStore((s) => s.language);
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);

  const { isLoading, data: messagesResult } = useQuery({
    queryKey: ['chat-messages', id],
    queryFn: () => getChatMessages(id),
    enabled: !!id,
    staleTime: 0,
  });

  const initializedRef = useRef(false);
  useEffect(() => {
    if (messagesResult?.data && !initializedRef.current) {
      initializedRef.current = true;
      setMessages(
        messagesResult.data.map((m: any) => ({ role: m.role, content: m.content }))
      );
    }
  }, [messagesResult]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: q };
    const pendingMsg: Message = { role: 'assistant', content: '', pending: true };
    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setStreaming(true);

    let accumulated = '';

    await streamChat({
      question: q,
      language,
      userName: user?.display_name ?? undefined,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
      onToken: (token) => {
        accumulated += token;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
        scrollRef.current?.scrollToEnd({ animated: false });
      },
      onDone: () => {
        setStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      },
      onError: () => {
        setStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' };
          return updated;
        });
      },
    });
  }, [input, streaming, messages, language, user]);

  return (
    <View style={styles.root}>
      <CosmicBackground />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Aroha Astrology</Text>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 600 }} style={styles.welcomeWrap}>
              <Text style={styles.welcomeEmoji}>🪐</Text>
              <Text style={styles.welcomeTitle}>Ask the Cosmos</Text>
              <Text style={styles.welcomeText}>What would you like to know about your stars, career, love, or destiny?</Text>
              {['What does my chart say about love?', 'When is my next good period?', 'What career suits me?'].map((q) => (
                <Pressable key={q} onPress={() => setInput(q)} style={styles.suggestionChip}>
                  <Text style={styles.suggestionText}>{q}</Text>
                </Pressable>
              ))}
            </MotiView>
          ) : (
            messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your chart..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={500}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={send}
            disabled={!input.trim() || streaming}
            style={[styles.sendBtn, input.trim() && !streaming && styles.sendBtnActive]}
          >
            {streaming ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[styles.sendIcon, input.trim() && { color: colors.primary }]}>➤</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: 'rgba(2,1,10,0.9)',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  headerCenter: { alignItems: 'center', gap: 3 },
  headerTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4caf50' },
  onlineText: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#4caf50' },

  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8, gap: 12 },

  loadingWrap: { flex: 1, alignItems: 'center', paddingTop: 60 },

  welcomeWrap: { alignItems: 'center', paddingTop: 40, gap: 10 },
  welcomeEmoji: { fontSize: 48, marginBottom: 8 },
  welcomeTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  welcomeText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 280, marginBottom: 8 },
  suggestionChip: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  suggestionText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  bubbleWrapUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: colors.borderAccent, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  bubbleAI: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: 'rgba(212,168,67,0.14)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 22 },
  bubbleTextUser: { color: colors.text },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: 'rgba(2,1,10,0.96)',
  },
  input: {
    flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text,
    backgroundColor: colors.bgSurface, borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { borderColor: 'rgba(212,168,67,0.40)', backgroundColor: 'rgba(212,168,67,0.12)' },
  sendIcon: { fontSize: 16, color: colors.textMuted },

  productRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  productChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.35)',
    backgroundColor: 'rgba(212,168,67,0.10)',
  },
  productIcon:  { fontSize: 13 },
  productLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  productArrow: { fontSize: 10, color: colors.primary, opacity: 0.7, marginLeft: 1 },
});
