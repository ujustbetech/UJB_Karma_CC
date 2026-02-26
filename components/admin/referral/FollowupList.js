"use client";

import React, { useMemo } from "react";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import StatusBadge from "@/components/ui/StatusBadge";

import {
  AlertTriangle,
  Clock,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Trash2,
  ClipboardList
} from "lucide-react";

export default function FollowupList({ followups = [], onEdit, onDelete }) {
  const today = new Date().toISOString().slice(0, 10);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";

    try {
      const clean = dateStr.slice(0, 10);
      const d = new Date(clean);
      if (isNaN(d)) return "—";

      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const stats = useMemo(() => {
    let overdue = 0;
    let todayCount = 0;
    let upcoming = 0;
    let completed = 0;

    followups.forEach((f) => {
      const cleanDate = f.date?.slice(0, 10);

      if (f.status === "Completed") completed++;
      else if (cleanDate < today) overdue++;
      else if (cleanDate === today) todayCount++;
      else if (cleanDate > today) upcoming++;
    });

    return { overdue, todayCount, upcoming, completed };
  }, [followups, today]);

  const getIcon = (f) => {
    const cleanDate = f.date?.slice(0, 10);

    if (f.status === "Completed")
      return <CheckCircle2 size={16} className="text-green-600" />;

    if (cleanDate < today)
      return <AlertTriangle size={16} className="text-red-600" />;

    if (cleanDate === today)
      return <Clock size={16} className="text-blue-600" />;

    return <CalendarDays size={16} className="text-slate-500" />;
  };

  const getStatusType = (f) => {
    const cleanDate = f.date?.slice(0, 10);

    if (f.status === "Completed") return "success";
    if (cleanDate < today) return "danger";
    if (cleanDate === today) return "info";
    return "info";
  };

  return (
    <div className="space-y-4">

      {/* HEADER — same style as other cards */}
      <div className="flex items-center gap-2">
        <ClipboardList size={18} />
        <Text as="h3" variant="h3">
          Follow Up Timeline
        </Text>
      </div>

      {/* SUMMARY */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <Text variant="caption">{stats.overdue} Overdue</Text>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <Text variant="caption">{stats.todayCount} Today</Text>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-slate-600" />
            <Text variant="caption">{stats.upcoming} Upcoming</Text>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <Text variant="caption">{stats.completed} Completed</Text>
          </div>
        </div>
      </Card>

      {/* LIST */}
      {followups.length > 0 ? (
        followups.map((f, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getIcon(f)}

                  <StatusBadge status={getStatusType(f)}>
                    {f.status}
                  </StatusBadge>

                  <StatusBadge status="info">
                    {f.priority}
                  </StatusBadge>
                </div>

                <Text variant="caption">
                  Next Followup: {formatDate(f.date)}
                </Text>

                <Text>{f.description || "—"}</Text>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip label="Edit Followup">
                  <ActionButton
                    label="Edit"
                    icon={Pencil}
                    onClick={() => onEdit(i)}
                  />
                </Tooltip>

                <Tooltip label="Delete Followup">
                  <ActionButton
                    label="Delete"
                    icon={Trash2}
                    variant="ghostDanger"
                    onClick={() => onDelete(i)}
                  />
                </Tooltip>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <Text variant="muted">No follow-ups yet.</Text>
        </Card>
      )}
    </div>
  );
}
