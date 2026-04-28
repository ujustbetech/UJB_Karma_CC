'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { BarChart3, TrendingUp, Activity, Users, IndianRupee } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function ReferralDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/referrals', { credentials: 'include' });
        const payload = await res.json().catch(() => ({}));
        const referrals = Array.isArray(payload.referrals) ? payload.referrals : [];

        const rows = [];
        referrals.forEach((d) => {
          const orbiter = d?.orbiter?.name || 'Unknown';
          const cosmo = d?.cosmoOrbiter?.name || 'Unknown';
          const source = d?.referralSource || 'Direct';
          const category = d?.service?.name || 'General';

          (d?.dealLogs || []).forEach((log) => {
            const dateValue = log?.timestamp?.seconds
              ? new Date(log.timestamp.seconds * 1000)
              : new Date(log.timestamp || log.lastDealCalculatedAt || Date.now());
            rows.push({
              status: log.dealStatus || 'Pending',
              value: Number(log.dealValue || 0),
              ujbShare: Number(log.ujustbeShare || 0),
              orbiter,
              cosmo,
              source,
              category,
              month: `${dateValue.getFullYear()}-${dateValue.getMonth() + 1}`,
            });
          });
        });

        setRecords(rows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusData = useMemo(() => aggregateBy(records, 'status'), [records]);
  const orbiterData = useMemo(() => aggregateBy(records, 'orbiter'), [records]);
  const cosmoData = useMemo(() => aggregateBy(records, 'cosmo'), [records]);
  const sourceData = useMemo(() => aggregateBy(records, 'source'), [records]);
  const categoryData = useMemo(() => aggregateBy(records, 'category'), [records]);
  const monthlyData = useMemo(() => aggregateBy(records, 'month'), [records]);
  const totalUjb = useMemo(
    () => records.reduce((sum, item) => sum + Number(item.ujbShare || 0), 0),
    [records]
  );
  const totalBusiness = useMemo(
    () => records.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [records]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-6 w-60 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={22} />
        <Text variant="h1">Referral Intelligence Center</Text>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPI title="Total Business" value={`INR ${totalBusiness}`} icon={IndianRupee} />
        <KPI title="UJB Revenue" value={`INR ${totalUjb}`} icon={TrendingUp} />
        <KPI title="Active Orbiters" value={orbiterData.length} icon={Users} />
        <KPI title="Categories" value={categoryData.length} icon={Activity} />
      </div>

      <Chart title="Monthly Revenue Trend" data={monthlyData} />
      <Chart title="Status-wise Business" data={statusData} />
      <Chart title="Orbiter-wise Business" data={orbiterData} />
      <Chart title="CosmoOrbiter-wise Business" data={cosmoData} />
      <Chart title="Referral Source Performance" data={sourceData} />
      <Chart title="Category-wise Business" data={categoryData} />
    </div>
  );
}

function aggregateBy(records, key) {
  const map = {};
  records.forEach((item) => {
    const label = item?.[key] || 'Unknown';
    map[label] = (map[label] || 0) + Number(item?.value || 0);
  });
  return Object.entries(map).map(([label, value]) => ({ label, value }));
}

function Chart({ title, data }) {
  return (
    <Card className="p-6">
      <Text variant="h3" className="mb-4">
        {title}
      </Text>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line dataKey="value" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function KPI({ title, value, icon: Icon }) {
  return (
    <Card className="p-4 flex gap-4 items-center">
      <Icon size={22} />
      <div>
        <Text variant="h2">{value}</Text>
        <Text variant="muted">{title}</Text>
      </div>
    </Card>
  );
}
