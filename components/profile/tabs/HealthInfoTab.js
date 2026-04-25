"use client";

import { useState } from "react";
import { HeartPulse, Pencil } from "lucide-react";
import EditHealthInfoSheet from "./EditHealthInfoSheet";

export default function HealthInfoTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-5">
        <InfoCard
          icon={<HeartPulse size={18} className="text-orange-500" />}
          title="Health Info"
          action={
            <button onClick={() => setOpen(true)}>
              <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
            </button>
          }
        >
          <InfoGrid
            items={[
              { label: "Current Health Condition", value: user?.CurrentHealthCondition },
              { label: "Blood Group", value: user?.BloodGroup },
              { label: "Fitness Level", value: user?.FitnessLevel },
              { label: "Smoking Habit", value: user?.SmokingHabit },
              { label: "Alcohol Consumption", value: user?.AlcoholConsumption },
            ]}
          />
        </InfoCard>

        <TagCard title="Health Parameters" items={user?.HealthParameters} />
        <TagCard title="Lifestyle Notes" items={user?.HealthNotes} />
        <TagCard title="Family Health History" items={user?.FamilyHistorySummary} />
      </div>

      <EditHealthInfoSheet open={open} setOpen={setOpen} user={user} setUser={setUser} ujbCode={ujbCode} />
    </>
  );
}

function InfoCard({ icon, title, children, action }) {
  return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"><div className="flex justify-between items-center mb-3"><div className="flex items-center gap-2">{icon}<h3 className="font-semibold text-gray-800">{title}</h3></div>{action}</div>{children}</div>;
}

function InfoGrid({ items }) {
  return <div className="grid grid-cols-2 gap-4 text-sm">{items.map(({ label, value }) => <div key={label}><p className="text-gray-500">{label}</p><p className="font-medium text-gray-800">{value || "-"}</p></div>)}</div>;
}

function TagCard({ title, items }) {
  const values = Array.isArray(items) ? items : typeof items === "string" && items ? items.split(",").map((item) => item.trim()).filter(Boolean) : [];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      {values.length ? (
        <div className="flex flex-wrap gap-2">{values.map((item, index) => <span key={`${item}-${index}`} className="px-3 py-1 text-xs rounded-full bg-orange-100 text-orange-600">{item}</span>)}</div>
      ) : (
        <p className="text-xs text-gray-400">No information added yet</p>
      )}
    </div>
  );
}
