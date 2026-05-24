import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeatureInsight } from './api';
import { supabase } from './supabase';
import type { FeatureInsightResponse } from './api';

interface UseFeatureInsightOptions {
  chartId: string;
  language?: string;
  paramsHash?: string;
  /** How long to keep the data fresh (ms). Insights rarely change, so default is 5m. */
  staleTime?: number;
}

/**
 * Read a feature insight with automatic Supabase realtime upgrade.
 *
 * On first call the GET /api/insights/[featureKey] endpoint returns the best
 * available content (report_enriched > lite_ai > deterministic) and
 * also enqueues a lite job if nothing is cached yet.
 *
 * A Supabase realtime subscription watches the feature_insights table for
 * this chart. When a higher-quality row lands (e.g., report_enriched), the
 * query cache is updated in place — no polling, no manual refresh needed.
 */
export function useFeatureInsight(
  featureKey: string,
  opts: UseFeatureInsightOptions,
) {
  const { chartId, language = 'en', paramsHash = '', staleTime = 5 * 60 * 1000 } = opts;
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery<FeatureInsightResponse>({
    queryKey: ['insight', featureKey, chartId, language, paramsHash],
    queryFn:  () => getFeatureInsight(featureKey, chartId, { language, paramsHash }),
    enabled:  Boolean(chartId),
    staleTime,
    gcTime:   30 * 60 * 1000,
  });

  // Realtime subscription: auto-upgrade content when a better row lands
  useEffect(() => {
    if (!chartId) return;

    const channel = supabase
      .channel(`insight:${chartId}:${featureKey}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'feature_insights',
          filter: `chart_id=eq.${chartId}`,
        },
        (payload) => {
          const row = payload.new as { feature_key: string; source: string; content: Record<string, unknown> };
          if (row.feature_key !== featureKey) return;

          const sourcePriority: Record<string, number> = { deterministic: 1, lite_ai: 2, report_enriched: 3 };
          const existing = queryClient.getQueryData<FeatureInsightResponse>(
            ['insight', featureKey, chartId, language, paramsHash],
          );
          const existPrio = sourcePriority[existing?.source ?? ''] ?? 0;
          const newPrio   = sourcePriority[row.source] ?? 0;
          if (newPrio > existPrio) {
            queryClient.setQueryData(['insight', featureKey, chartId, language, paramsHash], {
              featureKey,
              source:  row.source as FeatureInsightResponse['source'],
              content: row.content,
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'feature_insights',
          filter: `chart_id=eq.${chartId}`,
        },
        (payload) => {
          const row = payload.new as { feature_key: string; source: string; content: Record<string, unknown> };
          if (row.feature_key !== featureKey) return;

          const sourcePriority: Record<string, number> = { deterministic: 1, lite_ai: 2, report_enriched: 3 };
          const existing = queryClient.getQueryData<FeatureInsightResponse>(
            ['insight', featureKey, chartId, language, paramsHash],
          );
          const existPrio = sourcePriority[existing?.source ?? ''] ?? 0;
          const newPrio   = sourcePriority[row.source] ?? 0;
          if (newPrio >= existPrio) {
            queryClient.setQueryData(['insight', featureKey, chartId, language, paramsHash], {
              featureKey,
              source:  row.source as FeatureInsightResponse['source'],
              content: row.content,
            });
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [chartId, featureKey, language, paramsHash, queryClient]);

  const isEnriching = query.data?.source === 'deterministic' || query.data?.source === 'lite_ai';

  return {
    ...query,
    content:     query.data?.content ?? null,
    source:      query.data?.source ?? null,
    isEnriching,
  };
}
