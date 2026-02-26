'use client';

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import { BookOpen, Sparkles } from 'lucide-react';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';
import RichEditor from '@/components/ui/RichEditor';
import { useToast } from '@/components/ui/ToastProvider';

const TopicSection = forwardRef(({ eventID, data, fetchData }, ref) => {
  const toast = useToast();

  const [titleOfTheDay, setTitleOfTheDay] = useState('');
  const [description, setDescription] = useState('');
  const [topicHistory, setTopicHistory] = useState([]);

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});

  const firstErrorRef = useRef(null);

  /* ---------------- LOCAL TOPIC POOL (FREE AI FEEL) ---------------- */
  const topicPool = [
    "Building Trust in Business Relationships",
    "Turning Referrals into Revenue",
    "How to Attract High-Value Clients",
    "Personal Branding for Entrepreneurs",
    "Networking That Converts",
    "Leadership Habits for Success",
    "Scaling Small Business Smartly",
    "Client Retention Secrets",
    "Power of Consistent Follow-Ups",
    "Creating a Strong Business Identity",
    "Sales Psychology That Works",
    "Communication Skills for Leaders",
    "Time Management for Entrepreneurs",
    "From Contacts to Contracts",
    "Creating Value in Every Meeting",
    "Mastering Client Relationships",
    "The Art of Business Storytelling",
    "Confidence in Sales Conversations",
    "Positioning Yourself as an Expert",
    "Winning More Referrals Naturally",
    "How to Stand Out in Competitive Markets",
    "Strategic Thinking for Growth",
    "Developing a Success Mindset",
    "Smart Goal Setting for Entrepreneurs",
    "Building Long-Term Partnerships",
  ];

  /* ---------------- GENERATE TOPIC ---------------- */
  const generateTopic = () => {
    const available = topicPool.filter(t => t !== titleOfTheDay);
    const random = available[Math.floor(Math.random() * available.length)];
    setTitleOfTheDay(random);
    setDirty(true);
  };

  /* ---------------- LOAD EXISTING DATA ---------------- */
  useEffect(() => {
    if (!dirty) {
      setTitleOfTheDay(data?.titleOfTheDay || '');
      setDescription(data?.description || '');
    }
  }, [data]);

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    const loadHistory = async () => {
      const snap = await getDocs(
        collection(db, COLLECTIONS.monthlyMeeting)
      );

      const titles = snap.docs
        .map((d) => d.data().titleOfTheDay)
        .filter(Boolean);

      setTopicHistory([...new Set(titles)]);
    };

    loadHistory();
  }, []);

  /* ---------------- UNSAVED WARNING ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const clearError = (key) => {
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!titleOfTheDay.trim()) e.title = 'Required';
    if (!description.trim()) e.description = 'Required';
    setErrors(e);
    return e;
  };

  const focusFirstError = (errs) => {
    if (!Object.keys(errs).length) return;
    firstErrorRef.current?.focus();
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return;
    }

    try {
      setSaving(true);

      const eventRef = doc(db, COLLECTIONS.monthlyMeeting, eventID);
      await updateDoc(eventRef, {
        titleOfTheDay,
        description,
      });

      setDirty(false);
      fetchData?.();
      toast.success('Topic saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty: () => dirty,
  }));

  const suggestions = [
    "Scaling Your Business in 2026",
    "Mastering Client Communication",
    "Client Retention Strategies",
    "Building a High Performance Team",
    "Power of Referrals in Business",
  ];

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <Text as="h2">Topic of the Day</Text>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            type="button"
            className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
            onClick={() => {
              setTitleOfTheDay(s);
              setDirty(true);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Local Generator */}
      <Button
        variant="outline"
        type="button"
        onClick={generateTopic}
        className="flex items-center gap-2 w-fit"
      >
        <Sparkles className="w-4 h-4" />
        Generate Topic Idea
      </Button>

      {/* History Dropdown */}
      <select
        className="w-full border border-slate-200 rounded-md p-2"
        onChange={(e) => {
          setTitleOfTheDay(e.target.value);
          setDirty(true);
        }}
      >
        <option value="">Select from past topics</option>
        {topicHistory.map((t, i) => (
          <option key={i} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Title */}
      <FormField label="Title of the Day" required error={errors.title}>
        <div>
          <Input
            ref={firstErrorRef}
            value={titleOfTheDay}
            maxLength={120}
            onChange={(e) => {
              setTitleOfTheDay(e.target.value);
              setDirty(true);
              clearError('title');
            }}
            error={!!errors.title}
            placeholder="Enter topic title"
          />

          <div className="text-xs text-gray-500 mt-1 text-right">
            {titleOfTheDay.length}/120 characters
          </div>
        </div>
      </FormField>

      {/* Description */}
      <FormField label="Description" required error={errors.description}>
        <RichEditor
          value={description}
          onChange={(val) => {
            setDescription(val);
            setDirty(true);
            clearError('description');
          }}
        />
      </FormField>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Card>
  );
});

export default TopicSection;
