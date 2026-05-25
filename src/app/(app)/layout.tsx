import { AuthGate } from '@/components/AuthGate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <main className="min-h-screen px-6 py-12">{children}</main>
    </AuthGate>
  );
}
