"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  BarChart3,
  CalendarDays,
  Compass,
  Handshake,
  PlusCircle,
  Users,
  UserRoundCog,
  Waves,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  fetchAdminConclave,
  fetchAdminConclaves,
  fetchAdminConclaveUsers,
} from "@/services/adminConclaveService";

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthKey(value) {
  const date = toDate(value);
  if (!date) return "Unknown";
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function shortLabel(value, max = 14) {
  const text = String(value || "").trim();
  if (!text) return "Unknown";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function ConclaveDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conclaves, setConclaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [meetingsByConclave, setMeetingsByConclave] = useState({});

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [conclaveList, userList] = await Promise.all([
          fetchAdminConclaves(),
          fetchAdminConclaveUsers(),
        ]);

        if (!mounted) return;
        setConclaves(Array.isArray(conclaveList) ? conclaveList : []);
        setUsers(Array.isArray(userList) ? userList : []);

        const details = await Promise.allSettled(
          (Array.isArray(conclaveList) ? conclaveList : []).map((item) =>
            fetchAdminConclave(item.id)
          )
        );

        if (!mounted) return;
        const nextMeetings = {};
        details.forEach((result, index) => {
          const id = conclaveList?.[index]?.id;
          if (!id) return;
          if (result.status === "fulfilled") {
            nextMeetings[id] = Array.isArray(result.value?.meetings)
              ? result.value.meetings
              : [];
          } else {
            nextMeetings[id] = [];
          }
        });
        setMeetingsByConclave(nextMeetings);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load conclave dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const leaderDirectory = useMemo(() => {
    const map = new Map();
    users.forEach((user) => {
      const name = String(user?.label || user?.value || user?.id || "").trim();
      const idKey = String(user?.id || "").trim();
      const valueKey = String(user?.value || "").trim();
      const phoneKey = String(user?.phone || "").trim();
      if (idKey) map.set(idKey, name);
      if (valueKey) map.set(valueKey, name);
      if (phoneKey) map.set(phoneKey, name);
    });
    return map;
  }, [users]);

  const metrics = useMemo(() => {
    const totalConclaves = conclaves.length;
    const totalOrbiters = conclaves.reduce(
      (sum, item) => sum + (Array.isArray(item.orbiters) ? item.orbiters.length : 0),
      0
    );
    const totalNtMembers = conclaves.reduce(
      (sum, item) => sum + (Array.isArray(item.ntMembers) ? item.ntMembers.length : 0),
      0
    );

    const today = new Date();
    let activeConclaves = 0;
    let upcomingConclaves = 0;
    conclaves.forEach((item) => {
      const start = toDate(item.startDate);
      if (!start) return;
      if (start <= today) activeConclaves += 1;
      if (start > today) upcomingConclaves += 1;
    });

    let totalMeetings = 0;
    let totalReferrals = 0;
    let totalKnowledgeShares = 0;
    Object.values(meetingsByConclave).forEach((meetingList) => {
      totalMeetings += meetingList.length;
      meetingList.forEach((meeting) => {
        totalReferrals += Array.isArray(meeting?.referralSections)
          ? meeting.referralSections.length
          : 0;
        totalKnowledgeShares += Array.isArray(meeting?.knowledgeSections)
          ? meeting.knowledgeSections.length
          : 0;
      });
    });

    const leaderCount = {};
    conclaves.forEach((item) => {
      const leader = String(item.leader || "").trim() || "Unknown";
      leaderCount[leader] = (leaderCount[leader] || 0) + 1;
    });

    const topLeaders = Object.entries(leaderCount)
      .map(([leaderId, count]) => ({
        leaderId,
        leaderName: leaderDirectory.get(leaderId) || `Leader ${leaderId}`,
        leaderLabel: shortLabel(leaderDirectory.get(leaderId) || `Leader ${leaderId}`),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topConclaves = conclaves
      .map((item) => ({
        id: item.id,
        name: item.name || "Unnamed",
        orbiters: Array.isArray(item.orbiters) ? item.orbiters.length : 0,
        ntMembers: Array.isArray(item.ntMembers) ? item.ntMembers.length : 0,
        meetings: Array.isArray(meetingsByConclave[item.id])
          ? meetingsByConclave[item.id].length
          : 0,
      }))
      .sort((a, b) => b.orbiters - a.orbiters)
      .slice(0, 6);

    const monthlyMeetingMap = {};
    Object.values(meetingsByConclave).forEach((meetingList) => {
      meetingList.forEach((meeting) => {
        const key = monthKey(meeting?.datetime || meeting?.createdAt);
        if (!monthlyMeetingMap[key]) {
          monthlyMeetingMap[key] = { month: key, meetings: 0 };
        }
        monthlyMeetingMap[key].meetings += 1;
      });
    });

    return {
      totalConclaves,
      totalOrbiters,
      totalNtMembers,
      activeConclaves,
      upcomingConclaves,
      totalMeetings,
      totalReferrals,
      totalKnowledgeShares,
      topLeaders,
      topConclaves,
      monthlyMeetingTrend: Object.values(monthlyMeetingMap),
    };
  }, [conclaves, leaderDirectory, meetingsByConclave]);

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-7 w-72 rounded bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Card key={idx} className="p-4">
              <div className="h-16 rounded bg-slate-100 animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="text-blue-600" size={22} />
          <Text variant="h1">Conclave Dashboard</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/conclave/add">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Add Conclave
            </Button>
          </Link>
          <Link href="/admin/conclave/list">
            <Button variant="secondary">Manage Conclaves</Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="border border-rose-200 bg-rose-50 p-4">
          <Text className="text-rose-700">{error}</Text>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Total Conclaves" value={metrics.totalConclaves} icon={BarChart3} tone="slate" />
        <Kpi title="Active Conclaves" value={metrics.activeConclaves} icon={Waves} tone="blue" />
        <Kpi title="Total Orbiters" value={metrics.totalOrbiters} icon={Users} tone="emerald" />
        <Kpi title="NT Members" value={metrics.totalNtMembers} icon={UserRoundCog} tone="violet" />
        <Kpi title="Total Meetings" value={metrics.totalMeetings} icon={CalendarDays} tone="amber" />
        <Kpi title="Upcoming Conclaves" value={metrics.upcomingConclaves} icon={Compass} tone="sky" />
        <Kpi title="Meeting Referrals" value={metrics.totalReferrals} icon={Handshake} tone="orange" />
        <Kpi title="Knowledge Shares" value={metrics.totalKnowledgeShares} icon={Waves} tone="teal" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Monthly Meeting Trend
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={metrics.monthlyMeetingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="meetings" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Top Leaders by Conclave Count
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics.topLeaders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="leaderLabel" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value}`, "Conclaves"]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.leaderName || label}
              />
              <Bar dataKey="count" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <Text variant="h3" className="mb-4">
          Top Conclaves by Orbiter Strength
        </Text>
        <div className="space-y-3">
          {metrics.topConclaves.length ? (
            metrics.topConclaves.map((item, index) => (
              <div
                key={item.id}
                className="grid min-h-[84px] grid-cols-[56px_1fr_110px] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <Text className="truncate font-semibold text-slate-900">{item.name}</Text>
                  <Text variant="muted" className="mt-1 text-xs text-slate-600">
                    {item.orbiters} orbiters | {item.ntMembers} NT | {item.meetings} meetings
                  </Text>
                </div>
                <div className="text-right">
                  <Link href={`/admin/conclave/edit/${item.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <Text variant="muted">No conclave data available.</Text>
          )}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ title, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
  };

  return (
    <Card className="h-full min-h-[104px] p-4">
      <div className="flex h-full items-center gap-4">
        <div className={`rounded-xl border p-3 ${tones[tone] || tones.slate}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 space-y-1">
          <Text variant="h2" className="block leading-none text-slate-900">
            {value}
          </Text>
          <Text variant="muted" className="block text-sm leading-5 text-slate-600">
            {title}
          </Text>
        </div>
      </div>
    </Card>
  );
}
