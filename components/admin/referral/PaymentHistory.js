"use client";

import React, { useState } from "react";
import SlotPayoutRow from "./SlotPayoutRow";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";

import {
  Wallet,
  Hash,
  Calendar,
  ArrowRightLeft,
  CreditCard,
  Layers,
  ChevronDown,
  ChevronUp,
  Banknote,
  Send,
  Clock,
} from "lucide-react";

export default function PaymentHistory({
  payments = [],
  mapName,
  onRequestPayout,
}) {
  const [expanded, setExpanded] = useState(null);

  const safePayments = Array.isArray(payments)
    ? payments
    : Object.values(payments || {}).flat();

  const visiblePayments = safePayments.filter(
    (p) =>
      p?.meta?.isCosmoToUjb === true ||
      p?.meta?.type === "cosmoPayment"
  );

  const getPaidForSlot = (cosmoPaymentId, slot) =>
    safePayments
      .filter(
        (p) =>
          p?.meta?.isUjbPayout === true &&
          p?.meta?.belongsToPaymentId === cosmoPaymentId &&
          p?.meta?.slot === slot
      )
      .reduce((sum, p) => sum + (p?.meta?.logicalAmount || 0), 0);

  if (!visiblePayments.length) {
    return <Text muted>No payments yet.</Text>;
  }

  return (
    <div className="space-y-4">
      {visiblePayments.map((pay, idx) => {
        const paymentId =
          pay?.paymentId || pay?.meta?.paymentId || `PAY-${idx}`;

        const total =
          pay?.grossAmount ||
          pay?.meta?.logicalAmount ||
          Number(pay?.amountReceived || 0);

        const orbiterPaid = getPaidForSlot(paymentId, "Orbiter");
        const mentorPaid = getPaidForSlot(paymentId, "OrbiterMentor");
        const cosmoPaid = getPaidForSlot(paymentId, "CosmoMentor");

        const totalPaid = orbiterPaid + mentorPaid + cosmoPaid;

        const pending = total - totalPaid;

        const progress =
          total > 0 ? Math.round((totalPaid / total) * 100) : 0;

        return (
          <div key={`${paymentId}-${idx}`}>
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Wallet size={18} />
                  <Text variant="h3">
                    ₹{total.toLocaleString("en-IN")}
                  </Text>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <Hash size={14} />
                  <Text variant="caption">{paymentId}</Text>
                </div>
              </div>

              <StatusBadge status="received">
                {progress === 100
                  ? "Fully Distributed"
                  : progress > 0
                  ? "Partially Distributed"
                  : "Not Distributed"}
              </StatusBadge>
            </div>

            {/* SUMMARY */}
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Banknote size={14} />
                <Text>Received: ₹{total}</Text>
              </div>

              <div className="flex items-center gap-2">
                <Send size={14} />
                <Text>Paid: ₹{totalPaid}</Text>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={14} />
                <Text>Pending: ₹{pending}</Text>
              </div>
            </div>

            {/* META */}
            <div className="mt-3 space-y-1 text-slate-600">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={14} />
                <Text>
                  {mapName(pay?.paymentFrom)} →{" "}
                  {mapName(pay?.paymentTo)}
                </Text>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <Text>{pay?.paymentDate || "—"}</Text>
              </div>

              <div className="flex items-center gap-2">
                <CreditCard size={14} />
                <Text>{pay?.modeOfPayment || "—"}</Text>
              </div>
            </div>

            {/* DISTRIBUTION */}
            {pay?.distribution && (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setExpanded(expanded === paymentId ? null : paymentId)
                  }
                  className="flex items-center gap-2"
                >
                  <Layers size={16} />
                  {expanded === paymentId ? (
                    <>
                      <ChevronUp size={16} /> Hide Breakdown
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} /> View Breakdown
                    </>
                  )}
                </Button>

                {expanded === paymentId && (
                  <div className="mt-4 space-y-3">
                    <SlotPayoutRow
                      label="Orbiter"
                      totalShare={pay.distribution.orbiter}
                      paidSoFar={orbiterPaid}
                      onRequestPayout={(amount) =>
                        onRequestPayout?.({
                          cosmoPaymentId: paymentId,
                          slot: "Orbiter",
                          amount,
                        })
                      }
                    />

                    <SlotPayoutRow
                      label="Orbiter Mentor"
                      totalShare={pay.distribution.orbiterMentor}
                      paidSoFar={mentorPaid}
                      onRequestPayout={(amount) =>
                        onRequestPayout?.({
                          cosmoPaymentId: paymentId,
                          slot: "OrbiterMentor",
                          amount,
                        })
                      }
                    />

                    <SlotPayoutRow
                      label="Cosmo Mentor"
                      totalShare={pay.distribution.cosmoMentor}
                      paidSoFar={cosmoPaid}
                      onRequestPayout={(amount) =>
                        onRequestPayout?.({
                          cosmoPaymentId: paymentId,
                          slot: "CosmoMentor",
                          amount,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
