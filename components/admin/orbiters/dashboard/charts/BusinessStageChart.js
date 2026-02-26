'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function BusinessStageChart({ users }) {
  const startup = users.filter(u => u.BusinessStage === 'Startup').length;
  const growth = users.filter(u => u.BusinessStage === 'Growth').length;
  const established = users.filter(u => u.BusinessStage === 'Established').length;

  const data = [
    { name: 'Startup', value: startup },
    { name: 'Growth', value: growth },
    { name: 'Established', value: established }
  ];

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Business Stage
      </Text>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
