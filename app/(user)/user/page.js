"use client";

import { useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
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
  shouldPromptAgreement,
} from "@/lib/agreements/agreementWorkflow.mjs";

export default function HomePage() {
  useEffect(() => {
    const checkAgreement = async () => {
      const ujbCode = localStorage.getItem("mmUJBCode");
      if (!ujbCode) return;

      try {
        const userRef = doc(db, COLLECTIONS.userDetail, ujbCode);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const data = userSnap.data();

        if (!shouldPromptAgreement(data)) return;

        const result = await Swal.fire({
          title: getAgreementTitle(data.Category),
          html: `
            <div style="text-align:left; max-height:250px; overflow:auto;">
              <p>• You have read and understood the agreement</p>
              <p>• You accept all terms & conditions</p>
              <p>• This acceptance is legally binding</p>
            </div>
          `,
          icon: "info",
          confirmButtonText: "Accept",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        if (result.isConfirmed) {
          const name = data.Name || data.BusinessName || "User";
          const address = data.Address || "-";
          const city = data.City || "-";
          const category = data.Category;

          const pdfUrl = await generateAgreementPDF({
            name,
            address,
            city,
            category,
          });

          await updateDoc(
            userRef,
            buildAgreementAcceptanceUpdate({
              category,
              pdfUrl,
              acceptedAt: new Date(),
            })
          );

          Swal.fire(
            "Agreement Accepted",
            "Your agreement has been signed and saved successfully",
            "success"
          );
        }
      } catch (err) {
        Swal.fire(
          "Notice",
          "Some dashboard data is unavailable right now.",
          "info"
        );
      }
    };

    checkAgreement();
  }, []);

  return (
    <div className="space-y-6 pb-28">
      <NetworkOverview />
      <HeroReferralCTA />
      <EventEnrollmentCard />
      <RecentReferrals />
      <RecommendedServices />
      <DewdropLearningSection />
      <PerformanceSnapshot />
      <NetworkActivity />
      <NewlyAddedSection />
      <TopOrbitersLeaderboard />
    </div>
  );
}
