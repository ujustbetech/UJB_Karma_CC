'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

import {
  Users,
  BadgeCheck,
  AlertTriangle,
  Brain,
  Network,
  HeartPulse,
  Building,
  Trophy,
  MapPin
} from 'lucide-react';

import {
  PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

export default function DashboardLayout() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getDocs(collection(db, 'usersdetail')).then(snap => {
      setUsers(snap.docs.map(d => d.data()));
    });
  }, []);

  /* ================= KPI ================= */

  const total = users.length;

  const active = users.filter(u =>
    u.subscription?.status === 'active'
  ).length;

  const expired = users.filter(u => {
    const d = u.subscription?.nextRenewalDate;
    return d && new Date(d) < new Date();
  }).length;

  const expiring = users.filter(u => {
    const d = u.subscription?.nextRenewalDate;
    if (!d) return false;
    const days = (new Date(d) - new Date()) / (1000 * 60 * 60 * 24);
    return days < 30 && days > 0;
  }).length;

  /* ================= PROFILE STRENGTH ================= */

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
  const avgStrength =
    Math.round(strengths.reduce((a, b) => a + b, 0) / (strengths.length || 1));

  const strengthBuckets = { weak:0,growing:0,strong:0,leader:0 };

  strengths.forEach(s=>{
    if(s<30) strengthBuckets.weak++;
    else if(s<60) strengthBuckets.growing++;
    else if(s<80) strengthBuckets.strong++;
    else strengthBuckets.leader++;
  });

  const strengthChart = [
    { name:'Weak', value:strengthBuckets.weak },
    { name:'Growing', value:strengthBuckets.growing },
    { name:'Strong', value:strengthBuckets.strong },
    { name:'Leader', value:strengthBuckets.leader },
  ];

  /* ================= SKILLS ================= */

  const skillMap = {};
  users.forEach(u =>
    (u.Skills || []).forEach(s => {
      skillMap[s] = (skillMap[s] || 0) + 1;
    })
  );

  const skillData = Object.entries(skillMap)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,7)
    .map(([name,value])=>({name,value}));

  /* ================= BUSINESS STAGE ================= */

  const stageData = [
    { name:'Startup', value:users.filter(u=>u.BusinessStage==='Startup').length },
    { name:'Growth', value:users.filter(u=>u.BusinessStage==='Growth').length },
    { name:'Established', value:users.filter(u=>u.BusinessStage==='Established').length },
  ];

  /* ================= SUBSCRIPTION ================= */

  const subData = [
    { name:'Active', value:active },
    { name:'Expiring', value:expiring },
    { name:'Expired', value:expired },
  ];

  /* ================= FITNESS ================= */

  const fitnessMap = {};
  users.forEach(u=>{
    const f = u.FitnessLevel || 'Unknown';
    fitnessMap[f] = (fitnessMap[f] || 0) + 1;
  });

  const fitnessData = Object.entries(fitnessMap)
    .map(([name,value])=>({name,value}));

  /* ================= MENTOR ================= */

  const mentorMap = {};
  users.forEach(u=>{
    if(!u.MentorName) return;
    mentorMap[u.MentorName]=(mentorMap[u.MentorName]||0)+1;
  });

  const mentorData = Object.entries(mentorMap)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,7)
    .map(([name,value])=>({name,value}));

  /* ================= NETWORK ================= */

  const networkData = users
    .map(u=>({
      name:u.Name,
      value:(u.connects||[]).length
    }))
    .sort((a,b)=>b.value-a.value)
    .slice(0,7);

  /* ================= LOCATION (CITY) ================= */

  const cityMap = {};
  users.forEach(u=>{
    const city = u.City || 'Unknown';
    cityMap[city] = (cityMap[city] || 0) + 1;
  });

  const locationData = Object.entries(cityMap)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10)
    .map(([name,value])=>({name,value}));

  /* ================= STATE ================= */

  const stateMap = {};
  users.forEach(u=>{
    const state = u.State || 'Unknown';
    stateMap[state] = (stateMap[state] || 0) + 1;
  });

  const stateData = Object.entries(stateMap)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10)
    .map(([name,value])=>({name,value}));

  return (
    <div className="space-y-6 min-h-screen">

      {/* KPI */}
      <div className="grid grid-cols-5 gap-4">

        <KPI icon={Users} title="Total Users" value={total} color="bg-blue-500" />
        <KPI icon={BadgeCheck} title="Active" value={active} color="bg-green-500" />
        <KPI icon={AlertTriangle} title="Expiring" value={expiring} color="bg-yellow-500" />
        <KPI icon={AlertTriangle} title="Expired" value={expired} color="bg-red-500" />
        <KPI icon={Brain} title="Strength" value={`${avgStrength}%`} color="bg-purple-500" />

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-6">

        <ChartCard title="Subscription Health" icon={BadgeCheck}>
          <PieChartView data={subData} />
        </ChartCard>

        <ChartCard title="Business Stage" icon={Building}>
          <BarChartView data={stageData} />
        </ChartCard>

        <ChartCard title="Profile Strength" icon={Brain}>
          <BarChartView data={strengthChart} />
        </ChartCard>

        <ChartCard title="Top Skills" icon={Trophy}>
          <BarChartView data={skillData} />
        </ChartCard>

        <ChartCard title="Fitness Lifestyle" icon={HeartPulse}>
          <PieChartView data={fitnessData} />
        </ChartCard>

        <ChartCard title="Mentor Influence" icon={Users}>
          <BarChartView data={mentorData} />
        </ChartCard>

        <ChartCard title="Network Leaders" icon={Network}>
          <BarChartView data={networkData} />
        </ChartCard>

        <ChartCard title="Users by City" icon={MapPin}>
          <BarChartView data={locationData} />
        </ChartCard>

        <ChartCard title="Users by State" icon={MapPin}>
          <BarChartView data={stateData} />
        </ChartCard>

      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function KPI({ icon:Icon, title, value, color }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg text-white ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <Text className="text-xs text-slate-500">{title}</Text>
        <Text variant="h2">{value}</Text>
      </div>
    </Card>
  );
}

function ChartCard({ title, icon:Icon, children }) {
  return (
    <Card className="p-4">
      <Text variant="h3" className="mb-3 flex items-center gap-2">
        <Icon size={18} />
        {title}
      </Text>
      {children}
    </Card>
  );
}

function PieChartView({ data }) {
  const COLORS = ['#22c55e','#f59e0b','#ef4444','#6366f1','#06b6d4','#8b5cf6','#ec4899'];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BarChartView({ data }) {
  const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899'];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value">
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
