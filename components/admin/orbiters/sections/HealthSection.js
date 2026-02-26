'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Select from '@/components/ui/Select';
import TagsInput from '@/components/ui/TagsInput';
import { HeartPulse } from 'lucide-react';

export default function HealthSection({ profile }) {
  const { formData, handleChange } = profile;

  const clean = (v) => (!v || v === '—' ? '' : v);

  const ensureArray = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v !== '—')
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  /* ---------------- DROPDOWN OPTIONS ---------------- */

  const conditionOptions = [
    { label: 'Select Condition', value: '' },
    { label: 'Healthy', value: 'Healthy' },
    { label: 'Minor Issues', value: 'Minor Issues' },
    { label: 'Chronic Condition', value: 'Chronic Condition' },
    { label: 'Under Treatment', value: 'Under Treatment' },
  ];

  const bloodGroupOptions = [
    { label: 'Select Blood Group', value: '' },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  const fitnessOptions = [
    { label: 'Select Fitness Level', value: '' },
    { label: 'Very Active', value: 'Very Active' },
    { label: 'Active', value: 'Active' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'Sedentary', value: 'Sedentary' },
  ];

  const smokerOptions = [
    { label: 'Smoking Habit', value: '' },
    { label: 'Non-Smoker', value: 'Non-Smoker' },
    { label: 'Occasional Smoker', value: 'Occasional Smoker' },
    { label: 'Regular Smoker', value: 'Regular Smoker' },
  ];

  const alcoholOptions = [
    { label: 'Alcohol Consumption', value: '' },
    { label: 'Non-Drinker', value: 'Non-Drinker' },
    { label: 'Occasional', value: 'Occasional' },
    { label: 'Regular', value: 'Regular' },
  ];

  return (
    <Card>
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <HeartPulse size={18} />
        <Text variant="h3">Health</Text>
      </div>

      <Text variant="muted">
        Medical condition, lifestyle indicators, and family health background
      </Text>

      <div className="grid grid-cols-2 gap-6 mt-5">
        {/* Current Condition */}
        <FormField label="Current Health Condition">
          <Select
            options={conditionOptions}
            value={clean(formData?.CurrentHealthCondition)}
            onChange={(val) => handleChange('CurrentHealthCondition', val)}
          />
        </FormField>

        {/* Blood Group */}
        <FormField label="Blood Group">
          <Select
            options={bloodGroupOptions}
            value={clean(formData?.BloodGroup)}
            onChange={(val) => handleChange('BloodGroup', val)}
          />
        </FormField>

        {/* Fitness Level */}
        <FormField label="Fitness Level">
          <Select
            options={fitnessOptions}
            value={clean(formData?.FitnessLevel)}
            onChange={(val) => handleChange('FitnessLevel', val)}
          />
        </FormField>

        {/* Smoking */}
        <FormField label="Smoking Habit">
          <Select
            options={smokerOptions}
            value={clean(formData?.SmokingHabit)}
            onChange={(val) => handleChange('SmokingHabit', val)}
          />
        </FormField>

        {/* Alcohol */}
        <FormField label="Alcohol Consumption">
          <Select
            options={alcoholOptions}
            value={clean(formData?.AlcoholConsumption)}
            onChange={(val) => handleChange('AlcoholConsumption', val)}
          />
        </FormField>

        {/* Health Parameters (TagsInput) */}
        <FormField label="Health Parameters">
          <TagsInput
            value={ensureArray(formData?.HealthParameters)}
            onChange={(vals) => handleChange('HealthParameters', vals)}
            placeholder="BP, Diabetes, Thyroid, Cholesterol, Asthma"
          />
        </FormField>

        {/* Lifestyle Notes (TagsInput) */}
        <FormField label="Lifestyle Notes">
          <TagsInput
            value={ensureArray(formData?.HealthNotes)}
            onChange={(vals) => handleChange('HealthNotes', vals)}
            placeholder="Gym, Yoga, Running, Trekking, Sports"
          />
        </FormField>

        {/* Family History */}
        <FormField label="Family Health History">
          <TagsInput
            value={ensureArray(formData?.FamilyHistorySummary)}
            onChange={(vals) =>
              handleChange('FamilyHistorySummary', vals)
            }
            placeholder="Diabetes, Heart, BP"
          />
        </FormField>
      </div>
    </Card>
  );
}
