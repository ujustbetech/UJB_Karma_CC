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

import { useToast } from '@/components/ui/ToastProvider';

export default function ReferralSection({ eventId, data, fetchData }) {
  const { showToast } = useToast();

  const [referrals, setReferrals] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredMap, setFilteredMap] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const firstErrorRef = useRef(null);

  useEffect(() => {
    setReferrals(data?.referralSections || []);
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
    const updated = [...referrals];
    updated[index].search = value;
    setReferrals(updated);
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
    const updated = [...referrals];
    updated[index].name = name;
    updated[index].search = '';
    setReferrals(updated);
    setFilteredMap((p) => ({ ...p, [index]: [] }));
    clearError(`name-${index}`);
    setDirty(true);
  };

  const updateField = (index, field, value) => {
    const updated = [...referrals];
    updated[index][field] = value;
    setReferrals(updated);
    setDirty(true);
    clearError(`${field}-${index}`);
  };

  const addRow = () => {
    setReferrals([
      ...referrals,
      { name: '', description: '', search: '' },
    ]);
  };

  const removeRow = (index) => {
    const updated = referrals.filter((_, i) => i !== index);
    setReferrals(updated);
    setDirty(true);
  };

  const validate = () => {
    const e = {};
    referrals.forEach((r, i) => {
      if (!r.name) e[`name-${i}`] = 'Required';
      if (!r.description) e[`description-${i}`] = 'Required';
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

      const cleaned = referrals.map((r) => ({
        name: r.name,
        description: r.description,
      }));

      await updateDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId), {
        referralSections: cleaned,
      });

      setDirty(false);
      fetchData?.();

      showToast({
        type: 'success',
        message: 'Referrals saved',
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
      <Text as="h2">Referrals</Text>

      {referrals.map((r, i) => (
        <Card key={i} className="mb-4">
          <Text as="h3">Referral {i + 1}</Text>

          <FormField
            label="Select Name"
            required
            error={errors[`name-${i}`]}
          >
            <div className="relative">
              <Input
                ref={i === 0 ? firstErrorRef : null}
                value={r.search || r.name}
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
            label="Description"
            required
            error={errors[`description-${i}`]}
          >
            <Textarea
              value={r.description || ''}
              onChange={(e) =>
                updateField(i, 'description', e.target.value)
              }
              error={!!errors[`description-${i}`]}
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
          + Add Referral
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
