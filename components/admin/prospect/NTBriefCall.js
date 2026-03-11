import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import axios from 'axios';
import { COLLECTIONS } from "@/lib/utility_collection";
import emailjs from '@emailjs/browser';
import { db } from '@/firebaseConfig';

const Followup = ({ id, data = { followups: [], comments: [] ,event: [] }, fetchData }) => {
  const [followup, setFollowup] = useState([]);
  const [docData, setDocData] = useState({});
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [NTphone, setNTPhone] = useState('');
  const [Name, setName] = useState('');
  const [comments, setComments] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventMode, setEventMode] = useState('online');
  const [zoomLink, setZoomLink] = useState('');
  const [userList, setUserList] = useState([]);
  const [venue, setVenue] = useState('');

  const [rescheduleReason, setRescheduleReason] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [createMode, setCreateMode] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0/527476310441806/messages';
  const WHATSAPP_API_TOKEN = 'Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD';

  // Format a readable date from ISO or timestamp
  const formatReadableDate = (inputDate) => {
    if (!inputDate) return '';
    const d = typeof inputDate === 'number' ? new Date(inputDate) : new Date(inputDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'long' });
    const year = String(d.getFullYear()).slice(-2);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day} ${month} ${year} at ${hours}.${minutes} ${ampm}`;
  };

  // === NEW ===
  // helpers for datetime-local <-> ISO string
  const localToISO = (localValue) => {
    if (!localValue) return '';
    const d = new Date(localValue);
    return d.toISOString();
  };

  const isoToLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
  // === END NEW ===

  // === NEW ===
  // introevent array (multi-meetings) and accordion state
  const [introEvents, setIntroEvents] = useState([]); // will map to Firestore field "introevent"
  const [openIndex, setOpenIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [accordionForm, setAccordionForm] = useState({
    dateRaw: '',
    mode: 'online',
    zoomLink: '',
    venue: '',
    reason: ''
  });
  // === END NEW ===

useEffect(() => {

  const fetchDataLocal = async () => {

    try {

      // IMPORTANT: reset state first
      setIntroEvents([]);
      setComments([]);
      setFollowup([]);
      setDocData({});

      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {

        const d = docSnap.data();

        setDocData(d);
        setFollowup(d.followup || []);
        setComments(d.comments || []);

   if (Array.isArray(d.introevent)) {
  setIntroEvents(
    d.introevent.filter(e => e && e.date)
  );
} else {
  setIntroEvents([]);
}

      }

    } catch (err) {

      console.error("fetchDataLocal error:", err);

    }

  };

  if (id) fetchDataLocal();

}, [id]);

  const handleSendComment = async () => {
    if (!comment.trim()) return;

    const newComment = {
      text: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedComments = [newComment, ...comments];

    try {
      const docRef = doc(db, COLLECTIONS.prospect, id);
      await updateDoc(docRef, { comments: updatedComments });
      setComments(updatedComments);
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // === NEW ===
  // Persist introevent array to Firestore, optionally also update `event` for backward compatibility
  const persistIntroEvents = async (newArray, alsoUpdateEventField = false, latestEvent = null) => {
    try {
      const docRef = doc(db, COLLECTIONS.prospect, id);
      const payload = { introevent: newArray };
      if (alsoUpdateEventField) {
        // Keep legacy `event` field pointing to latest meeting (backwards compatibility)
        payload.event = latestEvent || (newArray.length ? {
          date: newArray[newArray.length - 1].date,
          mode: newArray[newArray.length - 1].mode,
          zoomLink: newArray[newArray.length - 1].zoomLink,
          venue: newArray[newArray.length - 1].venue,
          reason: newArray[newArray.length - 1].reason
        } : null);
      }
      await updateDoc(docRef, payload);
      setIntroEvents(newArray);
      if (alsoUpdateEventField && payload.event) {
       
      }
    } catch (err) {
      console.error('persistIntroEvents error:', err);
      throw err;
    }
  };
  // === END NEW ===

  const handleCreateOrReschedule = async () => {
    if (!eventDate.trim()) return alert('Please select a date');
    const formattedEventDate = formatReadableDate(eventDate);

    const eventDetails = {
      date: formattedEventDate,
      mode: eventMode,
      zoomLink: eventMode === 'online' ? zoomLink : '',
      venue: eventMode === 'offline' ? venue : '',
      reason: rescheduleMode ? rescheduleReason : '',
    };

    try {
      const docRef = doc(db,  COLLECTIONS.prospect, id);
      // Update legacy event field as before


      // === NEW ===
  const newIntroObj = {
  id: Date.now(), // index-based id
        date: formattedEventDate,
        dateRaw: localToISO(eventDate) || (eventDate ? new Date(eventDate).toISOString() : ''),
        mode: eventMode,
        zoomLink: eventMode === 'online' ? zoomLink : '',
        venue: eventMode === 'offline' ? venue : '',
        reason: rescheduleMode ? rescheduleReason : '',
        completed: false,
        createdAt: Date.now(),
        rescheduleHistory: []
      };

      if (rescheduleMode) {
        // If rescheduling via old UI, update last item in introEvents (if exists) and add reschedule log
        let updated = [];
        if (introEvents && introEvents.length > 0) {
          const lastIndex = introEvents.length - 1;
          const prev = introEvents[lastIndex];
          const rescheduleEntry = {
            oldDate: prev.dateRaw || (prev.date ? prev.date : ''),
            newDate: newIntroObj.dateRaw,
            reason: rescheduleReason || '',
            changedAt: Date.now()
          };
          const updatedLast = {
            ...prev,
            date: newIntroObj.date,
            dateRaw: newIntroObj.dateRaw,
            mode: newIntroObj.mode,
            zoomLink: newIntroObj.zoomLink,
            venue: newIntroObj.venue,
            reason: newIntroObj.reason,
            rescheduleHistory: [...(prev.rescheduleHistory || []), rescheduleEntry]
          };
          updated = [...introEvents.slice(0, lastIndex), updatedLast];
        } else {
          // nothing to reschedule; push new object
          updated = [...introEvents, newIntroObj];
        }
        await persistIntroEvents(updated, true, updated[updated.length - 1]);
      } else {
        // New meeting: append to introevent and also update legacy event
        const updated = [...(introEvents || []), newIntroObj];
        await persistIntroEvents(updated, true, newIntroObj);
      }
      // === END NEW ===

      alert(rescheduleMode ? 'Event rescheduled successfully!' : 'Event created successfully!');
      setCreateMode(false);
      setRescheduleMode(false);
      setRescheduleReason('');
      // clear the create form
      setEventDate('');
      setEventMode('online');
      setZoomLink('');
      setVenue('');

      // WhatsApp messages (unchanged)
    const messages = [
  {
    name: data.prospectName,
    phone: data.prospectPhone,
    date: formattedEventDate,
    zoomLink: eventMode === 'online' ? zoomLink : '',
    venue: eventMode === 'offline' ? venue : ''
  },
  {
    name: Name,        // NT Member selected
    phone: NTphone,    // NT Member phone
    date: formattedEventDate,
    zoomLink: eventMode === 'online' ? zoomLink : '',
    venue: eventMode === 'offline' ? venue : ''
  }
];


      for (const msg of messages) {
        await sendWhatsAppMessage({
          ...msg,
          isReschedule: rescheduleMode,
          reason: rescheduleReason,
          venue: eventMode === 'offline' ? venue : ''
        });
      }

      // Send email to prospect
      await sendEmailToProspect(
        data.prospectName,
        data.email,
        formattedEventDate,
        eventMode === 'online' ? zoomLink : '',
        rescheduleMode,
        rescheduleReason,
        eventMode === 'offline' ? venue : ''
      );
    } catch (error) {
      console.error('Error saving event or sending messages:', error);
    }
  };

  const sendEmailToProspect = async (prospectName, email, date, zoomLink, isReschedule = false, reason = '', venue = '') => {
    const scheduleDetails = zoomLink
      ? `Zoom Link: ${zoomLink}`
      : venue
        ? `Venue: ${venue}`
        : 'Details will be shared soon';

    const body = isReschedule
      ? `Dear ${prospectName},

As you are aware, due to ${reason}, we need to reschedule our upcoming call.

We are available for the call on ${date}. Please confirm if this works for you, or let us know a convenient time within the next two working days so we can align accordingly.`
      : `Thank you for confirming your availability. We look forward to connecting with you and sharing insights about UJustBe and how it fosters meaningful contributions in the areas of Relationship, Health, and Wealth.

Schedule details:

Date: ${date}  
${scheduleDetails}

Our conversation will be an opportunity to explore possibilities, answer any questions you may have, and understand how UJustBe aligns with your aspirations.

Looking forward to speaking with you soon! `;

    const templateParams = {
      prospect_name: prospectName,
      to_email: email,
      body,
    };

    try {
      await emailjs.send(
        'service_acyimrs',
        'template_cdm3n5x',
        templateParams,
        'w7YI9DEqR9sdiWX9h'
      );

      console.log(`✅ Email sent to ${prospectName} (${email})`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${prospectName}:`, error);
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
    const payload = {
      messaging_product: 'whatsapp',
      to: `91${phone}`,
      type: 'template',
      template: {
        name: isReschedule ? 'reschedule_meeting_otc' : 'schedule_message_otc',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: isReschedule
              ? [
                  { type: 'text', text: name },
                  { type: 'text', text: reason },
                  { type: 'text', text: date }
                ]
              : [
                  { type: 'text', text: name },
                  { type: 'text', text: date },
                  {
                    type: 'text',
                    text: zoomLink
                      ? `Zoom Link: ${zoomLink}`
                      : `Venue: ${venue}`
                  }
                ]
          }
        ]
      }
    };

    try {
      await axios.post(WHATSAPP_API_URL, payload, {
        headers: {
          Authorization: WHATSAPP_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ WhatsApp message sent to ${name} (${phone})`);
    } catch (err) {
      console.error(`❌ Failed to send message to ${name}:`, err.response?.data || err.message);
    }
  };


  // Function to send thank you message
  const sendThankYouMessage = async (name, phone) => {
    const payload = {
      messaging_product: 'whatsapp',
      to: `91${phone}`,
      type: 'template',
      template: {
        name: 'meeeting_done_thankyou_otc',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: name }]
          }
        ]
      }
    };

    try {
      await axios.post(WHATSAPP_API_URL, payload, {
        headers: {
          Authorization: WHATSAPP_API_TOKEN,
          'Content-Type': 'application/json',
        },
      });
      console.log(`✅ Message sent to ${name}`);
    } catch (error) {
      console.error(`❌ Failed to send message to ${name}`, error.response?.data || error.message);
    }
  };

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const userRef = collection(db, COLLECTIONS.userDetail);
      const snapshot = await getDocs(userRef);

      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,                 // UJB CODE ✔
          ujbCode: doc.id,            // optional alias
          name: d.Name || "",         // correct field
          phone: d.MobileNo || "",    // correct field
          email: d.Email || ""        // correct field
        };
      });

      setUserList(data);

    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  fetchUsers();
}, []);


  const handleSearchUser = (e) => {
    const value = e.target.value.toLowerCase();
    setUserSearch(value);
   const filtered = userList.filter(user =>
  user.name && user.name.toLowerCase().includes(value)
);

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
   setName(user.name);
  setNTPhone(user.phone);   // fixed
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

      const messagesToSend = [
        {
          name: data.prospectName,
          phone: data.prospectPhone,
          email: data.email, // <-- assuming prospect's email is here
        },
        {
          name: data.orbiterName,
          phone: data.orbiterContact,
          email: data.orbiterEmail, // <-- optional if available
        },
      ];

      for (const msg of messagesToSend) {
        await sendThankYouMessage(msg.name, msg.phone);
        if (msg.email) {
          await sendThankYouEmail(msg.name, msg.email);
        }
      }

      alert("Thank you messages sent successfully!");
    } catch (error) {
      console.error('Meeting Done Error:', error);
      alert("Something went wrong while sending messages.");
    }
  };

  // === NEW: Accordion helpers & operations for introevent ===
  const toggleOpen = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  const startAccordionEdit = (idx) => {
    const ev = introEvents[idx];
    setEditingIndex(idx);
    setAccordionForm({
      dateRaw: ev.dateRaw || '',
      mode: ev.mode || 'online',
      zoomLink: ev.zoomLink || '',
      venue: ev.venue || '',
      reason: ''
    });
    setOpenIndex(idx);
  };

  const saveAccordionReschedule = async (idx) => {
    if (!accordionForm.dateRaw) return alert('Select date & time');
    if (accordionForm.mode === 'online' && !accordionForm.zoomLink) return alert('Enter Zoom link');
    if (accordionForm.mode === 'offline' && !accordionForm.venue) return alert('Enter venue');

    const prev = introEvents[idx];
    const newDateRaw = localToISO(accordionForm.dateRaw) || (accordionForm.dateRaw ? new Date(accordionForm.dateRaw).toISOString() : '');
    const rescheduleEntry = {
      oldDate: prev.dateRaw || '',
      newDate: newDateRaw,
      reason: accordionForm.reason || '',
      changedAt: Date.now()
    };

    const updated = introEvents.map((ev, i) => {
      if (i !== idx) return ev;
      return {
        ...ev,
        date: formatReadableDate(newDateRaw),
        dateRaw: newDateRaw,
        mode: accordionForm.mode,
        zoomLink: accordionForm.mode === 'online' ? accordionForm.zoomLink : '',
        venue: accordionForm.mode === 'offline' ? accordionForm.venue : '',
        rescheduleHistory: [...(ev.rescheduleHistory || []), rescheduleEntry]
      };
    });

    try {
      // If this is the latest event, also update legacy event field
      const latestEvent = updated[updated.length - 1] || null;
      await persistIntroEvents(updated, true, latestEvent);
      setEditingIndex(null);
      setAccordionForm({ dateRaw: '', mode: 'online', zoomLink: '', venue: '', reason: '' });
      alert('Meeting rescheduled.');
    } catch (err) {
      console.error('saveAccordionReschedule', err);
      alert('Failed to reschedule.');
    }
  };

  const markAccordionDone = async (idx) => {
    const updated = introEvents.map((ev, i) => (i === idx ? { ...ev, completed: true } : ev));
    try {
      const latestEvent = updated[updated.length - 1] || null;
      await persistIntroEvents(updated, true, latestEvent);
      alert('Marked done.');
    } catch (err) {
      console.error('markAccordionDone', err);
      alert('Failed to mark done.');
    }
  };

  const deleteAccordionEvent = async (idx) => {
    if (!window.confirm('Delete this meeting?')) return;
const updated = introEvents.filter((_, i) => i !== idx);
    try {
      const latestEvent = updated.length ? updated[updated.length - 1] : null;
      await persistIntroEvents(updated, true, latestEvent);
      alert('Deleted.');
    } catch (err) {
      console.error('deleteAccordionEvent', err);
      alert('Failed to delete.');
    }
  };
  // === END NEW ===
return (
<div className="max-w-6xl mx-auto p-6 text-black">

<h2 className="text-2xl font-semibold mb-6">
Briefing on NT
</h2>


{/* Schedule Button */}

{!createMode && !rescheduleMode && (

<button
onClick={() => setCreateMode(true)}
className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 ml-auto block"
>
Schedule Meet
</button>

)}


{/* Latest Event */}

{introEvents.length > 0 && !createMode && !rescheduleMode && (

<div className="bg-white border rounded-xl p-6 shadow-sm mt-6">

<h4 className="font-semibold text-lg mb-4">
Event Details
</h4>

<p><strong>Date:</strong> {introEvents[introEvents.length - 1].date}</p>
<p><strong>Mode:</strong> {introEvents[introEvents.length - 1].mode}</p>

{introEvents[introEvents.length - 1].mode === "online" ? (

<p>
<strong>Zoom Link:</strong>{" "}
<a
href={introEvents[introEvents.length - 1].zoomLink}
target="_blank"
className="text-blue-600 underline"
>
{introEvents[introEvents.length - 1].zoomLink}
</a>
</p>

) : (

<p>
<strong>Venue:</strong> {introEvents[introEvents.length - 1].venue}
</p>

)}

<div className="flex gap-4 mt-4">

<button
className="bg-black text-white px-4 py-2 rounded-lg"
onClick={() => {
const last = introEvents[introEvents.length - 1];
setEventDate(last.dateRaw);
setEventMode(last.mode);
setZoomLink(last.zoomLink || "");
setVenue(last.venue || "");
setRescheduleMode(true);
}}
>
Reschedule
</button>

<button
onClick={handleMeetingDone}
className="bg-green-600 text-white px-4 py-2 rounded-lg"
>
Done
</button>

</div>

</div>

)}


{/* Schedule Form */}

{(createMode || rescheduleMode) && (

<div className="bg-white border rounded-xl p-6 shadow-sm mt-6 space-y-4">

<div>

<label className="font-medium">
Date
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

<label className="font-medium">
Reason for Rescheduling
</label>

<textarea
value={rescheduleReason}
onChange={(e) => setRescheduleReason(e.target.value)}
className="w-full border rounded-lg p-2"
/>

</div>

)}


{/* NT Member Search */}

<div>

<label className="font-medium">
Select NT Member
</label>

<input
type="text"
placeholder="Search NTMember"
value={userSearch}
onChange={handleSearchUser}
className="w-full border rounded-lg p-2"
/>


{filteredUsers.length > 0 && (

<div className="border rounded-lg mt-2 shadow bg-white">

{filteredUsers.map(user => (

<div
key={user.id}
onClick={() => handleSelectUser(user)}
className="p-2 hover:bg-gray-100 cursor-pointer"
>
{user.name} — {user.phone}
</div>

))}

</div>

)}

</div>


<div>

<p className="font-medium">Selected NT Member</p>

<p>{Name}</p>
<p>{NTphone}</p>

</div>


{!rescheduleMode && (

<>

<div>

<label className="font-medium">
Event Mode
</label>

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

<label className="font-medium">
Zoom Link
</label>

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

<label className="font-medium">
Venue
</label>

<input
type="text"
value={venue}
onChange={(e) => setVenue(e.target.value)}
className="w-full border rounded-lg p-2"
/>

</div>

)}

</>

)}

<button
onClick={handleCreateOrReschedule}
className="bg-black text-white px-5 py-2 rounded-lg"
>
{rescheduleMode ? "Reschedule" : "Schedule"}
</button>

</div>

)}


{/* Schedule Another Meeting */}

<div className="mt-6">

<button
onClick={() => {
setCreateMode(true);
setOpenIndex(null);
}}
className="bg-black text-white px-5 py-2 rounded-lg"
>
+ Schedule Another Meeting
</button>

</div>


{/* Meeting Accordion */}

<div className="mt-6 space-y-4">

{introEvents.length === 0 ? (

<p className="text-gray-500">
No meetings scheduled yet.
</p>

) : (

introEvents.map((ev, idx) => (

<div
key={idx}
className="border rounded-xl p-4 bg-white shadow-sm"
>

<div className="flex justify-between items-center">

<div className="font-semibold">

Meeting #{idx + 1} — {ev.date}

{ev.completed && (
<span className="text-green-600 ml-2">[Done]</span>
)}

</div>


<div className="flex gap-2">

<button
onClick={() => toggleOpen(idx)}
className="border px-3 py-1 rounded"
>
{openIndex === idx ? "Collapse" : "Expand"}
</button>


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
onClick={() => deleteAccordionEvent(idx)}
className="bg-red-600 text-white px-3 py-1 rounded"
>
Delete
</button>

</div>

</div>


{openIndex === idx && (

<div className="mt-4 space-y-2">

<p><strong>Mode:</strong> {ev.mode}</p>

{ev.mode === "online" ? (

<p>
<strong>Zoom Link:</strong>{" "}
<a
href={ev.zoomLink}
target="_blank"
className="text-blue-600 underline"
>
{ev.zoomLink}
</a>
</p>

) : (

<p>
<strong>Venue:</strong> {ev.venue}
</p>

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

<p>No comments yet.</p>

) : (

<div className="space-y-3">

{comments.map((c, idx) => (

<div
key={idx}
className="bg-gray-100 p-3 rounded-lg"
>

<p className="text-xs text-gray-500">
{new Date(c.timestamp).toLocaleString()}
</p>

<p>{c.text}</p>

</div>

))}

</div>

)}


<div className="flex gap-3 mt-4">

<textarea
value={comment}
onChange={(e) => setComment(e.target.value)}
placeholder="Write your message..."
className="flex-1 border rounded-lg p-2"
/>

<button
onClick={handleSendComment}
className="bg-black text-white px-4 rounded-lg"
>
Send
</button>

</div>

</div>

</div>
);
};

export default Followup;
