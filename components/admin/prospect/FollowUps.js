import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import Modal from '@/components/ui/Modal';
import { sendWhatsAppTemplateRequest } from '@/utils/whatsappClient';
import { getFallbackJourneyEmailTemplate } from '@/lib/journey/journey_email';
import { getFallbackJourneyWhatsAppTemplate } from '@/lib/journey/journey_whatsapp';

const DEFAULT_EVENT_MODE = 'online';
const MIN_NO_RECORDING_REASON_LENGTH = 10;
const MEETING_LOGS_TEMPLATE_ID = 'meeting_logs';
const DEFAULT_MEETING_LOGS_TEMPLATE = {
  channels: {
    email: getFallbackJourneyEmailTemplate(MEETING_LOGS_TEMPLATE_ID),
    whatsapp: getFallbackJourneyWhatsAppTemplate(MEETING_LOGS_TEMPLATE_ID),
  },
};

const emptyAccordionForm = {
  date: '',
  mode: DEFAULT_EVENT_MODE,
  zoomLink: '',
  venue: '',
  reason: '',
};

const emptyDoneModal = {
  open: false,
  index: null,
  recordingLink: '',
  noRecordingReason: '',
};

const buildMeetingKey = (meeting, idx) =>
  [
    String(meeting?.id ?? 'no-id'),
    String(meeting?.dateISO ?? 'no-date'),
    String(meeting?.createdAt ?? 'no-created-at'),
    String(idx),
  ].join('::');

const applyTemplateVariables = (template = '', values = {}) =>
  String(template || '').replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
    const normalizedKey = String(key || '').trim();
    return values[normalizedKey] ?? `{{${normalizedKey}}}`;
  });

const buildScheduleDetails = ({ zoomLink = '', venue = '' }) =>
  zoomLink
    ? `Zoom Link: ${zoomLink}`
    : venue
    ? `Venue: ${venue}`
    : 'Details will be shared soon';

const sanitizeText = (text) =>
  String(text || '').replace(/[^a-zA-Z0-9 .,!?'"@#&()\-:/]/g, ' ');

const fetchMeetingLogsTemplate = async () => {
  try {
    const res = await fetch(`/api/admin/journey-templates?id=${MEETING_LOGS_TEMPLATE_ID}`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.template) {
      throw new Error(data.message || 'Failed to load meeting logs template');
    }

    return data.template;
  } catch (error) {
    console.error('Meeting logs template fetch failed, using fallback:', error);
    return DEFAULT_MEETING_LOGS_TEMPLATE;
  }
};

const Followup = ({ id, data = { comments: [], event: [] } }) => {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [eventsList, setEventsList] = useState([]);
  const [eventDate, setEventDate] = useState('');
  const [eventMode, setEventMode] = useState(DEFAULT_EVENT_MODE);
  const [zoomLink, setZoomLink] = useState('');
  const [venue, setVenue] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [didChangeEventMode, setDidChangeEventMode] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [accordionForm, setAccordionForm] = useState(emptyAccordionForm);
  const [didChangeAccordionMode, setDidChangeAccordionMode] = useState(false);
  const [doneModal, setDoneModal] = useState(emptyDoneModal);
  const [currentAdminName, setCurrentAdminName] = useState('');

  const getMeetingStatus = (meeting) => {
    if (!meeting) return 'Scheduled';
    if (meeting.status) return meeting.status;
    if (meeting.completed) return 'Done';
    if (meeting.cancelled) return 'Cancelled';
    if (meeting.startedAt) return 'In Progress';
    return 'Scheduled';
  };

  const isClosedMeeting = (meeting) => {
    const status = getMeetingStatus(meeting);
    return status === 'Done' || status === 'Cancelled';
  };

  const latestMeeting = eventsList.length
    ? eventsList[eventsList.length - 1]
    : null;

  const showLatestMeetingBox = latestMeeting && !isClosedMeeting(latestMeeting);

  const latestOpenMeetingIndex = useMemo(
    () =>
      [...eventsList]
        .map((meeting, index) => ({ meeting, index }))
        .reverse()
        .find(({ meeting }) => !isClosedMeeting(meeting))?.index ?? null,
    [eventsList]
  );

  const updateProspectSection = async (updatePayload) => {
    const res = await fetch(`/api/admin/prospects?id=${id}&section=followups`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ update: updatePayload }),
    });
    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(responseData.message || 'Failed to update meeting logs');
    }
  };

  const persistEventsArray = async (newEventsArray) => {
    const latestEvent = newEventsArray.length ? newEventsArray[newEventsArray.length - 1] : null;

    await updateProspectSection({
      events: newEventsArray,
      event: latestEvent,
    });

    setEventsList(
      newEventsArray.map((event) => ({
        ...event,
        status: getMeetingStatus(event),
      }))
    );
  };

  const formatReadableDate = (inputDate) => {
    if (!inputDate) return '';
    const dateValue = new Date(inputDate);

    if (Number.isNaN(dateValue.getTime())) {
      return '';
    }

    const day = String(dateValue.getDate()).padStart(2, '0');
    const month = dateValue.toLocaleString('en-GB', { month: 'long' });
    const year = String(dateValue.getFullYear()).slice(-2);
    let hours = dateValue.getHours();
    const minutes = String(dateValue.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${day} ${month} ${year} at ${hours}.${minutes} ${ampm}`;
  };

  const formatLogTimestamp = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? ''
      : formatReadableDate(parsed.toISOString());
  };

  const localToISO = (localValue) => {
    if (!localValue) return '';
    const parsed = new Date(localValue);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  };

  const isoToLocal = (iso) => {
    if (!iso) return '';
    const parsed = new Date(iso);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const getLoggedByValue = () =>
    `Logged by ${String(currentAdminName || 'Admin').trim()}`;

  const resolveMeetingMode = ({
    previousMeeting,
    selectedMode,
    didExplicitlyChangeMode,
  }) => {
    if (didExplicitlyChangeMode) {
      return selectedMode;
    }

    return previousMeeting?.mode || selectedMode || DEFAULT_EVENT_MODE;
  };

  const resolveMeetingLocationDetails = ({
    previousMeeting,
    mode,
    zoomLinkValue,
    venueValue,
  }) => ({
    zoomLink:
      mode === 'online'
        ? String(zoomLinkValue || previousMeeting?.zoomLink || '').trim()
        : '',
    venue:
      mode === 'offline'
        ? String(venueValue || previousMeeting?.venue || '').trim()
        : '',
  });

  const getScheduleHistory = (meeting) => {
    if (!meeting) return [];

    const history = [
      {
        id: `scheduled-${meeting.id ?? meeting.dateISO ?? 'meeting'}`,
        type: 'Scheduled',
        happenedAt: meeting.createdAt || meeting.dateISO || meeting.date,
        details: [
          meeting.date ? `Meeting date: ${meeting.date}` : '',
          meeting.mode ? `Mode: ${meeting.mode}` : '',
          meeting.mode === 'online' && meeting.zoomLink ? `Zoom: ${meeting.zoomLink}` : '',
          meeting.mode === 'offline' && meeting.venue ? `Venue: ${meeting.venue}` : '',
        ].filter(Boolean),
      },
    ];

    (meeting.rescheduleHistory || []).forEach((entry, index) => {
      history.push({
        id: `rescheduled-${meeting.id ?? index}-${index}`,
        type: 'Rescheduled',
        happenedAt: entry.rescheduledAt || entry.newDateISO,
        details: [
          entry.previousDateISO
            ? `Previous date: ${formatReadableDate(entry.previousDateISO)}`
            : '',
          entry.newDateISO
            ? `New date: ${formatReadableDate(entry.newDateISO)}`
            : '',
          entry.previousMode ? `Previous mode: ${entry.previousMode}` : '',
          entry.newMode ? `New mode: ${entry.newMode}` : '',
          entry.reason ? `Reason: ${entry.reason}` : '',
        ].filter(Boolean),
      });
    });

    if (meeting.startedAt) {
      history.push({
        id: `progress-${meeting.id ?? meeting.startedAt}`,
        type: 'In Progress',
        happenedAt: meeting.startedAt,
        details: [
          meeting.date ? `Meeting date: ${meeting.date}` : '',
        ].filter(Boolean),
      });
    }

    if (meeting.completedAt || getMeetingStatus(meeting) === 'Done') {
      history.push({
        id: `done-${meeting.id ?? meeting.completedAt ?? 'meeting'}`,
        type: 'Done',
        happenedAt: meeting.completedAt,
        details: [
          meeting.completedAt ? `Completed on: ${formatLogTimestamp(meeting.completedAt)}` : '',
          meeting.recordingLink ? `Recording: ${meeting.recordingLink}` : '',
          meeting.noRecordingReason ? `No recording reason: ${meeting.noRecordingReason}` : '',
          meeting.loggedBy || '',
        ].filter(Boolean),
      });
    }

    return history;
  };

  useEffect(() => {
    const fetchDataLocal = async () => {
      try {
        const res = await fetch(`/api/admin/prospects?id=${id}&section=followups`, {
          credentials: 'include',
        });
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.message || 'Failed to fetch meeting logs');
        }

        const prospect = responseData.prospect || {};
        setComments(prospect.comments || []);
        setCurrentAdminName(responseData.admin?.name || responseData.admin?.email || 'Admin');

        if (Array.isArray(prospect.events)) {
          setEventsList(
            prospect.events.map((event, index) => ({
              id: event.id ?? index,
              ...event,
              status: getMeetingStatus(event),
            }))
          );
        } else if (prospect.event) {
          const singleEvent = {
            id: 0,
            ...prospect.event,
            mode: prospect.event.mode || DEFAULT_EVENT_MODE,
            status: getMeetingStatus(prospect.event),
          };
          setEventsList([singleEvent]);
        } else {
          setEventsList([]);
        }
      } catch (error) {
        console.error('fetchDataLocal error:', error);
      }
    };

    if (id) {
      fetchDataLocal();
    }
  }, [id]);

  const sendMeetingEmail = async ({
    template,
    variantKey,
    recipientType = 'prospect',
    recipientName,
    recipientEmail,
    date,
    zoomLink,
    isReschedule = false,
    isCancelled = false,
    reason = '',
    venue = '',
  }) => {
    const emailChannel =
      template?.channels?.email || DEFAULT_MEETING_LOGS_TEMPLATE.channels.email;
    const variant =
      emailChannel?.variants?.[variantKey] ||
      DEFAULT_MEETING_LOGS_TEMPLATE.channels.email.variants?.[variantKey];
    const recipientTemplate =
      variant?.recipients?.[recipientType] ||
      variant?.recipients?.prospect ||
      DEFAULT_MEETING_LOGS_TEMPLATE.channels.email.variants?.[variantKey]?.recipients?.[
        recipientType
      ] ||
      DEFAULT_MEETING_LOGS_TEMPLATE.channels.email.variants?.[variantKey]?.recipients
        ?.prospect;
    const scheduleDetails = buildScheduleDetails({ zoomLink, venue });
    const body = applyTemplateVariables(recipientTemplate?.body, {
      recipient_name: recipientName,
      date,
      schedule_details: scheduleDetails,
      reason: reason || 'Scheduling constraints',
    });

    try {
      await emailjs.send(
        emailChannel?.serviceId ||
          DEFAULT_MEETING_LOGS_TEMPLATE.channels.email.serviceId,
        emailChannel?.templateId ||
          DEFAULT_MEETING_LOGS_TEMPLATE.channels.email.templateId,
        {
          prospect_name: recipientName,
          to_email: recipientEmail,
          body,
        },
        emailChannel?.publicKey ||
          DEFAULT_MEETING_LOGS_TEMPLATE.channels.email.publicKey
      );
    } catch (error) {
      console.error(`Failed to send email to ${recipientName}:`, error);
    }
  };

  const sendWhatsAppMessage = async ({
    template,
    variantKey,
    recipientType = 'prospect',
    name,
    phone,
    date,
    zoomLink,
    isReschedule = false,
    reason = '',
    venue = '',
  }) => {
    const whatsappChannel =
      template?.channels?.whatsapp || DEFAULT_MEETING_LOGS_TEMPLATE.channels.whatsapp;
    const variant =
      whatsappChannel?.variants?.[variantKey] ||
      DEFAULT_MEETING_LOGS_TEMPLATE.channels.whatsapp.variants?.[variantKey];
    const defaultVariant =
      DEFAULT_MEETING_LOGS_TEMPLATE.channels.whatsapp.variants?.[variantKey];
    const selectedRecipientTemplate = variant?.recipients?.[recipientType];
    const selectedDefaultRecipientTemplate =
      defaultVariant?.recipients?.[recipientType];
    const fallbackRecipientTemplate =
      variant?.recipients?.prospect || defaultVariant?.recipients?.prospect;
    const resolvedTemplateName =
      String(
        selectedRecipientTemplate?.templateName ||
          selectedDefaultRecipientTemplate?.templateName ||
          fallbackRecipientTemplate?.templateName ||
          ''
      ).trim();
    const parameterKeys =
      Array.isArray(selectedRecipientTemplate?.variableKeys) &&
      selectedRecipientTemplate.variableKeys.length
        ? selectedRecipientTemplate.variableKeys
        : Array.isArray(selectedDefaultRecipientTemplate?.variableKeys) &&
            selectedDefaultRecipientTemplate.variableKeys.length
          ? selectedDefaultRecipientTemplate.variableKeys
          : Array.isArray(fallbackRecipientTemplate?.variableKeys) &&
              fallbackRecipientTemplate.variableKeys.length
            ? fallbackRecipientTemplate.variableKeys
            : [];
    const locationDetails = buildScheduleDetails({ zoomLink, venue });
    const templateValues = {
      name: String(name || 'Member').trim(),
      date: String(date || 'To be confirmed').trim(),
      reason: String(reason || 'Scheduling constraints').trim(),
      location_details: String(locationDetails || 'Details will be shared soon').trim(),
    };

    try {
      if (!resolvedTemplateName || !parameterKeys.length) {
        throw new Error('WhatsApp template configuration is incomplete');
      }

      await sendWhatsAppTemplateRequest({
        phone,
        templateName: resolvedTemplateName,
        parameters: parameterKeys.map((key) =>
          sanitizeText(templateValues[key] ?? '')
        ),
      });
    } catch (error) {
      console.error(`Failed to send message to ${name}:`, error?.response?.data || error?.message);
    }
  };

  const handleSendComment = async () => {
    if (!comment.trim()) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      text: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedComments = [newComment, ...comments];

    try {
      await updateProspectSection({ comments: updatedComments });
      setComments(updatedComments);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const resetMeetingForm = () => {
    setCreateMode(false);
    setRescheduleMode(false);
    setRescheduleReason('');
    setEventDate('');
    setEventMode(DEFAULT_EVENT_MODE);
    setDidChangeEventMode(false);
    setZoomLink('');
    setVenue('');
  };

  const handleCreateOrReschedule = async () => {
    if (!eventDate.trim()) {
      return alert('Please select a date');
    }

    const previousMeeting = rescheduleMode && latestMeeting ? latestMeeting : null;
    const resolvedMode = resolveMeetingMode({
      previousMeeting,
      selectedMode: eventMode,
      didExplicitlyChangeMode: !rescheduleMode || didChangeEventMode,
    });
    const resolvedLocation = resolveMeetingLocationDetails({
      previousMeeting,
      mode: resolvedMode,
      zoomLinkValue: zoomLink,
      venueValue: venue,
    });

    if (resolvedMode === 'online' && !resolvedLocation.zoomLink) {
      return alert('Enter Zoom link');
    }

    if (resolvedMode === 'offline' && !resolvedLocation.venue) {
      return alert('Enter venue');
    }

    const formattedEventDate = formatReadableDate(eventDate);
    const newEvent = {
      id: rescheduleMode && latestMeeting
        ? latestMeeting.id
        : `meeting-${Date.now()}`,
      date: formattedEventDate,
      dateISO: localToISO(eventDate) || new Date(eventDate).toISOString(),
      mode: resolvedMode,
      zoomLink: resolvedLocation.zoomLink,
      venue: resolvedLocation.venue,
      status: 'Scheduled',
      completed: false,
      createdAt: latestMeeting?.createdAt || Date.now(),
      rescheduleHistory: latestMeeting?.rescheduleHistory || [],
      NTMemberName: latestMeeting?.NTMemberName || data.orbiterName || '',
      NTMemberPhone: latestMeeting?.NTMemberPhone || data.orbiterContact || '',
      NTMemberEmail: latestMeeting?.NTMemberEmail || data.orbiterEmail || '',
    };

    try {
      let updatedEvents = [];

      if (rescheduleMode && latestMeeting) {
        const rescheduleEntry = {
          previousDateISO: latestMeeting.dateISO,
          newDateISO: newEvent.dateISO,
          previousMode: latestMeeting.mode,
          newMode: newEvent.mode,
          reason: rescheduleReason || '',
          rescheduledAt: Date.now(),
        };

        updatedEvents = [
          ...eventsList.slice(0, -1),
          {
            ...latestMeeting,
            ...newEvent,
            status: 'Scheduled',
            completed: false,
            rescheduleHistory: [
              ...(latestMeeting.rescheduleHistory || []),
              rescheduleEntry,
            ],
          },
        ];
      } else {
        updatedEvents = [...eventsList, newEvent];
      }

      await persistEventsArray(updatedEvents);
      const meetingLogsTemplate = await fetchMeetingLogsTemplate();

      const recipients = [
        {
          type: 'prospect',
          name: data.prospectName,
          phone: data.prospectPhone,
          email: data.email,
        },
        {
          type: 'orbiter',
          name: data.orbiterName,
          phone: data.orbiterContact,
          email: data.orbiterEmail,
        },
      ].filter((recipient) => recipient.name || recipient.email || recipient.phone);

      for (const recipient of recipients) {
        if (recipient.phone) {
          await sendWhatsAppMessage({
            template: meetingLogsTemplate,
            variantKey: rescheduleMode ? 'reschedule' : 'schedule',
            recipientType: recipient.type,
            name: recipient.name,
            phone: recipient.phone,
            date: formattedEventDate,
            zoomLink: resolvedLocation.zoomLink,
            isReschedule: rescheduleMode,
            reason: rescheduleReason,
            venue: resolvedLocation.venue,
          });
        }
      }

      await Promise.all(
        recipients
          .filter((recipient) => recipient.email)
          .map((recipient) =>
            sendMeetingEmail({
              template: meetingLogsTemplate,
              variantKey: rescheduleMode ? 'reschedule' : 'schedule',
              recipientType: recipient.type,
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              date: formattedEventDate,
              zoomLink: resolvedLocation.zoomLink,
              isReschedule: rescheduleMode,
              reason: rescheduleReason,
              venue: resolvedLocation.venue,
            })
          )
      );

      alert(rescheduleMode ? 'Event rescheduled successfully!' : 'Event created successfully!');
      resetMeetingForm();
    } catch (error) {
      console.error('Error saving event or sending messages:', error);
      alert('Failed to save meeting.');
    }
  };

  const handleMeetingInProgress = async (idx) => {
    if (idx === null || idx === undefined || !eventsList[idx]) {
      return alert('Meeting not found.');
    }

    const updatedEvents = eventsList.map((meeting, index) =>
      index === idx
        ? {
            ...meeting,
            status: 'In Progress',
            startedAt: meeting.startedAt || Date.now(),
          }
        : meeting
    );

    try {
      await persistEventsArray(updatedEvents);
      router.push(`/admin/prospect/edit/${id}?tab=3&returnTab=2&meetingId=${eventsList[idx].id ?? idx}`);
    } catch (error) {
      console.error('handleMeetingInProgress', error);
      alert('Failed to start the meeting workflow.');
    }
  };

  const openDoneModalForMeeting = (idx) => {
    if (idx === null || idx === undefined || !eventsList[idx]) {
      return;
    }

    setDoneModal({
      open: true,
      index: idx,
      recordingLink: eventsList[idx].recordingLink || '',
      noRecordingReason: eventsList[idx].noRecordingReason || '',
    });
  };

  const closeDoneModal = () => setDoneModal(emptyDoneModal);

  const submitMeetingDone = async () => {
    const idx = doneModal.index;
    const meeting = idx !== null ? eventsList[idx] : null;

    if (idx === null || !meeting) {
      return alert('Meeting not found.');
    }

    const recordingLink = String(doneModal.recordingLink || '').trim();
    const noRecordingReason = String(doneModal.noRecordingReason || '').trim();

    if (!recordingLink && noRecordingReason.length < MIN_NO_RECORDING_REASON_LENGTH) {
      return alert(
        `Add a recording link/reference or enter at least ${MIN_NO_RECORDING_REASON_LENGTH} characters explaining why there is no recording.`
      );
    }

    try {
      const meetingLogsTemplate = await fetchMeetingLogsTemplate();
      const thankYouRecipients = [
        {
          type: 'prospect',
          name: data.prospectName,
          phone: data.prospectPhone,
          email: data.email,
        },
        {
          type: 'orbiter',
          name: meeting.NTMemberName || data.orbiterName,
          phone: meeting.NTMemberPhone || data.orbiterContact,
          email: meeting.NTMemberEmail || data.orbiterEmail,
        },
      ];

      for (const recipient of thankYouRecipients) {
        if (recipient.phone) {
          await sendWhatsAppMessage({
            template: meetingLogsTemplate,
            variantKey: 'thank_you',
            recipientType: recipient.type,
            name: recipient.name,
            phone: recipient.phone,
          });
        }
        if (recipient.email) {
          await sendMeetingEmail({
            template: meetingLogsTemplate,
            variantKey: 'thank_you',
            recipientType: recipient.type,
            recipientName: recipient.name,
            recipientEmail: recipient.email,
          });
        }
      }

      const updatedEvents = eventsList.map((currentMeeting, index) =>
        index === idx
          ? {
              ...currentMeeting,
              completed: true,
              status: 'Done',
              completedAt: Date.now(),
              recordingLink,
              noRecordingReason,
              loggedBy: getLoggedByValue(),
            }
          : currentMeeting
      );

      await persistEventsArray(updatedEvents);
      closeDoneModal();
      alert('Meeting marked as done successfully!');
    } catch (error) {
      console.error('Meeting Done Error:', error);
      alert('Something went wrong while completing meeting.');
    }
  };

  const toggleOpen = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  const startAccordionEdit = (idx) => {
    const meeting = eventsList[idx];

    setEditingIndex(idx);
    setDidChangeAccordionMode(false);
    setAccordionForm({
      date: meeting?.dateISO ? isoToLocal(meeting.dateISO) : '',
      mode: meeting?.mode || DEFAULT_EVENT_MODE,
      zoomLink: meeting?.zoomLink || '',
      venue: meeting?.venue || '',
      reason: '',
    });
    setOpenIndex(idx);
  };

  const saveAccordionReschedule = async (idx) => {
    const previousMeeting = eventsList[idx];

    if (!previousMeeting || !accordionForm.date) {
      return alert('Select date & time');
    }

    const resolvedMode = resolveMeetingMode({
      previousMeeting,
      selectedMode: accordionForm.mode,
      didExplicitlyChangeMode: didChangeAccordionMode,
    });
    const resolvedLocation = resolveMeetingLocationDetails({
      previousMeeting,
      mode: resolvedMode,
      zoomLinkValue: accordionForm.zoomLink,
      venueValue: accordionForm.venue,
    });

    if (resolvedMode === 'online' && !resolvedLocation.zoomLink) {
      return alert('Enter Zoom link');
    }

    if (resolvedMode === 'offline' && !resolvedLocation.venue) {
      return alert('Enter venue');
    }

    const newDateISO = localToISO(accordionForm.date) || new Date(accordionForm.date).toISOString();
    const rescheduleEntry = {
      previousDateISO: previousMeeting.dateISO,
      newDateISO,
      previousMode: previousMeeting.mode,
      newMode: resolvedMode,
      reason: accordionForm.reason || '',
      rescheduledAt: Date.now(),
    };

    const updatedEvents = eventsList.map((meeting, index) =>
      index === idx
        ? {
            ...meeting,
            date: formatReadableDate(newDateISO),
            dateISO: newDateISO,
            mode: resolvedMode,
            zoomLink: resolvedLocation.zoomLink,
            venue: resolvedLocation.venue,
            status: 'Scheduled',
            completed: false,
            rescheduleHistory: [
              ...(meeting.rescheduleHistory || []),
              rescheduleEntry,
            ],
          }
        : meeting
    );

    try {
      await persistEventsArray(updatedEvents);
      setEditingIndex(null);
      setDidChangeAccordionMode(false);
      setAccordionForm(emptyAccordionForm);
      alert('Meeting rescheduled.');
    } catch (error) {
      console.error('saveAccordionReschedule', error);
      alert('Failed to reschedule.');
    }
  };

  const cancelAccordionEvent = async (idx) => {
    if (!window.confirm('Cancel this meeting?')) {
      return;
    }

    const meeting = eventsList[idx];

    if (!meeting) {
      return;
    }

    const updatedEvents = eventsList.map((currentMeeting, index) =>
      index === idx
        ? {
            ...currentMeeting,
            cancelled: true,
            status: 'Cancelled',
            completed: false,
            cancelledAt: Date.now(),
          }
        : currentMeeting
    );

    try {
      await persistEventsArray(updatedEvents);

      await Promise.all(
        [
          { name: data.prospectName, email: data.email },
          { name: meeting.NTMemberName || data.orbiterName, email: meeting.NTMemberEmail || data.orbiterEmail },
        ]
          .filter((recipient) => recipient.email)
          .map((recipient) =>
            sendMeetingEmail({
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              date: meeting.date || '',
              zoomLink: meeting.zoomLink || '',
              isCancelled: true,
              reason: meeting.reason || 'Meeting cancelled by the team',
              venue: meeting.venue || '',
            })
          )
      );

      alert('Meeting cancelled.');
    } catch (error) {
      console.error('cancelAccordionEvent', error);
      alert('Failed to cancel.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 text-black">
      <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
        Meeting Schedule Logs
      </h2>

      {!createMode && !showLatestMeetingBox && (
        <button
          onClick={() => setCreateMode(true)}
          className="ml-auto block bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Schedule Meet
        </button>
      )}

      {showLatestMeetingBox && !rescheduleMode && (
        <div className="bg-white border rounded-xl shadow-sm p-6 mt-6">
          <h4 className="font-semibold text-lg mb-3">Event Details</h4>

          <p className="mb-2"><strong>Date:</strong> {latestMeeting.date}</p>
          <p className="mb-2"><strong>Status:</strong> {getMeetingStatus(latestMeeting)}</p>
          <p className="mb-2"><strong>Mode:</strong> {latestMeeting.mode}</p>

          {latestMeeting.mode === 'online' ? (
            <p>
              <strong>Zoom Link:</strong>{' '}
              <a href={latestMeeting.zoomLink} target="_blank" className="text-blue-600 underline">
                {latestMeeting.zoomLink}
              </a>
            </p>
          ) : (
            <p><strong>Venue:</strong> {latestMeeting.venue}</p>
          )}

          <div className="flex gap-4 mt-4">
            <button
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              onClick={() => {
                setEventDate(isoToLocal(latestMeeting.dateISO || ''));
                setEventMode(latestMeeting.mode || DEFAULT_EVENT_MODE);
                setDidChangeEventMode(false);
                setZoomLink(latestMeeting.zoomLink || '');
                setVenue(latestMeeting.venue || '');
                setRescheduleMode(true);
              }}
            >
              Reschedule
            </button>

            <button
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-500"
              onClick={() => handleMeetingInProgress(latestOpenMeetingIndex)}
            >
              {getMeetingStatus(latestMeeting) === 'In Progress'
                ? 'Continue Pre-Enrolment'
                : 'In Progress'}
            </button>

            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
              onClick={() => openDoneModalForMeeting(latestOpenMeetingIndex)}
            >
              Done
            </button>
          </div>

          {getScheduleHistory(latestMeeting).length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h5 className="font-semibold mb-3">Schedule Activity</h5>
              <div className="space-y-3">
                {getScheduleHistory(latestMeeting).map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{log.type}</p>
                    {log.happenedAt && (
                      <p className="text-sm text-slate-500 mt-1">
                        Logged on {formatLogTimestamp(log.happenedAt)}
                      </p>
                    )}
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      {log.details.map((detail) => (
                        <p key={detail}>{detail}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(createMode || rescheduleMode) && (
        <div className="bg-white border rounded-xl shadow-sm p-6 mt-6 space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Date <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {rescheduleMode && (
            <div>
              <label className="block font-medium mb-1">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">
              Event Mode <span className="text-red-600">*</span>
            </label>
            <select
              value={eventMode}
              onChange={(e) => {
                setDidChangeEventMode(true);
                setEventMode(e.target.value);
              }}
              className="w-full border rounded-lg p-2"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {eventMode === 'online' && (
            <div>
              <label className="block font-medium mb-1">
                Zoom Link <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
          )}

          {eventMode === 'offline' && (
            <div>
              <label className="block font-medium mb-1">
                Venue <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreateOrReschedule}
              className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800"
            >
              {rescheduleMode ? 'Reschedule' : 'Schedule'}
            </button>

            <button
              type="button"
              onClick={resetMeetingForm}
              className="border border-slate-300 px-5 py-2 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {eventsList.length === 0 ? (
          <p className="text-gray-500">No meetings scheduled yet.</p>
        ) : (
          eventsList.map((meeting, idx) => (
            <div key={buildMeetingKey(meeting, idx)} className="border rounded-xl p-4 bg-white shadow-sm">
              <div className="flex justify-between items-center">
                <div className="font-semibold">
                  Meeting #{idx + 1} - {meeting.date}
                  {getMeetingStatus(meeting) === 'In Progress' && (
                    <span className="text-amber-600 ml-2 font-bold">[In Progress]</span>
                  )}
                  {getMeetingStatus(meeting) === 'Done' && (
                    <span className="text-green-600 ml-2 font-bold">[Done]</span>
                  )}
                  {getMeetingStatus(meeting) === 'Cancelled' && (
                    <span className="text-red-600 ml-2 font-bold">[Cancelled]</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleOpen(idx)}
                    className="text-sm px-3 py-1 border rounded"
                  >
                    {openIndex === idx ? 'Collapse' : 'Expand'}
                  </button>

                  {!isClosedMeeting(meeting) && (
                    <>
                      <button
                        onClick={() => startAccordionEdit(idx)}
                        className="bg-black text-white px-3 py-1 rounded"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => handleMeetingInProgress(idx)}
                        className="bg-amber-600 text-white px-3 py-1 rounded"
                      >
                        {getMeetingStatus(meeting) === 'In Progress' ? 'Continue' : 'In Progress'}
                      </button>

                      <button
                        onClick={() => openDoneModalForMeeting(idx)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Done
                      </button>

                      <button
                        onClick={() => cancelAccordionEvent(idx)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {openIndex === idx && (
                <div className="mt-4 space-y-2">
                  <p><strong>Status:</strong> {getMeetingStatus(meeting)}</p>
                  <p><strong>Mode:</strong> {meeting.mode}</p>
                  {meeting.completedAt && (
                    <p><strong>Completed At:</strong> {formatLogTimestamp(meeting.completedAt)}</p>
                  )}
                  {meeting.loggedBy && (
                    <p><strong>Logged By:</strong> {meeting.loggedBy}</p>
                  )}
                  {meeting.recordingLink && (
                    <p><strong>Recording:</strong> {meeting.recordingLink}</p>
                  )}
                  {meeting.noRecordingReason && (
                    <p><strong>No Recording Reason:</strong> {meeting.noRecordingReason}</p>
                  )}

                  {meeting.mode === 'online' ? (
                    <p>
                      <strong>Zoom:</strong>{' '}
                      <a href={meeting.zoomLink} className="text-blue-600 underline">
                        {meeting.zoomLink}
                      </a>
                    </p>
                  ) : (
                    <p><strong>Venue:</strong> {meeting.venue}</p>
                  )}

                  {editingIndex === idx && !isClosedMeeting(meeting) && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div>
                        <label className="block font-medium mb-1">Reschedule Date</label>
                        <input
                          type="datetime-local"
                          value={accordionForm.date}
                          onChange={(e) => setAccordionForm((prev) => ({ ...prev, date: e.target.value }))}
                          className="w-full border rounded-lg p-2"
                        />
                      </div>

                      <div>
                        <label className="block font-medium mb-1">Event Mode</label>
                        <select
                          value={accordionForm.mode}
                          onChange={(e) => {
                            setDidChangeAccordionMode(true);
                            setAccordionForm((prev) => ({ ...prev, mode: e.target.value }));
                          }}
                          className="w-full border rounded-lg p-2"
                        >
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                        </select>
                      </div>

                      {accordionForm.mode === 'online' ? (
                        <div>
                          <label className="block font-medium mb-1">Zoom Link</label>
                          <input
                            type="text"
                            value={accordionForm.zoomLink}
                            onChange={(e) => setAccordionForm((prev) => ({ ...prev, zoomLink: e.target.value }))}
                            className="w-full border rounded-lg p-2"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block font-medium mb-1">Venue</label>
                          <input
                            type="text"
                            value={accordionForm.venue}
                            onChange={(e) => setAccordionForm((prev) => ({ ...prev, venue: e.target.value }))}
                            className="w-full border rounded-lg p-2"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block font-medium mb-1">Reason</label>
                        <textarea
                          value={accordionForm.reason}
                          onChange={(e) => setAccordionForm((prev) => ({ ...prev, reason: e.target.value }))}
                          className="w-full border rounded-lg p-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveAccordionReschedule(idx)}
                          className="bg-black text-white px-4 py-2 rounded"
                        >
                          Save Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null);
                            setDidChangeAccordionMode(false);
                            setAccordionForm(emptyAccordionForm);
                          }}
                          className="border px-4 py-2 rounded"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {getScheduleHistory(meeting).length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h5 className="font-semibold mb-3">Schedule Activity</h5>
                      <div className="space-y-3">
                        {getScheduleHistory(meeting).map((log) => (
                          <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="font-medium text-slate-900">{log.type}</p>
                            {log.happenedAt && (
                              <p className="text-sm text-slate-500 mt-1">
                                Logged on {formatLogTimestamp(log.happenedAt)}
                              </p>
                            )}
                            <div className="mt-2 space-y-1 text-sm text-slate-700">
                              {log.details.map((detail) => (
                                <p key={detail}>{detail}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Comments</h3>

        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map((entry, idx) => (
              <div
                key={entry.id || entry.timestamp || `comment-${idx}`}
                className="bg-gray-100 border rounded-lg p-3"
              >
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
                <p>{entry.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your message..."
            rows={2}
            className="flex-1 border rounded-lg p-2"
          />

          <button
            onClick={handleSendComment}
            className="bg-black text-white px-4 rounded-lg hover:bg-gray-800"
          >
            Send
          </button>
        </div>
      </div>

      <Modal
        open={doneModal.open}
        onClose={closeDoneModal}
        title="Complete Meeting"
        footer={
          <>
            <button
              type="button"
              onClick={closeDoneModal}
              className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitMeetingDone}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
            >
              Done
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Meeting Recording Link / Reference</label>
            <input
              type="text"
              value={doneModal.recordingLink}
              onChange={(e) =>
                setDoneModal((prev) => ({ ...prev, recordingLink: e.target.value }))
              }
              placeholder="Add the recording URL or reference"
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Reason if no recording is available</label>
            <textarea
              value={doneModal.noRecordingReason}
              onChange={(e) =>
                setDoneModal((prev) => ({ ...prev, noRecordingReason: e.target.value }))
              }
              placeholder="Explain why the recording could not be added"
              className="w-full border rounded-lg p-2"
              rows={4}
            />
            <p className="mt-2 text-sm text-slate-500">
              Add a recording or provide a reason with at least {MIN_NO_RECORDING_REASON_LENGTH} characters.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <strong>Logged By:</strong> {getLoggedByValue()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Followup;


