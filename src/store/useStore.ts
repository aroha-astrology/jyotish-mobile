import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  credits: number;
  plan: string;
  avatar_url: string | null;
}

export interface BirthProfile {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: string;
  created_at: string;
}

export interface KundliChart {
  id: string;
  profile_id: string;
  chart_data: Record<string, unknown>;
  predictions: Record<string, unknown>;
  created_at: string;
}

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  // Birth profiles
  profiles: BirthProfile[];
  setProfiles: (profiles: BirthProfile[]) => void;
  addProfile: (profile: BirthProfile) => void;

  // Charts
  charts: KundliChart[];
  setCharts: (charts: KundliChart[]) => void;
  addChart: (chart: KundliChart) => void;

  // Theme (single dark theme — matches web)
  theme: 'dark';
  setTheme: (theme: 'dark') => void;

  // Language
  language: string;
  setLanguage: (lang: string) => void;

  // Chart style
  chartStyle: 'north' | 'south';
  setChartStyle: (style: 'north' | 'south') => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Auth readiness — true once Supabase auth state has been checked at least once
  authReady: boolean;
  setAuthReady: (ready: boolean) => void;

  // Credits
  credits: number;
  setCredits: (credits: number) => void;
  deductCredits: (amount: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user, credits: user?.credits ?? 0 }),

      profiles: [],
      setProfiles: (profiles) => set({ profiles }),
      addProfile: (profile) =>
        set((state) => ({ profiles: [...state.profiles, profile] })),

      charts: [],
      setCharts: (charts) => set({ charts }),
      addChart: (chart) =>
        set((state) => ({ charts: [...state.charts, chart] })),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      language: 'en',
      setLanguage: (language) => set({ language }),

      chartStyle: 'north',
      setChartStyle: (chartStyle) => set({ chartStyle }),

      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      authReady: false,
      setAuthReady: (authReady) => set({ authReady }),

      credits: 0,
      setCredits: (credits) => set({ credits }),
      deductCredits: (amount) =>
        set((state) => ({ credits: Math.max(0, state.credits - amount) })),
    }),
    {
      name: 'jyotish-ai-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        chartStyle: state.chartStyle,
      }),
    }
  )
);
