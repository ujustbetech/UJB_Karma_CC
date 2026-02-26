"use client";

import { useState } from "react";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    ChevronDown,
    ChevronUp,
    Calendar,
    Copy,
} from "lucide-react";

export default function PaymentsTab({ referral }) {
    const [expandedId, setExpandedId] = useState(null);

    if (!referral?.payments?.length) {
        return (
            <div className="px-4 mt-5 text-sm text-slate-500">
                No payments recorded yet.
            </div>
        );
    }

    /* ================= GROUP BY MONTH ================= */

    const groupedPayments = referral.payments.reduce((acc, payment) => {
        const date = payment?.paymentDate
            ? new Date(payment.paymentDate)
            : new Date();

        const monthKey = date.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });

        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(payment);

        return acc;
    }, {});

    return (
        <div className="mt-6 space-y-10">
            {Object.entries(groupedPayments).map(([month, payments]) => (
                <div key={month}>
                    {/* Month Header */}
                    <h3 className="text-sm font-semibold text-slate-200 mb-6">
                        {month}
                    </h3>

                    <div className="relative border-l-2 border-slate-200 ml-6 space-y-10">
                        {payments.map((p) => {
                            const paymentId = p.paymentId;
                            const isExpanded = expandedId === paymentId;

                            const isPayout = p.paymentFrom === "UJustBe";
                            const gross = p.meta.logicalAmount || p.amountReceived || 0;
                            const net = p.amountReceived || 0;
                            const tds = p.meta.tdsAmount || 0;

                            const paymentDate = p.paymentDate
                                ? new Date(p.paymentDate).toLocaleDateString()
                                : "—";

                            return (
                                <div key={paymentId} className="relative pl-8">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[14px] top-2">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center border ${isPayout
                                                ? "bg-green-50 border-green-300"
                                                : "bg-blue-50 border-blue-300"
                                                }`}
                                        >
                                            {isPayout ? (
                                                <ArrowUpCircle
                                                    size={14}
                                                    className="text-green-600"
                                                />
                                            ) : (
                                                <ArrowDownCircle
                                                    size={14}
                                                    className="text-blue-600"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div
                                        className={`rounded-xl p-5 border transition-all ${isExpanded
                                            ? isPayout
                                                ? "bg-green-50 border-green-200"
                                                : "bg-blue-50 border-blue-200"
                                            : "bg-white border-slate-200"
                                            }`}
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    {p.paymentFrom} → {p.paymentTo}
                                                </p>

                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {paymentDate}
                                                </p>
                                            </div>

                                            <p className="text-base font-semibold text-slate-900">
                                                ₹{net.toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Basic Info */}
                                        <div className="text-xs text-slate-500 mt-2 space-y-1">
                                            {p.modeOfPayment && (
                                                <p>Mode: {p.modeOfPayment}</p>
                                            )}
                                            {p.transactionRef && (
                                                <p>Ref: {p.transactionRef}</p>
                                            )}
                                            {p.paymentToName && (
                                                <p>To: {p.paymentToName}</p>
                                            )}
                                        </div>

                                        {/* Expand Button */}
                                        <button
                                            onClick={() =>
                                                setExpandedId((prev) =>
                                                    prev === paymentId ? null : paymentId
                                                )
                                            }
                                            className={`mt-3 text-xs flex items-center gap-1 ${isPayout
                                                ? "text-green-700"
                                                : "text-blue-700"
                                                }`}
                                        >
                                            View Details
                                            {isExpanded ? (
                                                <ChevronUp size={14} />
                                            ) : (
                                                <ChevronDown size={14} />
                                            )}
                                        </button>

                                        {/* ================= EXPANDED SECTION ================= */}
                                        {isExpanded && (
                                            <div className="mt-4 border-t pt-3 space-y-2 text-sm text-slate-700">

                                                {/* 🔵 COSMO PAYMENT → DISTRIBUTION */}
                                                {!isPayout && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>Gross Amount</span>
                                                            <span>₹{gross.toLocaleString()}</span>
                                                        </div>

                                                        <div className="flex justify-between font-medium">
                                                            <span>Amount Received by UJB</span>
                                                            <span>₹{net.toLocaleString()}</span>
                                                        </div>

                                                        <div className="pt-2 space-y-1 text-xs text-slate-600">
                                                            <p className="font-medium text-slate-700 mb-1">
                                                                Distribution
                                                            </p>

                                                            {referral.paidToOrbiter > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span>Paid To Orbiter</span>
                                                                    <span>₹{referral.paidToOrbiter.toLocaleString()}</span>
                                                                </div>
                                                            )}

                                                            {referral.paidToCosmoMentor > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span>Paid To Cosmo Mentor</span>
                                                                    <span>₹{referral.paidToCosmoMentor.toLocaleString()}</span>
                                                                </div>
                                                            )}

                                                            {referral.paidToOrbiterMentor > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span>Paid To Orbiter Mentor</span>
                                                                    <span>₹{referral.paidToOrbiterMentor.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {/* 🟢 UJB PAYMENT → TDS BREAKDOWN */}
                                                {isPayout && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>Gross Amount</span>
                                                            <span>₹{gross.toLocaleString()}</span>
                                                        </div>

                                                        {tds > 0 && (
                                                            <div className="flex justify-between text-amber-600">
                                                                <span>TDS Deducted</span>
                                                                <span>₹{tds.toLocaleString()}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between font-medium">
                                                            <span>Net Paid</span>
                                                            <span>₹{net.toLocaleString()}</span>
                                                        </div>

                                                        <div className="pt-2 text-xs text-slate-500 space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Payment ID</span>
                                                                <span>{paymentId}</span>
                                                            </div>
                                         
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}