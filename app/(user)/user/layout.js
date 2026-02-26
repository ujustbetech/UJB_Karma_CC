"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";



export default function UserLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-black">
  //       {/* <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> */}
  //     </div>
  //   );
  // }

  // if (!user) return null;

  return (
    <div
      className="flex flex-col h-screen max-w-md mx-auto border-x bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/space.jpeg')" }}
    >
      {/* Dark overlay for readability */}
      {/* <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div> */}

      {/* Content Layer */}
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