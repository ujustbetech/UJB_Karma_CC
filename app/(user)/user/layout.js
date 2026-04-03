"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import { useAuth } from "@/context/authContext";

export default function UserLayout({ children }) {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) return null;

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
