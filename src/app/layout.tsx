import './globals.css';
import { Suspense } from 'react';
import { PostHogProvider } from '@/components/PostHogProvider';
import { SessionBootstrap } from '@/components/SessionBootstrap';

export const metadata = {
  title: 'Aroha Astrology',
  description: 'Vedic astrology guidance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <PostHogProvider>
            <SessionBootstrap />
            {children}
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
