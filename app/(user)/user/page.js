"use client";

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

export default function HomePage() {
  return (
    <div className="space-y-6 pb-28">

      <NetworkOverview/>

      {/* 1️⃣ Primary Revenue Driver */}
      <HeroReferralCTA />

      {/* 2️⃣ Event Urgency (Auto hides if no event) */}
      <EventEnrollmentCard />

      <RecentReferrals/>

      {/* 3️⃣ Smart Personalized Recommendations */}
      <RecommendedServices />

      {/* 4️⃣ Dewdrop Learning Hub */}
      <DewdropLearningSection />

      {/* 5️⃣ Gamification Layer */}
      <PerformanceSnapshot />

      {/* 6️⃣ Social Proof */}
      <NetworkActivity />

      {/* 7️⃣ Curiosity Trigger */}
      <NewlyAddedSection />

      {/* 8️⃣ Competition Trigger */}
      <TopOrbitersLeaderboard />

    </div>
  );
}