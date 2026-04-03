"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { USER_COOKIE_NAME } from "@/lib/auth/accessControl";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/session/validate", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      }

      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasSessionCookie = document.cookie.includes(`${USER_COOKIE_NAME}=`);

    if (!hasSessionCookie) {
      setUser(null);
      setLoading(false);
      return;
    }

    refreshSession();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/session/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
