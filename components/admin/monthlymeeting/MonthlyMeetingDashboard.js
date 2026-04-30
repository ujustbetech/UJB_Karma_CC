'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, db } from '@/services/adminMonthlyMeetingFirebaseService';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

import {
  Users,
  Percent,
  Handshake,
  Briefcase,
  Activity,
  BarChart3,
} from 'lucide-react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function MonthlyMeetingDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const regListenersRef = useRef({});
  const meetingMapRef = useRef({});

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
            data?.referralSections?.filter((item) => item.status === 'Deal Won').length || 0;

          (data?.sections || []).forEach((section) => {
            addMember(memberStats, section.selectedParticipant1, 'interactions');
            addMember(memberStats, section.selectedParticipant2, 'interactions');
          });

          (data?.referralSections || []).forEach((section) => {
            addMember(memberStats, section.referralFrom, 'referrals');
          });

          (data?.knowledgeSections || []).forEach((section) => {
            addMember(memberStats, section.name, 'knowledge');
          });

          (data?.requirementSections || []).forEach((section) => {
            addMember(memberStats, section.reqfrom, 'requirements');
          });

          if (!regListenersRef.current[eventId]) {
            regListenersRef.current[eventId] = onSnapshot(
              collection(db, COLLECTIONS.monthlyMeeting, eventId, 'registeredUsers'),
              (regSnap) => {
                let present = 0;

                regSnap.forEach((item) => {
                  if (item.data()?.attendanceStatus) {
                    present++;
                  }
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
                  dealsWon,
                };

                setMeetings(Object.values(meetingMapRef.current));
              }
            );
          }
        });

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
      Object.values(regListenersRef.current).forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const totals = useMemo(() => {
    let reg = 0;
    let pre = 0;
    let ref = 0;
    let deals = 0;
    let inter = 0;

    meetings.forEach((meeting) => {
      reg += meeting.registered;
      pre += meeting.present;
      ref += meeting.referrals;
      deals += meeting.dealsWon;
      inter += meeting.interactions;
    });

    return {
      registered: reg,
      present: pre,
      attendance: reg ? Math.round((pre / reg) * 100) : 0,
      referrals: ref,
      dealsWon: deals,
      engagement: inter,
    };
  }, [meetings]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={22} />
        <Text variant="h1">Enterprise Analytics</Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPI title="Attendance %" value={`${totals.attendance}%`} icon={Percent} color="green" />
        <KPI title="Referrals" value={totals.referrals} icon={Handshake} color="blue" />
        <KPI title="Deals Won" value={totals.dealsWon} icon={Briefcase} color="purple" />
        <KPI title="Member Growth" value={totals.registered} icon={Users} color="orange" />
        <KPI title="Engagement" value={totals.engagement} icon={Activity} color="pink" />
      </div>

      <Card className="p-6">
        <Text variant="h3" className="mb-4">
          Attendance Trend
        </Text>

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

      <Card className="p-6">
        <Text variant="h3" className="mb-4">
          Top Orbiters
        </Text>

        <div className="space-y-3">
          {(leaderboard || []).slice(0, 5).map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div>
                  <Text className="font-semibold">{member.name}</Text>
                  <Text variant="muted" className="text-xs">
                    {member.interactions} 1:1 • {member.referrals} referrals
                  </Text>
                </div>
              </div>

              <div className="text-right">
                <Text className="text-lg font-bold">{member.score}</Text>
                <Text variant="muted" className="text-xs">
                  Score
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function KPI({ title, value, icon: Icon, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    pink: 'bg-pink-50 text-pink-700',
  };

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={`rounded-xl p-3 ${colors[color]}`}>
        <Icon size={22} />
      </div>

      <div>
        <Text variant="h2">{value}</Text>
        <Text variant="muted">{title}</Text>
      </div>
    </Card>
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

  statsMap[name][field]++;
}
