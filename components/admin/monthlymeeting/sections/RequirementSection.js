'use client';

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle
} from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import ActionButton from '@/components/ui/ActionButton';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';
import ConfirmModal from '@/components/ui/ConfirmModal';

import FormField from '@/components/ui/FormField';
import RichEditor from '@/components/ui/RichEditor';

import { useToast } from '@/components/ui/ToastProvider';
import { Trash2, ClipboardList } from 'lucide-react';

const RequirementSection = forwardRef(function RequirementSection(
  { eventId, data, fetchData },
  ref
) {
  const toast = useToast();

  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredMap, setFilteredMap] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState(null);

  const firstErrorRef = useRef(null);
  const total = sections.length;
  const withDesc = sections.filter(s => s.reqDescription?.trim()).length;
  const pending = total - withDesc;


  const PROSPECT_STAGES = [
    'New',
    'Connected',
    'Referral Passed',
    'Not Fulfilled'
  ];

  const STAGE_COLORS = {
    'New': 'bg-gray-100 text-gray-700',
    'Connected': 'bg-blue-100 text-blue-700',
    'Referral Passed': 'bg-green-100 text-green-700',
    'Not Fulfilled': 'bg-red-100 text-red-700',
  };

  /* Load existing data */
  useEffect(() => {
    setSections(data?.requirementSections || []);
    setDirty(false);
  }, [data]);

  const summary = PROSPECT_STAGES.reduce((acc, stage) => {
    acc[stage] = sections.filter(s => s.stage === stage).length;
    return acc;
  }, {});

  const getReqStatus = (s) =>
    s.reqDescription && s.reqDescription.replace(/<[^>]*>/g, '').trim()
      ? 'Detailed'
      : 'Pending';

  /* Load users for autosuggest */
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: d.data()['Name'] || '',
        phone: d.data()['MobileNo'] || '',
      }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  const clearError = (key) =>
    setErrors((p) => ({ ...p, [key]: '' }));

  const handleSearch = (index, value) => {
    const updated = [...sections];
    updated[index].reqSearch = value;
    setSections(updated);
    setDirty(true);

    const filtered = users.filter((u) =>
      u.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredMap((prev) => ({ ...prev, [index]: filtered }));
  };

  const selectUser = (index, name) => {
    const updated = [...sections];
    updated[index].reqfrom = name;
    updated[index].reqSearch = '';
    setSections(updated);
    setFilteredMap((p) => ({ ...p, [index]: [] }));
    clearError(`user-${index}`);
    setDirty(true);
  };

  const updateDesc = (index, value) => {
    const updated = [...sections];
    updated[index].reqDescription = value;
    setSections(updated);
    setDirty(true);
    clearError(`desc-${index}`);
  };

  const addRow = () => {
    setSections([
      ...sections,
      {
        reqfrom: '',
        reqSearch: '',
        reqDescription: '',
        stage: 'New',
      },
    ]);
    setDirty(true);
  };

  const updateField = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
    setDirty(true);
    clearError(`${field}-${index}`);
  };


  const confirmRemove = () => {
    const updated = sections.filter((_, i) => i !== removeIndex);
    setSections(updated);
    setDirty(true);
    setConfirmOpen(false);
    setRemoveIndex(null);
  };

  const validate = () => {
    const e = {};
    sections.forEach((s, i) => {
      if (!s.reqfrom) e[`user-${i}`] = 'Required';
      if (!s.reqDescription) e[`desc-${i}`] = 'Required';
    });
    setErrors(e);
    return e;
  };

  const focusFirstError = (errs) => {
    if (!Object.keys(errs).length) return;
    firstErrorRef.current?.focus();
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return false;
    }

    try {
      setSaving(true);

      const cleaned = sections.map((s) => ({
        reqfrom: s.reqfrom,
        reqDescription: s.reqDescription,
        stage: s.stage || 'New',
      }));

      await updateDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId), {
        requirementSections: cleaned,
      });

      setDirty(false);
      fetchData?.();

      toast.success('Requirements saved');
      return true;
    } catch {
      toast.error('Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    save: handleSave,
  }));

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <Text as="h2">Requirements</Text>

          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {total}
          </span>
        </div>



        <Button variant="outline" onClick={addRow}>
          + Add Entry
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROSPECT_STAGES.map(stage => (
          <div
            key={stage}
            className={`px-3 py-1 text-xs rounded-full ${STAGE_COLORS[stage]}`}
          >
            {stage}: {summary[stage]}
          </div>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {sections.map((s, i) => (
          <Card key={i} className="p-5 space-y-4 border border-slate-200 bg-slate-50/40">

            {/* Header */}
            <div className="flex items-center justify-between">
              <Text as="h3" className="font-semibold">
                Requirement Entry {i + 1}
              </Text>

              <div className="flex items-center gap-2">
                {/* Status Chip */}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${STAGE_COLORS[s.stage || 'New']
                    }`}
                >
                  {s.stage || 'New'}
                </span>

                <Tooltip label="Remove">
                  <ActionButton
                    icon={Trash2}
                    variant="ghostDanger"
                    onClick={() => {
                      setRemoveIndex(i);
                      setConfirmOpen(true);
                    }}
                  />
                </Tooltip>
              </div>
            </div>


            {/* Requested By */}
            <FormField label="Requested By" required error={errors[`user-${i}`]}>
              <div className="relative">
                <Input
                  ref={i === 0 ? firstErrorRef : null}
                  value={s.reqSearch || s.reqfrom}
                  onChange={(e) => handleSearch(i, e.target.value)}
                />

                {filteredMap[i]?.length > 0 && (
                  <div className="absolute z-30 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {filteredMap[i].map((u) => (
                      <div
                        key={u.id}
                        onClick={() => selectUser(i, u.name)}
                        className="px-4 py-2.5 cursor-pointer hover:bg-blue-50"
                      >
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            {/* Description (RichEditor) */}
            <FormField label="Description" required error={errors[`desc-${i}`]}>
              <RichEditor
                value={s.reqDescription || ''}
                onChange={(val) => updateDesc(i, val)}
              />
            </FormField>

            <FormField label="Requirement Outcome">
              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() => updateField(i, 'stage', 'New')}
                  className={`px-3 py-1.5 rounded-full text-sm border ${s.outcome === 'New'
                      ? 'bg-gray-100 text-gray-700 border-gray-200'
                      : 'bg-white border-gray-300'
                    }`}
                >
                  New
                </button>

                <button
                  type="button"
                  onClick={() => updateField(i, 'stage', 'Connected')}
                  className={`px-3 py-1.5 rounded-full text-sm border ${s.outcome === 'Connected'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-white border-gray-300'
                    }`}
                >
                  Connected
                </button>

                <button
                  type="button"
                  onClick={() => updateField(i, 'stage', 'Referral Passed')}
                  className={`px-3 py-1.5 rounded-full text-sm border ${s.outcome === 'Referral Passed'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-white border-gray-300'
                    }`}
                >
                  Referral Passed
                </button>

                <button
                  type="button"
                  onClick={() => updateField(i, 'stage', 'Not Fulfilled')}
                  className={`px-3 py-1.5 rounded-full text-sm border ${s.outcome === 'Not Fulfilled'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-white border-gray-300'
                    }`}
                >
                  Not Fulfilled
                </button>

              </div>
            </FormField>



          </Card>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this requirement?"
        description="This action cannot be undone."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
});

export default RequirementSection;
