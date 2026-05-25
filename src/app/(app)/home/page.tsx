'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/auth';

export default function HomePage() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  const phone = session?.user?.phone || session?.user?.user_metadata?.phone || 'friend';

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  return (
    <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
      <h1 className="text-4xl font-semibold">Hello, {phone}</h1>
      <p className="text-sm opacity-60">
        You are signed in. This is the foundation — product features land in the next plan.
      </p>
      <button
        onClick={handleLogout}
        className="self-start py-2 px-4 rounded border border-white/20 text-sm"
      >
        Log out
      </button>
    </div>
  );
}
