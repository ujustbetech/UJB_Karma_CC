"use client";

import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

const Followup = ({ id, data = {} }) => {

  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const [createMode, setCreateMode] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);

  const [eventDate, setEventDate] = useState("");
  const [eventMode, setEventMode] = useState("online");
  const [zoomLink, setZoomLink] = useState("");
  const [venue, setVenue] = useState("");

  const [eventCreated, setEventCreated] = useState(null);
  const [meetings, setMeetings] = useState([]);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {

    const fetchProspect = async () => {

      const docRef = doc(db, COLLECTIONS.prospect, id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {

        const d = snap.data();
        setComments(d.comments || []);

      }

      fetchMeetings();
    };

    fetchProspect();

  }, [id]);

  /* ---------------- FETCH MEETINGS ---------------- */

  const fetchMeetings = async () => {

    const meetingRef = collection(db, COLLECTIONS.prospect, id, "meetings");
    const snapshot = await getDocs(meetingRef);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    data.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

    setMeetings(data);

    if(data.length > 0){
      setEventCreated(data[0]);
    }

  };

  /* ---------------- FORMAT DATE ---------------- */

  const formatReadableDate = (inputDate) => {

    if(!inputDate) return "—";

    const d = new Date(inputDate);

    const day = String(d.getDate()).padStart(2,"0");
    const month = d.toLocaleString("en-GB",{month:"long"});
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2,"0");

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
  };

  /* ---------------- CREATE / RESCHEDULE ---------------- */

  const handleCreateOrReschedule = async () => {

    if(!eventDate) return alert("Please select date");

    const formattedEventDate = formatReadableDate(eventDate);

    const meetingData = {
      rawDate: eventDate,
      date: formattedEventDate,
      mode: eventMode,
      zoomLink: eventMode === "online" ? zoomLink : "",
      venue: eventMode === "offline" ? venue : "",
      createdAt: new Date()
    };

    try{

      const meetingRef = collection(db, COLLECTIONS.prospect, id, "meetings");

      await addDoc(meetingRef, meetingData);

      alert(rescheduleMode ? "Meeting rescheduled" : "Meeting scheduled");

      setCreateMode(false);
      setRescheduleMode(false);

      setEventDate("");
      setZoomLink("");
      setVenue("");

      fetchMeetings();

    }catch(err){

      console.error("Meeting save error",err);
      alert("Error saving meeting");

    }

  };

  /* ---------------- COMMENTS ---------------- */

  const handleSendComment = async () => {

    if(!comment.trim()) return;

    const newComment = {
      text: comment,
      timestamp: new Date().toISOString()
    };

    const updated = [newComment,...comments];

    const docRef = doc(db, COLLECTIONS.prospect, id);

    await updateDoc(docRef,{
      comments: updated
    });

    setComments(updated);
    setComment("");

  };

  /* ---------------- UI ---------------- */

  return (

  <div className="max-w-5xl mx-auto p-6 text-black">

  <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
  Meeting Schedule Logs
  </h2>

  {!createMode && !eventCreated && (
  <button
  className="bg-black text-white px-5 py-2 rounded-lg mb-6"
  onClick={()=>setCreateMode(true)}
  >
  Schedule Meet
  </button>
  )}

  {/* EVENT DETAILS */}

  {eventCreated && !rescheduleMode && (

  <div className="bg-white border p-6 rounded-xl mb-6">

  <h4 className="font-semibold mb-3">Latest Meeting</h4>

  <p><strong>Date:</strong> {eventCreated.date}</p>
  <p><strong>Mode:</strong> {eventCreated.mode}</p>

  {eventCreated.mode==="online" ? (

  <p>
  <strong>Zoom:</strong>{" "}
  <a href={eventCreated.zoomLink} className="text-blue-600 underline">
  {eventCreated.zoomLink}
  </a>
  </p>

  ):(

  <p><strong>Venue:</strong> {eventCreated.venue}</p>

  )}

  <div className="flex gap-3 mt-4">

  <button
  className="bg-gray-800 text-white px-4 py-2 rounded"
  onClick={()=>{
  setEventDate(eventCreated.rawDate);
  setEventMode(eventCreated.mode);
  setZoomLink(eventCreated.zoomLink || "");
  setVenue(eventCreated.venue || "");
  setRescheduleMode(true);
  }}
  >
  Reschedule
  </button>

  </div>

  </div>

  )}

  {/* CREATE / RESCHEDULE FORM */}

  {(createMode || rescheduleMode) && (

  <div className="bg-white border p-6 rounded-xl mb-6">

  <div className="grid gap-4">

  <div>
  <label>Date</label>
  <input
  type="datetime-local"
  value={eventDate || ""}
  onChange={(e)=>setEventDate(e.target.value)}
  className="w-full border p-2 rounded"
  />
  </div>

  {!rescheduleMode && (

  <>
  <div>
  <label>Mode</label>
  <select
  value={eventMode}
  onChange={(e)=>setEventMode(e.target.value)}
  className="w-full border p-2 rounded"
  >
  <option value="online">Online</option>
  <option value="offline">Offline</option>
  </select>
  </div>

  {eventMode==="online" && (

  <input
  placeholder="Zoom Link"
  value={zoomLink || ""}
  onChange={(e)=>setZoomLink(e.target.value)}
  className="border p-2 rounded"
  />

  )}

  {eventMode==="offline" && (

  <input
  placeholder="Venue"
  value={venue || ""}
  onChange={(e)=>setVenue(e.target.value)}
  className="border p-2 rounded"
  />

  )}

  </>
  )}

  <button
  onClick={handleCreateOrReschedule}
  className="bg-black text-white py-2 rounded"
  >
  {rescheduleMode ? "Reschedule" : "Schedule"}
  </button>

  </div>

  </div>

  )}

  {/* MEETING HISTORY */}

  {meetings.length > 0 && (

  <div className="bg-white border rounded-xl p-6 mb-8">

  <h3 className="font-semibold mb-4">Meeting History</h3>

  <div className="space-y-3">

  {meetings.map(m=>(
  <div key={m.id} className="border p-3 rounded">

  <p><strong>Date:</strong> {m.date}</p>
  <p><strong>Mode:</strong> {m.mode}</p>

  {m.mode==="online"
  ? <p>Zoom: {m.zoomLink}</p>
  : <p>Venue: {m.venue}</p>
  }

  </div>
  ))}

  </div>

  </div>

  )}

  {/* COMMENTS */}

  <div>

  <h3 className="text-xl font-semibold mb-4">Comments</h3>

  {comments.map((c,i)=>(
  <div key={i} className="bg-gray-100 p-3 rounded mb-2">
  <p className="text-xs text-gray-500">
  {new Date(c.timestamp).toLocaleString()}
  </p>
  <p>{c.text}</p>
  </div>
  ))}

  <div className="flex gap-3 mt-4">

  <textarea
  value={comment || ""}
  onChange={(e)=>setComment(e.target.value)}
  placeholder="Write comment"
  className="flex-1 border p-2 rounded"
  />

  <button
  onClick={handleSendComment}
  className="bg-black text-white px-5 rounded"
  >
  Send
  </button>

  </div>

  </div>

  </div>

  );

};

export default Followup;
