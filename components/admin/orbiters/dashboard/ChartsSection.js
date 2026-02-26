import SubscriptionChart from './charts/SubscriptionChart';
import BusinessStageChart from './charts/BusinessStageChart';
import SkillsChart from './charts/SkillsChart';
import FitnessChart from './charts/FitnessChart';
import RenewalRiskChart from './charts/RenewalRiskChart';

export default function ChartsSection({ users }) {
  return (
    <div className="grid grid-cols-2 gap-6">

      <SubscriptionChart users={users} />
      <BusinessStageChart users={users} />
      <SkillsChart users={users} />
      <FitnessChart users={users} />
      <RenewalRiskChart users={users} />

    </div>
  );
}
