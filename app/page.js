"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import { auth, microsoftProvider } from "@/lib/firebase/firebaseClient";
import { signInWithPopup } from "firebase/auth";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🔴 CHECK SESSION LOGIN
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const res = await fetch("/api/admin/session/validate", {
          credentials: "include",
        });

        if (res.ok) {
          router.replace("/admin/orbiters");
        }
      } catch {
        // No active admin session.
      }
    };

    checkAdminSession();
  }, [router]);

const handleMicrosoftLogin = async () => {
  setLoading(true);

  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    const idToken = await result.user.getIdToken();

    const res = await fetch("/api/admin/session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "You are not an Admin");
      setLoading(false);
      return;
    }


    if (!res.ok || !data.success) {
      alert("You are not an Admin ❌");
      setLoading(false);
      return;
    }

    // ✅ PRIORITY: Firestore image > Microsoft image
    const adminData = data.admin || {};


    router.replace("/admin/orbiters");

  } catch (err) {
    console.error(err);
    alert("Login Failed ❌");
  }

  setLoading(false);
};

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">

      <Card className="w-96 p-6">

        <h1 className="text-lg font-semibold text-neutral-700 mb-6 text-center">
          Admin Login
        </h1>

        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleMicrosoftLogin}
        >
          {loading ? "Signing In..." : "Sign in with Microsoft"}
        </Button>

      </Card>

    </div>
  );
}

