"use client";

import { useEffect, useMemo, useState } from "react";
import { decryptData } from "@/utils/encryption";
import { useAuth } from "@/context/authContext";
import { fetchUserProfile } from "@/services/profileService";

import ProfileHero from "@/components/profile/ProfileHero";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";

import PersonalInfoTab from "@/components/profile/tabs/PersonalInfoTab";
import PersonalKycTab from "@/components/profile/tabs/PersonalKycTab";
import BankDetailsTab from "@/components/profile/tabs/BankDetailsTab";
import BusinessKycTab from "@/components/profile/tabs/BusinessKycTab";
import BusinessTab from "@/components/profile/tabs/BusinessTab";
import ServiceFieldsTab from "@/components/profile/tabs/ServiceFieldsTab";
import ProductFieldsTab from "@/components/profile/tabs/ProductFieldsTab";
import HealthInfoTab from "@/components/profile/tabs/HealthInfoTab";
import EducationInfoTab from "@/components/profile/tabs/EducationInfoTab";
import ProfessionalInfoTab from "@/components/profile/tabs/ProfessionalInfoTab";
import AdditionalInfoTab from "@/components/profile/tabs/AdditionalInfoTab";

function normalizeCategory(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function decryptBankDetails(userData) {
  if (!userData?.bankDetails) {
    return userData;
  }

  return {
    ...userData,
    bankDetails: {
      ...userData.bankDetails,
      accountHolderName: decryptData(userData.bankDetails.accountHolderName),
      bankName: decryptData(userData.bankDetails.bankName),
      accountNumber: decryptData(userData.bankDetails.accountNumber),
      ifscCode: decryptData(userData.bankDetails.ifscCode),
    },
  };
}

export default function ProfilePage() {
  const { user: sessionUser, loading } = useAuth();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  const ujbCode = sessionUser?.profile?.ujbCode;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await fetchUserProfile();
        if (profile) {
          const nextUser = decryptBankDetails(profile);
          setUser(nextUser);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUser();
  }, [ujbCode]);

  const isCosmOrbiter =
    normalizeCategory(user?.Category || sessionUser?.profile?.type) ===
    "cosmorbiter";

  const tabs = useMemo(() => {
    const baseTabs = [
      { key: "personal", label: "Personal Info", icon: "User" },
      { key: "personalKyc", label: "Personal KYC", icon: "ShieldCheck" },
      { key: "bank", label: "Bank Details", icon: "Wallet" },
      { key: "health", label: "Health Info", icon: "HeartPulse" },
      { key: "education", label: "Education Info", icon: "GraduationCap" },
      { key: "professional", label: "Professional Info", icon: "UserCog" },
      { key: "additional", label: "Additional Info", icon: "Sparkles" },
    ];

    if (!isCosmOrbiter) {
      return baseTabs;
    }

    return [
      ...baseTabs,
      { key: "businessKyc", label: "Business KYC", icon: "ShieldCheck" },
      { key: "business", label: "Business Info", icon: "Briefcase" },
      { key: "services", label: "Service Fields", icon: "Layers" },
      { key: "products", label: "Product Fields", icon: "Trophy" },
    ];
  }, [isCosmOrbiter]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0]?.key || "personal");
    }
  }, [tabs, activeTab]);

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen pb-8">
      <ProfileHero user={user} setUser={setUser} ujbCode={ujbCode} />

      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />

      <div className="py-6">
        {activeTab === "personal" && (
          <PersonalInfoTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {activeTab === "personalKyc" && (
          <PersonalKycTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {activeTab === "bank" && (
          <BankDetailsTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {activeTab === "health" && (
          <HealthInfoTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {activeTab === "education" && (
          <EducationInfoTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {activeTab === "professional" && (
          <ProfessionalInfoTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {activeTab === "additional" && (
          <AdditionalInfoTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {isCosmOrbiter && activeTab === "businessKyc" && (
          <BusinessKycTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {isCosmOrbiter && activeTab === "business" && (
          <BusinessTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {isCosmOrbiter && activeTab === "services" && (
          <ServiceFieldsTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
        {isCosmOrbiter && activeTab === "products" && (
          <ProductFieldsTab user={user} setUser={setUser} ujbCode={ujbCode} />
        )}
      </div>
    </div>
  );
}


