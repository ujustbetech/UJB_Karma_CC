'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

export default function MentorSection({ users }) {
  const map = {};

  users.forEach(u=>{
    if(!u.MentorName) return;
    map[u.MentorName]=(map[u.MentorName]||0)+1;
  });

  const list = Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,6);

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Mentor Influence
      </Text>

      {list.map(([name,count])=>(
        <div key={name} className="flex justify-between py-1">
          <Text>{name}</Text>
          <Text className="font-semibold">{count}</Text>
        </div>
      ))}
    </Card>
  );
}
