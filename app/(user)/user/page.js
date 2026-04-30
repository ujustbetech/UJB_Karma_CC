"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import HeroReferralCTA from "@/components/home/HeroReferralCTA";
import EventEnrollmentCard from "@/components/home/EventEnrollmentCard";
import RecommendedServices from "@/components/home/RecommendedServices";
import DewdropLearningSection from "@/components/home/DewdropLearningSection";
import PerformanceSnapshot from "@/components/home/PerformanceSnapshot";
import NetworkActivity from "@/components/home/NetworkActivity";
import NewlyAddedSection from "@/components/home/NewlyAddedSection";
import TopOrbitersLeaderboard from "@/components/home/TopOrbitersLeaderboard";
import NetworkOverview from "@/components/home/NetworkOverview";
import RecentReferrals from "@/components/home/RecentReferrals";

import { generateAgreementPDF } from "@/utils/generateAgreementPDF";
import {
  buildAgreementAcceptanceUpdate,
  getAgreementTitle,
} from "@/lib/agreements/agreementWorkflow.mjs";
import { fetchUserHomeData } from "@/services/homeService";
import { updateUserProfile } from "@/services/profileService";

export default function HomePage() {
  const [homeData, setHomeData] = useState(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const data = await fetchUserHomeData();
        setHomeData(data);

        if (!data?.agreement?.shouldPrompt) {
          return;
        }

        const result = await Swal.fire({
          title: getAgreementTitle(data?.agreement?.category),
          html: `
            <div style="text-align:left; max-height:250px; overflow:auto;">
              <p>â€¢ You have read and understood the agreement</p>
              <p>â€¢ You accept all terms & conditions</p>
              <p>â€¢ This acceptance is legally binding</p>
            </div>
          `,
          icon: "info",
          confirmButtonText: "Accept",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        if (!result.isConfirmed) {
          return;
        }

        const category = data?.agreement?.category || "";
        const pdfUrl = await generateAgreementPDF({
          name: data?.agreement?.name || "User",
          address: data?.agreement?.address || "-",
          city: data?.agreement?.city || "-",
          category,
        });

        await updateUserProfile(
          buildAgreementAcceptanceUpdate({
            category,
            pdfUrl,
            acceptedAt: new Date(),
          })
        );

        setHomeData((current) =>
          current
            ? {
                ...current,
                agreement: {
                  ...current.agreement,
                  shouldPrompt: false,
                },
              }
            : current
        );

        Swal.fire(
          "Agreement Accepted",
          "Your agreement has been signed and saved successfully",
          "success"
        );
      } catch {
        setHomeData(null);
        Swal.fire(
          "Notice",
          "Some dashboard data is unavailable right now.",
          "info"
        );
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-6 pb-28">
      <NetworkOverview stats={homeData?.networkOverview} />
      <HeroReferralCTA />
      <EventEnrollmentCard data={homeData?.eventEnrollment} />
      <RecentReferrals referrals={homeData?.recentReferrals} />
      <RecommendedServices services={homeData?.recommendedServices} />
      <DewdropLearningSection stories={homeData?.dewdropStories} />
      <PerformanceSnapshot stats={homeData?.performance} />
      <NetworkActivity activities={homeData?.networkActivity} />
      <NewlyAddedSection services={homeData?.newlyAdded} />
      <TopOrbitersLeaderboard leaders={homeData?.topOrbiters} />
    </div>
  );
}


