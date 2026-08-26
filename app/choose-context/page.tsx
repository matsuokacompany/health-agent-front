'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RequireSuperAdmin } from '@/components/auth/guards';

// super_admin is scoped to the administration platform only — this route no
// longer offers the professional/patient portal experiences, so it just
// forwards straight to /admin. Kept as a route (rather than removed) in case
// anything still links or redirects here.
function ChooseContextContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return null;
}

export default function ChooseContext() {
  return <RequireSuperAdmin><ChooseContextContent /></RequireSuperAdmin>;
}
