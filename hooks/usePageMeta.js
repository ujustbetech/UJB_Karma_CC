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
    const monthlyMeetingMatch = pathname?.match(/^\/admin\/monthlymeeting\/([^/]+)$/);
    const dewdropMatch = pathname?.match(/^\/admin\/dewdrop\/([^/]+)$/);
    const todoViewMatch = pathname?.match(/^\/admin\/tasks\/([^/]+)$/);

    if (!prospectMatch && !monthlyMeetingMatch && !dewdropMatch && !todoViewMatch) {
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

    if (prospectMatch) {
      loadProspectName();
    }

    if (monthlyMeetingMatch) {
      const loadMonthlyMeetingName = async () => {
        try {
          const eventId = decodeURIComponent(monthlyMeetingMatch[1]);
          const res = await fetch(`/api/admin/monthlymeeting/${eventId}`, {
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data.message || "Failed to load monthly meeting");
          }

          if (isMounted) {
            const meetingName = String(
              data?.event?.Eventname || data?.event?.name || ""
            ).trim();
            setDynamicTitle(
              meetingName
                ? `${meetingName} (Monthly Meeting)`
                : "Monthly Meeting"
            );
          }
        } catch {
          if (isMounted) {
            setDynamicTitle("Monthly Meeting");
          }
        }
      };

      loadMonthlyMeetingName();
    }

    if (dewdropMatch) {
      const loadDewdropContentName = async () => {
        try {
          const contentId = decodeURIComponent(dewdropMatch[1]);
          const res = await fetch(`/api/admin/content/${contentId}`, {
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data.message || "Failed to load content");
          }

          if (isMounted) {
            const content = data?.content || {};
            const name = String(content?.contentName || "").trim();
            const owner =
              String(content?.ownershipType || "").trim().toLowerCase() === "partner"
                ? String(content?.partnerNamelp || "").trim() || "UjustBe"
                : "UjustBe";

            setDynamicTitle(name ? `${name} by ${owner}` : "Edit Content");
          }
        } catch {
          if (isMounted) {
            setDynamicTitle("Edit Content");
          }
        }
      };

      loadDewdropContentName();
    }

    if (todoViewMatch) {
      const loadTodoTitle = async () => {
        try {
          const todoId = decodeURIComponent(todoViewMatch[1]);
          const res = await fetch(`/api/admin/todos/${todoId}`, {
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data.message || "Failed to load TODO");
          }

          if (isMounted) {
            const linkedName = String(data?.todo?.linked_name || "").trim();
            setDynamicTitle(linkedName ? `TODO for "${linkedName}"` : "TODO");
          }
        } catch {
          if (isMounted) {
            setDynamicTitle("TODO");
          }
        }
      };

      loadTodoTitle();
    }

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
