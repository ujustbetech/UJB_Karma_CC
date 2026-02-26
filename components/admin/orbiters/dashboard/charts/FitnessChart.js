'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';

export default function FitnessChart({ users }) {
  const map = {};

  users.forEach(u => {
    const f = u.FitnessLevel || 'Unknown';
    map[f] = (map[f] || 0) + 1;
  });

  const data = Object.entries(map).map(([name,value])=>({name,value}));

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Fitness Level
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
