'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { fetchUserReferralDetails } from "@/services/referralService";

import ReferralDashboardMobile from "@/components/referrals/ReferralDashboardMobile";
import ReferralDetailsSkeleton from "@/components/referrals/ReferralDetailsSkeleton";

export default function ReferralDetailsPage() {

  const { id } = useParams();
  const { user: sessionUser, loading: authLoading } = useAuth();

  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const currentUserUjbCode = sessionUser?.profile?.ujbCode;

  const loadReferral = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    try {
      const data = await fetchUserReferralDetails(id);
      setReferral(data.referral || null);
      setUserRole(data.userRole || "viewer");
    } catch (error) {
      console.error("Referral load failed:", error);
      setReferral(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;

    loadReferral();
  }, [authLoading, loadReferral]);

  if (authLoading || loading) {
    return <ReferralDetailsSkeleton />;
  }

  if (!referral) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Referral not found
      </div>
    );
  }

  return (
    <ReferralDashboardMobile
      referral={referral}
      userRole={userRole}
      currentUserUjbCode={currentUserUjbCode}  // ✅ IMPORTANT
      onReferralUpdated={loadReferral}
    />
  );
}


