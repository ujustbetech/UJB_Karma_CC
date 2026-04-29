"use client";

import React, { useEffect, useState } from "react";
import MentorInfo from "@/components/prospect/MentorInfo";
import ProspectForm from "@/components/prospect/ProspectForm";
import SuccessModal from "@/components/prospect/SuccessModal";
import UserPageHeader from "@/components/user/UserPageHeader";
import { UserPlus } from "lucide-react";
import {
  createUserProspect,
  fetchCurrentUserProfile,
} from "@/services/prospectService";

export default function UserAddProspect() {
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

  useEffect(() => {
    setLoadingMentor(true);

    const loadMentor = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        setMentor(profile);
      } catch {
        setMentor(null);
      } finally {
        setLoadingMentor(false);
      }
    };

    loadMentor();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      await createUserProspect(formData);

      setFormData({
        prospectName: "",
        prospectPhone: "",
        prospectEmail: "",
        occupation: "",
        hobbies: "",
        source: "close_connect",
      });

      setShowSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <UserPageHeader
            title="Add Prospect"
            description="Register a new lead under your network and keep your prospect pipeline fresh and organized."
            icon={UserPlus}
          />

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            {loadingMentor ? (
              <div className="p-6 animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-16 bg-slate-200 rounded-xl"></div>
              </div>
            ) : mentor ? (
              <MentorInfo mentor={mentor} />
            ) : (
              <div className="p-6 text-sm text-red-500">Mentor not found.</div>
            )}
          </div>

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

      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}


