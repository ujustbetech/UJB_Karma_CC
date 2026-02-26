'use client';

import Card from '@/components/ui/Card';
import { User, Phone, Mail, Calendar } from 'lucide-react';

export default function OrbiterBasicCard({ profile }) {
  if (!profile) return null;

  const data = profile?.formData || profile;

  const Name = data?.Name;
  const UJBCode = data?.UJBCode || data?.ujbCode;
  const MobileNo = data?.MobileNo;
  const Email = data?.Email;

  const subscription = data?.subscription || {};
  const renewalDate = subscription?.nextRenewalDate;
  const status = subscription?.status;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
  };

  const daysLeft = renewalDate
    ? Math.ceil((new Date(renewalDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const renewalColor =
    daysLeft == null
      ? 'text-slate-500'
      : daysLeft < 0
      ? 'text-red-600'
      : daysLeft <= 15
      ? 'text-yellow-600'
      : 'text-green-600';

  const statusStyle =
    status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-slate-100 text-slate-600';

  const initial = Name?.charAt(0)?.toUpperCase();

  return (
    <Card className="p-4 relative overflow-hidden shadow-md border-l-4 border-brand-primary bg-gradient-to-br from-white to-brand-primary/5">

      {/* TOP STRIP */}
      <div className="flex items-center gap-3 mb-4">

        <div className="w-11 h-11 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center font-semibold text-lg">
          {initial || <User size={18} />}
        </div>

        <div className="min-w-0">
          <div className="font-semibold text-base leading-tight truncate">
            {Name || '—'}
          </div>

          <div className="text-xs text-slate-500 truncate">
            {UJBCode || '—'}
          </div>
        </div>

        {/* STATUS BADGE */}
        {status && (
          <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${statusStyle}`}>
            {status}
          </span>
        )}
      </div>

      {/* DETAILS */}
      <div className="space-y-3 text-sm">

        <div className="flex justify-between">
          <span className="text-slate-500">Mobile</span>
          <span className="flex items-center gap-1 font-medium">
            <Phone size={14} />
            {MobileNo || '—'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Email</span>
          <span className="flex items-center gap-1 truncate max-w-[130px]">
            <Mail size={14} />
            {Email || '—'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Renewal</span>
          <span className={`flex items-center gap-1 font-medium ${renewalColor}`}>
            <Calendar size={14} />
            {formatDate(renewalDate)}
          </span>
        </div>

        {daysLeft !== null && (
          <div className="text-right text-xs font-semibold">
            {daysLeft < 0
              ? 'Expired'
              : `${daysLeft} days left`}
          </div>
        )}
      </div>
    </Card>
  );
}
