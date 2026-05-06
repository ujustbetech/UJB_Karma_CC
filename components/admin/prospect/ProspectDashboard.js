"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  BarChart3,
  UserPlus,
  Users,
  Archive,
  Briefcase,
  ArrowRightCircle,
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

function getLifecycleStatus(prospect) {
  return String(prospect?.recordStatus || "Active").trim() || "Active";
}

function getProspectStage(prospect) {
  if (prospect.status === "Choose to enroll") return "Enrolled";
  if (prospect.enrollmentStages?.some((stage) => stage.status === "Completed")) return "Enrollment";
  if (prospect.assessmentMail?.sent) return "Assessment";
  if (prospect.caseStudy2?.sent) return "Case Study 2";
  if (prospect.caseStudy1?.sent) return "Case Study 1";
  if (prospect.knowledgeSeries10_evening?.sent) return "Knowledge 10";
  if (prospect.knowledgeSeries5_morning?.sent) return "Knowledge";
  if (prospect.ntIntro?.sent) return "NT Intro";
  if (prospect.sections?.length > 0) return "Assessment Form";
  if (prospect.introevent?.length > 0) return "Intro Meeting";
  return "Created";
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthKey(value) {
  const date = toDate(value);
  if (!date) return "Unknown";
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default function ProspectDashboard() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/prospects", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load prospects");
        if (!mounted) return;
        setProspects(Array.isArray(data.prospects) ? data.prospects : []);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load prospect dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const total = prospects.length;
    const active = prospects.filter((p) => getLifecycleStatus(p) === "Active").length;
    const archive = prospects.filter((p) => getLifecycleStatus(p) === "Archive").length;
    const enrolled = prospects.filter((p) => p.status === "Choose to enroll").length;
    const opsAssigned = new Set(
      prospects.map((p) => String(p.assignedOpsEmail || "").trim().toLowerCase()).filter(Boolean)
    ).size;
    const mentorCount = new Set(
      prospects.map((p) => String(p.orbiterName || "").trim()).filter(Boolean)
    ).size;

    const stageMap = {};
    prospects.forEach((p) => {
      const stage = getProspectStage(p);
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    });
    const stageData = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));

    const mentorMap = {};
    prospects.forEach((p) => {
      const mentor = String(p.orbiterName || "Unknown").trim();
      mentorMap[mentor] = (mentorMap[mentor] || 0) + 1;
    });
    const topMentors = Object.entries(mentorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const monthMap = {};
    prospects.forEach((p) => {
      const key = monthKey(p.createdAt || p.timestamp || p.updatedAt);
      if (!monthMap[key]) monthMap[key] = { month: key, total: 0 };
      monthMap[key].total += 1;
    });
    const trend = Object.values(monthMap);

    const recent = [...prospects]
      .sort((a, b) => {
        const aT = toDate(a.createdAt || a.timestamp || a.updatedAt)?.getTime() || 0;
        const bT = toDate(b.createdAt || b.timestamp || b.updatedAt)?.getTime() || 0;
        return bT - aT;
      })
      .slice(0, 8);

    return {
      total,
      active,
      archive,
      enrolled,
      opsAssigned,
      mentorCount,
      stageData,
      topMentors,
      trend,
      recent,
    };
  }, [prospects]);

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
          <BarChart3 size={22} className="text-blue-600" />
          <Text variant="h1">Prospect Dashboard</Text>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/prospect/add">
            <Button className="gap-2">
              <UserPlus size={16} />
              Add Prospect
            </Button>
          </Link>
          <Link href="/admin/prospect/manage">
            <Button variant="secondary">Manage Prospects</Button>
          </Link>
          <Link href="/admin/prospect/export">
            <Button variant="secondary">Export</Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="border border-rose-200 bg-rose-50 p-4">
          <Text className="text-rose-700">{error}</Text>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Total Prospects" value={metrics.total} icon={Users} />
        <Kpi title="Active" value={metrics.active} icon={ArrowRightCircle} />
        <Kpi title="Archive" value={metrics.archive} icon={Archive} />
        <Kpi title="Enrolled" value={metrics.enrolled} icon={Briefcase} />
        <Kpi title="OPS Assigned" value={metrics.opsAssigned} icon={Users} />
        <Kpi title="MentOrbiters" value={metrics.mentorCount} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Prospect Stage Funnel
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics.stageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Monthly Prospect Trend
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={metrics.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Top MentOrbiters by Prospect Count
          </Text>
          <div className="space-y-3">
            {metrics.topMentors.length ? (
              metrics.topMentors.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="grid min-h-[74px] grid-cols-[48px_1fr_70px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <Text className="truncate font-semibold text-slate-900">{item.name}</Text>
                  <div className="text-right">
                    <Text className="text-lg font-bold leading-none text-slate-900">{item.count}</Text>
                    <Text variant="muted" className="text-[11px]">Prospects</Text>
                  </div>
                </div>
              ))
            ) : (
              <Text variant="muted">No mentor data found.</Text>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Recently Added Prospects
          </Text>
          <div className="space-y-3">
            {metrics.recent.length ? (
              metrics.recent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="min-w-0">
                    <Text className="truncate font-semibold text-slate-900">
                      {item.prospectName || "Unnamed Prospect"}
                    </Text>
                    <Text variant="muted" className="text-xs">
                      {item.orbiterName || "No MentOrbiter"} | {getLifecycleStatus(item)}
                    </Text>
                  </div>
                  <Link href={`/admin/prospect/edit/${item.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              ))
            ) : (
              <Text variant="muted">No prospects available.</Text>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ title, value, icon: Icon }) {
  return (
    <Card className="h-full min-h-[104px] p-5">
      <div className="flex h-full items-center gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <Text variant="h2" className="block leading-none text-slate-900">
            {value}
          </Text>
          <Text variant="muted" className="mt-2 block text-sm leading-5 text-slate-600">
            {title}
          </Text>
        </div>
      </div>
    </Card>
  );
}
