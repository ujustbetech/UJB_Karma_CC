"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, MapPin, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import {
  createCcReferral,
  fetchApprovedCcDealById,
  fetchUserOrbiterByCode,
} from "@/services/ccMarketplaceService";

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState(null);
  const [orbiter, setOrbiter] = useState(null);
  const [leadDescription, setLeadDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDeal = async () => {
      try {
        const code = localStorage.getItem("mmUJBCode");
        const [dealData, orbiterData] = await Promise.all([
          fetchApprovedCcDealById(params?.id),
          fetchUserOrbiterByCode(code),
        ]);

        if (active) {
          setDeal(dealData);
          setOrbiter(orbiterData);
        }
      } catch (loadError) {
        console.error("Failed to load deal detail", loadError);
        if (active) {
          setError("Could not load the selected deal.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (params?.id) {
      loadDeal();
    }

    return () => {
      active = false;
    };
  }, [params]);

  const handleSubmit = async () => {
    if (!deal || !orbiter) {
      setError("User profile or deal details are missing.");
      return;
    }

    if (!leadDescription.trim()) {
      setError("Please add your requirement, location, or timeline.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const referralId = await createCcReferral({
        deal,
        orbiter,
        leadDescription,
      });

      router.replace(`/user/ccreferral/${referralId}`);
    } catch (submitError) {
      console.error("Failed to create CC referral", submitError);
      setError("Could not submit the referral.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <Card className="mt-6 shadow-sm">
        <Text as="h2" variant="h2">Deal not found</Text>
        <Text variant="muted">This CC marketplace item is no longer available.</Text>
      </Card>
    );
  }

  return (
    <main className="min-h-screen py-6">
      <section className="space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft size={16} />
          Back to marketplace
        </button>

        <Card className="overflow-hidden shadow-sm">
          {deal.displayImage ? (
            <img
              src={deal.displayImage}
              alt={deal.displayName}
              className="h-56 w-full object-cover"
            />
          ) : null}

          <div className="space-y-4 p-6">
            <div>
              <Text as="h1" variant="h1">{deal.displayName}</Text>
              <Text variant="muted">{deal.displayDescription || "No description available."}</Text>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="shadow-none border border-slate-100">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-orange-500" />
                  <Text variant="body">{deal.redemptionCategory || "Category not set"}</Text>
                </div>
              </Card>
              <Card className="shadow-none border border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-500" />
                  <Text variant="body">{deal.cosmo?.Name || "Cosmo orbiter"}</Text>
                </div>
              </Card>
              <Card className="shadow-none border border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-orange-500" />
                  <Text variant="body">{orbiter?.ujbCode || "Your profile"}</Text>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 shadow-sm">
          <Text as="h2" variant="h2">Pass This CC Referral</Text>
          <Text variant="muted">
            Add the requirement, location, timeline, or any useful context for the receiving cosmo orbiter.
          </Text>

          <textarea
            rows={5}
            value={leadDescription}
            onChange={(event) => setLeadDescription(event.target.value)}
            placeholder="Example: Bangalore lead, looking for onboarding in the next 2 weeks, budget already approved..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
          />

          {error ? <Text className="text-red-600">{error}</Text> : null}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} loading={submitting}>
              Submit Referral
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
