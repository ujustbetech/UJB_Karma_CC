"use client";

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

  const navTitle = findTitle(NAV_ITEMS, pathname);

  // Fallback if route not in nav
  const fallback =
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard";

  return {
    title: navTitle || fallback,
  };
}
