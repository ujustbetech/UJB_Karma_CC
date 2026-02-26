'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  IndianRupee
} from 'lucide-react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function ReferralDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTIONS.referral),
      (snap) => {

        const rows = [];

        snap.forEach(doc => {
          const d = doc.data();

          const orbiter = d?.orbiter?.name || 'Unknown';
          const cosmo = d?.cosmoOrbiter?.name || 'Unknown';
          const source = d?.referralSource || 'Direct';
          const category = d?.service?.name || 'General';

          (d?.dealLogs || []).forEach(log => {
            const date = new Date(log.timestamp || log.lastDealCalculatedAt);

            rows.push({
              status: log.dealStatus,
              value: Number(log.dealValue || 0),
              ujbShare: Number(log.ujustbeShare || 0),
              orbiter,
              cosmo,
              source,
              category,
              month: `${date.getFullYear()}-${date.getMonth()+1}`
            });
          });
        });

        setRecords(rows);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  /* ================= STATUS ================= */

  const statusData = useMemo(() => {
    const map = {};
    records.forEach(r=>{
      if(!map[r.status]) map[r.status]=0;
      map[r.status]+=r.value;
    });
    return Object.entries(map).map(([label,value])=>({label,value}));
  }, [records]);

  /* ================= ORBITER PERFORMANCE ================= */

  const orbiterData = useMemo(()=>{
    const map={};
    records.forEach(r=>{
      if(!map[r.orbiter]) map[r.orbiter]=0;
      map[r.orbiter]+=r.value;
    });
    return Object.entries(map).map(([label,value])=>({label,value}));
  },[records]);

  /* ================= COSMO PERFORMANCE ================= */

  const cosmoData = useMemo(()=>{
    const map={};
    records.forEach(r=>{
      if(!map[r.cosmo]) map[r.cosmo]=0;
      map[r.cosmo]+=r.value;
    });
    return Object.entries(map).map(([label,value])=>({label,value}));
  },[records]);

  /* ================= REFERRAL SOURCE ================= */

  const sourceData = useMemo(()=>{
    const map={};
    records.forEach(r=>{
      if(!map[r.source]) map[r.source]=0;
      map[r.source]+=r.value;
    });
    return Object.entries(map).map(([label,value])=>({label,value}));
  },[records]);

  /* ================= CATEGORY ================= */

  const categoryData = useMemo(()=>{
    const map={};
    records.forEach(r=>{
      if(!map[r.category]) map[r.category]=0;
      map[r.category]+=r.value;
    });
    return Object.entries(map).map(([label,value])=>({label,value}));
  },[records]);

  /* ================= MONTHLY ================= */

  const monthlyData = useMemo(()=>{
    const map={};
    records.forEach(r=>{
      if(!map[r.month]) map[r.month]=0;
      map[r.month]+=r.value;
    });
    return Object.entries(map).map(([label,value])=>({label,value}));
  },[records]);

  /* ================= UJB SHARE ================= */

  const totalUJB = useMemo(()=>{
    return records.reduce((a,b)=>a+b.ujbShare,0);
  },[records]);

  const totalBusiness = useMemo(()=>{
    return records.reduce((a,b)=>a+b.value,0);
  },[records]);

  /* ================= LOADING ================= */

  if(loading){
    return(
      <div className="p-6 space-y-6">
        <div className="h-6 w-60 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_,i)=>(
            <Card key={i} className="p-6">
              <div className="h-10 bg-gray-200 animate-pulse rounded"/>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="h-64 bg-gray-200 animate-pulse rounded"/>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center gap-2">
        <BarChart3 size={22}/>
        <Text variant="h1">Referral Intelligence Center</Text>
      </div>

      {/* TOP STRIP */}
      <div className="grid grid-cols-4 gap-4">
        <KPI title="Total Business" value={`₹${totalBusiness}`} icon={IndianRupee}/>
        <KPI title="UJB Revenue" value={`₹${totalUJB}`} icon={TrendingUp}/>
        <KPI title="Active Orbiters" value={orbiterData.length} icon={Users}/>
        <KPI title="Categories" value={categoryData.length} icon={Activity}/>
      </div>

      <Chart title="Monthly Revenue Trend" data={monthlyData}/>
      <Chart title="Status-wise Business" data={statusData}/>
      <Chart title="Orbiter-wise Business" data={orbiterData}/>
      <Chart title="CosmoOrbiter-wise Business" data={cosmoData}/>
      <Chart title="Referral Source Performance" data={sourceData}/>
      <Chart title="Category-wise Business" data={categoryData}/>

    </div>
  );
}

/* CHART */

function Chart({title,data}){
  return(
    <Card className="p-6">
      <Text variant="h3" className="mb-4">{title}</Text>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="label"/>
          <YAxis/>
          <Tooltip/>
          <Line dataKey="value"/>
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

/* KPI */

function KPI({title,value,icon:Icon}){
  return(
    <Card className="p-4 flex gap-4 items-center">
      <Icon size={22}/>
      <div>
        <Text variant="h2">{value}</Text>
        <Text variant="muted">{title}</Text>
      </div>
    </Card>
  )
}
