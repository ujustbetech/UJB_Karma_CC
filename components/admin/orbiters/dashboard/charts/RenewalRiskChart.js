'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';

export default function RenewalRiskChart({ users }) {
  let safe=0, risk=0, expired=0;

  users.forEach(u=>{
    const d=u.subscription?.nextRenewalDate;
    if(!d) return;

    const days=Math.ceil((new Date(d)-new Date())/(1000*60*60*24));

    if(days<0) expired++;
    else if(days<30) risk++;
    else safe++;
  });

  const data=[
    {name:'Safe',value:safe},
    {name:'At Risk',value:risk},
    {name:'Expired',value:expired}
  ];

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Renewal Risk
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
