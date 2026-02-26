'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import { Info, Settings, List, Trash2 } from 'lucide-react';
// import { useEditor, EditorContent } from '@tiptap/react';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';
import Textarea from '@/components/ui/Textarea';
import DateInput from '@/components/ui/DateInput';
// import RichEditor from '@/components/ui/RichEditor';
import { useToast } from '@/components/ui/ToastProvider';
import RichEditor from '@/components/ui/RichEditor';
import EventInfoSkeleton from '@/components/skeleton/EventInfoSkeleton';

export default function EventInfoSection({ data, eventId }) {
  const { showToast } = useToast();

  const [eventName, setEventName] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [zoomLink, setZoomLink] = useState('');

  const [agendaType, setAgendaType] = useState('points');
  const [agendaPoints, setAgendaPoints] = useState(['']);
  const [agendaRich, setAgendaRich] = useState('');

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const refs = {
    eventName: useRef(null),
    eventTime: useRef(null),
    zoomLink: useRef(null),
  };

  const formatTimestampForInput = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';

    const date = timestamp.toDate();

    const pad = (n) => String(n).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (!data) return;

    setEventName(data.Eventname || '');
    setZoomLink(data.zoomLink || '');
    setEventTime(formatTimestampForInput(data.time));

    if (data.agendaType === 'rich') {
      setAgendaType('rich');
      setAgendaRich(data.agenda || '');
    } else {
      setAgendaType('points');
      setAgendaPoints(data.agenda?.length ? data.agenda : ['']);
    }
  }, [data]);

  const validate = () => {
    const newErrors = {};

    if (!eventName.trim()) newErrors.eventName = 'Required';
    if (!eventTime) newErrors.eventTime = 'Required';
    if (!zoomLink.trim()) newErrors.zoomLink = 'Required';

    if (agendaType === 'points') {
      if (agendaPoints.some((a) => !a.trim()))
        newErrors.agenda = 'Fill all agenda points';
    } else {
      if (!agendaRich.trim()) newErrors.agenda = 'Agenda required';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleAgendaChange = (i, val) => {
    const updated = [...agendaPoints];
    updated[i] = val;
    setAgendaPoints(updated);
  };

  const addAgendaPoint = () =>
    setAgendaPoints([...agendaPoints, '']);

  const removeAgendaPoint = (i) => {
    if (agendaPoints.length === 1) return;
    setAgendaPoints(agendaPoints.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) return;

    try {
      setSaving(true);
      const ref = doc(db, COLLECTIONS.monthlyMeeting, eventId);

      await updateDoc(ref, {
        Eventname: eventName,
        time: Timestamp.fromDate(new Date(eventTime)),
        zoomLink,
        agendaType,
        agenda:
          agendaType === 'points'
            ? agendaPoints
            : agendaRich,
      });

      showToast({
        type: 'success',
        message: 'Event details updated',
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Update failed',
      });
    } finally {
      setSaving(false);
    }
  };


  if (!data) {
    return <EventInfoSkeleton />;
  }


  return (
    <Card className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Info className="w-5 h-5 text-blue-600" />
        <Text as="h2">Event Information</Text>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <Text className="font-semibold">Basic Info</Text>
          </div>

          <FormField label="Event Name" error={errors.eventName}>
            <Input
              ref={refs.eventName}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </FormField>

          <FormField label="Date & Time" error={errors.eventTime}>
            <DateInput
              ref={refs.eventTime}
              value={eventTime}
              onChange={(e) => {
                setEventTime(e.target.value);
                clearError('eventTime');
              }}
              error={!!errors.eventTime}
            />
          </FormField>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <Text className="font-semibold">Meeting Access</Text>
          </div>

          <FormField label="Zoom Link" error={errors.zoomLink}>
            <Input
              ref={refs.zoomLink}
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
            />
          </FormField>
        </div>
      </div>

      {/* Agenda */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-gray-500" />
          <Text className="font-semibold">Agenda</Text>
        </div>

        {/* Toggle */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={agendaType === 'points'}
              onChange={() => setAgendaType('points')}
            />
            Simple Points
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={agendaType === 'rich'}
              onChange={() => setAgendaType('rich')}
            />
            Rich Text
          </label>
        </div>

        <FormField error={errors.agenda}>
          {agendaType === 'points' ? (
            <div className="space-y-3">
              {agendaPoints.map((point, index) => (
                <div key={index} className="relative bg-gray-50 p-3 rounded-lg">

                  {agendaPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAgendaPoint(index)}
                      className="absolute top-2 right-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <Textarea
                    value={point}
                    onChange={(e) =>
                      handleAgendaChange(index, e.target.value)
                    }
                    className="pr-8"
                  />
                </div>
              ))}

              <Button variant="outline" onClick={addAgendaPoint}>
                + Add Agenda Point
              </Button>
            </div>
          ) : (
            <RichEditor
              value={agendaRich}
              onChange={setAgendaRich}
            />
          )}
        </FormField>

      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
}
