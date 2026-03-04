"use client";

import { useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
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

/* ================= PDF FUNCTION ================= */
import { generateAgreementPDF } from "@/utils/generateAgreementPDF"; 
// 👆 move your big PDF function into utils/generateAgreementPDF.js

export default function HomePage() {

  /* ================= AGREEMENT CHECK ================= */
  useEffect(() => {
    const checkAgreement = async () => {
      const ujbCode = localStorage.getItem("mmUJBCode");
      if (!ujbCode) return;

      try {
        const userRef = doc(db, COLLECTIONS.userDetail, ujbCode);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const data = userSnap.data();

        // Already accepted → exit
        if (data.agreementAccepted === true) return;

        const result = await Swal.fire({
          title:
            data.Category === "CosmOrbiter"
              ? "Listed Partner Agreement"
              : "Partner Agreement",
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

          const name =
            data.Name ||
            data.BusinessName ||
            "User";

          const address = data.Address || "—";
          const city = data.City || "—";
          const category = data.Category;

          // ✅ Generate + Upload PDF
          const pdfUrl = await generateAgreementPDF({
            name,
            address,
            city,
            category,
          });

          // ✅ Save in Firestore
          await updateDoc(userRef, {
            agreementAccepted: true,
            agreementAcceptedAt: new Date(),
            agreementType:
              category === "CosmOrbiter"
                ? "LISTED_PARTNER"
                : "PARTNER",
            agreementPdfUrl: pdfUrl,
          });

          Swal.fire(
            "Agreement Accepted",
            "Your agreement has been signed and saved successfully",
            "success"
          );
        }

      } catch (err) {
        console.error("Agreement error:", err);
        Swal.fire(
          "Error",
          "Something went wrong while saving the agreement",
          "error"
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