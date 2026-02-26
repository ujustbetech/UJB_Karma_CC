'use client';

import { use } from 'react';
import OrbiterProfilePage from '@/components/admin/orbiters/OrbiterProfilePage';

export default function Page({ params }) {
  const resolvedParams = use(params);   // 👈 unwrap promise
  const ujbcode = resolvedParams.ujbcode;

  return <OrbiterProfilePage ujbcode={ujbcode} />;
}
