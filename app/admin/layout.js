"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

export default function Layout({ children }) {

  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {

    const admin = sessionStorage.getItem("AdminData");

    // 🔴 If NOT logged in
    if (!admin) {
      router.replace("/");
      return;
    }

    setAuthorized(true);

  }, []);

  // 🔴 Prevent UI flash
  if (!authorized) return null;

  return (
    <AdminLayout role="admin">
      {children}
    </AdminLayout>
  );
}