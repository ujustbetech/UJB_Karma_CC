'use client';

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { collection, getDocs, doc, updateDoc, db } from '@/services/adminConclaveFirebaseService';
import { uploadAdminConclaveMeetingFile } from '@/services/adminConclaveService';

import { COLLECTIONS } from '@/lib/utility_collection';
import { Trash2, BookOpen, Upload, FileText, X, Pencil } from 'lucide-react';
import { CheckCircle2, UserCheck, UserX } from 'lucide-react';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RichEditor from '@/components/ui/RichEditor';

function buildAuditEntry(action, details) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    section: 'Knowledge Sharing',
    action,
    details,
    timestamp: new Date().toISOString(),
  };
}

const KnowledgeSharingSection = forwardRef(function KnowledgeSharingSection(
  { conclaveId, meetingId, data = {}, fetchData },
  ref
) {
  const toast = useToast();

  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredMap, setFilteredMap] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const firstErrorRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  /* ===============================
     Load data from parent
  =============================== */

  useEffect(() => {
    if (!data) return;

    if (data.knowledgeSections) {
      setSections(data.knowledgeSections);
    }
  }, [data]);

  /* ===============================
     Load users for autosuggest
  =============================== */
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

  /* ===============================
     Dirty protection
  =============================== */
  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  /* ===============================
     Ref API exposed to parent Save All
  =============================== */
  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    save: handleSave,
  }));

  const clearError = (key) =>
    setErrors((p) => ({
      ...p,
      [key]: '',
    }));

  const handleSearch = (index, value) => {
    const updated = [...sections];
    updated[index].search = value;
    setSections(updated);
    setDirty(true);

    const filtered = users.filter((u) =>
      u.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredMap((prev) => ({
      ...prev,
      [index]: filtered,
    }));
  };

  const selectUser = (index, name) => {
    const updated = [...sections];
    updated[index].name = name;
    updated[index].search = '';
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
    const newIndex = sections.length;
    setSections([
      ...sections,
      {
        name: '',
        search: '',
        topic: '',
        description: '',
        status: 'Shared',
        writeup: '',
        referenceUrl: '',
        fileName: '',
        uploading: false,
        referenceType: 'none',
      },
    ]);
    setEditingIndex(newIndex);
    setDirty(true);
  };

  const confirmRemove = () => {
    const updated = sections.filter((_, i) => i !== removeIndex);
    setSections(updated);
    setDirty(true);
    setEditingIndex((current) => {
      if (current === removeIndex) return null;
      if (typeof current === 'number' && current > removeIndex) return current - 1;
      return current;
    });
    setConfirmOpen(false);
    setRemoveIndex(null);
  };
  const validate = () => {
    const e = {};
    sections.forEach((s, i) => {
      if (!s.name) e[`user-${i}`] = 'Required';
      if (!s.topic) e[`topic-${i}`] = 'Required';
      if (!s.description) e[`desc-${i}`] = 'Required';
    });
    setErrors(e);
    return e;
  };

  const focusFirstError = (errs) => {
    if (!Object.keys(errs).length) return;
    firstErrorRef.current?.focus();
  };

  /* ===============================
     SAVE
  =============================== */
  const handleSave = async () => {
    if (!conclaveId || !meetingId) return false;
    
    const errs = validate();
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return false;
    }

    try {
      setSaving(true);

      const cleaned = sections.map((s) => ({
        description: s.description,
        name: s.name,
        topic: s.topic,
        status: s.status || 'Shared',
        writeup: s.writeup || '',
        referenceUrl: s.referenceUrl || '',
        fileName: s.fileName || '',
        referenceType: s.referenceType || 'none',
      }));

      await updateDoc(doc(db, COLLECTIONS.conclaves, conclaveId, "meetings", meetingId), {
        knowledgeSections: cleaned,
        auditLogs: [...(Array.isArray(data?.auditLogs) ? data.auditLogs : []), buildAuditEntry("edit", "Knowledge entries updated")].slice(-100),
      });

      setDirty(false);
      setEditingIndex(null);
      await fetchData?.();

      toast.success('Knowledge entries saved');
      return true;
    } catch {
      toast.error('Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  };


  const handleFileUpload = async (file, index) => {
    if (!file) return;

    updateField(index, 'uploading', true);

    try {
      const upload = await uploadAdminConclaveMeetingFile(conclaveId, meetingId, {
        file,
        module: "knowledgeDocs",
      });
      const url = upload.url;

      updateField(index, 'referenceUrl', url);
      updateField(index, 'fileName', file.name);

      toast.success('File uploaded');
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      toast.error(e.message || 'Upload failed');
    } finally {
      updateField(index, 'uploading', false);
    }
  };


  return (
    <Card className="p-6 space-y-6 border-none shadow-none">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <Text as="h2" variant="h2">Knowledge Sharing</Text>
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

      {/* Entries */}
      <div className="space-y-4">
        {sections.map((s, i) => (
          <Card
            key={i}
            className="p-5 space-y-4 border border-slate-200 bg-slate-50/40 hover:shadow-md transition"
          >
            {/* Entry Header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <Text className="font-semibold">Knowledge Entry #{i + 1}</Text>
                <Text className="text-sm text-slate-600">
                  {s.topic || 'No topic added yet'}
                </Text>
                <Text className="text-xs text-slate-500">
                  {s.name || 'Orbiter not selected'}
                </Text>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {s.status === 'Shared' && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    Shared
                  </span>
                )}

                {s.status === 'Present' && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    <UserCheck className="w-3 h-3" />
                    Present
                  </span>
                )}

                {s.status === 'Absent' && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                    <UserX className="w-3 h-3" />
                    Absent
                  </span>
                )}

                <Button
                  type="button"
                  variant={editingIndex === i ? 'secondary' : 'outline'}
                  onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                >
                  <span className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    {editingIndex === i ? 'Close' : 'Edit'}
                  </span>
                </Button>

                <Button type="button" variant="ghostDanger" onClick={() => { setRemoveIndex(i); setConfirmOpen(true); }}>
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </span>
                </Button>
              </div>
            </div>

            {editingIndex === i && (
              <div className="space-y-4 border-t pt-4 mt-2">
            {/* Orbiter */}
            <FormField label="Orbiter" required error={errors[`user-${i}`]}>
              <div className="relative">
                <Input
                  ref={i === 0 ? firstErrorRef : null}
                  value={s.search || s.name}
                  onChange={(e) => handleSearch(i, e.target.value)}
                  error={!!errors[`user-${i}`]}
                  placeholder="Search member name"
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

            {/* Topic */}
            <FormField label="Topic" required error={errors[`topic-${i}`]}>
              <Input
                value={s.topic || ''}
                onChange={(e) => updateField(i, 'topic', e.target.value)}
                error={!!errors[`topic-${i}`]}
                placeholder="Enter topic title"
              />
            </FormField>

            {/* Description */}
            <FormField label="Description" required error={errors[`desc-${i}`]}>
              <Textarea
                value={s.description || ''}
                onChange={(e) => updateField(i, 'description', e.target.value)}
                error={!!errors[`desc-${i}`]}
                placeholder="Describe what was shared"
              />
            </FormField>

            <FormField label="Reference Material">
              <div className="flex flex-wrap gap-2">
                {['none', 'writeup', 'document', 'both'].map(type => (
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
                    {type === 'writeup' && 'Write-up'}
                    {type === 'document' && 'Document'}
                    {type === 'both' && 'Both'}
                  </button>
                ))}
              </div>
            </FormField>


            {(s.referenceType === 'writeup' || s.referenceType === 'both') && (
              <FormField label="Reference Write-up (optional)">
                <RichEditor
                  value={s.writeup || ''}
                  onChange={(val) => updateField(i, 'writeup', val)}
                />
              </FormField>
            )}

            {(s.referenceType === 'document' || s.referenceType === 'both') && (
              <>

                <FormField label="Reference Document Link (optional)">
                  <Input
                    value={s.referenceUrl || ''}
                    onChange={(e) => updateField(i, 'referenceUrl', e.target.value)}
                    placeholder="Paste Google Drive / PDF / PPT link"
                  />
                </FormField>

                <FormField label="Reference Document (optional)">
                  <div className="flex items-center gap-3 flex-wrap">

                    {/* Upload Button */}
                    <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer bg-white hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      Upload File
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files[0], i)}
                      />
                    </label>

                    {/* Uploading */}
                    {s.uploading && (
                      <span className="text-sm text-blue-600">
                        Uploading...
                      </span>
                    )}

                    {/* File Preview */}
                    {s.referenceUrl && (
                      <div className="flex items-center gap-2">
                        <a
                          href={s.referenceUrl}
                          target="_blank"
                          className="flex items-center gap-1 text-sm text-blue-600 underline"
                        >
                          <FileText className="w-4 h-4" />
                          {s.fileName || 'View Document'}
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            updateField(i, 'referenceUrl', '');
                            updateField(i, 'fileName', '');
                          }}
                          className="text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </FormField>

              </>
            )}

            <FormField label="Knowledge Sharing Status">
              <div className="flex flex-wrap gap-2">
                {/* Shared */}
                <button
                  type="button"
                  onClick={() => updateField(i, 'status', 'Shared')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${s.status === 'Shared'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-white border-gray-300'
                    }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Shared
                </button>

                {/* Present */}
                <button
                  type="button"
                  onClick={() => updateField(i, 'status', 'Present')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${s.status === 'Present'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-white border-gray-300'
                    }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Present but not shared
                </button>

                {/* Absent */}
                <button
                  type="button"
                  onClick={() => updateField(i, 'status', 'Absent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${s.status === 'Absent'
                    ? 'bg-gray-200 text-gray-700 border-gray-300'
                    : 'bg-white border-gray-300'
                    }`}
                >
                  <UserX className="w-4 h-4" />
                  Absent
                </button>
              </div>
            </FormField>

            <div className="flex justify-end pt-4 mt-4">
              <Button variant="primary" loading={saving} onClick={handleSave}>
                Save
              </Button>
            </div>
            </div>
            )}
          </Card>
        ))}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this entry?"
        description="This knowledge entry will be permanently removed."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
});

export default KnowledgeSharingSection;



