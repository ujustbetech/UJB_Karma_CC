"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  LayoutGrid,
  Users,
  UserSearch,
  Share2,
  CalendarDays,
  Droplets,
  Compass,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

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

function getProspectStatus(item) {
  return String(item?.recordStatus || "Active").trim() || "Active";
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState({
    prospects: [],
    content: [],
    conclaves: [],
    events: [],
    referrals: [],
    todos: [],
  });

  useEffect(() => {
    let mounted = true;

    async function safeGet(url, key) {
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to load ${key}`);
      return data;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [prospectData, contentData, conclaveData, meetingData, referralData, todoData] =
          await Promise.all([
            safeGet("/api/admin/prospects", "prospects"),
            safeGet("/api/admin/content", "content"),
            safeGet("/api/admin/conclave", "conclaves"),
            safeGet("/api/admin/monthlymeeting", "monthly meetings"),
            safeGet("/api/admin/referrals", "referrals"),
            safeGet("/api/admin/todos", "todos"),
          ]);

        if (!mounted) return;
        setPayload({
          prospects: Array.isArray(prospectData?.prospects) ? prospectData.prospects : [],
          content: Array.isArray(contentData?.content) ? contentData.content : [],
          conclaves: Array.isArray(conclaveData?.conclaves) ? conclaveData.conclaves : [],
          events: Array.isArray(meetingData?.events) ? meetingData.events : [],
          referrals: Array.isArray(referralData?.referrals) ? referralData.referrals : [],
          todos: Array.isArray(todoData?.todos) ? todoData.todos : [],
        });
      } catch (err) {
        console.error(err);
        if (mounted) setError(err?.message || "Failed to load admin dashboard");
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
    const totalProspects = payload.prospects.length;
    const activeProspects = payload.prospects.filter(
      (item) => getProspectStatus(item) === "Active"
    ).length;
    const totalDewdrop = payload.content.length;
    const dewdropViews = payload.content.reduce(
      (sum, item) => sum + Number(item.views_count ?? item.views ?? 0),
      0
    );
    const totalConclaves = payload.conclaves.length;
    const totalMeetings = payload.events.length;
    const totalReferrals = payload.referrals.length;
    const openTodos = payload.todos.filter(
      (item) => String(item?.status || "").toLowerCase() !== "done"
    ).length;

    const stageMap = {};
    payload.prospects.forEach((item) => {
      const key = getProspectStatus(item);
      stageMap[key] = (stageMap[key] || 0) + 1;
    });
    const prospectStatusData = Object.entries(stageMap).map(([name, value]) => ({
      name,
      value,
    }));

    const monthlyActivityMap = {};
    payload.referrals.forEach((item) => {
      const key = monthKey(item?.createdAt || item?.timestamp);
      if (!monthlyActivityMap[key]) {
        monthlyActivityMap[key] = { month: key, referrals: 0, prospects: 0 };
      }
      monthlyActivityMap[key].referrals += 1;
    });
    payload.prospects.forEach((item) => {
      const key = monthKey(item?.createdAt || item?.timestamp || item?.updatedAt);
      if (!monthlyActivityMap[key]) {
        monthlyActivityMap[key] = { month: key, referrals: 0, prospects: 0 };
      }
      monthlyActivityMap[key].prospects += 1;
    });

    const recentContent = [...payload.content]
      .sort((a, b) => {
        const aT = toDate(a.AdminCreatedby)?.getTime() || 0;
        const bT = toDate(b.AdminCreatedby)?.getTime() || 0;
        return bT - aT;
      })
      .slice(0, 5);

    return {
      totalProspects,
      activeProspects,
      totalDewdrop,
      dewdropViews,
      totalConclaves,
      totalMeetings,
      totalReferrals,
      openTodos,
      prospectStatusData,
      monthlyActivityData: Object.values(monthlyActivityMap),
      recentContent,
    };
  }, [payload]);

  if (loading) {
    return (
      <div className="space-y-5 p-1">
        <div className="h-7 w-72 rounded bg-slate-200 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          <LayoutGrid className="text-slate-700" size={22} />
          <Text variant="h1">Admin Command Center</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tasks/add">
            <Button className="gap-2">
              <CheckCircle2 size={16} />
              Add Task
            </Button>
          </Link>
          <Link href="/admin/prospect/add">
            <Button variant="secondary">Add Prospect</Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="border border-rose-200 bg-rose-50 p-4">
          <Text className="text-rose-700">{error}</Text>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Prospects" value={metrics.totalProspects} icon={UserSearch} />
        <KpiCard title="Referrals" value={metrics.totalReferrals} icon={Share2} />
        <KpiCard title="Conclaves" value={metrics.totalConclaves} icon={Compass} />
        <KpiCard title="Monthly Meetings" value={metrics.totalMeetings} icon={CalendarDays} />
        <KpiCard title="Dewdrop Content" value={metrics.totalDewdrop} icon={Droplets} />
        <KpiCard title="Dewdrop Views" value={metrics.dewdropViews} icon={ArrowUpRight} />
        <KpiCard title="Active Prospects" value={metrics.activeProspects} icon={Users} />
        <KpiCard title="Open TODOs" value={metrics.openTodos} icon={Clock3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Prospect Lifecycle Split
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics.prospectStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Monthly Acquisition Pulse
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={metrics.monthlyActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="prospects" stroke="#0ea5e9" strokeWidth={2} />
              <Line type="monotone" dataKey="referrals" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Quick Modules
          </Text>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <QuickLink href="/admin/prospect" label="Prospect Dashboard" meta="Pipeline and conversion" />
            <QuickLink href="/admin/referral" label="Referral Dashboard" meta="Business and deal status" />
            <QuickLink href="/admin/monthlymeeting" label="Monthly Meeting" meta="Attendance and engagement" />
            <QuickLink href="/admin/conclave" label="Conclave Dashboard" meta="Streams and leadership" />
            <QuickLink href="/admin/dewdrop" label="Dewdrop Dashboard" meta="Content and performance" />
            <QuickLink href="/admin/tasks" label="My TODO" meta="Execution tracker" />
          </div>
        </Card>

        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Recently Added Dewdrop
          </Text>
          <div className="space-y-3">
            {metrics.recentContent.length ? (
              metrics.recentContent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.name || "Untitled"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.partner || "UjustBe"} | {item.status || "inactive"}
                    </p>
                  </div>
                  <Link href={`/admin/dewdrop/${item.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              ))
            ) : (
              <Text variant="muted">No content available.</Text>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon }) {
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

function QuickLink({ href, label, meta }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{meta}</p>
    </Link>
  );
}
