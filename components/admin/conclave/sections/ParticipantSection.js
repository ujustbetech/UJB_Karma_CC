'use client';

import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  db,
} from '@/services/adminConclaveFirebaseService';

import { Users, Trash2, Pencil } from 'lucide-react';
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
  { conclaveId, meetingId, data = {}, fetchData },
  ref
) {
  const toast = useToast();
  const containerRef = useRef(null);

  const [sections, setSections] = useState([]);
  const [userList, setUserList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState({});
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty: () => dirty,
  }));

  useEffect(() => {
    const handler = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setFilteredUsers({});
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!conclaveId || !meetingId) return;

    const fetchSectionData = async () => {
      const refDoc = doc(db, COLLECTIONS.conclaves, conclaveId, "meetings", meetingId);
      const snap = await getDoc(refDoc);
      if (snap.exists()) {
        const loadedSections = snap.data().sections || [];
        setSections(loadedSections);
        setEditingIndex(loadedSections.length ? null : 0);
      }
    };

    fetchSectionData();
  }, [conclaveId, meetingId]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
      const users = snap.docs.map((item) => ({
        name: item.data().Name || '',
        phone: item.data().MobileNo || '',
      }));
      setUserList(users);
    };

    fetchUsers();
  }, []);

  const clearError = (key) => {
    setErrors((previous) => ({ ...previous, [key]: null }));
  };

  const handleSearch = (value, index, key) => {
    const updated = [...sections];
    const searchKey =
      key === 'selectedParticipant1' ? 'participantSearchTerm1' : 'participantSearchTerm2';

    updated[index][searchKey] = value;
    setSections(updated);
    setDirty(true);
    clearError(`${index}_${key}`);

    const filtered =
      value.trim() === ''
        ? userList.slice(0, 6)
        : userList.filter((user) =>
            user.name?.toLowerCase().includes(value.toLowerCase())
          );

    setFilteredUsers((previous) => ({
      ...previous,
      [`${index}_${key}`]: filtered,
    }));
  };

  const selectUser = (index, user, key) => {
    const updated = [...sections];
    const searchKey =
      key === 'selectedParticipant1' ? 'participantSearchTerm1' : 'participantSearchTerm2';

    updated[index][key] = user.name;
    updated[index][searchKey] = '';

    setSections(updated);
    setDirty(true);
    setFilteredUsers({});
    clearError(`${index}_${key}`);
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
    const nextSections = [
      ...sections,
      {
        selectedParticipant1: '',
        selectedParticipant2: '',
        interactionDate: '',
        status: '',
      },
    ];

    setSections(nextSections);
    setEditingIndex(nextSections.length - 1);
    setDirty(true);
  };

  const askRemove = (index) => {
    setRemoveIndex(index);
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    const updated = sections.filter((_, index) => index !== removeIndex);
    setSections(updated);
    setDirty(true);
    setEditingIndex((current) => {
      if (current === removeIndex) return null;
      if (typeof current === 'number' && current > removeIndex) return current - 1;
      return current;
    });

    try {
      await updateDoc(doc(db, COLLECTIONS.conclaves, conclaveId, "meetings", meetingId), {
        sections: updated,
      });
      toast.success('Interaction removed');
      fetchData?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove interaction');
    }

    setConfirmOpen(false);
    setRemoveIndex(null);
  };

  const validate = () => {
    const nextErrors = {};

    sections.forEach((section, index) => {
      if (!section.selectedParticipant1) {
        nextErrors[`${index}_selectedParticipant1`] = 'Required';
      }
      if (!section.selectedParticipant2) {
        nextErrors[`${index}_selectedParticipant2`] = 'Required';
      }
      if (!section.interactionDate) {
        nextErrors[`${index}_date`] = 'Required';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  async function handleSave() {
    if (!conclaveId || !meetingId) {
      toast.error('Meeting ID missing');
      return false;
    }

    if (!validate()) {
      toast.error('Please complete all required fields');
      return false;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, COLLECTIONS.conclaves, conclaveId, "meetings", meetingId), {
        sections: [...sections],
      });

      setDirty(false);
      setEditingIndex(null);
      toast.success('Interactions saved');
      fetchData?.();
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  }

  const summary = STATUS_OPTIONS.reduce((accumulator, status) => {
    accumulator[status.label] = sections.filter(
      (section) => section.status === status.label
    ).length;
    return accumulator;
  }, {});

  return (
    <>
      <Card ref={containerRef} className="space-y-6 p-6 border-none shadow-none">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-600" />
          <Text as="h2" variant="h2">1:1 Interaction</Text>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
            {sections.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <div key={status.label} className={`rounded-full px-3 py-1 text-xs ${status.color}`}>
              {status.label}: {summary[status.label]}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => {
            const open1 = filteredUsers[`${index}_selectedParticipant1`]?.length > 0;
            const open2 = filteredUsers[`${index}_selectedParticipant2`]?.length > 0;
            const isEditing = editingIndex === index;
            const selectedStatus = STATUS_OPTIONS.find((item) => item.label === section.status);

            return (
              <Card key={index} className="space-y-4 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <Text className="font-semibold">Interaction #{index + 1}</Text>
                    <Text className="text-sm text-slate-600">
                      {(section.selectedParticipant1 || 'Member 1') +
                        ' with ' +
                        (section.selectedParticipant2 || 'Member 2')}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {section.interactionDate || 'Date not added yet'}
                    </Text>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedStatus && (
                      <span className={`rounded-full px-2 py-1 text-xs ${selectedStatus.color}`}>
                        {selectedStatus.label}
                      </span>
                    )}

                    <Button
                      type="button"
                      variant={isEditing ? 'secondary' : 'outline'}
                      onClick={() => setEditingIndex(isEditing ? null : index)}
                    >
                      <span className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        {isEditing ? 'Close' : 'Edit'}
                      </span>
                    </Button>

                    <Button type="button" variant="ghostDanger" onClick={() => askRemove(index)}>
                      <span className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </span>
                    </Button>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-4 border-t pt-4 mt-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        label="Proposed by"
                        error={errors[`${index}_selectedParticipant1`]}
                        required
                      >
                        <div className="relative">
                          <Input
                            placeholder="Search member..."
                            className={open1 ? 'border-blue-500 ring-1 ring-blue-500' : ''}
                            error={!!errors[`${index}_selectedParticipant1`]}
                            value={
                              section.participantSearchTerm1 ||
                              section.selectedParticipant1 ||
                              ''
                            }
                            onFocus={() =>
                              !section.selectedParticipant1 &&
                              setFilteredUsers((previous) => ({
                                ...previous,
                                [`${index}_selectedParticipant1`]: userList.slice(0, 6),
                              }))
                            }
                            onChange={(event) =>
                              handleSearch(event.target.value, index, 'selectedParticipant1')
                            }
                          />

                          {open1 && (
                            <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                              {filteredUsers[`${index}_selectedParticipant1`].map((user, userIndex) => (
                                <div
                                  key={userIndex}
                                  onClick={() => selectUser(index, user, 'selectedParticipant1')}
                                  className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                                >
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-xs text-gray-500">{user.phone}</div>
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
                            error={!!errors[`${index}_selectedParticipant2`]}
                            value={
                              section.participantSearchTerm2 ||
                              section.selectedParticipant2 ||
                              ''
                            }
                            onFocus={() =>
                              !section.selectedParticipant2 &&
                              setFilteredUsers((previous) => ({
                                ...previous,
                                [`${index}_selectedParticipant2`]: userList.slice(0, 6),
                              }))
                            }
                            onChange={(event) =>
                              handleSearch(event.target.value, index, 'selectedParticipant2')
                            }
                          />

                          {open2 && (
                            <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                              {filteredUsers[`${index}_selectedParticipant2`].map((user, userIndex) => (
                                <div
                                  key={userIndex}
                                  onClick={() => selectUser(index, user, 'selectedParticipant2')}
                                  className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                                >
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-xs text-gray-500">{user.phone}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormField>
                    </div>

                    <FormField label="Interaction Date" error={errors[`${index}_date`]} required>
                      <DateInput
                        value={section.interactionDate || ''}
                        error={!!errors[`${index}_date`]}
                        onChange={(event) => {
                          const value = event?.target?.value || event;
                          handleDateChange(value, index);
                        }}
                      />
                    </FormField>

                    <FormField label="Interaction Outcome">
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => {
                          const active = section.status === status.label;
                          return (
                            <button
                              key={status.label}
                              type="button"
                              onClick={() => setStatus(index, status.label)}
                              className={`rounded-full border px-3 py-1.5 text-sm ${
                                active
                                  ? `${status.color} border-transparent shadow-sm`
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {status.label}
                            </button>
                          );
                        })}
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
            );
          })}
        </div>

        <div className="flex justify-start border-t pt-4">
          <Button variant="outline" onClick={addInteraction}>
            + Add Interaction
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



