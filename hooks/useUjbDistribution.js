import { useState } from "react";
import { recordCcUjbPayout } from "@/services/ccReferralService";
import { COLLECTIONS } from "@/lib/utility_collection";

const getPaymentIdentity = (payment, index = 0) =>
  payment?.paymentId ||
  payment?.meta?.paymentId ||
  payment?.transactionRef ||
  `payment-${index}`;

const mergePaymentEntry = (previousPayments, nextEntry) => {
  const merged = [...(Array.isArray(previousPayments) ? previousPayments : []), nextEntry];
  const seen = new Set();

  return merged.filter((payment, index) => {
    const identity = getPaymentIdentity(payment, index);

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
};

export function useUjbDistribution({
  referralId,
  referralData,
  payments,
  onPaymentsUpdate,
  orbiter,
  cosmoOrbiter,
  collectionName = COLLECTIONS.referral,
  onRefresh,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const getBalance = () => Number(referralData?.ujbBalance || 0);

  const recipientNameMap = {
    Orbiter: orbiter?.name || "Orbiter",
    OrbiterMentor: orbiter?.mentorName || "Orbiter Mentor",
    CosmoMentor: cosmoOrbiter?.mentorName || "Cosmo Mentor",
  };

  const fieldMap = {
    Orbiter: "paidToOrbiter",
    OrbiterMentor: "paidToOrbiterMentor",
    CosmoMentor: "paidToCosmoMentor",
  };

  const payFromSlot = async ({
    recipient,
    amount,
    logicalAmount,
    tdsAmount,
    fromPaymentId,
    modeOfPayment,
    transactionRef,
    paymentDate,
    adjustmentMeta,
  }) => {
    if (!referralId) return { error: "Referral ID missing" };
    if (!fieldMap[recipient]) return { error: "Invalid recipient" };
    if (isSubmitting) return { error: "Payout already in progress" };

    const netAmount = Number(amount || 0);
    const grossAmount = Number(logicalAmount || 0);
    const tds = Number(tdsAmount || 0);

    if (netAmount < 0 || grossAmount < 0 || tds < 0) {
      return { error: "Invalid payout values" };
    }

    const balance = getBalance();
    if (netAmount > balance) {
      return { error: "Insufficient UJB balance" };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (collectionName !== "CCReferral") {
        throw new Error("Unsupported referral collection");
      }

      const entry = {
        paymentId: `UJB-PAYOUT-${Date.now()}`,
        paymentFrom: "UJustBe",
        paymentTo: recipient,
        paymentToName: recipientNameMap[recipient],
        amountReceived: netAmount,
        paymentDate,
        modeOfPayment,
        transactionRef,
        createdAt: new Date().toISOString(),
        meta: {
          isUjbPayout: true,
          slot: recipient,
          belongsToPaymentId: fromPaymentId || null,
          logicalAmount: grossAmount,
          tdsAmount: tds,
          adjustment: adjustmentMeta || null,
        },
      };

      Object.keys(entry).forEach((key) => {
        if (entry[key] === undefined) {
          delete entry[key];
        }
      });

      await recordCcUjbPayout({
        id: referralId,
        recipient,
        entry,
      });

      onPaymentsUpdate?.((prev = []) => mergePaymentEntry(prev, entry));
      await onRefresh?.();
      return { success: true };
    } catch (err) {
      console.error("UJB payout error:", err);
      setError("Payout failed");
      return { error: "Payout failed" };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    ujbBalance: getBalance(),
    payFromSlot,
  };
}
