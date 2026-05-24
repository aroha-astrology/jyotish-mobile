import '../global.css';

import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { updateUserLocation } from '@/lib/api';
import { colors } from '@/constants/theme';
import {
  registerForPushNotificationsAsync,
  teardownPushListeners,
} from '@/lib/push';

const LOCATION_ASKED_KEY = 'jyotish_location_asked';


async function requestAndStoreLocation() {
  try {
    const alreadyAsked = await AsyncStorage.getItem(LOCATION_ASKED_KEY);
    if (alreadyAsked) return;
    await AsyncStorage.setItem(LOCATION_ASKED_KEY, '1');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [place] = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
    const city = [place?.city, place?.region, place?.country].filter(Boolean).join(', ');
    await updateUserLocation(coords.latitude, coords.longitude, city);
  } catch {
    // Location is optional — never block the app
  }
}

// Do NOT prevent auto-hide — we hide it immediately so only LOADING.mp4 shows

// Show notifications even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

export default function RootLayout() {
  const setUser = useStore((s) => s.setUser);
  const setAuthReady = useStore((s) => s.setAuthReady);
  const isReadyRef = useRef(false);
  const router = useRouter();
  const segments = useSegments();

  // Hide native splash immediately — LOADING.mp4 in index.tsx takes over
  useEffect(() => { SplashScreen.hideAsync(); }, []);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          let displayName: string | null =
            (profile?.name as string | undefined) ||
            (session.user.user_metadata?.full_name as string | undefined) ||
            (session.user.user_metadata?.name as string | undefined) ||
            null;

          if (!displayName) {
            const { data: primaryProfile } = await supabase
              .from('birth_profiles')
              .select('name')
              .eq('user_id', session.user.id)
              .eq('is_primary', true)
              .maybeSingle();
            displayName = primaryProfile?.name ?? null;
          }

          setUser({
            id: session.user.id,
            email: profile?.email ?? session.user.email ?? '',
            display_name: displayName,
            credits: profile?.credits ?? 0,
            plan: profile?.plan ?? 'free',
            avatar_url:
              profile?.avatar_url ??
              (session.user.user_metadata?.avatar_url as string | undefined) ??
              null,
          });

          if (event === 'SIGNED_IN') {
            requestAndStoreLocation();
            registerForPushNotificationsAsync().catch(() => {});
            if (segments[0] !== '(tabs)') router.replace('/(tabs)');
          }
        } else {
          setUser(null);
        }

        setAuthReady(true);

        if (!isReadyRef.current) {
          isReadyRef.current = true;
        }
      }
    );

    const handleDeepLink = async (url: string | null) => {
      console.log('[DeepLink] received =', url);
      if (!url) return;
      if (url.includes('code=') || url.includes('access_token=')) {
        console.log('[DeepLink] has auth code, processing…');
        // If login.tsx already exchanged the code, getSession() will return a session
        // and we can navigate directly without a second (failing) exchange call.
        const { data: { session: existing } } = await supabase.auth.getSession();
        if (existing) {
          if (segments[0] !== '(tabs)') router.replace('/(tabs)');
          return;
        }
        try {
          await supabase.auth.exchangeCodeForSession(url);
          // onAuthStateChange fires SIGNED_IN and navigates
        } catch {
          // exchange failed — user stays on current screen
        }
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Custom animated splash (app/index.tsx) takes over visually as soon as
    // fonts are loaded — no need to gate the native splash on auth. Drop the
    // hide ceiling to 1500ms so the perceived blank time is minimal.
    const timeout = setTimeout(() => {
      // Fallback: unblock index.tsx even if Supabase never fires
      setAuthReady(true);
    }, 1500);

    // Navigate to the route embedded in a notification tap.
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const route = (data?.route ?? data?.url ?? '/') as string;
        if (route && route !== '/') {
          router.push(route as Parameters<typeof router.push>[0]);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
      clearTimeout(timeout);
      tapSub.remove();
      teardownPushListeners();
    };
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
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
          <Stack.Screen name="signup" />
          <Stack.Screen name="auth" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="kundli/generate" />
          <Stack.Screen name="kundli/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="horoscope/[period]" />
          <Stack.Screen name="couple" />
          <Stack.Screen name="life-journey/index" />
          <Stack.Screen name="life-journey/phase" />
          <Stack.Screen name="match/new" />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chat/astrologer/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="credits" />
          <Stack.Screen name="panchang" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="muhurta" />
          <Stack.Screen name="prashna" />
          <Stack.Screen name="gochar" />
          <Stack.Screen name="kp-system" />
          <Stack.Screen name="vargas" />
          <Stack.Screen name="varshaphal" />
          <Stack.Screen name="baby-names" />
          <Stack.Screen name="gemstone" />
          <Stack.Screen name="remedies" />
          <Stack.Screen name="tarot" />
          <Stack.Screen name="dreams" />
          <Stack.Screen name="vastu" />
          <Stack.Screen name="palm" />
          <Stack.Screen name="video" />
          <Stack.Screen name="referral" />
          <Stack.Screen name="mantra-jaap" />
          <Stack.Screen name="reports/premium" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
