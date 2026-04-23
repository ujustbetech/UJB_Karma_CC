"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav.config";

/* Recursive search inside nav tree */
function findTitle(items, pathname) {
  for (const item of items) {
    // Direct match
    if (item.href === pathname) return item.label;

    // Check children
    if (item.children) {
      const found = findTitle(item.children, pathname);
      if (found) return found;
    }
  }
  return null;
}

export function usePageMeta() {
  const pathname = usePathname();
  const [dynamicTitle, setDynamicTitle] = useState("");

  const navTitle = findTitle(NAV_ITEMS, pathname);

  useEffect(() => {
    let isMounted = true;
    const prospectMatch = pathname?.match(/^\/admin\/prospect\/edit\/([^/]+)$/);

    if (!prospectMatch) {
      setDynamicTitle("");
      return () => {
        isMounted = false;
      };
    }

    const loadProspectName = async () => {
      try {
        const prospectId = decodeURIComponent(prospectMatch[1]);
        const res = await fetch(`/api/admin/prospects?id=${prospectId}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load prospect");
        }

        if (isMounted) {
          setDynamicTitle(
            String(data?.prospect?.prospectName || "").trim() || "Prospect"
          );
        }
      } catch {
        if (isMounted) {
          setDynamicTitle("Prospect");
        }
      }
    };

    loadProspectName();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Fallback if route not in nav
  const fallback =
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard";

  return {
    title: dynamicTitle || navTitle || fallback,
  };
}
