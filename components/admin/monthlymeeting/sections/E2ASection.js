'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import ActionButton from '@/components/ui/ActionButton';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';
import StatusBadge from '@/components/ui/StatusBadge';
import Textarea from '@/components/ui/Textarea';
import DateInput from '@/components/ui/DateInput';
import { useToast } from '@/components/ui/ToastProvider';
import FormField from '@/components/ui/FormField';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RichEditor from '@/components/ui/RichEditor';

import { Trash2, Upload, FileText, X, BookOpen, Lightbulb, BadgeCheck, CheckCircle2 } from 'lucide-react';

const E2ASection = forwardRef(function E2ASection({ eventId, data, fetchData }, ref) {
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

  useEffect(() => {
    setSections(data?.e2aSections || []);
    setDirty(false);
  }, [data]);

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

  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    save: async () => {
      await handleSave();
    },
  }));

  const clearError = (key) =>
    setErrors((p) => ({ ...p, [key]: '' }));

  const handleSearch = (index, value) => {
    const updated = [...sections];
    updated[index].e2aSearch = value;
    setSections(updated);
    setDirty(true);

    const filtered = users.filter((u) =>
      u.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredMap((prev) => ({ ...prev, [index]: filtered }));
  };

  const selectUser = (index, name) => {
    const updated = [...sections];
    updated[index].e2a = name;
    updated[index].e2aSearch = '';
    setSections(updated);
    setFilteredMap((p) => ({ ...p, [index]: [] }));
    clearError(`name-${index}`);
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
        e2a: '',
        e2aSearch: '',
        e2aDesc: '',
        e2aDate: '',

        status: 'Proposed', // ⭐ new lifecycle

        referenceType: 'none',
        notes: '',
        referenceUrl: '',
        fileName: '',
        uploading: false,
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
      if (!s.e2a) e[`name-${i}`] = 'Required';
      if (!s.e2aDesc) e[`desc-${i}`] = 'Required';
      if (!s.e2aDate) e[`date-${i}`] = 'Required';
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
      return;
    }

    try {
      setSaving(true);

      const cleaned = sections.map((s) => ({
        e2a: s.e2a,
        e2aDate: s.e2aDate || '',
        e2aDesc: s.e2aDesc || '',

        status: s.status || 'Proposed',

        referenceType: s.referenceType || 'none',
        notes: s.notes || '',
        referenceUrl: s.referenceUrl || '',
        fileName: s.fileName || '',
      }));


      await updateDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId), {
        e2aSections: cleaned,
      });

      setDirty(false);
      fetchData?.();
      toast.success('E2A saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file, index) => {
    if (!file) return;

    updateField(index, 'uploading', true);

    try {
      const path = `e2aDocs/${eventId}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, path);

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      updateField(index, 'referenceUrl', url);
      updateField(index, 'fileName', file.name);
      updateField(index, 'referenceType', 'document');

      toast.success('File uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    } finally {
      updateField(index, 'uploading', false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <Text as="h2">Proposed E2A</Text>
      </div>

      {/* Helper + Add */}
      <div className="flex items-center justify-between">
        <Text className="text-sm text-gray-500">
          Capture key learning moments shared by members
        </Text>

        <Button variant="outline" onClick={addRow}>
          + Add Entry
        </Button>
      </div>

      {sections.map((s, i) => (
        <Card key={i} className="mb-4 p-5 space-y-4">

          <div className="flex items-center justify-between">
            <Text as="h3" className="text-base font-semibold">
              E2A Entry {i + 1}
            </Text>

            <div className="flex items-center gap-2">

              {s.status === 'Proposed' && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  Proposed
                </span>
              )}

              {s.status === 'Approved' && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Approved
                </span>
              )}

              {s.status === 'Done' && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Done
                </span>
              )}

              <ActionButton
                icon={Trash2}
                label="Remove"
                variant="ghostDanger"
                onClick={() => {
                  setRemoveIndex(i);
                  setConfirmOpen(true);
                }}
              />
            </div>
          </div>


          <FormField label="Facilitator" required error={errors[`name-${i}`]}>
            <div className="relative">
              <Input
                ref={i === 0 ? firstErrorRef : null}
                value={s.e2aSearch || s.e2a}
                onChange={(e) => handleSearch(i, e.target.value)}
              />

              {filteredMap[i]?.length > 0 && (
                <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {filteredMap[i].map((u) => (
                    <div
                      key={u.id}
                      onClick={() => selectUser(i, u.name)}
                      className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition"
                    >
                      <div className="text-sm font-medium text-slate-800">
                        {u.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {u.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Topic & Description" required error={errors[`desc-${i}`]}>
            <Textarea
              value={s.e2aDesc || ''}
              onChange={(e) => updateField(i, 'e2aDesc', e.target.value)}
            />
          </FormField>

          <FormField label="Date" required error={errors[`date-${i}`]}>
            <DateInput
              value={s.e2aDate || ''}
              onChange={(e) => updateField(i, 'e2aDate', e.target.value)}
            />
          </FormField>

          <FormField label="Reference Material">
            <div className="flex flex-wrap gap-2">
              {['none', 'notes', 'document', 'both'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField(i, 'referenceType', type)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${s.referenceType === type
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-white border-gray-300'
                    }`}
                >
                  {type === 'none' && 'None'}
                  {type === 'notes' && 'Notes'}
                  {type === 'document' && 'Document'}
                  {type === 'both' && 'Both'}
                </button>
              ))}
            </div>
          </FormField>




          {(s.referenceType === 'notes' || s.referenceType === 'both') && (
            <FormField label="Notes">
              <RichEditor
                value={s.notes || ''}
                onChange={(val) => updateField(i, 'notes', val)}
              />
            </FormField>
          )}
          {(s.referenceType === 'document' || s.referenceType === 'both') && (
            <FormField label="Reference Document">
              <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer bg-white hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                Upload File
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0], i)}
                />
              </label>

              {s.uploading && (
                <span className="text-sm text-blue-600">Uploading...</span>
              )}

              {s.referenceUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={s.referenceUrl}
                    target="_blank"
                    className="flex items-center gap-1 text-sm text-blue-600 underline"
                  >
                    <FileText className="w-4 h-4" />
                    {s.fileName}
                  </a>

                  <button
                    onClick={() => {
                      updateField(i, 'referenceUrl', '');
                      updateField(i, 'fileName', '');
                    }}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </FormField>
          )}


          <FormField label="E2A Status">
            <div className="flex flex-wrap gap-2">

              {/* Proposed */}
              <button
                type="button"
                onClick={() => updateField(i, 'status', 'Proposed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${s.status === 'Proposed'
                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                  : 'bg-white border-gray-300'
                  }`}
              >
                <Lightbulb className="w-4 h-4" />
                Proposed
              </button>

              {/* Approved */}
              <button
                type="button"
                onClick={() => updateField(i, 'status', 'Approved')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${s.status === 'Approved'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-white border-gray-300'
                  }`}
              >
                <BadgeCheck className="w-4 h-4" />
                Approved
              </button>

              {/* Done */}
              <button
                type="button"
                onClick={() => updateField(i, 'status', 'Done')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${s.status === 'Done'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-white border-gray-300'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Done
              </button>

            </div>
          </FormField>

        </Card>
      ))}

      <div className="flex justify-between mt-6">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this E2A entry?"
        description="This action cannot be undone."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
});

export default E2ASection;
