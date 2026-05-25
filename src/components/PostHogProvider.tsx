'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, capture, capturePageview } from '@/lib/analytics';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
    capture('app_opened', {
      platform: typeof window !== 'undefined' && /Android|iPhone|iPad/.test(navigator.userAgent)
        ? /Android/.test(navigator.userAgent) ? 'android' : 'ios'
        : 'web',
      app_version: '0.1.0',
    });
  }, []);

  useEffect(() => {
    if (pathname) capturePageview(pathname);
  }, [pathname]);

  return <>{children}</>;
}
