import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { sendWhatsAppTemplateRequest } from '@/utils/whatsappClient';

const Followup = ({ id, data = { followups: [], comments: [] ,event: [] }, fetchData }) => {
  const [followup, setFollowup] = useState([]);
  const [docData, setDocData] = useState({});
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [NTphone, setNTPhone] = useState('');
  const [NTemail, setNTEmail] = useState('');
  const [Name, setName] = useState('');
  const [comments, setComments] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventMode, setEventMode] = useState('online');
  const [zoomLink, setZoomLink] = useState('');
  const [userList, setUserList] = useState([]);
  const [venue, setVenue] = useState('');
  const [eventCreated, setEventCreated] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [createMode, setCreateMode] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);

  // === NEW ===
  // store all events (multiple meetings) — will be synced with Firestore field `events`
  const [eventsList, setEventsList] = useState([]);
  // accordion ui
  const [openIndex, setOpenIndex] = useState(null);
  // editing index for accordion reschedule
  const [editingIndex, setEditingIndex] = useState(null);
  // form used for accordion reschedule (reuses eventDate/eventMode/zoomLink/venue but keep separate to avoid conflict)
  const [accordionForm, setAccordionForm] = useState({
    date: '',
    mode: 'online',
    zoomLink: '',
    venue: '',
    reason: ''
  });
  // === END NEW ===

  const getMeetingStatus = (meeting) => {
    if (!meeting) return 'Scheduled';
    if (meeting.status) return meeting.status;
    if (meeting.completed) return 'Done';
    if (meeting.cancelled) return 'Cancelled';
    return 'Scheduled';
  };

  const isClosedMeeting = (meeting) => {
    const status = getMeetingStatus(meeting);
    return status === 'Done' || status === 'Cancelled';
  };

  const updateProspectSection = async (updatePayload) => {
    const res = await fetch(`/api/admin/prospects?id=${id}&section=followups`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ update: updatePayload }),
    });
    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(responseData.message || "Failed to update meeting logs");
    }
  };


// ================= CP HELPERS =================

const addCpForMeetingDone = async (orbiter, prospect, mode) => {
  if (!orbiter?.ujbcode) return;

  await ensureCpBoardUser(db, orbiter);

  const activityNo = mode === "online" ? "004" : "005";
  const activityName =
    mode === "online"
      ? "Ensuring Attendance for Doorstep (Online)"
      : "Ensuring Attendance for Doorstep (Offline)";

  const points = 25;
  const categories = ["R"]; // 🔁 adjust later if needed

  const q = query(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    where("activityNo", "==", activityNo),
    where("prospectPhone", "==", prospect.prospectPhone)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  await addDoc(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    {
      activityNo,
      activityName,
      points,
      categories,
      purpose:
        mode === "online"
          ? "Acknowledges consistent follow-up and engagement to ensure participation."
          : "Recognizes offline engagement and commitment to onboarding experience.",
      prospectName: prospect.prospectName,
      prospectPhone: prospect.prospectPhone,
      source: "MeetingDone",
      month: new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      addedAt: serverTimestamp(),
    }
  );

  // ✅ UPDATE TOTALS
  await updateCategoryTotals(orbiter, categories, points);
};

const ensureCpBoardUser = async (db, orbiter) => {
  if (!orbiter?.ujbcode) return;

  const ref = doc(db, "CPBoard", orbiter.ujbcode);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      id: orbiter.ujbcode,
      name: orbiter.name,
      phoneNumber: orbiter.phone,
      role: orbiter.category || "MentOrbiter",
      totals: { R: 0, H: 0, W: 0 }, // ✅ REQUIRED
      createdAt: serverTimestamp(),
    });
  }
};


const addCpForMeetingScheduled = async (
  db,
  orbiter,
  prospectPhone,
  prospectName
) => {
  if (!orbiter?.ujbcode) return;

  await ensureCpBoardUser(db, orbiter);

  const activityNo = "003";
  const points = 25;
  const categories = ["R"]; // 🔁 can be ["R","H"] later

  const q = query(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    where("activityNo", "==", activityNo),
    where("prospectPhone", "==", prospectPhone)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  await addDoc(
    collection(db, "CPBoard", orbiter.ujbcode, "activities"),
    {
      activityNo,
      activityName: "Prospect Invitation to Doorstep",
      points,
      categories, // ✅ store categories
      purpose:
        "Rewards outreach effort and relationship-building intent by extending a formal invite.",
      prospectName,
      prospectPhone,
      source: "MeetingScheduled",
      month: new Date().toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      addedAt: serverTimestamp(),
    }
  );

  // ✅ UPDATE TOTALS
  await updateCategoryTotals(orbiter, categories, points);
};


  const formatReadableDate = (inputDate) => {
    if (!inputDate) return '';
    const d = new Date(inputDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'long' });
    const year = String(d.getFullYear()).slice(-2);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${day} ${month} ${year} at ${hours}.${minutes} ${ampm}`;
  };

  const formatLogTimestamp = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : formatReadableDate(parsed.toISOString());
  };

  const getScheduleHistory = (meeting) => {
    if (!meeting) return [];

    const history = [];

    history.push({
      id: `scheduled-${meeting.id ?? meeting.dateISO ?? meeting.date ?? 'meeting'}`,
      type: 'Scheduled',
      happenedAt: meeting.createdAt || meeting.dateISO || meeting.date,
      details: [
        meeting.date ? `Meeting date: ${meeting.date}` : '',
        meeting.mode ? `Mode: ${meeting.mode}` : '',
        meeting.mode === 'online' && meeting.zoomLink ? `Zoom: ${meeting.zoomLink}` : '',
        meeting.mode === 'offline' && meeting.venue ? `Venue: ${meeting.venue}` : '',
      ].filter(Boolean),
    });

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

    return history;
  };

  // === NEW ===
  const localToISO = (localValue) => {
    // input from datetime-local (YYYY-MM-DDTHH:MM)
    if (!localValue) return '';
    const d = new Date(localValue);
    return d.toISOString();
  };

  const isoToLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const safeToIsoString = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  };
  // === END NEW ===

  useEffect(() => {
    const fetchDataLocal = async () => {
      try {
        const res = await fetch(`/api/admin/prospects?id=${id}&section=followups`, {
          credentials: "include",
        });
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.message || "Failed to fetch meeting logs");
        }

        const dataDoc = responseData.prospect || {};
        setDocData(dataDoc);
        setFollowup(dataDoc.followup || []);
        setComments(dataDoc.comments || []);
        if (dataDoc.event) {
          setEventCreated(dataDoc.event);
        }

        if (Array.isArray(dataDoc.events)) {
          setEventsList(
            dataDoc.events.map((event, index) => ({
              id: event.id ?? index,
              ...event,
              status: getMeetingStatus(event),
            }))
          );
        } else if (dataDoc.event) {
          const single = {
            id: 0,
            date: dataDoc.event.date || '',
            dateISO: dataDoc.event.dateISO || safeToIsoString(dataDoc.event.date),
            mode: dataDoc.event.mode || dataDoc.event.eventMode || 'online',
            zoomLink: dataDoc.event.zoomLink || '',
            venue: dataDoc.event.venue || '',
            reason: dataDoc.event.reason || '',
            completed: dataDoc.event.completed || false,
            status: getMeetingStatus(dataDoc.event),
            createdAt: dataDoc.event.createdAt || Date.now(),
            rescheduleHistory: dataDoc.event.rescheduleHistory || []
          };
          setEventsList([single]);
        } else {
          setEventsList([]);
        }

        setUserList(Array.isArray(responseData.users) ? responseData.users : []);
      } catch (err) {
        console.error('fetchDataLocal error:', err);
      }
    };

    if (id) fetchDataLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // === NEW: helper to persist eventsList entire array to Firestore ===
  const persistEventsArray = async (newEventsArray, alsoUpdateEventField = false, latestEventForEventField = null) => {
    try {
      const updatePayload = { events: newEventsArray };
      // If we want to keep backward compatibility: also update `event` with latest event
      if (alsoUpdateEventField) {
        updatePayload.event = latestEventForEventField || (newEventsArray.length ? newEventsArray[newEventsArray.length - 1] : null);
      }
      await updateProspectSection(updatePayload);
      setEventsList(newEventsArray);

      // update local eventCreated if we updated `event` field
      if (alsoUpdateEventField) {
        setEventCreated(latestEventForEventField || (newEventsArray.length ? newEventsArray[newEventsArray.length - 1] : null));
      }
    } catch (err) {
      console.error('persistEventsArray error:', err);
      throw err;
    }
  };
  // === END NEW ===

 const handleCreateOrReschedule = async () => {
  if (!eventDate.trim()) return alert('Please select a date');
  if (eventMode === 'online' && !zoomLink.trim()) return alert('Enter Zoom link');
  if (eventMode === 'offline' && !venue.trim()) return alert('Enter venue');

  const formattedEventDate = formatReadableDate(eventDate);

  const eventDetails = {
    date: formattedEventDate,
    mode: eventMode,
    zoomLink: eventMode === 'online' ? zoomLink : '',
    venue: eventMode === 'offline' ? venue : '',
    reason: rescheduleMode ? rescheduleReason : '',
    status: 'Scheduled',
    completed: false,
    NTMemberName: Name || '',
    NTMemberPhone: NTphone || '',
    NTMemberEmail: NTemail || '',
  };

  try {
    const newEventObj = {
      id: eventsList.length,
      date: formattedEventDate,
      dateISO: localToISO(eventDate) || new Date(eventDate).toISOString(),
      mode: eventMode,
      zoomLink: eventMode === 'online' ? zoomLink : '',
      venue: eventMode === 'offline' ? venue : '',
      reason: rescheduleMode ? rescheduleReason : '',
      completed: false,
      status: 'Scheduled',
      NTMemberName: Name || '',
      NTMemberPhone: NTphone || '',
      NTMemberEmail: NTemail || '',
      createdAt: Date.now(),
      rescheduleHistory: [],
    };

    /* ================= RESCHEDULE FLOW ================= */
    if (rescheduleMode) {
      setEventCreated(eventDetails);

      let updatedEvents = [];

      if (eventsList.length > 0) {
        const lastIndex = eventsList.length - 1;
        const prev = eventsList[lastIndex];

        const rescheduleEntry = {
          previousDateISO: prev.dateISO,
          newDateISO: newEventObj.dateISO,
          previousMode: prev.mode,
          newMode: newEventObj.mode,
          reason: rescheduleReason || '',
          rescheduledAt: Date.now(),
        };

        updatedEvents = [
          ...eventsList.slice(0, lastIndex),
          {
            ...prev,
            date: newEventObj.date,
            dateISO: newEventObj.dateISO,
            mode: newEventObj.mode,
            zoomLink: newEventObj.zoomLink,
            venue: newEventObj.venue,
            status: 'Scheduled',
            completed: false,
            NTMemberName: Name || prev.NTMemberName || '',
            NTMemberPhone: NTphone || prev.NTMemberPhone || '',
            NTMemberEmail: NTemail || prev.NTMemberEmail || '',
            rescheduleHistory: [
              ...(prev.rescheduleHistory || []),
              rescheduleEntry,
            ],
          },
        ];
      } else {
        updatedEvents = [...eventsList, newEventObj];
      }

      await persistEventsArray(updatedEvents, true, updatedEvents.at(-1));
    }

    /* ================= FIRST TIME SCHEDULE ================= */
    else {
      setEventCreated(eventDetails);

      const updatedEvents = [...(eventsList || []), newEventObj];
      await persistEventsArray(updatedEvents, true, newEventObj);

      /* ⭐ ADD CP POINTS (Activity 003) */
    }

    /* ================= UI RESET ================= */
    alert(rescheduleMode ? 'Event rescheduled successfully!' : 'Event created successfully!');
    setCreateMode(false);
    setRescheduleMode(false);
    setRescheduleReason('');
    setEventDate('');
    setEventMode('online');
    setZoomLink('');
    setVenue('');

    /* ================= NOTIFICATIONS ================= */
    const messages = [
      {
        name: data.prospectName,
        phone: data.prospectPhone,
        date: formattedEventDate,
        zoomLink: eventMode === 'online' ? zoomLink : '',
        venue: eventMode === 'offline' ? venue : '',
      },
      {
        name: Name || data.orbiterName,
        phone: NTphone || data.orbiterContact,
        date: formattedEventDate,
        zoomLink: eventMode === 'online' ? zoomLink : '',
        venue: eventMode === 'offline' ? venue : '',
      },
    ];

    for (const msg of messages) {
      await sendWhatsAppMessage({
        ...msg,
        isReschedule: rescheduleMode,
        reason: rescheduleReason,
      });
    }

    const emailRecipients = [
      { name: data.prospectName, email: data.email },
      { name: Name || data.orbiterName, email: NTemail || data.orbiterEmail },
    ].filter((recipient) => recipient.email);

    await Promise.all(
      emailRecipients.map((recipient) =>
        sendMeetingEmail({
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          date: formattedEventDate,
          zoomLink: eventMode === 'online' ? zoomLink : '',
          isReschedule: rescheduleMode,
          reason: rescheduleReason,
          venue: eventMode === 'offline' ? venue : '',
        })
      )
    );

  } catch (error) {
    console.error('Error saving event or sending messages:', error);
  }
};


  const sendMeetingEmail = async ({
    recipientName,
    recipientEmail,
    date,
    zoomLink,
    isReschedule = false,
    isCancelled = false,
    reason = '',
    venue = '',
  }) => {
    const scheduleDetails = zoomLink
      ? `Zoom Link: ${zoomLink}`
      : venue
        ? `Venue: ${venue}`
        : 'Details will be shared soon';

    const body = isCancelled
      ? `Dear ${recipientName},

We need to inform you that the scheduled meeting has been cancelled.

Meeting details:

Date: ${date}
${scheduleDetails}

Reason: ${reason || 'Scheduling constraints'}

We will reconnect with the next available slot soon.`
      : isReschedule
      ? `Dear ${recipientName},

As you are aware, due to ${reason}, we need to reschedule our upcoming call.

We are available for the call on ${date}. Please confirm if this works for you, or let us know a convenient time within the next two working days so we can align accordingly.

${scheduleDetails}`
      : `Thank you for confirming your availability. We look forward to connecting with you and sharing insights about UJustBe and how it fosters meaningful contributions in the areas of Relationship, Health, and Wealth.

Schedule details:

Date: ${date}  
${scheduleDetails}

Our conversation will be an opportunity to explore possibilities, answer any questions you may have, and understand how UJustBe aligns with your aspirations.

    Looking forward to speaking with you soon! `;

    const templateParams = {
      prospect_name: recipientName,
      to_email: recipientEmail,
      body,
    };

    try {
      await emailjs.send(
        'service_acyimrs',
        'template_cdm3n5x',
        templateParams,
        'w7YI9DEqR9sdiWX9h'
      );

      console.log(`Email sent to ${recipientName} (${recipientEmail})`);
    } catch (error) {
      console.error(`Failed to send email to ${recipientName}:`, error);
    }
  };

  const sendWhatsAppMessage = async ({
    name,
    phone,
    date,
    zoomLink,
    isReschedule = false,
    reason = '',
    venue = ''
  }) => {
    try {
      await sendWhatsAppTemplateRequest({
        phone,
        templateName: isReschedule ? 'reschedule_meeting_otc' : 'schedule_message_otc',
        parameters: isReschedule
          ? [name, reason, date]
          : [name, date, zoomLink ? `Zoom Link: ${zoomLink}` : `Venue: ${venue}`],
      });

      console.log(`✅ WhatsApp message sent to ${name} (${phone})`);
    } catch (err) {
      console.error(`❌ Failed to send message to ${name}:`, err.response?.data || err.message);
    }
  };

  // Function to send thank you message
  const sendThankYouMessage = async (name, phone) => {
    try {
      await sendWhatsAppTemplateRequest({
        phone,
        templateName: 'meeeting_done_thankyou_otc',
        parameters: [name],
      });
      console.log(`✅ Message sent to ${name}`);
    } catch (error) {
      console.error(`❌ Failed to send message to ${name}`, error.response?.data || error.message);
    }
  };

  const handleSearchUser = (e) => {
    const value = e.target.value.toLowerCase();
    setUserSearch(value);
    const filtered = userList.filter(user =>
        user.name && user.name.toLowerCase().includes(value)
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setName(user.name || '');
    setNTPhone(user.phone || '');
    setNTEmail(user.email || '');
    setUserSearch('');
    setFilteredUsers([]);
  };
  const sendThankYouEmail = async (recipientName, recipientEmail) => {
    const body = `Dear ${recipientName},

Thank you for taking the time to connect with us. It was a pleasure learning about your interests and sharing how UJustBe creates meaningful contributions in the areas of Relationship, Health, and Wealth. We truly value the time and energy you invested in this conversation.

As you reflect on our discussion, we hope you consider how being part of the UJustBe Universe can contribute to building stronger connections, enhancing well-being, and creating possibilities for growth and collaboration. Should you have any questions or require further clarity, we are here to support you.

Regardless of your choice, we are grateful for the opportunity to connect with you and would love to stay in touch. UJustBe is a space where contributions in all aspects of life lead to shared progress and empowerment, and we hope to welcome you into this journey whenever it feels right for you.`;

    const templateParams = {
      prospect_name: recipientName,
      to_email: recipientEmail,
      body,
    };

    try {
      await emailjs.send(
        'service_acyimrs',
        'template_cdm3n5x',
        templateParams,
        'w7YI9DEqR9sdiWX9h'
      );
      console.log(`✅ Thank you email sent to ${recipientName}`);
    } catch (error) {
      console.error(`❌ Failed to send thank you email to ${recipientName}:`, error);
    }
  };

  // Button handler
 const handleMeetingDone = async () => {
  try {
    if (!data) return alert("Prospect data not available");

    const latestOpenMatch = [...eventsList]
      .map((meeting, index) => ({ meeting, index }))
      .reverse()
      .find(({ meeting }) => !isClosedMeeting(meeting));

    const latestOpenIndex = latestOpenMatch?.index;
    const latestOpenMeeting = latestOpenMatch?.meeting;

    if (latestOpenIndex === undefined) {
      return alert("No active meeting found.");
    }

    /* ====== SEND THANK YOU ====== */
      const messagesToSend = [
        {
          name: data.prospectName,
          phone: data.prospectPhone,
          email: data.email,
        },
        {
          name: latestOpenMeeting?.NTMemberName || data.orbiterName,
          phone: latestOpenMeeting?.NTMemberPhone || data.orbiterContact,
          email: latestOpenMeeting?.NTMemberEmail || data.orbiterEmail,
        },
      ];

    for (const msg of messagesToSend) {
      await sendThankYouMessage(msg.name, msg.phone);
      if (msg.email) {
        await sendThankYouEmail(msg.name, msg.email);
      }
    }

    const updatedEvents = eventsList.map((meeting, index) =>
      index === latestOpenIndex
        ? { ...meeting, completed: true, status: 'Done', completedAt: Date.now() }
        : meeting
    );
    const latestEvent = updatedEvents.length ? updatedEvents[updatedEvents.length - 1] : null;
    await persistEventsArray(updatedEvents, true, latestEvent);

    alert("Meeting marked as done successfully!");
  } catch (error) {
    console.error("Meeting Done Error:", error);
    alert("Something went wrong while completing meeting.");
  }
};


  // === NEW: Accordion reschedule handlers & UI helpers ===
  const toggleOpen = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  const startAccordionEdit = (idx) => {
    const ev = eventsList[idx];
    setEditingIndex(idx);
    setAccordionForm({
      date: ev.dateISO ? isoToLocal(ev.dateISO) : '',
      mode: ev.mode || 'online',
      zoomLink: ev.zoomLink || '',
      venue: ev.venue || '',
      reason: ''
    });
    setOpenIndex(idx);
  };

  const saveAccordionReschedule = async (idx) => {
    if (!accordionForm.date) return alert('Select date & time');
    if (accordionForm.mode === 'online' && !accordionForm.zoomLink) return alert('Enter Zoom link');
    if (accordionForm.mode === 'offline' && !accordionForm.venue) return alert('Enter venue');

    const prev = eventsList[idx];
    const newDateISO = localToISO(accordionForm.date) || new Date(accordionForm.date).toISOString();
    const rescheduleEntry = {
      previousDateISO: prev.dateISO || (prev.date ? new Date(prev.date).toISOString() : ''),
      newDateISO,
      previousMode: prev.mode || '',
      newMode: accordionForm.mode,
      reason: accordionForm.reason || '',
      rescheduledAt: Date.now()
    };

    const updated = eventsList.map((ev, i) => {
      if (i !== idx) return ev;
      return {
        ...ev,
        date: formatReadableDate(newDateISO),
        dateISO: newDateISO,
        mode: accordionForm.mode,
        zoomLink: accordionForm.mode === 'online' ? accordionForm.zoomLink : '',
        venue: accordionForm.mode === 'offline' ? accordionForm.venue : '',
        status: 'Scheduled',
        completed: false,
        rescheduleHistory: [...(ev.rescheduleHistory || []), rescheduleEntry]
      };
    });

    // persist: update events[], and if this is the latest event, also update `event` field for backward compat
    try {
      const latestEvent = updated[updated.length - 1];
      await persistEventsArray(updated, true, latestEvent);
      const updatedMeeting = updated[idx];
      const emailRecipients = [
        { name: data.prospectName, email: data.email },
        {
          name: updatedMeeting?.NTMemberName || data.orbiterName,
          email: updatedMeeting?.NTMemberEmail || data.orbiterEmail,
        },
      ].filter((recipient) => recipient.email);

      await Promise.all(
        emailRecipients.map((recipient) =>
          sendMeetingEmail({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            date: updatedMeeting?.date || '',
            zoomLink: updatedMeeting?.zoomLink || '',
            isReschedule: true,
            reason: accordionForm.reason || '',
            venue: updatedMeeting?.venue || '',
          })
        )
      );

      setEditingIndex(null);
      setAccordionForm({ date: '', mode: 'online', zoomLink: '', venue: '', reason: '' });
      alert('Meeting rescheduled.');
    } catch (err) {
      console.error('saveAccordionReschedule', err);
      alert('Failed to reschedule.');
    }
  };

  const markAccordionDone = async (idx) => {
    const updated = eventsList.map((ev, i) =>
      i === idx ? { ...ev, completed: true, status: 'Done', completedAt: Date.now() } : ev
    );
    try {
      const latestEvent = updated[updated.length - 1];
      await persistEventsArray(updated, true, latestEvent);
      alert('Marked done.');
    } catch (err) {
      console.error('markAccordionDone', err);
      alert('Failed to mark done.');
    }
  };

  const cancelAccordionEvent = async (idx) => {
    if (!window.confirm('Cancel this meeting?')) return;

    const meeting = eventsList[idx];
    const updated = eventsList.map((ev, i) =>
      i === idx
        ? { ...ev, cancelled: true, status: 'Cancelled', completed: false, cancelledAt: Date.now() }
        : ev
    );
    try {
      const latestEvent = updated.length ? updated[updated.length - 1] : null;
      await persistEventsArray(updated, true, latestEvent);

      const emailRecipients = [
        { name: data.prospectName, email: data.email },
        { name: meeting?.NTMemberName, email: meeting?.NTMemberEmail },
      ].filter((recipient) => recipient.email);

      await Promise.all(
        emailRecipients.map((recipient) =>
          sendMeetingEmail({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            date: meeting?.date || '',
            zoomLink: meeting?.zoomLink || '',
            isCancelled: true,
            reason: meeting?.reason || 'Meeting cancelled by the team',
            venue: meeting?.venue || '',
          })
        )
      );

      alert('Meeting cancelled.');
    } catch (err) {
      console.error('cancelAccordionEvent', err);
      alert('Failed to cancel.');
    }
  };
  // === END NEW ===

const resetMeetingForm = () => {
  setCreateMode(false);
  setRescheduleMode(false);
  setRescheduleReason('');
  setEventDate('');
  setEventMode('online');
  setZoomLink('');
  setVenue('');
  setName('');
  setNTPhone('');
  setNTEmail('');
};

const requiredLabel = (label) => (
  <>
    {label}
    <span className="text-red-600"> *</span>
  </>
);

const latestMeeting = eventsList.length ? eventsList[eventsList.length - 1] : eventCreated;
const showLatestMeetingBox = latestMeeting && !isClosedMeeting(latestMeeting);

return (
<div className="max-w-6xl mx-auto p-6 text-black">

<h2 className="text-2xl font-semibold mb-6 border-b pb-2">
Meeting Schedule Logs
</h2>

{/* Schedule Meet Button */}

{!createMode && !showLatestMeetingBox && (
<button
onClick={() => setCreateMode(true)}
className="ml-auto block bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
>
Schedule Meet
</button>
)}

{/* Event Details */}

{showLatestMeetingBox && !rescheduleMode && (
<div className="bg-white border rounded-xl shadow-sm p-6 mt-6">

<h4 className="font-semibold text-lg mb-3">Event Details</h4>

<p className="mb-2"><strong>Date:</strong> {latestMeeting.date}</p>
<p className="mb-2"><strong>Mode:</strong> {latestMeeting.mode}</p>

{latestMeeting.mode === "online" ? (
<p>
<strong>Zoom Link:</strong>{" "}
<a
href={latestMeeting.zoomLink}
target="_blank"
className="text-blue-600 underline"
>
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
setEventMode(latestMeeting.mode);
setZoomLink(latestMeeting.zoomLink || "");
setVenue(latestMeeting.venue || "");
setName(latestMeeting.NTMemberName || '');
setNTPhone(latestMeeting.NTMemberPhone || '');
setNTEmail(latestMeeting.NTMemberEmail || '');
setRescheduleMode(true);
}}
>
Reschedule
</button>

<button
className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
onClick={handleMeetingDone}
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
<p className="font-medium text-slate-900">
{log.type}
</p>
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

{/* Schedule Form */}

{(createMode || rescheduleMode) && (
<div className="bg-white border rounded-xl shadow-sm p-6 mt-6 space-y-4">

<div>
<label className="block font-medium mb-1">{requiredLabel("Date")}</label>
<input
type="datetime-local"
value={eventDate}
onChange={(e) => setEventDate(e.target.value)}
className="w-full border rounded-lg p-2"
/>
</div>

{rescheduleMode && (
<div>
<label className="block font-medium mb-1">{requiredLabel("Reason")}</label>
<textarea
value={rescheduleReason}
onChange={(e) => setRescheduleReason(e.target.value)}
className="w-full border rounded-lg p-2"
/>
</div>
)}

<div>
<label className="block font-medium mb-1">{requiredLabel("Event Mode")}</label>
<select
value={eventMode}
onChange={(e) => setEventMode(e.target.value)}
className="w-full border rounded-lg p-2"
>
<option value="online">Online</option>
<option value="offline">Offline</option>
</select>
</div>

{eventMode === "online" && (
<div>
<label className="block font-medium mb-1">{requiredLabel("Zoom Link")}</label>
<input
type="text"
value={zoomLink}
onChange={(e) => setZoomLink(e.target.value)}
className="w-full border rounded-lg p-2"
/>
</div>
)}

{eventMode === "offline" && (
<div>
<label className="block font-medium mb-1">{requiredLabel("Venue")}</label>
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
{rescheduleMode ? "Reschedule" : "Schedule"}
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

{/* Accordion Meeting List */}

<div className="mt-6 space-y-4">

{eventsList.length === 0 ? (
<p className="text-gray-500">No meetings scheduled yet.</p>
) : (
eventsList.map((ev, idx) => (

<div key={ev.id ?? `event-${ev.dateISO || ev.date || idx}`} className="border rounded-xl p-4 bg-white shadow-sm">

<div className="flex justify-between items-center">

<div className="font-semibold">
Meeting #{idx + 1} — {ev.date}
{getMeetingStatus(ev) === 'Done' && (
<span className="text-green-600 ml-2 font-bold">
[Done]
</span>
)}
{getMeetingStatus(ev) === 'Cancelled' && (
<span className="text-red-600 ml-2 font-bold">
[Cancelled]
</span>
)}
</div>

<div className="flex gap-2">

<button
onClick={() => toggleOpen(idx)}
className="text-sm px-3 py-1 border rounded"
>
{openIndex === idx ? "Collapse" : "Expand"}
</button>

{!isClosedMeeting(ev) && (
<>
<button
onClick={() => startAccordionEdit(idx)}
className="bg-black text-white px-3 py-1 rounded"
>
Reschedule
</button>

<button
onClick={() => markAccordionDone(idx)}
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

<p><strong>Mode:</strong> {ev.mode}</p>

{ev.mode === "online" ? (
<p>
<strong>Zoom:</strong>{" "}
<a href={ev.zoomLink} className="text-blue-600 underline">
{ev.zoomLink}
</a>
</p>
) : (
<p><strong>Venue:</strong> {ev.venue}</p>
)}

{editingIndex === idx && !isClosedMeeting(ev) && (
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
onChange={(e) => setAccordionForm((prev) => ({ ...prev, mode: e.target.value }))}
className="w-full border rounded-lg p-2"
>
<option value="online">Online</option>
<option value="offline">Offline</option>
</select>
</div>

{accordionForm.mode === "online" ? (
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
setAccordionForm({ date: '', mode: 'online', zoomLink: '', venue: '', reason: '' });
}}
className="border px-4 py-2 rounded"
>
Close
</button>
</div>
</div>
)}

{getScheduleHistory(ev).length > 0 && (
<div className="mt-4 border-t pt-4">
<h5 className="font-semibold mb-3">Schedule Activity</h5>
<div className="space-y-3">
{getScheduleHistory(ev).map((log) => (
<div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
<p className="font-medium text-slate-900">
{log.type}
</p>
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

{/* Comments */}

<div className="mt-10">

<h3 className="text-xl font-semibold mb-4">
Comments
</h3>

{comments.length === 0 ? (
<p className="text-gray-500">No comments yet.</p>
) : (
<div className="space-y-3 mb-4">

{comments.map((c, idx) => (
<div
key={c.id || c.timestamp || `comment-${idx}`}
className="bg-gray-100 border rounded-lg p-3"
>
<p className="text-xs text-gray-500 mb-1">
{new Date(c.timestamp).toLocaleString()}
</p>
<p>{c.text}</p>
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

</div>
);
};

export default Followup;



