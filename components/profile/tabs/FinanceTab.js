"use client";

import {
  CreditCard,
  Wallet,
  Receipt,
  Calendar,
  BadgeCheck
} from "lucide-react";

export default function FinanceTab({ user = {} }) {
  const subscription = user?.subscription || {};
  const payment = user?.payment || {};

  return (
    <div className="space-y-8">

      {/* ================= SUBSCRIPTION ================= */}
      <section className="space-y-4">

        <SectionHeader
          icon={<CreditCard size={18} className="text-orange-500" />}
          title="Subscription"
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

          <InfoItem
            label="Status"
            value={subscription.status}
            isStatus
          />

          <InfoItem
            label="Start Date"
            value={subscription.startDate}
          />

          <InfoItem
            label="Renewal Date"
            value={subscription.nextRenewalDate}
            highlight
          />

          <InfoItem
            label="Tax Slab"
            value={subscription.taxSlab}
          />

        </div>

      </section>

      {/* ================= WALLET ================= */}
      <section className="space-y-4">

        <SectionHeader className="text-gray-100"
          icon={<Wallet size={18} className="text-orange-500" />}
          title="Wallet"
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

          <p className="text-sm text-gray-500">
            Available Balance
          </p>

          <p className="text-2xl font-semibold text-gray-800 mt-1">
            ₹{user?.balanceAmount || 0}
          </p>

        </div>

      </section>

      {/* ================= PAYMENTS ================= */}
      <section className="space-y-4">

        <SectionHeader
          icon={<Receipt size={18} className="text-orange-500" />}
          title="Payments"
        />

        <div className="bg-white rounded-2xl shadow-sm">

          <InfoItem
            label="Cosmo Payment"
            value={payment?.cosmo?.status}
            isStatus
          />

          <InfoItem
            label="Orbiter Payment"
            value={payment?.orbiter?.status}
            isStatus
          />

        </div>

      </section>

    </div>
  );
}

/* ---------------- Section Header ---------------- */

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="font-semibold text-gray-200 text-lg">
        {title}
      </h3>
    </div>
  );
}

/* ---------------- Info Row ---------------- */

function InfoItem({ label, value, isStatus, highlight }) {
  const display = value || "-";

  return (
    <div className="flex justify-between items-center px-5 py-4">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      {isStatus ? (
        <StatusBadge status={display} />
      ) : (
        <p
          className={`text-sm font-medium ${
            highlight ? "text-orange-500" : "text-gray-800"
          }`}
        >
          {display}
        </p>
      )}

    </div>
  );
}

/* ---------------- Status Badge ---------------- */

function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();

  let style =
    "bg-gray-100 text-gray-600";

  if (normalized.includes("active")) {
    style = "bg-green-100 text-green-600";
  }

  if (normalized.includes("pending")) {
    style = "bg-amber-100 text-amber-600";
  }

  if (normalized.includes("expired")) {
    style = "bg-red-100 text-red-600";
  }

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${style}`}
    >
      {status || "-"}
    </span>
  );
}