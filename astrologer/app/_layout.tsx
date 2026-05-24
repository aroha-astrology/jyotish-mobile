import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setProfile = useStore((s) => s.setProfile);
  const setAuthReady = useStore((s) => s.setAuthReady);
  const isReadyRef = useRef(false);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: row } = await supabase
            .from('users')
            .select('id, email, name, astro_status, astro_plan, customer_limit')
            .eq('id', session.user.id)
            .maybeSingle();

          setProfile({
            id: session.user.id,
            email: row?.email ?? session.user.email ?? '',
            name: row?.name ?? null,
            astro_status: row?.astro_status ?? null,
            astro_plan: row?.astro_plan ?? null,
            customer_limit: row?.customer_limit ?? 0,
          });

          if (event === 'SIGNED_IN') {
            const status = row?.astro_status;
            if (status === 'approved') {
              if (segments[0] !== '(tabs)') router.replace('/(tabs)');
            } else if (status === 'rejected') {
              router.replace('/rejected');
            } else if (status === 'pending') {
              router.replace('/pending');
            } else {
              // No astrologer registration yet
              router.replace('/register');
            }
          }
        } else {
          setProfile(null);
        }

        setAuthReady(true);
        if (fontsLoaded && !isReadyRef.current) {
          isReadyRef.current = true;
          await SplashScreen.hideAsync();
        }
      }
    );

    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      if (url.includes('code=') || url.includes('access_token=')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return;
        try { await supabase.auth.exchangeCodeForSession(url); } catch { /* ignore */ }
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const linkingSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    const timeout = setTimeout(async () => {
      if (!isReadyRef.current && fontsLoaded) {
        isReadyRef.current = true;
        await SplashScreen.hideAsync();
      }
      setAuthReady(true);
    }, 1500);

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
      clearTimeout(timeout);
    };
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && !isReadyRef.current) {
      isReadyRef.current = true;
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="pending" />
        <Stack.Screen name="rejected" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="customer/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
