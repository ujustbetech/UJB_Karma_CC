'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';

import {
  Users,
  TrendingUp,
  Phone,
  Mail
} from 'lucide-react';

export default function ReferralInsightsSection({ profile }) {
  const { formData } = profile;

  const connects = Array.isArray(formData?.connects)
    ? formData.connects
    : [];

  const passed = formData?.ReferralPassed || 0;
  const received = connects.length;

  const getInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card>
      {/* HEADER */}
      <Text variant="h3" className="flex items-center gap-2">
        <Users size={18} />
        Referral Insights
      </Text>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-4 mt-6">

        {/* PASSED */}
        <div className="p-4 rounded-xl bg-slate-50">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <Text variant="muted">Referrals Passed</Text>
          </div>

          <Text variant="h1" className="mt-2">
            {passed}
          </Text>
        </div>

        {/* RECEIVED */}
        <div className="p-4 rounded-xl bg-slate-50">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <Text variant="muted">Referrals Received</Text>
          </div>

          <Text variant="h1" className="mt-2">
            {received}
          </Text>
        </div>
      </div>

      {/* CONNECTION GRID */}
      {received > 0 && (
        <>
          <Text variant="h4" className="mt-6">
            Network Connections
          </Text>

          <div className="grid grid-cols-3 gap-4 mt-4">
            {connects.map((c, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-semibold">
                    {getInitial(c.name)}
                  </div>

                  <div>
                    <Text variant="h4">
                      {c.name || 'Unknown'}
                    </Text>
                    <Text variant="muted">
                      {c.ujbCode}
                    </Text>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{c.phone}</span>
                    </div>
                  )}

                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span>{c.email}</span>
                    </div>
                  )}
                </div>

                {c.ujbCode && (
                  <Button
                    variant="ghost"
                    className="mt-3 w-full"
                    onClick={() =>
                      window.open(`/admin/orbiters/${c.ujbCode}`, '_blank')
                    }
                  >
                    View Profile
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
