"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  BarChart3,
  Droplets,
  Eye,
  Heart,
  Sparkles,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  PlusCircle,
  FolderKanban,
  LayoutList,
} from "lucide-react";
import { fetchContentListing } from "@/services/adminContentService";

function normalizeType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "featured") return "Featured";
  if (raw === "normal") return "Normal";
  return "Other";
}

function normalizeFormat(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "image") return "Image";
  if (raw === "video") return "Video";
  if (raw === "audio") return "Audio";
  if (raw === "text") return "Text";
  return "Other";
}

function getDateMs(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export default function DewdropDashboardPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchContentListing();
        if (!mounted) return;
        setContent(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError("Failed to load Dewdrop dashboard data");
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
    const total = content.length;
    const active = content.filter((item) => item.status === "active").length;
    const inactive = total - active;
    const featured = content.filter(
      (item) => normalizeType(item.type) === "Featured"
    ).length;
    const normal = content.filter(
      (item) => normalizeType(item.type) === "Normal"
    ).length;
    const totalViews = content.reduce(
      (sum, item) => sum + Number(item.views_count ?? item.views ?? 0),
      0
    );
    const uniqueViews = content.reduce(
      (sum, item) => sum + Number(item.unique_views_count ?? 0),
      0
    );
    const likes = content.reduce((sum, item) => sum + Number(item.likes ?? 0), 0);

    const formatCounts = { Image: 0, Video: 0, Audio: 0, Text: 0, Other: 0 };
    content.forEach((item) => {
      const format = normalizeFormat(item.format);
      formatCounts[format] = (formatCounts[format] || 0) + 1;
    });

    const topByViews = [...content]
      .sort(
        (a, b) =>
          Number(b.views_count ?? b.views ?? 0) -
          Number(a.views_count ?? a.views ?? 0)
      )
      .slice(0, 5);

    const latest = [...content]
      .sort((a, b) => getDateMs(b.AdminCreatedby) - getDateMs(a.AdminCreatedby))
      .slice(0, 6);

    return {
      total,
      active,
      inactive,
      featured,
      normal,
      totalViews,
      uniqueViews,
      likes,
      formatCounts,
      topByViews,
      latest,
    };
  }, [content]);

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
          <Droplets className="text-orange-500" size={22} />
          <Text variant="h1">Dewdrop Dashboard</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/dewdrop/add">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Add Content
            </Button>
          </Link>
          <Link href="/admin/dewdrop/manage">
            <Button variant="secondary" className="gap-2">
              <LayoutList size={16} />
              Manage
            </Button>
          </Link>
          <Link href="/admin/dewdrop/category">
            <Button variant="secondary" className="gap-2">
              <FolderKanban size={16} />
              Categories
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="border border-rose-200 bg-rose-50 p-4">
          <Text className="text-rose-700">{error}</Text>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Content" value={metrics.total} icon={BarChart3} />
        <KpiCard title="Active Content" value={metrics.active} icon={Sparkles} />
        <KpiCard title="Total Views" value={metrics.totalViews} icon={Eye} />
        <KpiCard title="Total Likes" value={metrics.likes} icon={Heart} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Content Type Split
          </Text>
          <div className="grid grid-cols-3 gap-3">
            <MetricPill label="Featured" value={metrics.featured} tone="orange" />
            <MetricPill label="Normal" value={metrics.normal} tone="blue" />
            <MetricPill label="Inactive" value={metrics.inactive} tone="slate" />
          </div>
          <div className="mt-4">
            <MetricPill label="Unique Views" value={metrics.uniqueViews} tone="emerald" />
          </div>
        </Card>

        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Format Distribution
          </Text>
          <div className="grid grid-cols-2 gap-3">
            <FormatPill label="Image" value={metrics.formatCounts.Image} icon={ImageIcon} />
            <FormatPill label="Video" value={metrics.formatCounts.Video} icon={Video} />
            <FormatPill label="Audio" value={metrics.formatCounts.Audio} icon={Music} />
            <FormatPill label="Text" value={metrics.formatCounts.Text} icon={FileText} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Top Content by Views
          </Text>
          <div className="space-y-3">
            {metrics.topByViews.length ? (
              metrics.topByViews.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {index + 1}. {item.name || "Untitled"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {normalizeType(item.type)} • {item.format || "Unknown"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {Number(item.views_count ?? item.views ?? 0)}
                    </p>
                    <p className="text-xs text-slate-500">views</p>
                  </div>
                </div>
              ))
            ) : (
              <Text variant="muted">No content available.</Text>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <Text variant="h3" className="mb-4">
            Recently Added
          </Text>
          <div className="space-y-3">
            {metrics.latest.length ? (
              metrics.latest.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.name || "Untitled"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.partner || "UjustBe"} • {item.status || "inactive"}
                    </p>
                  </div>
                  <Link href={`/admin/dewdrop/${item.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                    Edit
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
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Text variant="muted" className="text-sm">
          {title}
        </Text>
        <Icon size={18} className="text-slate-500" />
      </div>
      <Text variant="h2" className="mt-3">
        {value}
      </Text>
    </Card>
  );
}

function MetricPill({ label, value, tone }) {
  const tones = {
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <div className={`rounded-xl border px-3 py-2 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function FormatPill({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <Icon size={14} className="text-slate-500" />
      </div>
      <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
