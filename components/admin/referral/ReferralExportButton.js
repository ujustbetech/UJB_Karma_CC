'use client';

import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { Download } from 'lucide-react';

export default function ReferralExportButton() {
  const toast = useToast();

  // Flatten object (handles Firestore Timestamp safely)
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const pre = prefix ? `${prefix}_` : '';
      const value = obj[key];

      if (
        value &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        !(value?.toDate)
      ) {
        Object.assign(acc, flattenObject(value, pre + key));
      } else {
        if (value?.toDate) {
          acc[pre + key] = value.toDate().toLocaleString();
        } else {
          acc[pre + key] = value !== undefined ? value : '';
        }
      }
      return acc;
    }, {});
  };

  const exportReferralData = async () => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.referral));

      if (snapshot.empty) {
        toast.info('No referral data found');
        return;
      }

      const allData = snapshot.docs.map((docSnap) =>
        flattenObject(docSnap.data())
      );

      const csvHeaders = Array.from(
        new Set(allData.flatMap((item) => Object.keys(item)))
      );

      const csvRows = allData.map((row) =>
        csvHeaders.map((field) => `"${row[field] || ''}"`).join(',')
      );

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\r\n');

      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });

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
