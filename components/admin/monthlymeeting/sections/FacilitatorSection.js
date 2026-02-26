'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import ActionButton from '@/components/ui/ActionButton';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';

import { FormField } from '@/components/ui/form/FormField';
import Textarea from '@/components/ui/form/Textarea';
import DateInput from '@/components/ui/form/DateInput';

import { useToast } from '@/components/ui/ToastProvider';

export default function FacilitatorSection({ eventId, data, fetchData }) {
  const { showToast } = useToast();

  const [facilitators, setFacilitators] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredMap, setFilteredMap] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const firstErrorRef = useRef(null);

  useEffect(() => {
    setFacilitators(data?.facilitatorSections || []);
  }, [data]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: d.data()['Name'] || '',
      }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const clearError = (key) =>
    setErrors((p) => ({
      ...p,
      [key]: '',
    }));

  const handleSearch = (index, value) => {
    const updated = [...facilitators];
    updated[index].search = value;
    setFacilitators(updated);
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
    const updated = [...facilitators];
    updated[index].name = name;
    updated[index].search = '';
    setFacilitators(updated);
    setFilteredMap((p) => ({ ...p, [index]: [] }));
    clearError(`name-${index}`);
    setDirty(true);
  };

  const updateField = (index, field, value) => {
    const updated = [...facilitators];
    updated[index][field] = value;
    setFacilitators(updated);
    setDirty(true);
    clearError(`${field}-${index}`);
  };

  const addRow = () => {
    setFacilitators([
      ...facilitators,
      { name: '', topic: '', date: '', search: '' },
    ]);
  };

  const removeRow = (index) => {
    const updated = facilitators.filter((_, i) => i !== index);
    setFacilitators(updated);
    setDirty(true);
  };

  const validate = () => {
    const e = {};
    facilitators.forEach((f, i) => {
      if (!f.name) e[`name-${i}`] = 'Required';
      if (!f.topic) e[`topic-${i}`] = 'Required';
      if (!f.date) e[`date-${i}`] = 'Required';
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

      const cleaned = facilitators.map((f) => ({
        name: f.name,
        topic: f.topic,
        date: f.date,
      }));

      await updateDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId), {
        facilitatorSections: cleaned,
      });

      setDirty(false);
      fetchData?.();

      showToast({
        type: 'success',
        message: 'Facilitators saved',
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Text as="h2">Facilitators</Text>

      {facilitators.map((f, i) => (
        <Card key={i} className="mb-4">
          <Text as="h3">Facilitator {i + 1}</Text>

          <FormField
            label="Select Name"
            required
            error={errors[`name-${i}`]}
          >
            <div className="relative">
              <Input
                ref={i === 0 ? firstErrorRef : null}
                value={f.search || f.name}
                onChange={(e) => handleSearch(i, e.target.value)}
                error={!!errors[`name-${i}`]}
              />

              {filteredMap[i]?.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-auto">
                  {filteredMap[i].map((u) => (
                    <div
                      key={u.id}
                      className="px-3 py-2 cursor-pointer"
                      onClick={() => selectUser(i, u.name)}
                    >
                      <Text>{u.name}</Text>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </FormField>

          <FormField
            label="Topic & Description"
            required
            error={errors[`topic-${i}`]}
          >
            <Textarea
              value={f.topic || ''}
              onChange={(e) =>
                updateField(i, 'topic', e.target.value)
              }
              error={!!errors[`topic-${i}`]}
            />
          </FormField>

          <FormField
            label="Date & Time"
            required
            error={errors[`date-${i}`]}
          >
            <DateInput
              type="datetime-local"
              value={f.date || ''}
              onChange={(e) =>
                updateField(i, 'date', e.target.value)
              }
              error={!!errors[`date-${i}`]}
            />
          </FormField>

          <div className="flex justify-end mt-2">
            <Tooltip label="Remove">
              <ActionButton
                variant="ghostDanger"
                onClick={() => removeRow(i)}
                icon="trash"
              />
            </Tooltip>
          </div>
        </Card>
      ))}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={addRow}>
          + Add Facilitator
        </Button>

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
}
