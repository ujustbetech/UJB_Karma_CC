'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function SkillsChart({ users }) {
  const map = {};

  users.forEach(u =>
    (u.Skills || []).forEach(s => {
      map[s] = (map[s] || 0) + 1;
    })
  );

  const data = Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,8)
    .map(([name,value])=>({name,value}));

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Top Skills
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
