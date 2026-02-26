"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { NAV_ITEMS } from "./nav.config";
import {
  ChevronRight,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();

  const [openMenu, setOpenMenu] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const hoverTimeoutRef = useRef(null);

  const openHoverMenu = (label) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredMenu(label);
  };

  const closeHoverMenuWithDelay = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 120);
  };

  /* restore submenu on load */
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open-menu");
    if (stored) setOpenMenu(stored);
    setIsMounted(true);
  }, []);

  /* save submenu */
  useEffect(() => {
    if (openMenu) {
      localStorage.setItem("sidebar-open-menu", openMenu);
    }
  }, [openMenu]);

  /* auto-open active parent */
  useEffect(() => {
    const activeParent = NAV_ITEMS.find(item =>
      item.children?.some(child => child.href === pathname)
    );
    if (activeParent) {
      setOpenMenu(activeParent.label);
    }
  }, [pathname]);

  if (!isMounted) return null;

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col transition-[width] duration-300",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b  border-slate-200">
        {!collapsed && (
          <span className="text-sm font-semibold">
            U Just Be
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          const isParentActive =
            item.href === pathname ||
            item.children?.some(child => child.href === pathname);

          const isOpen =
            !collapsed &&
            (openMenu === item.label || isParentActive);

          return (
            <div key={item.label} className="relative">
              <button
                onMouseEnter={() => {
                  if (collapsed && item.children) {
                    openHoverMenu(item.label);
                  }
                }}
                onMouseLeave={() => {
                  if (collapsed && item.children) {
                    closeHoverMenuWithDelay();
                  }
                }}
                onClick={() => {
                  if (!item.children || collapsed) return;
                  setOpenMenu(isOpen ? null : item.label);
                }}
                className={clsx(
                  "group flex items-center w-full h-9 px-3 rounded-[10px] text-sm transition-colors",
                  isParentActive
                    ? "bg-slate-100 text-[#16274f] font-medium"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />

                {!collapsed && (
                  <span className="ml-3 flex-1 text-left">
                    {item.label}
                  </span>
                )}

                {!collapsed && item.children && (
                  <ChevronRight
                    className={clsx(
                      "h-4 w-4 text-slate-400 transition-transform",
                      isOpen && "rotate-90"
                    )}
                  />
                )}
              </button>

              {/* Expanded submenu */}
              {!collapsed && item.children && isOpen && (
                <div className="mt-1 ml-9 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive =
                      pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpenMenu(item.label)}
                        className={clsx(
                          "block px-3 py-1.5 rounded-md text-sm",
                          isChildActive
                            ? "text-[#16274f] font-medium"
                            : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Floating submenu (collapsed) */}
              {collapsed &&
                item.children &&
                hoveredMenu === item.label && (
                  <div
                    className="absolute left-full top-0 ml-2 min-w-[180px] rounded-md border border-slate-200 bg-white shadow-sm"
                    onMouseEnter={() => openHoverMenu(item.label)}
                    onMouseLeave={closeHoverMenuWithDelay}
                  >
                    <div className="px-3 py-2 text-xs font-medium text-slate-400">
                      {item.label}
                    </div>

                    {item.children.map((child) => {
                      const isChildActive =
                        pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={clsx(
                            "block px-3 py-2 text-sm",
                            isChildActive
                              ? "text-[#16274f] font-medium"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-1 pb-4 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center h-9 px-3 rounded-[10px] text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
          {!collapsed && <span className="ml-3">Collapse</span>}
        </button>

        <Link
          href="/admin/settings"
          className="flex items-center h-9 px-3 rounded-[10px] text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Settings</span>}
        </Link>

        <Link
          href="/logout"
          className="flex items-center h-9 px-3 rounded-[10px] text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Log Out</span>}
        </Link>
      </div>
    </aside>
  );
}
