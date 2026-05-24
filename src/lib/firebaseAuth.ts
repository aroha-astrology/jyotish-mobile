import auth from '@react-native-firebase/auth';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://arohaastrology.in';

/**
 * Send OTP to a phone number.
 * Returns a confirmation object used to verify the OTP.
 */
export async function sendPhoneOTP(phone: string) {
  return auth().signInWithPhoneNumber(phone);
}

/**
 * Verify OTP and exchange the Firebase ID token for a Supabase session.
 */
export async function verifyPhoneOTP(
  confirmation: Awaited<ReturnType<typeof sendPhoneOTP>>,
  code: string,
  referralCode?: string,
): Promise<{ isNewUser: boolean }> {
  const credential = await confirmation.confirm(code);
  const idToken = await credential.user.getIdToken();

  const res = await fetch(`${API_URL}/api/auth/phone-signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, ...(referralCode ? { referralCode } : {}) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'Sign-in failed');
  }

  const { tokenHash, type, isNewUser } = (await res.json()) as {
    tokenHash: string;
    type: string;
    isNewUser: boolean;
  };

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as 'email',
  });
  if (error) throw error;

  return { isNewUser };
}

export function normaliseIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0/, '');
  return `+91${digits}`;
}

export function isValidIndianMobile(local: string): boolean {
  return /^[6-9]\d{9}$/.test(local);
}
