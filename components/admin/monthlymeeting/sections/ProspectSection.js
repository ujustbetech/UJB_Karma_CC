'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
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
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/ToastProvider';

import {
  Trash2,
  UserPlus,
  Phone,
  Sparkles,
  CheckCircle2
} from 'lucide-react';


const ProspectSection = forwardRef(function ProspectSection(
  { eventId, data, fetchData },
  ref
) {
  // const { showToast } = useToast();
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


  const PROSPECT_STAGES = [
    { label: 'New', color: 'bg-gray-100 text-gray-700' },
    { label: 'Connected', color: 'bg-blue-100 text-blue-700' },
    { label: 'Eligible', color: 'bg-purple-100 text-purple-700' },
    { label: 'Enrolled', color: 'bg-green-100 text-green-700' },
  ];


  const summary = PROSPECT_STAGES.reduce((acc, s) => {
    acc[s.label] = sections.filter(sec => sec.stage === s.label).length;
    return acc;
  }, {});

  /* Load existing data */
  useEffect(() => {
    if (!data?.prospectSections) return;

    const migrated = data.prospectSections.map((s) => ({
      ...s,
      stage: s.stage || 'New',
    }));

    setSections(migrated);
    setDirty(false);
  }, [data]);

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
    updated[index].prospectSearch = value;
    setSections(updated);
    setDirty(true);

    const filtered = users.filter((u) =>
      u.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredMap((prev) => ({ ...prev, [index]: filtered }));
  };

  const selectUser = (index, name) => {
    const updated = [...sections];
    updated[index].prospect = name;
    updated[index].prospectSearch = '';
    setSections(updated);
    setFilteredMap((p) => ({ ...p, [index]: [] }));
    clearError(`user-${index}`);
    setDirty(true);
  };

  const updateField = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
    setDirty(true);
    clearError(`${field}-${index}`);
  };

  const addRow = () => {
    setSections([
      ...sections,
      {
        prospect: '',
        prospectSearch: '',
        prospectName: '',
        prospectDescription: '',
        stage: 'New',
      },
    ]);
    setDirty(true);
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
      if (!s.prospect) e[`user-${i}`] = 'Required';
      if (!s.prospectName) e[`name-${i}`] = 'Required';
      if (!s.prospectDescription) e[`desc-${i}`] = 'Required';
    });
    setErrors(e);
    return e;
  };

  const focusFirstError = (errs) => {
    if (!Object.keys(errs).length) return;
    firstErrorRef.current?.focus();
  };

  const saveInternal = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return false;
    }

    try {
      setSaving(true);

      const cleaned = sections.map((s) => ({
        prospect: s.prospect,
        prospectDescription: s.prospectDescription,
        prospectName: s.prospectName,
        stage: s.stage || 'New',
      }));

      await updateDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId), {
        prospectSections: cleaned,
      });

      setDirty(false);
      fetchData?.();

      // showToast({
      //   type: 'success',
      //   message: 'Prospects saved',
      // });
      toast.success('Prospects saved');

      return true;
    } catch {
      // showToast({
      //   type: 'error',
      //   message: 'Save failed',
      // });

      toast.error('Save failed');

      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    save: saveInternal,
  }));

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <Text as="h2">Prospects</Text>

          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {sections.length}
          </span>
        </div>

        <Button variant="outline" onClick={addRow}>
          + Add Entry
        </Button>
      </div>



      <div className="flex flex-wrap gap-2">
        {PROSPECT_STAGES.map(s => (
          <div key={s.label} className={`px-3 py-1 text-xs rounded-full ${s.color}`}>
            {s.label}: {summary[s.label]}
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
                Prospect Entry {i + 1}
              </Text>

              <div className="flex items-center gap-2">

                {/* Stage Badge */}
                {s.stage === 'New' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    New
                  </span>
                )}
                {s.stage === 'Connected' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    Connected
                  </span>
                )}
                {s.stage === 'Eligible' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                    Eligible
                  </span>
                )}
                {s.stage === 'Enrolled' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    Enrolled
                  </span>
                )}

                <ActionButton
                  icon={Trash2}
                  variant="ghostDanger"
                  label="Remove"
                  onClick={() => {
                    setRemoveIndex(i);
                    setConfirmOpen(true);
                  }}
                />
              </div>
            </div>

            {/* Orbiter */}
            <FormField label="Orbiter" required error={errors[`user-${i}`]}>
              <div className="relative">
                <Input
                  ref={i === 0 ? firstErrorRef : null}
                  value={s.prospectSearch || s.prospect}
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

            {/* Prospect Name */}
            <FormField label="Prospect Name" required error={errors[`name-${i}`]}>
              <Input
                value={s.prospectName || ''}
                onChange={(e) => updateField(i, 'prospectName', e.target.value)}
              />
            </FormField>

            {/* Details */}
            <FormField label="Details" required error={errors[`desc-${i}`]}>
              <Textarea
                value={s.prospectDescription || ''}
                onChange={(e) =>
                  updateField(i, 'prospectDescription', e.target.value)
                }
              />
            </FormField>

            {/* Stage Chips */}
            <FormField label="Prospect Stage">
              <div className="flex flex-wrap gap-2">

                {['New', 'Connected', 'Eligible', 'Enrolled'].map(stage => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => updateField(i, 'stage', stage)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${s.stage === stage
                      ? stage === 'Enrolled'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : stage === 'Eligible'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : stage === 'Connected'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                      : 'bg-white border-gray-300'
                      }`}
                  >
                    {stage}
                  </button>
                ))}

              </div>
            </FormField>
          </Card>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="primary" onClick={saveInternal} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this prospect?"
        description="This action cannot be undone."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
});

export default ProspectSection;
