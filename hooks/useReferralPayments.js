import { useMemo, useState } from "react";
import { recordCcCosmoPayment } from "@/services/ccReferralService";
import { COLLECTIONS } from "@/lib/utility_collection";

const round2 = (n) => Math.round(n * 100) / 100;

const getPaymentIdentity = (payment, index = 0) =>
  payment?.paymentId ||
  payment?.meta?.paymentId ||
  payment?.transactionRef ||
  `payment-${index}`;

const dedupePayments = (paymentList) => {
  const seen = new Set();
  const result = [];

  paymentList.forEach((payment, index) => {
    const identity = getPaymentIdentity(payment, index);

    if (seen.has(identity)) {
      return;
    }

    seen.add(identity);
    result.push(payment);
  });

  return result;
};

const mergePaymentEntry = (previousPayments, nextEntry) =>
  dedupePayments([...(Array.isArray(previousPayments) ? previousPayments : []), nextEntry]);

export default function useReferralPayments({
  id,
  referralData,
  payments,
  setPayments,
  dealLogs,
  collectionName = COLLECTIONS.referral,
  onRefresh,
}) {
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safePayments = useMemo(() => {
    const normalized = Array.isArray(payments)
      ? payments
      : payments && typeof payments === "object"
      ? Object.values(payments)
      : [];

    return dedupePayments(normalized);
  }, [payments]);

  const agreedAmount = useMemo(() => {
    if (!Array.isArray(dealLogs) || dealLogs.length === 0) return 0;
    const lastDeal = dealLogs[dealLogs.length - 1];
    return Number(lastDeal?.agreedAmount || 0);
  }, [dealLogs]);

  const cosmoPaid = safePayments
    .filter((payment) => payment?.meta?.isCosmoToUjb)
    .reduce(
      (sum, payment) =>
        sum + Number(payment?.grossAmount ?? payment?.amountReceived ?? 0),
      0
    );

  const agreedRemaining = Math.max(agreedAmount - cosmoPaid, 0);

  const calculateDistribution = (amount) => {
    if (!Array.isArray(dealLogs) || dealLogs.length === 0) return null;

    const deal = dealLogs[dealLogs.length - 1];
    if (!deal?.agreedAmount) return null;

    const ratio = Number(amount) / Number(deal.agreedAmount || 1);

    return {
      orbiter: round2((deal.orbiterShare || 0) * ratio),
      orbiterMentor: round2((deal.orbiterMentorShare || 0) * ratio),
      cosmoMentor: round2((deal.cosmoMentorShare || 0) * ratio),
      ujustbe: round2((deal.ujustbeShare || 0) * ratio),
    };
  };

  const [newPayment, setNewPayment] = useState({
    amountReceived: "",
    modeOfPayment: "",
    transactionRef: "",
    paymentDate: "",
    tdsDeducted: false,
    tdsRate: 10,
  });

  const updateNewPayment = (field, value) => {
    const nextValue = value && value.target ? value.target.value : value;

    setNewPayment((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const openPaymentModal = () => setShowAddPaymentForm(true);
  const closePaymentModal = () => setShowAddPaymentForm(false);

  const handleSavePayment = async () => {
    if (!id || isSubmitting) return;

    const amount = Number(newPayment.amountReceived || 0);
    if (amount <= 0) return alert("Enter valid amount");
    if (!newPayment.paymentDate) return alert("Select payment date");

    const distribution = calculateDistribution(amount);
    if (!distribution) return alert("Distribution not available");

    const tdsRate = newPayment.tdsDeducted
      ? Number(newPayment.tdsRate || 0)
      : 0;
    const tdsAmount = Math.max(0, round2((amount * tdsRate) / 100));
    const netAmount = round2(amount - tdsAmount);

    setIsSubmitting(true);

    try {
      if (collectionName !== "CCReferral") {
        throw new Error("Unsupported referral collection");
      }

      const entry = {
        paymentId: `COSMO-${Date.now()}`,
        paymentFrom: "CosmoOrbiter",
        paymentTo: "UJustBe",
        grossAmount: amount,
        tdsAmount,
        tdsRate,
        amountReceived: netAmount,
        distribution,
        paymentDate: newPayment.paymentDate,
        modeOfPayment: newPayment.modeOfPayment,
        transactionRef: newPayment.transactionRef,
        createdAt: new Date().toISOString(),
        meta: {
          isCosmoToUjb: true,
          tdsDeducted: newPayment.tdsDeducted,
        },
      };

      await recordCcCosmoPayment({
        id,
        entry,
      });

      setPayments((prev = []) => mergePaymentEntry(prev, entry));
      await onRefresh?.();
      closePaymentModal();
    } catch (error) {
      console.error(error);
      alert("Cosmo payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    agreedAmount,
    cosmoPaid,
    agreedRemaining,
    showAddPaymentForm,
    isSubmitting,
    newPayment,
    updateNewPayment,
    openPaymentModal,
    closePaymentModal,
    handleSavePayment,
    payments: safePayments,
  };
}
