'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

function Stat({ title, value }) {
  return (
    <Card className="p-4">
      <Text className="text-xs text-slate-500">{title}</Text>
      <Text variant="h2" className="mt-1">{value}</Text>
    </Card>
  );
}

export default function KPISection({ users }) {
  const total = users.length;

  const active = users.filter(
    u => u.subscription?.status === 'active'
  ).length;

  const expired = users.filter(u => {
    const d = u.subscription?.nextRenewalDate;
    return d && new Date(d) < new Date();
  }).length;

  const cosm = users.filter(
    u => u.Category === 'CosmOrbiter'
  ).length;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Stat title="Total Users" value={total} />
      <Stat title="Active Subs" value={active} />
      <Stat title="Expired" value={expired} />
      <Stat title="CosmOrbiters" value={cosm} />
    </div>
  );
}
