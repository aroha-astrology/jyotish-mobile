import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface Mantra {
  key: string;
  name: string;
  mantra_text: string;
  deity: string;
  description: string;
  mukhi: number;
  category: 'planet' | 'deity';
  jaap_count: number;
  reward_credits: number;
  audio_url: string | null;
  audio_duration_ms: number | null;
  sort_order: number;
}

export function useMantras() {
  return useQuery<Mantra[]>({
    queryKey: ['mantras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mantras')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Mantra[];
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Returns the set of mantra keys the user has already claimed today.
 * Reads from credit_transactions (type='jaap_reward'). RLS keeps it scoped
 * to the current user.
 */
export function useClaimedTodayKeys() {
  return useQuery<Set<string>>({
    queryKey: ['mantras', 'claimed_today'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('description')
        .eq('type', 'jaap_reward')
        .gte('created_at', todayStart.toISOString());
      if (error) throw error;
      const keys = new Set<string>();
      for (const row of data ?? []) {
        const m = /Mantra Jaap — ([a-z]+)/.exec(row.description ?? '');
        if (m) keys.add(m[1]);
      }
      return keys;
    },
    staleTime: 60 * 1000,
  });
}
