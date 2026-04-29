"use client";

import { useState } from "react";
import { UserCog, Pencil } from "lucide-react";
import EditProfessionalInfoSheet from "./EditProfessionalInfoSheet";

export default function ProfessionalInfoTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-5">
        <InfoCard
          icon={<UserCog size={18} className="text-orange-500" />}
          title="Professional Info"
          action={<button onClick={() => setOpen(true)}><Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" /></button>}
        >
          <InfoGrid
            items={[
              { label: "Profession Type", value: user?.ProfessionType },
              { label: "Company Name", value: user?.CompanyName || user?.BusinessName },
              { label: "Job Title / Course", value: user?.JobTitle || user?.Course || user?.PrimaryRole || user?.PreviousProfession },
              { label: "Industry", value: user?.Industry || user?.PreviousIndustry },
            ]}
          />
        </InfoCard>

        <TagCard title="Skills" items={user?.Skills} />
        <TagCard title="Expertise" items={user?.Expertise} />
        <TagCard title="Career Aspirations" items={user?.CareerAspirations || user?.CareerInterests || user?.Aspirations} />
        <TagCard title="Support Areas" items={user?.SupportAreas} />
      </div>

      <EditProfessionalInfoSheet open={open} setOpen={setOpen} user={user} setUser={setUser} ujbCode={ujbCode} />
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
  return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"><h3 className="font-semibold text-gray-800 mb-3">{title}</h3>{values.length ? <div className="flex flex-wrap gap-2">{values.map((item, index) => <span key={`${item}-${index}`} className="px-3 py-1 text-xs rounded-full bg-orange-100 text-orange-600">{item}</span>)}</div> : <p className="text-xs text-gray-400">No information added yet</p>}</div>;
}

