'use client';

import { useEffect, useState } from 'react';
import { ReadOnlyAnamnese } from '@/components/patient/ReadOnlyAnamnese';
import { anamnesesApi } from '@/services/anamnese';

export default function PatientAnamnese() {
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { anamnesesApi.me().then((a) => setInfo(String(a.info ?? ''))).catch(() => setInfo('')).finally(() => setLoading(false)); }, []);

  return <section className="stack"><ReadOnlyAnamnese info={info} loading={loading} /></section>;
}
