'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function ProfileStrengthSection({ users }) {
  const getStrength = (u) => {
    let s = 0;
    if (u.Name) s++;
    if (u.MobileNo) s++;
    if (u.Email) s++;
    if (u.BusinessName) s++;
    if ((u.Skills || []).length) s++;
    return Math.round((s / 5) * 100);
  };

  const strengths = users.map(getStrength);

  const buckets = { weak:0,growing:0,strong:0,leader:0 };

  strengths.forEach(v=>{
    if(v<30)buckets.weak++;
    else if(v<60)buckets.growing++;
    else if(v<80)buckets.strong++;
    else buckets.leader++;
  });

  const data = [
    { name:'Weak', value:buckets.weak },
    { name:'Growing', value:buckets.growing },
    { name:'Strong', value:buckets.strong },
    { name:'Leader', value:buckets.leader }
  ];

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Profile Strength
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
