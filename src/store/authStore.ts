import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  phone: string | null;
  verificationId: string | null;
  isNewUser: boolean;
  setSession: (session: Session | null) => void;
  setPhone: (phone: string | null) => void;
  setVerificationId: (id: string | null) => void;
  setIsNewUser: (isNew: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  phone: null,
  verificationId: null,
  isNewUser: false,
  setSession: (session) => set({ session }),
  setPhone: (phone) => set({ phone }),
  setVerificationId: (verificationId) => set({ verificationId }),
  setIsNewUser: (isNewUser) => set({ isNewUser }),
  reset: () => set({ session: null, phone: null, verificationId: null, isNewUser: false }),
}));
