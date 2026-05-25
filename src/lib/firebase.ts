import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import type { PluginListenerHandle } from '@capacitor/core';
import { env } from './env';

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }
  app = initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  });
  return app;
}

export async function sendPhoneOTP(phone: string): Promise<{ verificationId: string }> {
  getFirebaseApp();

  const handles: PluginListenerHandle[] = [];
  const cleanup = async () => {
    await Promise.all(handles.map((h) => h.remove()));
  };

  return new Promise<{ verificationId: string }>((resolve, reject) => {
    FirebaseAuthentication.addListener('phoneCodeSent', async (event) => {
      await cleanup();
      if (!event.verificationId) {
        reject(new Error('Firebase did not return a verificationId'));
        return;
      }
      resolve({ verificationId: event.verificationId });
    }).then((h) => handles.push(h));

    FirebaseAuthentication.addListener('phoneVerificationFailed', async (event) => {
      await cleanup();
      reject(new Error(event.message || 'Phone verification failed'));
    }).then((h) => handles.push(h));

    FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: phone }).catch(async (err) => {
      await cleanup();
      reject(err);
    });
  });
}

export async function confirmPhoneOTP(
  verificationId: string,
  verificationCode: string,
): Promise<{ idToken: string }> {
  await FirebaseAuthentication.confirmVerificationCode({
    verificationId,
    verificationCode,
  });
  const { token } = await FirebaseAuthentication.getIdToken();
  if (!token) {
    throw new Error('Firebase did not return an ID token');
  }
  return { idToken: token };
}

export async function firebaseSignOut(): Promise<void> {
  await FirebaseAuthentication.signOut();
}
