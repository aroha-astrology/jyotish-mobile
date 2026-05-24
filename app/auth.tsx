import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; error?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      try {
        // 1. If we already have a session (deep link handler in _layout.tsx
        //    may have already exchanged the code), just navigate.
        const { data: { session: existing } } = await supabase.auth.getSession();
        if (existing) {
          router.replace('/(tabs)');
          return;
        }

        // 2. Try exchanging the URL for a session.
        const initialUrl = await Linking.getInitialURL();
        const urlToExchange = initialUrl ?? `?${new URLSearchParams(params as any).toString()}`;
        if (params.code || params.access_token || (initialUrl && (initialUrl.includes('code=') || initialUrl.includes('access_token=')))) {
          const { error } = await supabase.auth.exchangeCodeForSession(urlToExchange);
          if (error) throw error;
        }

        // 3. Wait briefly for onAuthStateChange to fire and update the user.
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 300));
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.replace('/(tabs)');
            return;
          }
        }

        // No session — back to login.
        router.replace('/login');
      } catch {
        router.replace('/login');
      }
    })();
  }, []);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 14 },
  text: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
});
