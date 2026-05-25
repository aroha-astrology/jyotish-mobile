import posthog from 'posthog-js';
import { env } from './env';

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    persistence: 'localStorage+cookie',
    autocapture: true,
    capture_pageview: false,
  });
  initialized = true;
}

export function identifyUser(userId: string, properties: Record<string, unknown> = {}): void {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function capture(event: string, properties: Record<string, unknown> = {}): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function resetAnalytics(): void {
  if (!initialized) return;
  posthog.reset();
}

export function capturePageview(path: string): void {
  capture('$pageview', { path });
}
