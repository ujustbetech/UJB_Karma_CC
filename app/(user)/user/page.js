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

  useEffect(() => {
    const promptAgreement = async () => {
      if (!homeData?.agreement?.shouldPrompt) {
        return;
      }

      try {
        const result = await Swal.fire({
          title: getAgreementTitle(homeData?.agreement?.category),
          html: `
            <div style="text-align:left; max-height:250px; overflow:auto;">
              <p>- You have read and understood the agreement</p>
              <p>- You accept all terms & conditions</p>
              <p>- This acceptance is legally binding</p>
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

        const category = homeData?.agreement?.category || "";
        let pdfUrl = "";

        try {
          pdfUrl = await generateAgreementPDF({
            name: homeData?.agreement?.name || "User",
            address: homeData?.agreement?.address || "-",
            city: homeData?.agreement?.city || "-",
            category,
          });
        } catch (error) {
          console.error("Agreement PDF generation failed:", error);
        }

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
                  pdfUrl,
                },
              }
            : current
        );

        Swal.fire(
          "Agreement Accepted",
          "Your agreement has been signed and saved successfully",
          "success"
        );
      } catch (error) {
        console.error("Agreement acceptance failed:", error);
        Swal.fire(
          "Notice",
          "Your dashboard loaded, but we could not save the agreement right now.",
          "info"
        );
      }
    };

    promptAgreement();
  }, [homeData]);

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
