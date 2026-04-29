"use client";

import { useEffect, useState } from "react";
import { Receipt, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchUserPayments } from "@/services/userRedeemService";
import UserPageHeader from "@/components/user/UserPageHeader";

export default function UserPaymentsPage() {
  const toast = useToast();

  const [payments, setPayments] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoadingPayments(true);
        const result = await fetchUserPayments();

        setPayments(result.payments);
        setTotalReceived(result.totalReceived);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load payments.");
      } finally {
        setLoadingPayments(false);
      }
    };

    loadPayments();
  }, [toast]);

  return (
    <main className="min-h-screen py-6">
      <div className="space-y-5">
        <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <UserPageHeader
            title="My Payments"
            description="Review payment records from your referral and CC marketplace activity in one place."
            icon={Receipt}
          />

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <Wallet className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Total Received
              </p>
              <p className="text-xl font-semibold text-slate-800">
                Rs. {totalReceived.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loadingPayments ? (
            <StateCard label="Loading payment records..." />
          ) : payments.length === 0 ? (
            <StateCard label="No payment records found." />
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {payment.feeType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Referral ID: {payment.referralId}
                    </p>
                    <p className="text-xs text-slate-500">
                      Date: {payment.paymentDateLabel}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Actual Received
                    </p>
                    <p className="text-xl font-semibold text-slate-800">
                      Rs. {payment.actualReceived.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InfoBlock
                    label="Flow"
                    lines={[`${payment.paymentFromName} to ${payment.paymentToName}`]}
                  />
                  <InfoBlock
                    label="Details"
                    lines={[
                      `Mode: ${payment.modeOfPayment}`,
                      `Transaction Ref: ${payment.transactionRef}`,
                      `Adjusted: Rs. ${payment.adjustedAmount.toLocaleString("en-IN")}`,
                    ]}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function StateCard({ label }) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
      {label}
    </div>
  );
}

function InfoBlock({ label, lines }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      {lines.map((line) => (
        <p key={line} className="mt-1 text-sm text-slate-700">
          {line}
        </p>
      ))}
    </div>
  );
}
