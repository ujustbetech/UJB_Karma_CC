'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { Download } from 'lucide-react';

export default function ReferralExportButton() {
  const toast = useToast();

  const flattenObject = (obj, prefix = '') =>
    Object.keys(obj || {}).reduce((acc, key) => {
      const pre = prefix ? `${prefix}_` : '';
      const value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value?.seconds && typeof value.seconds === 'number') {
          acc[pre + key] = new Date(value.seconds * 1000).toLocaleString();
        } else {
          Object.assign(acc, flattenObject(value, pre + key));
        }
      } else {
        acc[pre + key] = Array.isArray(value) ? JSON.stringify(value) : value ?? '';
      }
      return acc;
    }, {});

  const exportReferralData = async () => {
    try {
      const res = await fetch('/api/admin/referrals', { credentials: 'include' });
      const payload = await res.json().catch(() => ({}));
      const referrals = Array.isArray(payload.referrals) ? payload.referrals : [];

      if (!res.ok) throw new Error(payload.message || 'Export failed');
      if (!referrals.length) {
        toast.info('No referral data found');
        return;
      }

      const allData = referrals.map((r) => flattenObject(r));
      const csvHeaders = Array.from(new Set(allData.flatMap((item) => Object.keys(item))));
      const csvRows = allData.map((row) =>
        csvHeaders.map((field) => `"${String(row[field] || '').replace(/"/g, '""')}"`).join(',')
      );
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ReferralData.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Referral data exported');
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  return (
    <Button variant="outline" onClick={exportReferralData}>
      <Download className="w-4 h-4 mr-2" />
      Export
    </Button>
  );
}
