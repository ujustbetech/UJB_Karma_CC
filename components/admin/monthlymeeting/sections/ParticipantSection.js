'use client';

import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef
} from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from 'firebase/firestore';

import { Users, Trash2 } from 'lucide-react';

import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import DateInput from '@/components/ui/DateInput';
import ConfirmModal from '@/components/ui/ConfirmModal';

const STATUS_OPTIONS = [
  { label: 'Not Connected', color: 'bg-gray-100 text-gray-700' },
  { label: 'Offline Meeting', color: 'bg-blue-100 text-blue-700' },
  { label: 'Online Meeting', color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Collaboration', color: 'bg-purple-100 text-purple-700' },
  { label: 'Referral Passed', color: 'bg-green-100 text-green-700' },
  { label: 'Identified Prospect', color: 'bg-orange-100 text-orange-700' },
];

const ParticipantSection = forwardRef(function ParticipantSection(
  { eventID },
  ref
) {
  const { success, error: showError } = useToast();
  const containerRef = useRef(null);

  const [sections, setSections] = useState([]);
  const [userList, setUserList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState(null);

  // const isDisabled = disabled || loading;

  /* -------- Expose to parent (Save All) -------- */
  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty: () => dirty,
  }));


  /* -------- Close dropdown on outside click -------- */
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setFilteredUsers({});
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* -------- Fetch existing sections -------- */
  useEffect(() => {
    if (!eventID) return;

    const fetchData = async () => {
      const ref = doc(db, COLLECTIONS.monthlyMeeting, eventID);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSections(snap.data().sections || []);
      }
    };

    fetchData();
  }, [eventID]);

  /* -------- Fetch users -------- */
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));

      const users = snap.docs.map(doc => ({
        name: doc.data().Name || '',
        phone: doc.data().MobileNo || '',
      }));

      setUserList(users);
    };

    fetchUsers();
  }, []);

  const clearError = (k) =>
    setErrors(prev => ({ ...prev, [k]: null }));

  /* -------- Autocomplete search -------- */
  const handleSearch = (value, index, key) => {
    const updated = [...sections];

    updated[index][
      key === 'selectedParticipant1'
        ? 'participantSearchTerm1'
        : 'participantSearchTerm2'
    ] = value;

    setSections(updated);
    setDirty(true);
    clearError(`${index}_${key}`);

    const filtered =
      value.trim() === ''
        ? userList.slice(0, 6)
        : userList.filter(u =>
          u.name?.toLowerCase().includes(value.toLowerCase())
        );

    setFilteredUsers(prev => ({
      ...prev,
      [`${index}_${key}`]: filtered,
    }));
  };

  const selectUser = (index, user, key) => {
    const updated = [...sections];
    updated[index][key] = user.name;

    updated[index][
      key === 'selectedParticipant1'
        ? 'participantSearchTerm1'
        : 'participantSearchTerm2'
    ] = '';

    setSections(updated);
    setDirty(true);
    setFilteredUsers({});
  };

  const handleDateChange = (value, index) => {
    const updated = [...sections];
    updated[index].interactionDate = value || '';
    setSections(updated);
    setDirty(true);
    clearError(`${index}_date`);
  };

  const setStatus = (index, value) => {
    const updated = [...sections];
    updated[index].status = value;
    setSections(updated);
    setDirty(true);
  };

  const addInteraction = () => {
    setSections(prev => [
      ...prev,
      {
        selectedParticipant1: '',
        selectedParticipant2: '',
        interactionDate: '',
        status: '',
      },
    ]);
    setDirty(true);
  };

  const askRemove = (i) => {
    setRemoveIndex(i);
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    const updated = sections.filter((_, i) => i !== removeIndex);
    setSections(updated);
    setDirty(true);

    try {
      const ref = doc(db, COLLECTIONS.monthlyMeeting, eventID);
      await updateDoc(ref, { sections: updated });
      success('Interaction removed');
    } catch {
      showError('Failed to remove interaction');
    }

    setConfirmOpen(false);
    setRemoveIndex(null);
  };

  /* -------- Validation -------- */
  const validate = () => {
    const e = {};

    sections.forEach((s, i) => {
      if (!s.selectedParticipant1)
        e[`${i}_selectedParticipant1`] = 'Required';
      if (!s.selectedParticipant2)
        e[`${i}_selectedParticipant2`] = 'Required';
      if (!s.interactionDate)
        e[`${i}_date`] = 'Required';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* -------- SAVE (updateDoc – same as earlier working code) -------- */
  const handleSave = async () => {
    console.log("SAVE CLICKED");

    if (!eventID) {
      showError("Event ID missing");
      return;
    }

    const isValid = validate();

    if (!isValid) {
      showError("Please complete all required fields");
      return;
    }

    try {
      setSaving(true);

      const refDoc = doc(db, COLLECTIONS.monthlyMeeting, eventID);

      await updateDoc(refDoc, {
        sections: [...sections],
      });

      setDirty(false);
      success("Participants saved");

    } catch (err) {
      console.error("SAVE ERROR:", err);
      showError("Save failed");
    } finally {
      setSaving(false);
    }
  };




  /* -------- SUMMARY -------- */
  const summary = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.label] = sections.filter(sec => sec.status === s.label).length;
    return acc;
  }, {});

  return (
    <>
      <Card ref={containerRef} className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <Text as="h2">1:1 Interaction</Text>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {sections.length}
          </span>
        </div>

        {/* SUMMARY */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <div key={s.label} className={`px-3 py-1 text-xs rounded-full ${s.color}`}>
              {s.label}: {summary[s.label]}
            </div>
          ))}
        </div>

        {sections.map((section, index) => {
          const open1 =
            filteredUsers[`${index}_selectedParticipant1`]?.length > 0;
          const open2 =
            filteredUsers[`${index}_selectedParticipant2`]?.length > 0;

          return (
            <Card key={index} className="p-5 relative space-y-4">
              {sections.length > 1 && (
                <button
                  title="Delete interaction"
                  onClick={() => askRemove(index)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="flex justify-between">
                <Text className="font-semibold">
                  Interaction #{index + 1}
                </Text>

                {section.status && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${STATUS_OPTIONS.find(s => s.label === section.status)?.color
                      }`}
                  >
                    {section.status}
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="Proposed by"
                  error={errors[`${index}_selectedParticipant1`]}
                  required
                >
                  <div className="relative">
                    <Input
                      placeholder="Search member..."
                      className={open1 ? 'border-blue-500 ring-1 ring-blue-500' : ''}
                      value={section.participantSearchTerm1 || section.selectedParticipant1 || ''}
                      onFocus={() =>
                        !section.selectedParticipant1 &&
                        setFilteredUsers(p => ({
                          ...p,
                          [`${index}_selectedParticipant1`]: userList.slice(0, 6),
                        }))
                      }
                      onChange={(e) =>
                        handleSearch(e.target.value, index, 'selectedParticipant1')
                      }
                    />

                    {open1 && (
                      <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                        {filteredUsers[`${index}_selectedParticipant1`].map((u, i) => (
                          <div
                            key={i}
                            onClick={() => selectUser(index, u, 'selectedParticipant1')}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>

                <FormField
                  label="Proposed with"
                  error={errors[`${index}_selectedParticipant2`]}
                  required
                >
                  <div className="relative">
                    <Input
                      placeholder="Search member..."
                      className={open2 ? 'border-blue-500 ring-1 ring-blue-500' : ''}
                      value={section.participantSearchTerm2 || section.selectedParticipant2 || ''}
                      onFocus={() =>
                        !section.selectedParticipant2 &&
                        setFilteredUsers(p => ({
                          ...p,
                          [`${index}_selectedParticipant2`]: userList.slice(0, 6),
                        }))
                      }
                      onChange={(e) =>
                        handleSearch(e.target.value, index, 'selectedParticipant2')
                      }
                    />

                    {open2 && (
                      <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                        {filteredUsers[`${index}_selectedParticipant2`].map((u, i) => (
                          <div
                            key={i}
                            onClick={() => selectUser(index, u, 'selectedParticipant2')}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>
              </div>

              <FormField
                label="Interaction Date"
                error={errors[`${index}_date`]}
                required
              >
                <DateInput
                  value={section.interactionDate || ''}
                  onChange={(e) => {
                    const value = e?.target?.value || e;
                    handleDateChange(value, index);
                  }}
                />
              </FormField>

              <FormField label="Interaction Outcome">
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => {
                    const active = section.status === s.label;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setStatus(index, s.label)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${active
                          ? `${s.color} border-transparent shadow-sm`
                          : 'bg-white border-gray-300'
                          }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </FormField>
            </Card>
          );
        })}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={addInteraction}>
            + Add Interaction
          </Button>

          <Button
            variant="primary"
            loading={saving}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this interaction?"
        description="This action cannot be undone."
        onConfirm={confirmRemove}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
});

export default ParticipantSection;
