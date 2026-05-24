import { create } from 'zustand';
import type { AstroPlan } from '@aroha-astrology/shared';

interface AstrologerProfile {
  id: string;
  email: string;
  name: string | null;
  astro_status: 'pending' | 'approved' | 'rejected' | null;
  astro_plan: AstroPlan | null;
  customer_limit: number;
}

interface Store {
  profile: AstrologerProfile | null;
  authReady: boolean;
  setProfile: (profile: AstrologerProfile | null) => void;
  setAuthReady: (ready: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  profile: null,
  authReady: false,
  setProfile: (profile) => set({ profile }),
  setAuthReady: (authReady) => set({ authReady }),
}));
