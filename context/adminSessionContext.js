"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/accessControl";

const AdminSessionContext = createContext(null);

export function AdminSessionProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/admin/session/validate", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin || null);
        return data.admin || null;
      }

      setAdmin(null);
      return null;
    } catch {
      setAdmin(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/session/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAdmin(null);
    }
  };

  useEffect(() => {
    const hasSessionCookie = document.cookie.includes(`${ADMIN_COOKIE_NAME}=`);

    if (!hasSessionCookie) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    refreshSession();
  }, []);

  return (
    <AdminSessionContext.Provider
      value={{ admin, loading, refreshSession, logout }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);

  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }

  return context;
}
