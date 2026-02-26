"use client";

import { useEffect, useState, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";
import Image from "next/image";
import {
  MapPin,
  Globe,
  Phone,
  Mail,
  CheckCircle,
} from "lucide-react";

export default function ModernProfilePage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const fetchUser = async () => {
      const storedUjbCode = localStorage.getItem("mmUJBCode");
      if (!storedUjbCode) return;

      const snap = await getDoc(
        doc(db, COLLECTIONS.userDetail, storedUjbCode)
      );

      if (snap.exists()) {
        setUser(snap.data());
      }
    };

    fetchUser();
  }, []);

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.Name,
      user.TagLine,
      user.BusinessName,
      user.BusinessHistory,
      user.LanguagesKnown?.length,
      user.services?.length,
      user.ProfilePhotoURL,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">

      {/* HERO */}
      <div className="relative h-[340px]">

        <Image
          src={user.ProfilePhotoURL || "/placeholder.jpg"}
          fill
          priority
          className="object-cover"
          alt="profile"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />

        {/* Avatar */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
          <div className="relative w-28 h-28 rounded-full border-4 border-white overflow-hidden shadow-lg">
            <Image
              src={user.ProfilePhotoURL || "/placeholder.jpg"}
              fill
              className="object-cover"
              alt="avatar"
            />
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="mt-16 px-5">

        <div className="bg-white rounded-3xl shadow-sm p-6">

          {/* NAME */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {user.Name}
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              {user.TagLine}
            </p>

            <div className="mt-2 inline-flex items-center gap-2 text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
              <CheckCircle size={14} />
              {user.ProfileStatus}
            </div>
          </div>

          {/* COMPLETION BAR */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Profile Completion</span>
              <span>{profileCompletion}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>

          {/* QUICK INFO */}
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <Stat number={user.services?.length || 0} label="Services" />
            <Stat number={user.products?.length || 0} label="Products" />
            <Stat number={user.connects?.length || 0} label="Network" />
          </div>

        </div>
      </div>

      {/* TABS */}
      <div className="mt-6 px-5">
        <div className="bg-white rounded-full p-1 shadow-sm flex">
          {["about", "business", "services"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-orange-500 text-white"
                  : "text-gray-500"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 py-6 space-y-6">

        {activeTab === "about" && (
          <Card title="Personal Information">
            <Info label="DOB" value={user.DOB} />
            <Info label="Gender" value={user.Gender} />
            <Info label="Marital" value={user.MaritalStatus} />
            <TagList items={user.LanguagesKnown} />
            <TagList items={user.Skills} />
          </Card>
        )}

        {activeTab === "business" && (
          <>
            <Card title="Business Overview">
              <p className="text-sm text-gray-600 leading-relaxed">
                {user.BusinessHistory}
              </p>
            </Card>

            <Card title="Contact">
              <IconRow icon={<Phone size={14} />} value={user.MobileNo} />
              <IconRow icon={<Mail size={14} />} value={user.Email} />
              <IconRow icon={<Globe size={14} />} value={user.Website} />
              <IconRow
                icon={<MapPin size={14} />}
                value={`${user.City}, ${user.State}`}
              />
            </Card>
          </>
        )}

        {activeTab === "services" && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {user.services?.map((s, i) => (
              <div
                key={i}
                className="min-w-[240px] bg-white rounded-2xl shadow-sm p-4"
              >
                <h4 className="font-semibold">{s.name}</h4>
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                  {s.description}
                </p>

                <span className="mt-3 inline-block text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                  {s.agreedValue?.single?.value}%
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold mb-3 text-gray-800">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">
        {value || "-"}
      </span>
    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div>
      <p className="text-lg font-bold text-gray-800">{number}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function TagList({ items }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items?.map((item, i) => (
        <span
          key={i}
          className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function IconRow({ icon, value }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 py-1">
      {icon}
      {value || "-"}
    </div>
  );
}