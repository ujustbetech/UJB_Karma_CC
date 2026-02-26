'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';

import { Users, Phone, Mail, Share2 } from 'lucide-react';

export default function ReferralNetworkSection({ profile }) {
  const { formData } = profile;

  const connects = Array.isArray(formData?.connects)
    ? formData.connects
    : [];

  const referralPassed = formData?.ReferralPassed || 0;

  const getInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Text variant="h3" className="flex items-center gap-2">
          <Users size={18} />
          Referral Network
        </Text>

        <div className="flex items-center gap-6">
          <Text variant="muted">
            {connects.length} Connections
          </Text>

          <Text variant="muted" className="flex items-center gap-1">
            <Share2 size={14} />
            {referralPassed} Referrals Passed
          </Text>
        </div>
      </div>

      {/* EMPTY STATE */}
      {connects.length === 0 && (
        <div className="mt-6 text-center py-10">
          <Text variant="muted">
            No referral connections available
          </Text>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {connects.map((c, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
          >
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-semibold">
                {getInitial(c.name)}
              </div>

              <div>
                <Text variant="h4">{c.name || 'Unknown'}</Text>
                <Text variant="muted">{c.ujbCode}</Text>
              </div>
            </div>

            {/* Contact */}
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

            {/* ACTION */}
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
    </Card>
  );
}
