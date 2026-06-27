'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/guards';
import { ShellSkeleton } from '@/components/ui/Skeleton';

export function AppLayout({ children: _children }: { children?: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    router.replace('/patient');
  }, [router]);

  return <RequireAuth><ShellSkeleton /></RequireAuth>;
}
