'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import { useAuth } from "@/context/authContext";

import ReferralDashboardMobile from "@/components/referrals/ReferralDashboardMobile";
import ReferralDetailsSkeleton from "@/components/referrals/ReferralDetailsSkeleton";

export default function ReferralDetailsPage() {

  const { id } = useParams();
  const { user: sessionUser, loading: authLoading } = useAuth();

  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // ✅ Get from session (NOT localStorage)
  const currentUserUjbCode = sessionUser?.profile?.ujbCode;

  useEffect(() => {

    if (!id) return;

    const refDoc = doc(db, COLLECTIONS.referral, id);

    const unsubscribe = onSnapshot(refDoc, (snap) => {

      if (!snap.exists()) {
        setReferral(null);
        setLoading(false);
        return;
      }

      const data = {
        id: snap.id,
        ...snap.data(),
      };

      setReferral(data);

      if (!currentUserUjbCode) return;

      if (currentUserUjbCode === data?.cosmoUjbCode) {
        setUserRole("cosmo");
      }
      else if (currentUserUjbCode === data?.orbiter?.ujbCode) {
        setUserRole("orbiter");
      }
      else {
        setUserRole("admin");
      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [id, currentUserUjbCode]);

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
    />
  );
}