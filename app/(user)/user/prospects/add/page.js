"use client";

import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/context/authContext";
import { COLLECTIONS } from "@/lib/utility_collection";

import MentorInfo from "@/components/prospect/MentorInfo";
import ProspectForm from "@/components/prospect/ProspectForm";
import SuccessModal from "@/components/prospect/SuccessModal";

export default function UserAddProspect() {
  const { user, loading } = useAuth();

  const [mentor, setMentor] = useState(null);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    prospectName: "",
    prospectPhone: "",
    prospectEmail: "",
    occupation: "",
    hobbies: "",
    source: "close_connect",
  });

  // 🔹 Fetch Mentor using ujbCode
  useEffect(() => {
    if (loading) return;

    setLoadingMentor(true);

    const ujbCode = user?.profile?.ujbCode;

    if (!ujbCode) {
      setLoadingMentor(false);
      return;
    }

    const fetchMentor = async () => {
      try {
        const snap = await getDoc(
          doc(db, "usersdetail", ujbCode)
        );

        if (snap.exists()) {
          setMentor({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        // Optional error handling
      } finally {
        setLoadingMentor(false);
      }
    };

    fetchMentor();
  }, [user, loading]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 🔥 Updated Submit (Old Structure + mentorUjbCode)
  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const now = new Date();

      const formattedDate = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      await addDoc(collection(db, COLLECTIONS.prospect), {
        // Prospect Info
        prospectName: formData.prospectName,
        prospectPhone: formData.prospectPhone,
        email: formData.prospectEmail || "",
        occupation: formData.occupation,
        hobbies: formData.hobbies,
        source: formData.source,

        // Old Structure Fields
        orbiterName: mentor?.Name || user?.profile?.name || "",
        orbiterContact: user?.phone || "",
        orbiterEmail: mentor?.Email || "",

        // New (Future Safe)
        mentorUjbCode: user?.profile?.ujbCode || "",

        // Meta
        date: formattedDate,
        registeredAt: serverTimestamp(),
        userType: "orbiter",
      });

      // Reset form
      setFormData({
        prospectName: "",
        prospectPhone: "",
        prospectEmail: "",
        occupation: "",
        hobbies: "",
        source: "close_connect",
      });

      setShowSuccess(true);

    } catch (err) {
      // Optional error handling
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Add Prospect
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Register a new lead under your network.
            </p>
          </div>

          {/* Mentor Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            {loadingMentor ? (
              <div className="p-6 animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-16 bg-slate-200 rounded-xl"></div>
              </div>
            ) : mentor ? (
              <MentorInfo mentor={mentor} />
            ) : (
              <div className="p-6 text-sm text-red-500">
                Mentor not found.
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <ProspectForm
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>

        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}