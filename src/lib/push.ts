// Android push registration via Expo Notifications + FCM.
//
// Flow:
//   1. Ask for notification permission (Android 13+ runtime permission).
//   2. Get the native FCM device token (NOT the Expo push token — the backend
//      hits FCM v1 directly, see apps/web/src/lib/push/fcm.ts).
//   3. POST { fcm_token, platform: 'android-fcm' } to /api/push/subscribe-native
//      with the user's Bearer token. The route upserts on (user_id, fcm_token).
//   4. Subscribe to token rotation and re-register if FCM rotates the token.
//
// iOS is intentionally skipped — the backend has an 'ios-apns' enum reserved
// but no APNs sender wired up yet.

import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PUSH_PROMPT_KEY = 'jyotish_push_prompt_decision';
const PUSH_REPROMPT_DAYS = 7;

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

let tokenSub: Notifications.Subscription | null = null;

async function postToken(fcmToken: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    console.warn('[push] no session — skipping token upload');
    return;
  }

  const res = await fetch(`${BASE_URL}/api/push/subscribe-native`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fcm_token: fcmToken, platform: 'android-fcm' }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[push] upload failed: ${res.status} ${body}`);
    return;
  }
  console.log('[push] FCM token registered with backend');
}

// Idempotent — safe to call after every sign-in. Returns true if the token
// was registered; false if permission was denied or the platform is unsupported.
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;

    if (!granted) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.granted;
    }

    if (!granted) {
      console.log('[push] notification permission not granted');
      return false;
    }

    // Required on Android 8+ — every notification must belong to a channel.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7A96AB',
    });

    const token = await Notifications.getDevicePushTokenAsync();
    if (token.type !== 'android') {
      console.warn('[push] unexpected token type:', token.type);
      return false;
    }

    await postToken(token.data);

    // Re-register when FCM rotates the token (reinstall, Play Services event, etc.)
    if (!tokenSub) {
      tokenSub = Notifications.addPushTokenListener((next) => {
        if (next.type === 'android' && next.data) {
          console.log('[push] FCM token rotated — re-uploading');
          postToken(next.data).catch((err) =>
            console.warn('[push] rotation upload failed:', err),
          );
        }
      });
    }

    return true;
  } catch (err) {
    console.warn('[push] registration error:', err);
    return false;
  }
}

// Soft pre-prompt shown after onboarding completes. Asks in-app first so we
// don't burn the one-shot OS dialog on someone who'd say no.
export async function maybeAskForPushPermission(): Promise<void> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      registerForPushNotificationsAsync().catch(() => {});
      return;
    }
    if (current.status === 'denied' && !current.canAskAgain) return;

    const raw = await AsyncStorage.getItem(PUSH_PROMPT_KEY);
    if (raw) {
      try {
        const stored = JSON.parse(raw) as { decision: string; at: number };
        if (stored.decision === 'allowed' || stored.decision === 'denied') return;
        const ageDays = (Date.now() - stored.at) / (1000 * 60 * 60 * 24);
        if (ageDays < PUSH_REPROMPT_DAYS) return;
      } catch {
        // fall through and re-ask
      }
    }

    // 3s delay lets the user settle onto the home tab before we interrupt.
    setTimeout(() => {
      Alert.alert(
        'Your reading, every morning',
        "Allow notifications and we'll send your astrologer's card at 7 AM each day — even when the app is closed.",
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => {
              AsyncStorage.setItem(
                PUSH_PROMPT_KEY,
                JSON.stringify({ decision: 'later', at: Date.now() }),
              ).catch(() => {});
            },
          },
          {
            text: 'Allow',
            onPress: async () => {
              const ok = await registerForPushNotificationsAsync();
              AsyncStorage.setItem(
                PUSH_PROMPT_KEY,
                JSON.stringify({ decision: ok ? 'allowed' : 'denied', at: Date.now() }),
              ).catch(() => {});
            },
          },
        ],
        { cancelable: false },
      );
    }, 3000);
  } catch {
    // never block the app on the prompt machinery
  }
}

export function teardownPushListeners(): void {
  tokenSub?.remove();
  tokenSub = null;
}
