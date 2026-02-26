"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

export default function UserLayout({ children }) {

  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {

    const validateSession = async () => {

      try {

        const res = await fetch("/api/session/validate");

        // 🔴 SESSION INVALID
        if (res.status !== 200) {
          router.replace("/login");
          return;
        }

        // 🔴 SESSION VALID
        setCheckingSession(false);

      } catch {
        router.replace("/login");
      }

    };

    validateSession();

  }, []);

  // 🔴 PREVENT DASHBOARD FLASH
  if (checkingSession) return null;

  return (
    <div
      className="flex flex-col h-screen max-w-md mx-auto border-x bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/space.jpeg')" }}
    >

      <div className="relative z-10 flex flex-col h-full">

        <MobileHeader />

        <main className="flex-1 overflow-y-auto pb-16 px-4">
          {children}
        </main>

        <MobileBottomNav />

      </div>

    </div>
  );
}