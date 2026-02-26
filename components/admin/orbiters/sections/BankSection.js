'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Landmark } from 'lucide-react';

export default function BankSection({ profile }) {
  const { formData = {}, handleChange } = profile || {};
  const bank = formData?.bankDetails || {};

  const [errors, setErrors] = useState({});
  const [showAccount, setShowAccount] = useState(false);

  const updateBank = (field, value) => {
    handleChange('bankDetails', {
      ...bank,
      [field]: value,
    });

    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  /* ---------------- VALIDATIONS ---------------- */

  const validateIFSC = (value) => {
    if (!value) return '';
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(value)
      ? ''
      : 'Invalid IFSC format (e.g. HDFC0001234)';
  };

  const validateAccount = (value) => {
    if (!value) return '';
    return /^[0-9]{9,18}$/.test(value)
      ? ''
      : 'Account number must be 9–18 digits';
  };

  const handleIFSCChange = (value) => {
    const upper = value.toUpperCase();
    updateBank('ifscCode', upper);
    setErrors((prev) => ({ ...prev, ifscCode: validateIFSC(upper) }));
  };

  const handleAccountChange = (value) => {
    updateBank('accountNumber', value);
    setErrors((prev) => ({ ...prev, accountNumber: validateAccount(value) }));
  };

  /* ---------------- BANK PROOF ---------------- */

  const handleProofTypeChange = (value) => {
    updateBank('proofType', value);
    updateBank('proofFile', null);
    updateBank('proofPreview', '');
  };

  const handleProofUpload = (file) => {
    if (!file) return;

    updateBank('proofFile', file);
    updateBank('proofPreview', URL.createObjectURL(file));
  };

  const isPDF = (url) => url?.toLowerCase()?.includes('.pdf');

  return (
    <Card>
      <Text variant="h3" className="flex items-center gap-2">
        <Landmark size={18} /> Bank Details
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-4">

        <FormField label="Account Holder Name">
          <Input
            value={bank.accountHolderName || ''}
            onChange={(e) =>
              updateBank('accountHolderName', e.target.value)
            }
          />
        </FormField>

        <FormField label="Bank Name">
          <Input
            value={bank.bankName || ''}
            onChange={(e) =>
              updateBank('bankName', e.target.value)
            }
          />
        </FormField>

        <FormField label="Account Number" error={errors.accountNumber}>
          <div className="space-y-2">
            <Input
              type={showAccount ? 'text' : 'password'}
              value={bank.accountNumber || ''}
              onChange={(e) => handleAccountChange(e.target.value)}
            />

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAccount(!showAccount)}
            >
              {showAccount ? 'Hide' : 'Show'} Account Number
            </Button>
          </div>
        </FormField>

        <FormField label="IFSC Code" error={errors.ifscCode}>
          <Input
            value={bank.ifscCode || ''}
            onChange={(e) => handleIFSCChange(e.target.value)}
            placeholder="HDFC0001234"
          />
        </FormField>

        {/* -------- BANK PROOF TYPE -------- */}
        <FormField label="Bank Proof Type">
          <Select
            value={bank.proofType || ''}
            onChange={(value) => handleProofTypeChange(value)}
            options={[
              { value: '', label: 'Select Proof Type' },
              { value: 'cheque', label: 'Cancelled Cheque' },
              { value: 'passbook', label: 'Passbook' },
              { value: 'statement', label: 'Bank Statement' },
            ]}
          />
        </FormField>

        {/* -------- FILE UPLOAD -------- */}
        <FormField label="Upload Bank Proof">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleProofUpload(e.target.files[0])}
            />

            {bank.proofPreview && (
              isPDF(bank.proofPreview) ? (
                <a
                  href={bank.proofPreview}
                  target="_blank"
                  className="text-sm text-blue-600 underline"
                >
                  View Uploaded PDF
                </a>
              ) : (
                <img
                  src={bank.proofPreview}
                  className="w-32 rounded-lg border"
                />
              )
            )}
          </div>
        </FormField>

      </div>
    </Card>
  );
}
