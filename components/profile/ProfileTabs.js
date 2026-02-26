"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  Briefcase,
  Layers,
  Trophy,
  Users,
  Wallet,
  ShieldCheck,
} from "lucide-react";

export default function ProfileTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "about", label: "About", icon: User },
    { key: "business", label: "Business", icon: Briefcase },
    { key: "services", label: "Services", icon: Layers },
    { key: "achievements", label: "Achievements", icon: Trophy },
    { key: "network", label: "Network", icon: Users },
    { key: "finance", label: "Finance", icon: Wallet },
    { key: "secure", label: "Secure", icon: ShieldCheck },
  ];

  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  useEffect(() => {
    const activeButton = containerRef.current?.querySelector(
      `[data-key="${activeTab}"]`
    );

    if (activeButton) {
      setIndicatorStyle({
        width: activeButton.offsetWidth,
        left: activeButton.offsetLeft,
      });
    }
  }, [activeTab]);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100 rounded-bl-lg rounded-br-lg px-2">
      <div
        ref={containerRef}
        className="relative flex overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              data-key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center items-center gap-2 px-2 py-2 text-sm font-medium whitespace-nowrap transition
                ${
                  isActive
                    ? "text-orange-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <Icon
                size={16}
                className={`transition ${
                  isActive ? "text-orange-600" : "text-gray-400"
                }`}
              />
              {tab.label}
            </button>
          );
        })}

        {/* Sliding indicator */}
        <span
          className="absolute bottom-0 h-[2px] bg-orange-500 transition-all duration-300 ease-out"
          style={indicatorStyle}
        />
      </div>
    </div>
  );
}