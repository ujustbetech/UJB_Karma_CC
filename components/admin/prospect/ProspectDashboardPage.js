"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Select from "@/components/ui/Select";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import { CircleHelp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

const CHART_COLORS = ["#2563eb", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6"];

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value?.seconds ? value.seconds * 1000 : value);
  if (Number.isNaN(parsed.getTime())) return "-";
  const date = parsed.toLocaleDateString("en-GB");
  const time = parsed.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

function MetricInfoIcon({ definition }) {
  if (!definition) return null;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50"
        aria-label={`Info: ${definition.title || "metric"}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <CircleHelp size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{definition.title || "Metric"}</p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <p className="text-sm text-slate-700">{definition.laymanMeaning || "-"}</p>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">How we calculate: </span>
              {definition.formula || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Includes: </span>
              {definition.includedData || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Excludes: </span>
              {definition.excludedData || "Not specified"}
            </p>
          </div>
        </div>
      )}
    </span>
  );
}

function KPISection({ kpis, metricDefinitions }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Text as="p" variant="muted" className="mb-2">
                {kpi.title}
              </Text>
              <Text as="p" variant="h2">
                {kpi.value}
              </Text>
            </div>
            <MetricInfoIcon definition={metricDefinitions?.[kpi.id]} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChartCard({ chart, metricDefinitions }) {
  const definition = metricDefinitions?.[chart.id];
  const data = Array.isArray(chart.data) ? chart.data : [];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Text variant="h3">{chart.title}</Text>
        <MetricInfoIcon definition={definition} />
      </div>

      {data.length === 0 ? (
        <Text variant="muted">No data available for this chart.</Text>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {chart.type === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" outerRadius={90}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.label}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <RechartsTooltip />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ left: 6, right: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" angle={-15} textAnchor="end" height={50} interval={0} />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function ActionTable({ title, metricDefinition, columns, rows, rowRenderer }) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <Text variant="h3">{title}</Text>
        <MetricInfoIcon definition={metricDefinition} />
      </div>

      {rows.length === 0 ? (
        <div className="p-4">
          <Text variant="muted">No records found.</Text>
        </div>
      ) : (
        <Table>
          <TableHeader columns={columns} />
          <tbody>
            {rows.map((row) => (
              <TableRow key={row.key}>{rowRenderer(row)}</TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export default function ProspectDashboardPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opsEmail, setOpsEmail] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState("all-time");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (opsEmail) params.set("opsEmail", opsEmail);
    if (status) params.set("status", status);
    if (dateRange) params.set("dateRange", dateRange);
    return params.toString();
  }, [opsEmail, status, dateRange]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/prospects/dashboard?${query}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to load dashboard");
        }
        if (!active) return;
        setPayload(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [query]);

  const filters = payload?.filters;
  const charts = payload?.charts || [];
  const kpis = payload?.kpis || [];
  const metricDefinitions = payload?.metricDefinitions || {};
  const actionTables = payload?.actionTables || {};

  const metricFor = (id, fallbackTitle) => {
    return (
      metricDefinitions[id] || {
        title: fallbackTitle,
        laymanMeaning: "This section helps you understand and take next actions quickly.",
        formula: "Based on the current filtered data.",
        includedData: "Prospect dashboard data",
        excludedData: "-",
      }
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <Text variant="h1">Prospect Dashboard</Text>
        <Text variant="caption">{payload?.generatedAt ? `Updated: ${formatDateTime(payload.generatedAt)}` : ""}</Text>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Text variant="caption">OPS</Text>
            <Select
              value={opsEmail}
              onChange={setOpsEmail}
              options={[
                { label: "All OPS", value: "" },
                ...((filters?.options?.ops || []).map((option) => ({
                  label: option.label,
                  value: option.value,
                })) || []),
              ]}
            />
          </div>

          <div>
            <Text variant="caption">Status</Text>
            <Select
              value={status}
              onChange={setStatus}
              options={[
                { label: "All Status", value: "" },
                ...((filters?.options?.status || []).map((item) => ({
                  label: item,
                  value: item,
                })) || []),
              ]}
            />
          </div>

          <div>
            <Text variant="caption">Date Range</Text>
            <Select
              value={dateRange}
              onChange={setDateRange}
              options={filters?.options?.dateRange || [{ label: "All-time", value: "all-time" }]}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpsEmail("");
                setStatus("");
                setDateRange("all-time");
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <Text>Loading dashboard data...</Text>
        </Card>
      ) : error ? (
        <Card>
          <Text className="text-rose-600">{error}</Text>
        </Card>
      ) : (
        <>
          {kpis.length ? (
            <KPISection kpis={kpis} metricDefinitions={metricDefinitions} />
          ) : (
            <Card>
              <Text variant="muted">No KPI data available for selected filters.</Text>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} metricDefinitions={metricDefinitions} />
            ))}
          </div>

          <div className="space-y-4">
            <ActionTable
              title="Overdue Follow-ups"
              metricDefinition={metricFor("overdue_todos", "Overdue Follow-ups")}
              columns={[
                { key: "name", label: "Prospect" },
                { key: "ops", label: "OPS" },
                { key: "followUpDate", label: "Follow-up Date" },
                { key: "purpose", label: "Purpose" },
                { key: "status", label: "Status" },
              ]}
              rows={(actionTables.overdueFollowups || []).map((row) => ({ key: row.todoId, ...row }))}
              rowRenderer={(row) => (
                <>
                  <td className="px-4 py-3">{row.linkedName || "-"}</td>
                  <td className="px-4 py-3">{row.assignToName || row.assignTo || "-"}</td>
                  <td className="px-4 py-3">{row.followUpDate || "-"}</td>
                  <td className="px-4 py-3">{row.purpose || "-"}</td>
                  <td className="px-4 py-3">{row.status || "-"}</td>
                </>
              )}
            />

            <ActionTable
              title="Need Some Time Follow-up"
              metricDefinition={metricFor("need_some_time_rate", "Need Some Time Follow-up")}
              columns={[
                { key: "name", label: "Prospect" },
                { key: "ops", label: "OPS" },
                { key: "status", label: "Status" },
                { key: "days", label: "Days Since Need Time" },
              ]}
              rows={(actionTables.needSomeTimeFollowups || []).map((row) => ({ key: row.prospectId, ...row }))}
              rowRenderer={(row) => (
                <>
                  <td className="px-4 py-3">{row.prospectName || "-"}</td>
                  <td className="px-4 py-3">{row.assignedOpsName || row.assignedOpsEmail || "-"}</td>
                  <td className="px-4 py-3">{row.status || "-"}</td>
                  <td className="px-4 py-3">{row.daysSinceNeedTime ?? "-"}</td>
                </>
              )}
            />

            <ActionTable
              title="Fee Mail Sent, Option Pending"
              metricDefinition={metricFor("chart_fee_option_split", "Fee Mail Sent, Option Pending")}
              columns={[
                { key: "name", label: "Prospect" },
                { key: "ops", label: "OPS" },
                { key: "mail", label: "Fee Mail Status" },
                { key: "option", label: "Fee Option" },
              ]}
              rows={(actionTables.feeMailSentNoOption || []).map((row) => ({ key: row.prospectId, ...row }))}
              rowRenderer={(row) => (
                <>
                  <td className="px-4 py-3">{row.prospectName || "-"}</td>
                  <td className="px-4 py-3">{row.assignedOpsName || row.assignedOpsEmail || "-"}</td>
                  <td className="px-4 py-3">{row.feeMailStatus || "-"}</td>
                  <td className="px-4 py-3">{row.feeOptionStatus || "-"}</td>
                </>
              )}
            />

            <ActionTable
              title="Missing OPS Assignment Exceptions"
              metricDefinition={metricFor("skipped_missing_ops", "Missing OPS Assignment Exceptions")}
              columns={[
                { key: "name", label: "Prospect" },
                { key: "rule", label: "Rule Key" },
                { key: "message", label: "Issue" },
                { key: "createdAt", label: "Created" },
              ]}
              rows={(actionTables.missingOpsAssignmentIssues || []).map((row) => ({ key: row.issueId, ...row }))}
              rowRenderer={(row) => (
                <>
                  <td className="px-4 py-3">{row.prospectName || "-"}</td>
                  <td className="px-4 py-3">{row.ruleKey || "-"}</td>
                  <td className="px-4 py-3">{row.message || "-"}</td>
                  <td className="px-4 py-3">{formatDateTime(row.createdAt)}</td>
                </>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
