"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, db } from "@/services/adminMonthlyMeetingFirebaseService";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";

import {
  Users,
  Percent,
  Handshake,
  Briefcase,
  Activity,
  BarChart3,
  CalendarClock,
  Sparkles,
  UserCheck,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMeetingDateLabel(meetingDoc) {
  const dateValue =
    toDate(meetingDoc?.time) ||
    toDate(meetingDoc?.date) ||
    toDate(meetingDoc?.meetingDate) ||
    toDate(meetingDoc?.AdminCreatedby);
  if (!dateValue) return "No date";
  return dateValue.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMonthKey(meetingDoc) {
  const dateValue =
    toDate(meetingDoc?.time) ||
    toDate(meetingDoc?.date) ||
    toDate(meetingDoc?.meetingDate) ||
    toDate(meetingDoc?.AdminCreatedby);
  if (!dateValue) return "Unknown";
  return dateValue.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default function MonthlyMeetingDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const regListenersRef = useRef({});
  const meetingMapRef = useRef({});

  useEffect(() => {
    const unsubMeetings = onSnapshot(
      collection(db, COLLECTIONS.monthlyMeeting),
      (snapshot) => {
        const memberStats = {};
        const liveMeetingIds = new Set(snapshot.docs.map((item) => item.id));

        Object.entries(regListenersRef.current).forEach(([eventId, unsub]) => {
          if (!liveMeetingIds.has(eventId)) {
            unsub?.();
            delete regListenersRef.current[eventId];
            delete meetingMapRef.current[eventId];
          }
        });

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const eventId = docSnap.id;

          const interactions = Array.isArray(data.sections) ? data.sections.length : 0;
          const referrals = Array.isArray(data.referralSections) ? data.referralSections.length : 0;
          const dealsWon = (data?.referralSections || []).filter(
            (item) => String(item?.status || "").toLowerCase() === "deal won"
          ).length;
          const knowledgeShares = Array.isArray(data.knowledgeSections)
            ? data.knowledgeSections.length
            : 0;
          const requirements = Array.isArray(data.requirementSections)
            ? data.requirementSections.length
            : 0;

          (data?.sections || []).forEach((section) => {
            addMember(memberStats, section.selectedParticipant1, "interactions");
            addMember(memberStats, section.selectedParticipant2, "interactions");
          });

          (data?.referralSections || []).forEach((section) => {
            addMember(memberStats, section.referralFrom, "referrals");
          });

          (data?.knowledgeSections || []).forEach((section) => {
            addMember(memberStats, section.name, "knowledge");
          });

          (data?.requirementSections || []).forEach((section) => {
            addMember(memberStats, section.reqfrom, "requirements");
          });

          const baseRow = {
            id: eventId,
            name: data?.Eventname || "Meeting",
            dateLabel: getMeetingDateLabel(data),
            monthKey: getMonthKey(data),
            registered: 0,
            present: 0,
            attendancePercent: 0,
            interactions,
            referrals,
            dealsWon,
            knowledgeShares,
            requirements,
          };

          meetingMapRef.current[eventId] = {
            ...(meetingMapRef.current[eventId] || {}),
            ...baseRow,
          };

          if (!regListenersRef.current[eventId]) {
            regListenersRef.current[eventId] = onSnapshot(
              collection(db, COLLECTIONS.monthlyMeeting, eventId, "registeredUsers"),
              (regSnap) => {
                let present = 0;
                regSnap.forEach((item) => {
                  if (item.data()?.attendanceStatus) present++;
                });

                const registered = regSnap.size;
                const attendancePercent = registered
                  ? Math.round((present / registered) * 100)
                  : 0;

                meetingMapRef.current[eventId] = {
                  ...meetingMapRef.current[eventId],
                  registered,
                  present,
                  attendancePercent,
                };

                setMeetings(Object.values(meetingMapRef.current));
                setLoading(false);
              }
            );
          }
        });

        setMeetings(Object.values(meetingMapRef.current));
        setLoading(false);

        const nextLeaderboard = Object.entries(memberStats)
          .map(([name, stats]) => ({
            name,
            ...stats,
            score:
              stats.interactions * 3 +
              stats.referrals * 5 +
              stats.knowledge * 4 +
              stats.requirements * 2,
          }))
          .sort((left, right) => right.score - left.score);

        setLeaderboard(nextLeaderboard);
      }
    );

    return () => {
      unsubMeetings();
      Object.values(regListenersRef.current).forEach((unsubscribe) => unsubscribe?.());
    };
  }, []);

  const totals = useMemo(() => {
    let reg = 0;
    let pre = 0;
    let ref = 0;
    let deals = 0;
    let inter = 0;
    let knowledge = 0;
    let req = 0;

    meetings.forEach((meeting) => {
      reg += Number(meeting.registered || 0);
      pre += Number(meeting.present || 0);
      ref += Number(meeting.referrals || 0);
      deals += Number(meeting.dealsWon || 0);
      inter += Number(meeting.interactions || 0);
      knowledge += Number(meeting.knowledgeShares || 0);
      req += Number(meeting.requirements || 0);
    });

    return {
      meetings: meetings.length,
      registered: reg,
      present: pre,
      attendance: reg ? Math.round((pre / reg) * 100) : 0,
      referrals: ref,
      dealsWon: deals,
      engagement: inter,
      knowledge,
      requirements: req,
    };
  }, [meetings]);

  const attendanceTrend = useMemo(() => {
    return [...meetings]
      .sort((a, b) => String(a.dateLabel).localeCompare(String(b.dateLabel)))
      .map((item) => ({
        name: item.name,
        date: item.dateLabel,
        attendancePercent: item.attendancePercent || 0,
      }));
  }, [meetings]);

  const monthlyPerformance = useMemo(() => {
    const map = {};
    meetings.forEach((item) => {
      const key = item.monthKey || "Unknown";
      if (!map[key]) {
        map[key] = {
          month: key,
          registrations: 0,
          referrals: 0,
          dealsWon: 0,
        };
      }
      map[key].registrations += Number(item.registered || 0);
      map[key].referrals += Number(item.referrals || 0);
      map[key].dealsWon += Number(item.dealsWon || 0);
    });
    return Object.values(map);
  }, [meetings]);

  const topMeetings = useMemo(() => {
    return [...meetings]
      .sort((a, b) => (b.attendancePercent || 0) - (a.attendancePercent || 0))
      .slice(0, 6);
  }, [meetings]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-7 w-72 rounded bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={22} />
        <Text variant="h1">Monthly Meeting Intelligence Dashboard</Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI title="Total Meetings" value={totals.meetings} icon={CalendarClock} color="slate" />
        <KPI title="Attendance %" value={`${totals.attendance}%`} icon={Percent} color="green" />
        <KPI title="Registered Users" value={totals.registered} icon={Users} color="blue" />
        <KPI title="Present Users" value={totals.present} icon={UserCheck} color="emerald" />
        <KPI title="Referrals" value={totals.referrals} icon={Handshake} color="orange" />
        <KPI title="Deals Won" value={totals.dealsWon} icon={Briefcase} color="purple" />
        <KPI title="1:1 Interactions" value={totals.engagement} icon={Activity} color="pink" />
        <KPI title="Knowledge Shares" value={totals.knowledge} icon={Sparkles} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Meeting Attendance Trend
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="attendancePercent" stroke="#0f766e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Monthly Performance
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="registrations" fill="#2563eb" />
              <Bar dataKey="referrals" fill="#f59e0b" />
              <Bar dataKey="dealsWon" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Top Orbiters by Contribution
          </Text>
          <div className="space-y-3">
            {(leaderboard || []).slice(0, 8).map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="grid min-h-[86px] grid-cols-[56px_1fr_88px] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <Text className="truncate font-semibold leading-5 text-slate-900">
                    {member.name}
                  </Text>
                  <Text variant="muted" className="mt-1 text-xs leading-5 text-slate-600">
                    {member.interactions} 1:1 | {member.referrals} referrals | {member.knowledge} shares
                  </Text>
                </div>
                <div className="text-right">
                  <Text className="text-xl font-bold leading-none text-slate-900">
                    {member.score}
                  </Text>
                  <Text variant="muted" className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                    Score
                  </Text>
                </div>
              </div>
            ))}
            {!leaderboard.length ? <Text variant="muted">No member contribution data yet.</Text> : null}
          </div>
        </Card>

        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Meeting Health Snapshot
          </Text>
          <div className="space-y-3">
            {topMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-xl border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <Text className="font-semibold">{meeting.name}</Text>
                  <Text className="text-sm font-semibold text-slate-700">
                    {meeting.attendancePercent}% attendance
                  </Text>
                </div>
                <Text variant="muted" className="mt-1 text-xs">
                  {meeting.dateLabel}
                </Text>
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                  <StatChip label="Reg" value={meeting.registered} />
                  <StatChip label="Present" value={meeting.present} />
                  <StatChip label="Referrals" value={meeting.referrals} />
                  <StatChip label="Deals" value={meeting.dealsWon} />
                </div>
              </div>
            ))}
            {!topMeetings.length ? <Text variant="muted">No meetings found.</Text> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({ title, value, icon: Icon, color }) {
  const colors = {
    slate: "bg-slate-50 text-slate-700",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-violet-50 text-violet-700",
    pink: "bg-pink-50 text-pink-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <Card className="h-full min-h-[104px] p-5">
      <div className="flex h-full items-center gap-4">
        <div className={`rounded-xl p-3 ${colors[color] || colors.slate}`}>
        <Icon size={22} />
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

function StatChip({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function addMember(statsMap, name, field) {
  if (!name) return;
  if (!statsMap[name]) {
    statsMap[name] = {
      interactions: 0,
      referrals: 0,
      knowledge: 0,
      requirements: 0,
    };
  }
  statsMap[name][field] += 1;
}
