'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TagsInput from '@/components/ui/TagsInput';
import { GraduationCap } from 'lucide-react';

export default function EducationSection({ profile }) {
  const { formData, handleChange } = profile;

  const clean = (v) => (!v || v === '—' ? '' : v);

  const ensureArray = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v !== '—')
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  /* ---------------- DROPDOWNS ---------------- */

  const qualificationOptions = [
    { label: 'Select Qualification', value: '' },
    { label: 'PhD', value: 'PhD' },
    { label: 'Post Graduate', value: 'Post Graduate' },
    { label: 'Graduate', value: 'Graduate' },
    { label: 'Diploma', value: 'Diploma' },
    { label: '12th', value: '12th' },
    { label: '10th', value: '10th' },
    { label: 'Other', value: 'Other' },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { label: 'Select Passing Year', value: '' },
    ...Array.from({ length: currentYear - 1979 }, (_, i) => {
      const year = String(currentYear - i);
      return { label: year, value: year };
    }),
  ];

  return (
    <Card>
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <GraduationCap size={18} />
        <Text variant="h3">Education</Text>
      </div>

      <Text variant="muted">
        Academic background, certifications, and knowledge strengths
      </Text>

      <div className="grid grid-cols-2 gap-6 mt-5">
        {/* Highest Qualification */}
        <FormField label="Highest Qualification">
          <Select
            options={qualificationOptions}
            value={clean(formData?.HighestQualification)}
            onChange={(val) => handleChange('HighestQualification', val)}
          />
        </FormField>

        {/* Passing Year (Dropdown 1980–Current) */}
        <FormField label="Passing Year">
          <Select
            options={yearOptions}
            value={clean(formData?.PassingYear)}
            onChange={(val) => handleChange('PassingYear', val)}
          />
        </FormField>

        {/* Degree */}
        <FormField label="Degree">
          <Input
            value={clean(formData?.Degree)}
            onChange={(e) => handleChange('Degree', e.target.value)}
            placeholder="B.E, B.Com, MBA, etc."
          />
        </FormField>

        {/* College / Institute */}
        <FormField label="College / Institute">
          <Input
            value={clean(formData?.CollegeName)}
            onChange={(e) => handleChange('CollegeName', e.target.value)}
            placeholder="College or University name"
          />
        </FormField>

        {/* Specialization */}
        <FormField label="Specialization">
          <TagsInput
            value={ensureArray(formData?.Specialization)}
            onChange={(vals) => handleChange('Specialization', vals)}
            placeholder="Finance, Marketing, IT, Mechanical"
          />
        </FormField>

        {/* Certifications */}
        <FormField label="Certifications">
          <TagsInput
            value={ensureArray(formData?.Certifications)}
            onChange={(vals) => handleChange('Certifications', vals)}
            placeholder="PMP, Six Sigma, AWS, Digital Marketing"
          />
        </FormField>

        {/* Educational Background (Flexible Tags) */}
        <FormField label="Educational Background">
          <TagsInput
            value={ensureArray(formData?.EducationalBackground)}
            onChange={(vals) => handleChange('EducationalBackground', vals)}
            placeholder="MBA, Commerce Graduate, Self Taught"
          />
        </FormField>
        
        {/* Educational Background (Flexible Tags) */}
        <FormField label="Languages Known">
          <TagsInput
            value={ensureArray(formData?.LanguagesKnown)}
            onChange={(vals) => handleChange('LanguagesKnown', vals)}
            placeholder="Marathi, Hindi, English"
          />
        </FormField>

        {/* Mastery */}
        <FormField label="Mastery">
          <TagsInput
            value={ensureArray(formData?.Mastery)}
            onChange={(vals) => handleChange('Mastery', vals)}
            placeholder="Leadership, Strategy, Finance"
          />
        </FormField>

        {/* Exclusive Knowledge */}
        <FormField label="Exclusive Knowledge">
          <TagsInput
            value={ensureArray(formData?.ExclusiveKnowledge)}
            onChange={(vals) => handleChange('ExclusiveKnowledge', vals)}
            placeholder="Import/Export, Branding, Negotiation"
          />
        </FormField>
      </div>
    </Card>
  );
}
