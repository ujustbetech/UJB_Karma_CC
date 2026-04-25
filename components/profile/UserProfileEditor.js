"use client";

import { useEffect, useMemo, useState } from "react";
import {
  User,
  ShieldCheck,
  Landmark,
  Building2,
  Store,
  Briefcase,
  Package,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import useOrbiterProfile from "@/hooks/useOrbiterProfile";

import PersonalInfoSection from "@/components/admin/orbiters/sections/PersonalInfoSection";
import PersonalKYCSection from "@/components/admin/orbiters/sections/PersonalKYCSection";
import BankSection from "@/components/admin/orbiters/sections/BankSection";
import BusinessKYCSection from "@/components/admin/orbiters/sections/BusinessKYCSection";
import BusinessInfoSection from "@/components/admin/orbiters/sections/BusinessInfoSection";
import ServicesSection from "@/components/admin/orbiters/sections/ServicesSection";
import ProductsSection from "@/components/admin/orbiters/sections/ProductsSection";

function normalizeCategory(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

export default function UserProfileEditor({ ujbCode }) {
  const toast = useToast();
  const [active, setActive] = useState("personal");
  const profile = useOrbiterProfile(ujbCode, toast, {
    profileEndpoint: "/api/user/profile",
  });

  const isCosmOrbiter =
    normalizeCategory(profile?.formData?.Category) === "cosmorbiter";

  const sections = useMemo(() => {
    const baseSections = [
      { id: "personal", label: "Personal Info", icon: User },
      { id: "kyc", label: "Personal KYC", icon: ShieldCheck },
      { id: "bank", label: "Bank Details", icon: Landmark },
    ];

    if (!isCosmOrbiter) {
      return baseSections;
    }

    return [
      ...baseSections,
      { id: "businesskyc", label: "Business KYC", icon: Building2 },
      { id: "businessinfo", label: "Business Info", icon: Store },
      { id: "services", label: "Service Fields", icon: Briefcase },
      { id: "products", label: "Product Fields", icon: Package },
    ];
  }, [isCosmOrbiter]);

  useEffect(() => {
    if (!sections.some((section) => section.id === active)) {
      setActive(sections[0]?.id || "personal");
    }
  }, [active, sections]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  return (
    <div className="grid grid-cols-12 gap-6 pb-28">
      <div className="col-span-12 lg:col-span-3 xl:col-span-2">
        <Card className="sticky top-6 p-3">
          <Text variant="h3">Profile</Text>

          <div className="mt-4 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = active === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActive(section.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary font-medium"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-1 rounded bg-brand-primary" />
                  )}

                  <Icon size={17} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-9 xl:col-span-10 space-y-6">
        {active === "personal" && <PersonalInfoSection profile={profile} />}
        {active === "kyc" && <PersonalKYCSection profile={profile} />}
        {active === "bank" && <BankSection profile={profile} />}
        {isCosmOrbiter && active === "businesskyc" && (
          <BusinessKYCSection profile={profile} />
        )}
        {isCosmOrbiter && active === "businessinfo" && (
          <BusinessInfoSection profile={profile} />
        )}
        {isCosmOrbiter && active === "services" && (
          <ServicesSection profile={profile} />
        )}
        {isCosmOrbiter && active === "products" && (
          <ProductsSection profile={profile} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex justify-end gap-3 shadow-md">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={profile.handleSubmit}
          disabled={profile.loading}
        >
          {profile.loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
