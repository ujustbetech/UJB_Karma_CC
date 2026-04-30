"use client";

import { useState } from "react";
import { User, MapPin, Globe, Pencil, ShieldCheck } from "lucide-react";
import EditPersonalInfoSheet from "./EditPersonalInfoSheet";

export default function PersonalInfoTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-5">
        <InfoCard
          icon={<User size={18} className="text-orange-500" />}
          title="Personal Info"
          action={
            <button onClick={() => setOpen(true)}>
              <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
            </button>
          }
        >
          <InfoGrid
            items={[
              { label: "Name", value: user?.Name },
              { label: "Category", value: user?.Category },
              { label: "Email", value: user?.Email },
              { label: "Mobile", value: user?.MobileNo || user?.Mobile },
              { label: "Resident Status", value: user?.residentStatus },
              { label: "Applicable Tax Slab", value: user?.taxSlab },
              { label: "ID Type", value: user?.IDType },
              { label: "ID Number", value: user?.IDNumber },
            ]}
          />
        </InfoCard>

        <InfoCard
          icon={<MapPin size={18} className="text-orange-500" />}
          title="Location"
        >
          <InfoGrid
            items={[
              { label: "Pincode", value: user?.Pincode },
              { label: "City", value: user?.City },
              { label: "State", value: user?.State },
              { label: "Location", value: user?.Location },
            ]}
          />
        </InfoCard>

        <InfoCard
          icon={<Globe size={18} className="text-orange-500" />}
          title="Social Media"
        >
          {Array.isArray(user?.BusinessSocialMediaPages) &&
          user.BusinessSocialMediaPages.length > 0 ? (
            <div className="space-y-2 text-sm">
              {user.BusinessSocialMediaPages.map((item, index) => (
                <div key={`${item.platform || "platform"}-${index}`}>
                  <span className="font-medium text-gray-700">
                    {item.customPlatform || item.platform || "Platform"}:
                  </span>{" "}
                  <span className="text-gray-600">{item.url || "-"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No social links added yet</p>
          )}
        </InfoCard>
      </div>

      <EditPersonalInfoSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}

function InfoCard({ icon, title, children, action }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        {action}
      </div>
      {children}
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
            {value && value !== "â€”" ? value : "-"}
          </p>
        </div>
      ))}
    </div>
  );
}

