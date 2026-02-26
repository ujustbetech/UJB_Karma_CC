'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

export default function NetworkSection({ users }) {
  const leaders = users
    .map(u => ({
      name: u.Name,
      count: (u.connects || []).length
    }))
    .sort((a,b)=>b.count-a.count)
    .slice(0,5);

  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3">
        Top Connectors
      </Text>

      {leaders.map(l=>(
        <div key={l.name} className="flex justify-between py-1">
          <Text>{l.name}</Text>
          <Text className="font-semibold">{l.count}</Text>
        </div>
      ))}
    </Card>
  );
}
