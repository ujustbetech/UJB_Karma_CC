"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  AdminSessionProvider,
  useAdminSession,
} from "@/context/adminSessionContext";

function AdminRouteGuard({ children }) {
  const router = useRouter();
  const { admin, loading } = useAdminSession();

  useEffect(() => {
    if (!loading && !admin) {
      router.replace("/");
    }
  }, [admin, loading, router]);

  if (loading || !admin) return null;

  return <AdminLayout role={admin.role}>{children}</AdminLayout>;
}

export default function Layout({ children }) {
  return (
    <AdminSessionProvider>
      <AdminRouteGuard>{children}</AdminRouteGuard>
    </AdminSessionProvider>
  );
}


