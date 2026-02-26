"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { COLLECTIONS } from "/utility_collection";

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.userDetail));

        const list = snap.docs.map(doc => ({
          ujbCode: doc.id,
          name: doc.data()["Name"] || "",
          phone: doc.data().MobileNo || "",
        }));

        setUsers(list);
      } catch (err) {
        console.error("User fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading };
}
