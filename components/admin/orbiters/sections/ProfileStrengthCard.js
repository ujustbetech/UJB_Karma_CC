'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { AlertTriangle } from 'lucide-react';

export default function ProfileStrengthCard({ profile }) {
  const { formData } = profile;

  const clean = (v) => v && v !== '—';

  const has = (field) => clean(formData?.[field]);

  let score = 0;
  const missing = [];

  /* -------- CORE -------- */
  if (has('Name')) score += 4; else missing.push('Name');
  if (has('MobileNo')) score += 4; else missing.push('Mobile');
  if (has('Email')) score += 4; else missing.push('Email');
  if (has('Category')) score += 4; else missing.push('Category');
  if (has('ProfilePhotoURL')) score += 4; else missing.push('Profile Photo');

  /* -------- PERSONAL -------- */
  if (formData?.LanguagesKnown?.length) score += 5;
  else missing.push('Languages');

  if (has('MaritalStatus')) score += 3;
  else missing.push('Marital Status');

  if (has('City') && has('State')) score += 4;
  else missing.push('Location');

  if (has('residentStatus')) score += 3;
  else missing.push('Resident Status');

  /* -------- KYC -------- */
  if (has('IDNumber')) score += 5;
  else missing.push('PAN/Aadhaar');

  if (formData?.personalKYC &&
      Object.values(formData.personalKYC).some(v => v))
    score += 10;
  else missing.push('KYC Document');

  /* -------- BANK -------- */
  if (formData?.bankDetails?.accountHolderName) score += 4;
  else missing.push('Bank Holder Name');

  if (formData?.bankDetails?.accountNumber) score += 4;
  else missing.push('Account Number');

  if (formData?.bankDetails?.ifscCode) score += 4;
  else missing.push('IFSC');

  if (formData?.bankDetails?.proofUrl) score += 3;
  else missing.push('Bank Proof');

  /* -------- BUSINESS -------- */
  if (has('BusinessName')) score += 4;
  else missing.push('Business Name');

  if (has('BusinessStage')) score += 3;
  else missing.push('Business Stage');

  if (has('Website')) score += 3;
  else missing.push('Website');

  /* -------- SERVICES / PRODUCTS -------- */
  if (formData?.services?.length || formData?.products?.length)
    score += 5;
  else missing.push('Services / Products');

  /* -------- NETWORK -------- */
  if (formData?.closeConnections?.length >= 3)
    score += 5;
  else missing.push('Close Connections');

  const percent = Math.min(score, 100);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Text variant="h3">Profile Strength</Text>
        <Text variant="h2">{percent}%</Text>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mt-4">
        <div
          className="bg-emerald-500 h-3 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Missing Items */}
      {missing.length > 0 && (
        <div className="mt-5">
          <Text variant="h4" className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Improve Profile
          </Text>

          <ul className="mt-2 space-y-1">
            {missing.slice(0, 6).map((m, i) => (
              <li key={i}>
                <Text variant="muted">• {m}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
