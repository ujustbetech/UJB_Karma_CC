'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  doc,
  updateDoc,
  Timestamp,
  db,
} from '@/services/adminMonthlyMeetingFirebaseService';
import { COLLECTIONS } from '@/lib/utility_collection';

import { Info, Settings, List, Trash2 } from 'lucide-react';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';
import Textarea from '@/components/ui/Textarea';
import DateInput from '@/components/ui/DateInput';
import { useToast } from '@/components/ui/ToastProvider';
import RichEditor from '@/components/ui/RichEditor';
import EventInfoSkeleton from '@/components/skeleton/EventInfoSkeleton';

const EventInfoSection = forwardRef(function EventInfoSection(
  { data, eventId, fetchData },
  ref
) {
  const toast = useToast();

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventClock, setEventClock] = useState('');
  const [zoomLink, setZoomLink] = useState('');

  const [agendaType, setAgendaType] = useState('points');
  const [agendaPoints, setAgendaPoints] = useState(['']);
  const [agendaRich, setAgendaRich] = useState('');

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const refs = {
    eventName: useRef(null),
    eventDate: useRef(null),
    eventClock: useRef(null),
    zoomLink: useRef(null),
  };

  const formatTimestampParts = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';

    const date = timestamp.toDate();
    const pad = (value) => String(value).padStart(2, '0');

    return {
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
  };

  useEffect(() => {
    if (!data) return;

    setEventName(data.Eventname || '');
    setZoomLink(data.zoomLink || '');
    const timestampParts = formatTimestampParts(data.time);
    setEventDate(timestampParts?.date || '');
    setEventClock(timestampParts?.time || '');

    if (data.agendaType === 'rich') {
      setAgendaType('rich');
      setAgendaRich(data.agenda || '');
      setAgendaPoints(['']);
    } else {
      setAgendaType('points');
      setAgendaPoints(data.agenda?.length ? data.agenda : ['']);
      setAgendaRich('');
    }

    setErrors({});
    setDirty(false);
  }, [data]);

  const clearError = (field) => {
    setErrors((previous) => ({ ...previous, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!eventName.trim()) nextErrors.eventName = 'Event name is required';
    if (!eventDate) nextErrors.eventDate = 'Date is required';
    if (!eventClock) nextErrors.eventClock = 'Time is required';
    if (zoomLink && !/^https?:\/\//i.test(zoomLink.trim())) {
      nextErrors.zoomLink = 'Enter a valid meeting URL';
    }

    if (agendaType === 'points') {
      if (agendaPoints.some((item) => !item.trim())) {
        nextErrors.agenda = 'Fill all agenda points';
      }
    } else if (!agendaRich.trim()) {
      nextErrors.agenda = 'Agenda is required';
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleAgendaChange = (index, value) => {
    const updated = [...agendaPoints];
    updated[index] = value;
    setAgendaPoints(updated);
    setDirty(true);
    clearError('agenda');
  };

  const addAgendaPoint = () => {
    setAgendaPoints([...agendaPoints, '']);
    setDirty(true);
  };

  const removeAgendaPoint = (index) => {
    if (agendaPoints.length === 1) return;
    setAgendaPoints(agendaPoints.filter((_, currentIndex) => currentIndex !== index));
    setDirty(true);
    clearError('agenda');
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      return false;
    }

    try {
      setSaving(true);
      const eventDateTime = new Date(`${eventDate}T${eventClock}`);

      await updateDoc(doc(db, COLLECTIONS.monthlyMeeting, eventId), {
        Eventname: eventName.trim(),
        time: Timestamp.fromDate(eventDateTime),
        zoomLink: zoomLink.trim(),
        agendaType,
        agenda:
          agendaType === 'points'
            ? agendaPoints.map((item) => item.trim())
            : agendaRich,
      });

      fetchData?.();
      setDirty(false);
      toast.success('Event details updated');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Failed to update event details');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty: () => dirty,
  }));

  if (!data) {
    return <EventInfoSkeleton />;
  }

  return (
    <Card className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Info className="h-5 w-5 text-blue-600" />
        <Text as="h2">Event Information</Text>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            <Text className="font-semibold">Basic Info</Text>
          </div>

          <FormField label="Event Name" error={errors.eventName}>
            <Input
              ref={refs.eventName}
              value={eventName}
              onChange={(event) => {
                setEventName(event.target.value);
                setDirty(true);
                clearError('eventName');
              }}
              error={!!errors.eventName}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Date" error={errors.eventDate}>
              <DateInput
                ref={refs.eventDate}
                type="date"
                value={eventDate}
                onChange={(event) => {
                  setEventDate(event.target.value);
                  setDirty(true);
                  clearError('eventDate');
                }}
                error={!!errors.eventDate}
              />
            </FormField>

            <FormField label="Time" error={errors.eventClock}>
              <input
                ref={refs.eventClock}
                type="time"
                value={eventClock}
                onChange={(event) => {
                  setEventClock(event.target.value);
                  setDirty(true);
                  clearError('eventClock');
                }}
                className={`block h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 transition-colors focus:outline-none ${
                  errors.eventClock
                    ? 'border-rose-300 text-rose-900 focus:border-rose-400'
                    : 'border-slate-200 focus:border-slate-300'
                }`}
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <Text className="font-semibold">Meeting Access</Text>
          </div>

          <FormField label="Zoom Link" error={errors.zoomLink}>
            <Input
              ref={refs.zoomLink}
              value={zoomLink}
              onChange={(event) => {
                setZoomLink(event.target.value);
                setDirty(true);
                clearError('zoomLink');
              }}
              error={!!errors.zoomLink}
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-gray-500" />
          <Text className="font-semibold">Agenda</Text>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={agendaType === 'points'}
              onChange={() => {
                setAgendaType('points');
                setDirty(true);
              }}
            />
            Simple Points
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={agendaType === 'rich'}
              onChange={() => {
                setAgendaType('rich');
                setDirty(true);
              }}
            />
            Rich Text
          </label>
        </div>

        <FormField error={errors.agenda}>
          {agendaType === 'points' ? (
            <div className="space-y-3">
              {agendaPoints.map((point, index) => (
                <div key={index} className="relative rounded-lg bg-gray-50 p-3">
                  {agendaPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAgendaPoint(index)}
                      className="absolute right-2 top-2 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <Textarea
                    value={point}
                    onChange={(event) => handleAgendaChange(index, event.target.value)}
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
              onChange={(value) => {
                setAgendaRich(value);
                setDirty(true);
                clearError('agenda');
              }}
            />
          )}
        </FormField>
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
});

export default EventInfoSection;
