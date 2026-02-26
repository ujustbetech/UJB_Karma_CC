"use client";

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { COLLECTIONS } from "/utility_collection";

export default function useEventDoc(eventID) {
  const ref = doc(db, COLLECTIONS.monthlyMeeting, eventID);

  const safeUpdate = async (data) => {
    try {
      await updateDoc(ref, data);
    } catch (e) {
      console.error("Update failed:", e);
    }
  };

  const fetchDoc = async () => {
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  };

  return { ref, safeUpdate, fetchDoc };
}
