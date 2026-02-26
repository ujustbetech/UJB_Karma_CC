'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

import {
  Users,
  Percent,
  Handshake,
  Briefcase,
  Activity,
  BarChart3
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

export default function MonthlyMeetingDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const regListenersRef = useRef({});
  const meetingMapRef = useRef({});

  /* ================= REALTIME FIRESTORE ================= */

  useEffect(() => {
    const unsubMeetings = onSnapshot(
      collection(db, COLLECTIONS.monthlyMeeting),
      (snapshot) => {

        const memberStats = {};

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const eventId = docSnap.id;

          const interactions = data?.sections?.length || 0;
          const referrals = data?.referralSections?.length || 0;

          const dealsWon =
            data?.referralSections?.filter(r => r.status === 'Deal Won').length || 0;

          /* ===== BUILD MEMBER STATS ===== */

          (data?.sections || []).forEach(s => {
            addMember(memberStats, s.selectedParticipant1, 'interactions');
            addMember(memberStats, s.selectedParticipant2, 'interactions');
          });

          (data?.referralSections || []).forEach(r => {
            addMember(memberStats, r.referralFrom, 'referrals');
          });

          (data?.knowledgeSections || []).forEach(k => {
            addMember(memberStats, k.name, 'knowledge');
          });

          (data?.requirementSections || []).forEach(r => {
            addMember(memberStats, r.reqfrom, 'requirements');
          });

          /* ===== REGISTERED USERS LISTENER ===== */

          if (!regListenersRef.current[eventId]) {
            regListenersRef.current[eventId] = onSnapshot(
              collection(db, COLLECTIONS.monthlyMeeting, eventId, 'registeredUsers'),
              (regSnap) => {

                let present = 0;

                regSnap.forEach(d => {
                  if (d.data()?.attendanceStatus) present++;
                });

                const registered = regSnap.size;
                const attendancePercent = registered
                  ? Math.round((present / registered) * 100)
                  : 0;

                meetingMapRef.current[eventId] = {
                  id: eventId,
                  name: data?.Eventname || 'Meeting',
                  registered,
                  present,
                  attendancePercent,
                  interactions,
                  referrals,
                  dealsWon
                };

                setMeetings(Object.values(meetingMapRef.current));
              }
            );
          }
        });

        /* ===== CREATE LEADERBOARD ===== */

        const lb = Object.entries(memberStats).map(([name, stats]) => {
          const score =
            stats.interactions * 3 +
            stats.referrals * 5 +
            stats.knowledge * 4 +
            stats.requirements * 2;

          return { name, ...stats, score };
        });

        lb.sort((a, b) => b.score - a.score);
        setLeaderboard(lb);
      }
    );

    return () => {
      unsubMeetings();
      Object.values(regListenersRef.current).forEach(unsub => unsub());
    };
  }, []);

  /* ================= KPI TOTALS ================= */

  const totals = useMemo(() => {
    let reg = 0, pre = 0, ref = 0, deals = 0, inter = 0;

    meetings.forEach(m => {
      reg += m.registered;
      pre += m.present;
      ref += m.referrals;
      deals += m.dealsWon;
      inter += m.interactions;
    });

    return {
      registered: reg,
      present: pre,
      attendance: reg ? Math.round((pre / reg) * 100) : 0,
      referrals: ref,
      dealsWon: deals,
      engagement: inter
    };
  }, [meetings]);

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-2">
        <BarChart3 size={22} />
        <Text variant="h1">Enterprise Analytics</Text>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-5 gap-4">

        <KPI title="Attendance %" value={`${totals.attendance}%`} icon={Percent} color="green" />
        <KPI title="Referrals" value={totals.referrals} icon={Handshake} color="blue" />
        <KPI title="Deals Won" value={totals.dealsWon} icon={Briefcase} color="purple" />
        <KPI title="Member Growth" value={totals.registered} icon={Users} color="orange" />
        <KPI title="Engagement" value={totals.engagement} icon={Activity} color="pink" />

      </div>

      {/* ATTENDANCE TREND */}
      <Card className="p-6">
        <Text variant="h3" className="mb-4">Attendance Trend</Text>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={meetings}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line dataKey="attendancePercent" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* TOP ACTIVE MEMBERS */}
      <Card className="p-6">
        <Text variant="h3" className="mb-4">🏆 Top Active Members</Text>

        <div className="space-y-3">
          {(leaderboard || []).slice(0, 5).map((m, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                <div>
                  <Text className="font-semibold">{m.name}</Text>
                  <Text variant="muted" className="text-xs">
                    {m.interactions} 121 • {m.referrals} referrals
                  </Text>
                </div>
              </div>

              <div className="text-right">
                <Text className="font-bold text-lg">{m.score}</Text>
                <Text variant="muted" className="text-xs">Score</Text>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

/* ================= KPI COMPONENT ================= */

function KPI({ title, value, icon: Icon, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    pink: 'bg-pink-50 text-pink-700'
  };

  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} />
      </div>

      <div>
        <Text variant="h2">{value}</Text>
        <Text variant="muted">{title}</Text>
      </div>
    </Card>
  );
}

/* ================= HELPER ================= */

function addMember(obj, name, field) {
  if (!name) return;

  if (!obj[name]) {
    obj[name] = {
      interactions: 0,
      referrals: 0,
      knowledge: 0,
      requirements: 0
    };
  }

  obj[name][field]++;
}
