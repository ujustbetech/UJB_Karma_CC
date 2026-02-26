'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';

export default function SubscriptionChart({ users }) {
  const active = users.filter(u => u.subscription?.status === 'active').length;

  const expired = users.filter(u => {
    const d = u.subscription?.nextRenewalDate;
    return d && new Date(d) < new Date();
  }).length;

  const data = [
    { name: 'Active', value: active },
    { name: 'Expired', value: expired }
  ];

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Subscription Health
      </Text>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" label />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
