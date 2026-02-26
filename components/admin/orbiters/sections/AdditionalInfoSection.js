'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import TagsInput from '@/components/ui/TagsInput';

import {
  Brain,
  Sparkles,
  Trophy,
  Users,
  FileText,
  Image as ImageIcon,
  Award
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AdditionalInfoSection({ profile }) {
  const {
    formData,
    setFormData,
    // 🔥 ADD THESE
    achievementPreviews = [],
    handleAchievementFilesChange,
    removeAchievementFile,
  } = profile;

  const update = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const normalizeTags = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string')
      return v.split(',').map(t => t.trim()).filter(Boolean);
    return [];
  };

  const clean = (v) => (!v || v === '—' ? '' : v);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <Card>
      <Text variant="h3">Additional Information</Text>

      {/* ================= VISION ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-6">
        <Brain size={18} />
        Vision & Mindset
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <FormField label="Aspirations">
          <Input
            value={clean(formData?.Aspirations)}
            onChange={(e) => update('Aspirations', e.target.value)}
          />
        </FormField>

        <FormField label="Immediate Desire">
          <Input
            value={clean(formData?.ImmediateDesire)}
            onChange={(e) => update('ImmediateDesire', e.target.value)}
          />
        </FormField>

        <FormField label="Mastery">
          <TagsInput
            value={normalizeTags(formData?.Mastery)}
            onChange={(v) => update('Mastery', v)}
          />
        </FormField>

        <FormField label="Exclusive Knowledge">
          <TagsInput
            value={normalizeTags(formData?.ExclusiveKnowledge)}
            onChange={(v) => update('ExclusiveKnowledge', v)}
          />
        </FormField>
      </div>

      {/* ================= ACHIEVEMENTS ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-8">
        <Award size={18} /> Noteworthy Achievements
      </Text>

      <div className="mt-3">
        {/* Upload Box */}
        <FormField label="Upload Certificates / Awards">
          <div >
            <Input
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={(e) => handleAchievementFilesChange(e.target.files)}
            />
            <div className="text-xs text-slate-500 mt-2">
              Upload images or PDFs • Multiple files supported
            </div>
          </div>
        </FormField>

        {/* Preview Grid */}
        <div className="grid grid-cols-2 gap-4 mt-5">
          {achievementPreviews.map((file, index) => (
            <div
              key={index}
              className="bg-slate-50 hover:bg-slate-100 rounded-xl p-3 flex items-center gap-3 transition"
            >
              {/* Preview */}
              <div className="w-14 h-14 flex items-center justify-center bg-slate-100 rounded">
                {file.preview === "PDF" ? (
                  <FileText size={28} className="text-red-600" />
                ) : (
                  <img
                    src={file.preview}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {file.fileName}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => window.open(file.url, "_blank")}
                  >
                    View
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeAchievementFile(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ================= PERSONAL BACKGROUND ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-8">
        <Users size={18} />
        Personal Background
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <FormField label="Family History Summary">
          <Input
            value={clean(formData?.FamilyHistorySummary)}
            onChange={(e) =>
              update('FamilyHistorySummary', e.target.value)
            }
          />
        </FormField>

        <FormField label="Hobbies">
          <TagsInput
            value={normalizeTags(formData?.Hobbies)}
            onChange={(v) => update('Hobbies', v)}
          />
        </FormField>
      </div>

      {/* ================= PERSONALITY ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-8">
        <Sparkles size={18} />
        Personality Layer
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <FormField label="Interest Areas">
          <TagsInput
            value={normalizeTags(formData?.InterestArea)}
            onChange={(v) => update('InterestArea', v)}
          />
        </FormField>

        <FormField label="Skills">
          <TagsInput
            value={normalizeTags(formData?.Skills)}
            onChange={(v) => update('Skills', v)}
          />
        </FormField>
      </div>
    </Card>
  );
}
