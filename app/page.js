"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import { auth, microsoftProvider, db } from "@/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🔴 CHECK SESSION LOGIN
  useEffect(() => {
    const admin = sessionStorage.getItem("AdminData");

    if (admin) {
      router.replace("/admin/orbiters");
    }
  }, []);

  const handleMicrosoftLogin = async () => {

    setLoading(true);

    try {

      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;

      const adminSnapshot = await getDocs(collection(db, "AdminUsers"));
      const admins = adminSnapshot.docs.map(doc => doc.data());

      const matchedAdmin = admins.find(a =>
        a.email.toLowerCase() === user.email.toLowerCase()
      );

      if (!matchedAdmin) {
        alert("You are not an Admin ❌");
        setLoading(false);
        return;
      }

      // 🔴 SAVE IN SESSION STORAGE
      const adminData = {
        email: user.email,
        name: matchedAdmin.name,
        role: matchedAdmin.role,
        designation: matchedAdmin.designation,
        photo: user.photoURL,
        currentuser: matchedAdmin.name
      };

      sessionStorage.setItem("AdminData", JSON.stringify(adminData));

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