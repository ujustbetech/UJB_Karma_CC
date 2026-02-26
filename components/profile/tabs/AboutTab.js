"use client";

import { useState } from "react";
import {
  User,
  Sparkles,
  Heart,
  Languages,
  Leaf,
  Activity,
  Compass,
  Target,
  HandHeart,
  Pencil
} from "lucide-react";

import EditAboutSheet from "./EditAboutSheet";

export default function AboutTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-5">

        {/* PERSONAL OVERVIEW */}
        <InfoCard
          icon={<User size={18} className="text-orange-500" />}
          title="Personal Overview"
          action={
            <button onClick={() => setOpen(true)}>
              <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
            </button>
          }
        >
          <InfoGrid
            items={[
              { label: "Marital Status", value: user?.MaritalStatus },
              { label: "Fitness Level", value: user?.FitnessLevel },
              { label: "Health Condition", value: user?.CurrentHealthCondition },
              { label: "Blood Group", value: user?.BloodGroup },
            ]}
          />
        </InfoCard>

        {/* LANGUAGES */}
        <InfoCard
          icon={<Languages size={18} className="text-orange-500" />}
          title="Languages"
        >
          <TagDisplay
            items={user?.LanguagesKnown}
            emptyText="No languages added yet"
            color="orange"
          />
        </InfoCard>

        {/* SKILLS */}
        <InfoCard
          icon={<Sparkles size={18} className="text-orange-500" />}
          title="Skills & Strengths"
        >
          <TagDisplay
            items={user?.Skills}
            emptyText="No skills added yet"
            color="gray"
          />
        </InfoCard>

        {/* HOBBIES */}
        <InfoCard
          icon={<Heart size={18} className="text-orange-500" />}
          title="Hobbies"
        >
          <TagDisplay
            items={user?.Hobbies}
            emptyText="No hobbies added yet"
            color="orange"
          />
        </InfoCard>

        {/* INTEREST AREA */}
        <InfoCard
          icon={<Compass size={18} className="text-orange-500" />}
          title="Interest Area"
        >
          <TagDisplay
            items={user?.InterestArea}
            emptyText="No interests added yet"
            color="gray"
          />
        </InfoCard>

        {/* LIFESTYLE */}
        <InfoCard
          icon={<Leaf size={18} className="text-orange-500" />}
          title="Lifestyle"
        >
          <InfoGrid
            items={[
              { label: "Smoking Habit", value: user?.SmokingHabit },
              { label: "Alcohol Consumption", value: user?.AlcoholConsumption },
            ]}
          />
        </InfoCard>

        {/* ASPIRATIONS */}
        <InfoCard
          icon={<Target size={18} className="text-orange-500" />}
          title="Aspirations"
        >
          <LongTextCard text={user?.Aspirations} />
        </InfoCard>

        {/* SOCIAL CONTRIBUTION */}
        <InfoCard
          icon={<HandHeart size={18} className="text-orange-500" />}
          title="Social Contribution"
        >
          <LongTextCard text={user?.SpecialSocialContribution} />
        </InfoCard>

      </div>

      {/* EDIT SHEET */}
      <EditAboutSheet
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

function LongTextCard({ text }) {
  if (!text || text === "—") {
    return (
      <p className="text-xs text-gray-400">
        No information provided yet
      </p>
    );
  }

  return (
    <p className="text-sm text-gray-700 leading-relaxed">
      {text}
    </p>
  );
}