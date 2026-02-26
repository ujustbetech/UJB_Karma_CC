"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import { useAuth } from "@/context/authContext";

import ProfileHero from "@/components/profile/ProfileHero";
import ProfileTabs from "@/components/profile/ProfileTabs";

import AboutTab from "@/components/profile/tabs/AboutTab";
import BusinessTab from "@/components/profile/tabs/BusinessTab";
import ServicesTab from "@/components/profile/tabs/ServicesTab";
import AchievementsTab from "@/components/profile/tabs/AchievementsTab";
import NetworkTab from "@/components/profile/tabs/NetworkTab";
import FinanceTab from "@/components/profile/tabs/FinanceTab";
import SecureTab from "@/components/profile/tabs/SecureTab";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";

export default function ProfilePage() {
  const { user: sessionUser, loading } = useAuth();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("about");

  // ✅ Get UJBCode from session
  const ujbCode = sessionUser?.profile?.ujbCode;

  useEffect(() => {
    if (!ujbCode) return;

    const fetchUser = async () => {
      const snap = await getDoc(
        doc(db, COLLECTIONS.userDetail, ujbCode)
      );

      if (snap.exists()) {
        setUser(snap.data());
      }
    };

    fetchUser();
  }, [ujbCode]);

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen pb-8">
      <ProfileHero
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />

      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="py-6">
        {activeTab === "about" && (
          <AboutTab user={user} ujbCode={ujbCode} />
        )}
        {activeTab === "business" && (
          <BusinessTab user={user} ujbCode={ujbCode} />
        )}
        {activeTab === "services" && (
          <ServicesTab user={user} ujbCode={ujbCode} />
        )}
        {activeTab === "achievements" && (
          <AchievementsTab
            user={user}
            // setUser={setUser}
            ujbCode={ujbCode}
          />
        )}
        {activeTab === "network" && (
          <NetworkTab user={user} ujbCode={ujbCode} />
        )}
        {activeTab === "finance" && (
          <FinanceTab user={user} ujbCode={ujbCode} />
        )}
        {activeTab === "secure" && (
          <SecureTab user={user} ujbCode={ujbCode} />
        )}
      </div>
    </div>
  );
}