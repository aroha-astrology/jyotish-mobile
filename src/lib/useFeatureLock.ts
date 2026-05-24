import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'jyotish.feature_lock.';

interface LockState {
  unlocked: boolean;
  taps: number;
}

/**
 * Lightweight per-feature lock backed by AsyncStorage.
 *
 * UX: a "Coming Soon" feature can be unlocked by tapping its tile
 * `requiredTaps` times (default 5). The unlocked state persists.
 *
 *   const { locked, recordTap, tapsLeft } = useFeatureLock('mantra-jaap');
 *   onPress = () => { if (locked) recordTap(); else router.push(...); }
 */
export function useFeatureLock(featureKey: string, requiredTaps = 5) {
  const storageKey = STORAGE_PREFIX + featureKey;
  const [state, setState] = useState<LockState>({ unlocked: false, taps: 0 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as LockState;
            setState({
              unlocked: !!parsed.unlocked,
              taps: parsed.taps ?? 0,
            });
          } catch {
            // ignore — keep default locked state
          }
        }
      })
      .finally(() => setHydrated(true));
  }, [storageKey]);

  const persist = useCallback(
    (next: LockState) => {
      setState(next);
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
    },
    [storageKey],
  );

  /** Returns `true` if this tap was the one that unlocked the feature. */
  const recordTap = useCallback((): boolean => {
    if (state.unlocked) return false;
    const nextTaps = state.taps + 1;
    if (nextTaps >= requiredTaps) {
      persist({ unlocked: true, taps: nextTaps });
      return true;
    }
    persist({ unlocked: false, taps: nextTaps });
    return false;
  }, [state, requiredTaps, persist]);

  return {
    /** True until the user has tapped `requiredTaps` times. */
    locked: hydrated ? !state.unlocked : true,
    /** Always-safe call. Returns true exactly once — on the unlocking tap. */
    recordTap,
    /** Remaining taps until unlock (0 once unlocked). */
    tapsLeft: state.unlocked ? 0 : Math.max(0, requiredTaps - state.taps),
    /** True once the AsyncStorage read has settled. */
    hydrated,
  };
}
