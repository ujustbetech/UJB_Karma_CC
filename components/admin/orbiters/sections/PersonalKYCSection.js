'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import { ShieldCheck } from 'lucide-react';

export default function PersonalKYCSection({ profile }) {
  const safeProfile = profile || {};
  const {
    formData = {},
    setFormData = () => {},
    personalKYCPreview = {},
    handlePersonalKYCChange = () => {}
  } = safeProfile;

  const [errors, setErrors] = useState({});

  const clean = (v) => (!v || v === '—' ? '' : v);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });

    // clear error on typing
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /* ---------------- PAN VALIDATION ---------------- */

  const validatePAN = (value) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!value) return '';

    if (!panRegex.test(value)) {
      return 'Invalid PAN format (ABCDE1234F)';
    }

    return '';
  };

  /* ---------------- AADHAAR VALIDATION ---------------- */

  const validateAadhaar = (value) => {
    if (!value) return '';

    if (!/^[0-9]+$/.test(value)) {
      return 'Aadhaar must be numbers only';
    }

    if (value.length !== 12) {
      return 'Aadhaar must be 12 digits';
    }

    return '';
  };

  const handlePANChange = (value) => {
    const upper = value.toUpperCase();
    handleChange('panNumber', upper);

    const error = validatePAN(upper);
    setErrors((prev) => ({ ...prev, panNumber: error }));
  };

  const handleAadhaarChange = (value) => {
    handleChange('aadhaarNumber', value);

    const error = validateAadhaar(value);
    setErrors((prev) => ({ ...prev, aadhaarNumber: error }));
  };

  const isPDF = (url) => url?.toLowerCase().includes('.pdf');

  return (
    <Card>
      <Text variant="h3" className="flex items-center gap-2">
        <ShieldCheck size={18} /> Personal KYC
      </Text>

      <div className="grid grid-cols-2 gap-6 mt-5">

        {/* PAN NUMBER */}
        <FormField label="PAN Number" error={errors.panNumber}>
          <Input
            value={clean(formData.panNumber || formData.IDNumber)}
            onChange={(e) => handlePANChange(e.target.value)}
            placeholder="ABCDE1234F"
          />
        </FormField>

        {/* PAN UPLOAD */}
        <FormField label="Upload PAN Card">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handlePersonalKYCChange('panCard', e.target.files[0])
              }
            />

            {personalKYCPreview?.panCard && (
              isPDF(personalKYCPreview.panCard) ? (
                <a
                  href={personalKYCPreview.panCard}
                  target="_blank"
                  className="text-blue-600 text-sm underline"
                >
                  View PAN PDF
                </a>
              ) : (
                <img
                  src={personalKYCPreview.panCard}
                  className="w-28 rounded-lg"
                />
              )
            )}
          </div>
        </FormField>

        {/* AADHAAR NUMBER */}
        <FormField label="Aadhaar Number" error={errors.aadhaarNumber}>
          <Input
            value={clean(formData.aadhaarNumber)}
            onChange={(e) => handleAadhaarChange(e.target.value)}
            placeholder="12 digit number"
            maxLength={12}
          />
        </FormField>

        {/* AADHAAR FRONT */}
        <FormField label="Upload Aadhaar Front">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handlePersonalKYCChange('aadhaarFront', e.target.files[0])
              }
            />

            {personalKYCPreview?.aadhaarFront && (
              <img
                src={personalKYCPreview.aadhaarFront}
                className="w-28 rounded-lg"
              />
            )}
          </div>
        </FormField>

        {/* AADHAAR BACK */}
        <FormField label="Upload Aadhaar Back">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handlePersonalKYCChange('aadhaarBack', e.target.files[0])
              }
            />

            {personalKYCPreview?.aadhaarBack && (
              <img
                src={personalKYCPreview.aadhaarBack}
                className="w-28 rounded-lg"
              />
            )}
          </div>
        </FormField>

        {/* ADDRESS PROOF */}
        <FormField label="Address Proof">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                handlePersonalKYCChange('addressProof', e.target.files[0])
              }
            />

            {personalKYCPreview?.addressProof && (
              <img
                src={personalKYCPreview.addressProof}
                className="w-28 rounded-lg"
              />
            )}
          </div>
        </FormField>

      </div>
    </Card>
  );
}
