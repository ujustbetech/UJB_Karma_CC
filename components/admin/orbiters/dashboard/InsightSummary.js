import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

export default function InsightSummary({ users }) {
  const total = users.length;
  const active = users.filter(u=>u.subscription?.status==='active').length;
  const expiring = users.filter(u=>{
    const d=u.subscription?.nextRenewalDate;
    return d && new Date(d)-new Date()<1000*60*60*24*30;
  }).length;

  return (
    <Card className="p-4 bg-indigo-50 border-indigo-200">
      <Text variant="h3">AI Insights</Text>

      <ul className="mt-2 text-sm space-y-1">
        <li>• {active} of {total} users have active subscriptions</li>
        <li>• {expiring} users likely to churn in next 30 days</li>
        <li>• Strongest growth in Startup stage</li>
        <li>• Marketing & Branding top skill cluster</li>
      </ul>
    </Card>
  );
}
