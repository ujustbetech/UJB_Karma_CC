"use client";

import { useState } from "react";
import {
  Building2,
  Star,
  Layers,
  Globe,
  MapPin,
  Users,
  Image,
  Pencil,
} from "lucide-react";

import EditBusinessSheet from "./EditBusinessSheet"; 

export default function BusinessTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-5">

        {/* BUSINESS OVERVIEW */}
        <InfoCard
          icon={<Building2 size={18} className="text-orange-500" />}
          title="Business Overview"
          action={
            <button onClick={() => setOpen(true)}>
              <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
            </button>
          }
        >
          {user?.BusinessLogo && (
            <div className="mb-4">
              <img
                src={user.BusinessLogo}
                alt="Business Logo"
                className="w-20 h-20 rounded-xl object-cover border"
              />
            </div>
          )}

          <InfoGrid
            items={[
              { label: "Business Name", value: user?.BusinessName },
              { label: "Stage", value: user?.BusinessStage },
              { label: "Type", value: user?.BusinessDetails },
              { label: "Established", value: user?.EstablishedAt },
            ]}
          />
        </InfoCard>

        {/* BRAND POSITIONING */}
        <InfoCard
          icon={<Star size={18} className="text-orange-500" />}
          title="Brand Positioning"
        >
          <LongTextCard label="Tagline" text={user?.TagLine} />
          <LongTextCard label="USP" text={user?.USP} />
          <LongTextCard label="Clientele Base" text={user?.ClienteleBase} />
          <LongTextCard label="Business History" text={user?.BusinessHistory} />
          <LongTextCard
            label="Achievements"
            text={user?.NoteworthyAchievements}
          />
        </InfoCard>

        {/* CATEGORIES */}
        <InfoCard
          icon={<Layers size={18} className="text-orange-500" />}
          title="Categories"
        >
          <TagDisplay
            items={[
              user?.Category,
              user?.Category1,
              user?.Category2,
              user?.keyCategory,
            ].filter(Boolean)}
            emptyText="No categories added"
            color="orange"
          />
        </InfoCard>

        {/* MARKET PRESENCE */}
        <InfoCard
          icon={<Globe size={18} className="text-orange-500" />}
          title="Market Presence"
        >
          <InfoGrid
            items={[
              { label: "Website", value: user?.Website },
              { label: "Business Email", value: user?.BusinessEmailID },
            ]}
          />

          <div className="mt-4">
            <p className="text-gray-500 text-sm mb-2">
              Areas of Services
            </p>
            <TagDisplay
              items={user?.AreaOfServices}
              emptyText="No service areas added"
              color="gray"
            />
          </div>
        </InfoCard>

        {/* SOCIAL MEDIA */}
        <InfoCard
          icon={<Users size={18} className="text-orange-500" />}
          title="Social Media"
        >
          {Array.isArray(user?.BusinessSocialMediaPages) &&
          user.BusinessSocialMediaPages.length > 0 ? (
            <div className="space-y-2 text-sm">
              {user.BusinessSocialMediaPages.map((item, index) => (
                <div key={index}>
                  <span className="font-medium text-gray-700">
                    {item.platform}:
                  </span>{" "}
                  <span className="text-gray-600">
                    {item.url}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              No social media links added
            </p>
          )}
        </InfoCard>

        {/* LOCATION */}
        <InfoCard
          icon={<MapPin size={18} className="text-orange-500" />}
          title="Location"
        >
          <InfoGrid
            items={[
              { label: "Address", value: user?.Location },
              { label: "Locality", value: user?.Locality },
              { label: "City", value: user?.City },
              { label: "State", value: user?.State },
              { label: "Pincode", value: user?.Pincode },
            ]}
          />
        </InfoCard>

      </div>

      <EditBusinessSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* --------------------- REUSABLE COMPONENTS ------------------------ */
/* ------------------------------------------------------------------ */

function InfoCard({ icon, title, children, action }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-800">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function TagDisplay({ items = [], emptyText, color = "orange" }) {
  const safeItems = Array.isArray(items) ? items : [];

  const base =
    color === "orange"
      ? "bg-orange-100 text-orange-600"
      : "bg-gray-200 text-gray-700";

  if (safeItems.length === 0) {
    return (
      <p className="text-xs text-gray-400">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {safeItems.map((item) => (
        <span
          key={item}
          className={`px-3 py-1 text-xs rounded-full ${base}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-gray-500">{label}</p>
          <p className="font-medium text-gray-800">
            {value && value !== "—" ? value : "-"}
          </p>
        </div>
      ))}
    </div>
  );
}

function LongTextCard({ label, text }) {
  if (!text || text === "—") {
    return (
      <p className="text-xs text-gray-400">
        No information provided yet
      </p>
    );
  }

  return (
    <div className="mb-3">
      {label && (
        <p className="text-gray-500 text-sm mb-1">
          {label}
        </p>
      )}
      <p className="text-sm text-gray-700 leading-relaxed">
        {text}
      </p>
    </div>
  );
}