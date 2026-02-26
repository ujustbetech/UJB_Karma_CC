'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import FilePreview from '@/components/ui/FilePreview';

import { BriefcaseBusiness } from 'lucide-react';

export default function BusinessKYCSection({ profile }) {
  const {
    formData,
    businessKYCPreview,
    handleBusinessKYCChange
  } = profile;

  const docs = [
    { key: 'gst', label: 'GST Certificate' },
    { key: 'shopAct', label: 'Shop Act / License' },
    { key: 'businessPan', label: 'Business PAN Card' },
    { key: 'cheque', label: 'Cancelled Cheque' },
    { key: 'addressProof', label: 'Business Address Proof' },
  ];

  return (
    <Card>
      {/* HEADER — MATCH BANK STYLE */}
      <div className="flex items-center gap-2">
        <BriefcaseBusiness size={18} />
        <Text variant="h3">Business KYC</Text>
      </div>

      <Text variant="muted">
        GST, Shop Act, PAN, Cheque, Address Proof
      </Text>

      <div className="grid grid-cols-2 gap-6 mt-5">
        {docs.map((doc) => {
          const existingFile = formData?.businessKYC?.[doc.key];
          const newPreview = businessKYCPreview?.[doc.key];

          return (
            <FormField key={doc.key} label={doc.label}>
              <div className="space-y-3">

                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    handleBusinessKYCChange(doc.key, e.target.files[0])
                  }
                />

                {/* PREVIEW CONTAINER */}
                {(existingFile?.url || newPreview) && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    
                    {/* NEW UPLOAD PREVIEW */}
                    {newPreview && !existingFile && (
                      <FilePreview
                        file={{
                          url: newPreview,
                          fileName: 'New Upload',
                          size: null,
                          path: ''
                        }}
                      />
                    )}

                    {/* SAVED FILE PREVIEW */}
                    {existingFile?.url && (
                      <FilePreview file={existingFile} />
                    )}

                  </div>
                )}

              </div>
            </FormField>
          );
        })}
      </div>
    </Card>
  );
}
