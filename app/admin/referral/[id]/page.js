// pages/referral/[id].js
'use client';

import { useRouter, useParams } from "next/navigation";

import { Activity, useState } from "react";

import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";



import useReferralDetails from "@/hooks/useReferralDetails";
import useReferralPayments from "@/hooks/useReferralPayments";
import { useUjbDistribution } from "@/hooks/useUjbDistribution";
import { useReferralAdjustment } from "@/hooks/useReferralAdjustment";

// LEFT COLUMN CARDS
import StatusCard from "@/components/admin/referral/StatusCard";
import ReferralInfoCard from "@/components/admin/referral/ReferralInfoCard";
import OrbiterDetailsCard from "@/components/admin/referral/OrbiterDetailsCard";
import CosmoOrbiterDetailsCard from "@/components/admin/referral/CosmoOrbiterDetailsCard";
import ServiceDetailsCard from "@/components/admin/referral/ServiceDetailsCard";
import PaymentHistory from "@/components/admin/referral/PaymentHistory";

// RIGHT STICKY COLUMN
import FollowupList from "@/components/admin/referral/FollowupList";
import FollowupForm from "@/components/admin/referral/FollowupForm";

// BOTTOM PAYMENT BAR + DRAWER
import PaymentSummary from "@/components/admin/referral/PaymentSummary";
import PaymentDrawer from "@/components/admin/referral/PaymentDrawer";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import NumberInput from "@/components/ui/NumberInput";
import DateInput from "@/components/ui/DateInput";
// import Layout from "@/component/Layout";
import { FileText, Wallet, Tag, Users, PlusCircle } from "lucide-react";

function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-md ${className}`}
    />
  );
}

export default function ReferralDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [participantTab, setParticipantTab] = useState("orbiter");

  const {
    loading,
    referralData,
    orbiter,
    cosmoOrbiter,
    payments,
    setPayments,
    followups,
    formState,
    setFormState,
    dealLogs,
    dealAlreadyCalculated,
    dealEverWon,
    handleStatusUpdate,
    handleSaveDealLog,
    addFollowup,
    editFollowup,
    deleteFollowup,
    uploadLeadDoc,
  } = useReferralDetails(id);

  const payment = useReferralPayments({
    id,
    referralData,
    payments,
    setPayments,
    dealLogs,
  });
  const getUjbTdsRate = (isNri) => (isNri ? 0.20 : 0.05);

  const calculateUjbTDS = (gross, isNri) => {
    const g = Number(gross || 0);
    const rate = getUjbTdsRate(isNri);
    const tds = Math.round(g * rate);
    const net = g - tds;
    return { gross: g, tds, net, rate };
  };

  const ujb = useUjbDistribution({
    referralId: id,
    referralData,
    payments,
    onPaymentsUpdate: setPayments,
    orbiter,
    cosmoOrbiter,
  });

  // Use the primary orbiter UJB code for the preload hook (but for mentors we will pass exact UJB codes)
  const primaryOrbiterUjb =
    referralData?.orbiterUJBCode ||
    orbiter?.ujbCode ||
    orbiter?.UJBCode ||
    null;

  const adjustment = useReferralAdjustment(id, primaryOrbiterUjb);

  // Followup form state
  const defaultFollowupForm = {
    priority: "Medium",
    date: "",
    description: "",
    status: "Pending",
  };
  const [followupForm, setFollowupForm] = useState(defaultFollowupForm);
  const [isEditingFollowup, setIsEditingFollowup] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Payment Drawer
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);

  // Payout modal state (manual per-slot payout)
  const [payoutModal, setPayoutModal] = useState({
    open: false,
    cosmoPaymentId: null,
    slot: "", // "Orbiter" | "OrbiterMentor" | "CosmoMentor"
    logicalAmount: 0, // how much this slot logically represents
    recipientUjb: null,
    recipientName: "",
    preview: null,
    modeOfPayment: "",
    transactionRef: "",
    paymentDate: new Date().toISOString().split("T")[0],
    processing: false,
  });
  // ================= TDS DERIVED VALUES FOR MODAL =================

  const headerColor =
    formState.dealStatus === "Deal Won"
      ? "from-emerald-50 to-white border-emerald-200"
      : formState.dealStatus === "Rejected"
        ? "from-red-50 to-white border-red-200"
        : "from-indigo-50 to-white border-indigo-200";

  // Helper: sanitize number
  const n = (v) => Math.max(0, Number(v || 0));
  const getRecipientInfo = (slot) => {
    const normalize = (status) =>
      status === "Non-Resident" ? "nri" : "resident";

    switch (slot) {
      case "Orbiter":
        return {
          ujb:
            referralData?.orbiterUJBCode ||
            orbiter?.ujbCode ||
            null,
          name: orbiter?.name || "Orbiter",
          payeeType: normalize(
            referralData?.orbiter?.residentStatus ??
            orbiter?.residentStatus
          ),
        };

      case "OrbiterMentor":
        return {
          ujb:
            referralData?.orbiterMentorUJBCode ||
            orbiter?.mentorUJBCode ||
            null,
          name: orbiter?.mentorName || "Orbiter Mentor",
          payeeType: normalize(
            referralData?.orbiter?.mentorResidentStatus ??
            orbiter?.mentorResidentStatus
          ),
        };


      case "CosmoMentor":
        return {
          ujb:
            referralData?.cosmoMentorUJBCode ||
            cosmoOrbiter?.mentorUJBCode ||
            null,

          name: cosmoOrbiter?.mentorName || "Cosmo Mentor",

          payeeType:
            cosmoOrbiter?.mentorResidentStatus === "Non-Resident"
              ? "nri"
              : "resident",
        };



      default:
        return { ujb: null, name: "", payeeType: "resident" };
    }
  };



  // ================= TDS DERIVED VALUES FOR MODAL =================
  let previewGross = 0;
  let previewTds = 0;
  let previewNet = 0;
  let previewIsNri = false;
  if (payoutModal.open && payoutModal.preview) {
    const deducted = Number(payoutModal.preview?.deducted || 0);
    const logical = Number(payoutModal.logicalAmount || 0);

    const adjustedGross =
      deducted > 0 ? Math.max(logical - deducted, 0) : logical;

    const recipientInfo = getRecipientInfo(payoutModal.slot);
    previewIsNri = recipientInfo.payeeType === "nri";

    const { gross, tds, net } =
      calculateUjbTDS(adjustedGross, previewIsNri);

    previewGross = gross;
    previewTds = tds;
    previewNet = net;
  }



  // Map slot -> recipient info (we will use referral-level flat fields as authoritative)


  // Open payout modal for a slot (manual)
  const openPayoutModal = ({ cosmoPaymentId, slot, amount }) => {
    const logical = n(amount);
    const info = getRecipientInfo(slot);

    setPayoutModal({
      open: true,
      cosmoPaymentId: cosmoPaymentId || null,
      slot,
      logicalAmount: logical,
      recipientUjb: info.ujb,
      recipientName: info.name,
      preview: null,
      modeOfPayment: "",
      transactionRef: "",
      paymentDate: new Date().toISOString().split("T")[0],
      processing: false,
    });

    // fetch preview (non-blocking)
    (async () => {
      try {
        const lastDeal = dealLogs?.[dealLogs.length - 1];
        const dealValue = lastDeal?.dealValue || null;

        const preview = await adjustment.applyAdjustmentForRole({
          role: slot,
          requestedAmount: logical,
          dealValue,
          ujbCode: info.ujb,
          previewOnly: true,
          referral: { id },
        });

        setPayoutModal((p) => ({ ...p, preview }));
      } catch (err) {
        setPayoutModal((p) => ({ ...p, preview: { error: "Preview failed" } }));
      }
    })();
  };

  const closePayoutModal = () => {
    setPayoutModal((p) => ({ ...p, open: false, preview: null }));
  };

  // Confirm payout => commit adjustment and create UJB payout
  const confirmPayout = async () => {
    const {
      cosmoPaymentId,
      slot,
      logicalAmount,
      recipientUjb,
      modeOfPayment,
      transactionRef,
      paymentDate,
    } = payoutModal;

    if (!slot || logicalAmount <= 0) {
      alert("Invalid payout slot or amount");
      return;
    }

    if (!modeOfPayment) {
      alert("Please select mode of payment");
      return;
    }

    if (!transactionRef) {
      alert("Transaction / reference required");
      return;
    }

    // Slot cap check: ensure not paying more than slot remaining for that cosmo payment
    // compute remaining for this cosmo payment & slot from payments array
    const cosmoPayment =
      (payments || []).find(
        (p) =>
          p.paymentId === payoutModal.cosmoPaymentId ||
          p.meta?.belongsToPaymentId === payoutModal.cosmoPaymentId
      ) || null;


    // We'll rely on server-side check via remaining computed earlier in UI, but still prevent obvious overshoot:
    // For simplicity here we compute paid so far for this cosmo payment & slot:
    const paidForThisPaymentAndSlot = (payments || [])
      .filter(
        (p) =>
          p.meta?.isUjbPayout === true &&
          p.meta?.belongsToPaymentId === payoutModal.cosmoPaymentId &&
          p.meta?.slot === slot
      )
      .reduce((s, p) => {
        if (typeof p?.meta?.logicalAmount === "number") {
          return s + n(p.meta.logicalAmount);
        }
        return s + n(p.amountReceived);
      }, 0);


    // Find the cosmo distribution for this cosmo payment so we know slot total
    const cosmoEntry = (payments || []).find(
      (p) => p.paymentId === payoutModal.cosmoPaymentId || p.meta?.paymentId === payoutModal.cosmoPaymentId
    );

    // If cosmoEntry available compute slotTotal
    let slotTotal = null;
    if (cosmoEntry && cosmoEntry.distribution) {
      slotTotal = n(cosmoEntry.distribution[slot === "Orbiter" ? "orbiter" : slot === "OrbiterMentor" ? "orbiterMentor" : "cosmoMentor"]);
    }

    // If slotTotal known, ensure not overpaying logicalAmount beyond remaining
    if (slotTotal != null) {
      const remaining = Math.max(slotTotal - paidForThisPaymentAndSlot, 0);
      if (logicalAmount > remaining) {
        if (!confirm(`Requested amount ₹${logicalAmount} exceeds remaining for this slot (₹${remaining}). Do you want to proceed and pay only remaining ₹${remaining}?`)) {
          return;
        }
      }
    }

    setPayoutModal((p) => ({ ...p, processing: true }));

    try {
      const lastDeal = dealLogs?.[dealLogs.length - 1];
      const dealValue = lastDeal?.dealValue || null;

      // 1) Apply adjustment (commit)
      const adjResult = await adjustment.applyAdjustmentForRole({
        role: slot,
        requestedAmount: logicalAmount,
        dealValue,
        ujbCode: recipientUjb,
        referral: { id },
      });

      const { deducted = 0, newGlobalRemaining } = adjResult || {};

      // gross after adjustment
      const adjustedGross = Math.max(logicalAmount - deducted, 0);

      // TDS calculation
      const recipientInfo = getRecipientInfo(slot);
      const isNri = recipientInfo.payeeType === "nri";

      const { gross, tds, net, rate } =
        calculateUjbTDS(adjustedGross, isNri);



      // ✅ EARLY UJB BALANCE CHECK (CRITICAL FIX)
      const availableBalance = Number(referralData?.ujbBalance || 0);

      if (net > 0 && net > availableBalance) {
        alert(
          `Insufficient UJB balance.\n\n` +
          `Net payable: ₹${net}\n` +
          `Available balance: ₹${availableBalance}`
        );
        setPayoutModal((p) => ({ ...p, processing: false }));
        return;
      }


      // ✅ CASE: FULLY ADJUSTED — LOG ONLY (NO CASH PAYOUT)
      if (adjustedGross <= 0 && deducted > 0) {

        const adjustmentOnlyEntry = {
          paymentId: `ADJ-${Date.now()}`,
          paymentFrom: "UJustBe",
          paymentTo: slot,
          paymentToName: payoutModal.recipientName,
          amountReceived: 0,
          paymentDate,
          createdAt: new Date(),
          comment: "Fully adjusted against pending fees",
          meta: {
            isUjbPayout: true,
            isAdjustmentOnly: true,
            slot,
            belongsToPaymentId: payoutModal.cosmoPaymentId || null,
            adjustment: {
              deducted,
              cashPaid: 0,
              previousRemaining: newGlobalRemaining + deducted,
              newRemaining: newGlobalRemaining,
            },
          },
        };

        // 🔐 LOG ONLY — NO BALANCE CHANGE
        await updateDoc(doc(db, COLLECTIONS.referral, id), {
          payments: arrayUnion(adjustmentOnlyEntry),
        });

        // Update UI immediately
        setPayments((prev = []) => [...prev, adjustmentOnlyEntry]);

        closePayoutModal();
        return;
      }



      // 2) Perform UJB payout (actual cash = cashToPay; logical increment = logicalAmount)
      const payRes = await ujb.payFromSlot({
        recipient: slot,

        // 💰 BANK
        amount: net,

        // 📘 ACCOUNTING (ABSOLUTELY REQUIRED)
        logicalAmount: gross,
        tdsAmount: tds,

        fromPaymentId: payoutModal.cosmoPaymentId,
        modeOfPayment,
        transactionRef,
        paymentDate,

        adjustmentMeta:
          deducted > 0
            ? {
              deducted,
              cashPaid: net,
            }
            : undefined,
      });




      if (payRes?.error) {
        alert(payRes.error || "Payout failed");
        setPayoutModal((p) => ({ ...p, processing: false }));
        return;
      }

      // optional: send WhatsApp notifications (preserve earlier behavior)
      try {
        const refId = referralData?.referralId || id;
        // notify recipient (if phone exists)
        const recipientPhone =
          slot === "Orbiter" ? orbiter?.phone : slot === "OrbiterMentor" ? orbiter?.mentorPhone : cosmoOrbiter?.mentorPhone;
        if (recipientPhone) {
          const msg = `Hello ${slot === "Orbiter" ? orbiter?.name : slot === "OrbiterMentor" ? orbiter?.mentorName : cosmoOrbiter?.mentorName}, a payout of ₹${logicalAmount} (cash: ₹${cashToPay}) for referral ${refId} has been processed.`;
          await sendWhatsAppMessage(recipientPhone, [
            slot === "Orbiter" ? orbiter?.name : slot === "OrbiterMentor" ? orbiter?.mentorName : cosmoOrbiter?.mentorName,
            msg,
          ]);
        }
      } catch (err) {
        // silent per preference
      }

      // update local payments (use onPaymentsUpdate in hook already pushing entry; but ensure UI updates)
      // setPayments handled by useUjbDistribution via onPaymentsUpdate

      closePayoutModal();
    } catch (err) {
      console.error("confirmPayout error:", err);
      alert("Payout failed");
      setPayoutModal((p) => ({ ...p, processing: false }));
    }
  };

  // small helper to normalize payment id when different shapes
  const cosmoPaymentIdFrom = (pid) => pid;



  // WhatsApp sender (kept from your earlier file)
  async function sendWhatsAppMessage(phone, parameters = []) {
    try {
      const formattedPhone = String(phone || "").replace(/\s+/g, "");

      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "referral_module",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: parameters.map((param) => ({
                type: "text",
                text: param,
              })),
            },
          ],
        },
      };

      await fetch(
        "https://graph.facebook.com/v19.0/527476310441806/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD",
          },
          body: JSON.stringify(payload),
        }
      );
      // intentionally silent
    } catch (error) {
      // silent fail per preference
    }
  }

  if (loading || !referralData) {
    return (
      <main className="w-full">

        {/* HEADER SKELETON */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-32" />
          </div>
        </Card>

        <div className="w-full flex gap-6 mt-4">

          {/* LEFT PANEL */}
          <div className="w-[400px] space-y-6">

            <Card className="p-5">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-9 w-full mb-3" />
              <Skeleton className="h-20 w-full" />
            </Card>

            <Card className="p-4">
              <div className="flex justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </Card>

            <Card className="p-4">
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-8 w-24" />
            </Card>

          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 space-y-6">

            {/* TAB BAR */}
            <Card className="p-3 flex gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-36" />
            </Card>

            {/* OVERVIEW GRID */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 1fr",
                gap: "16px",
              }}
            >
              <Card className="p-5">
                <Skeleton className="h-5 w-28 mb-3" />
                <Skeleton className="h-40 w-full" />
              </Card>

              <Card className="p-5">
                <Skeleton className="h-5 w-40 mb-3" />
                <Skeleton className="h-40 w-full" />
              </Card>

              <Card className="p-5">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-40 w-full" />
              </Card>
            </div>

          </div>
        </div>
      </main>
    );
  }


  const mapName = (key) => {
    switch (key) {
      case "Orbiter":
        return orbiter?.name || orbiter?.Name || "Orbiter";
      case "OrbiterMentor":
        return orbiter?.mentorName || orbiter?.MentorName || "Orbiter Mentor";
      case "CosmoOrbiter":
        return cosmoOrbiter?.name || cosmoOrbiter?.Name || "Cosmo Orbiter";
      case "CosmoMentor":
        return cosmoOrbiter?.mentorName || cosmoOrbiter?.MentorName || "Cosmo Mentor";
      case "UJustBe":
        return "UJustBe";
      default:
        return key || "";
    }
  };

  const paidToOrbiter = Number(referralData?.paidToOrbiter || 0);
  const paidToOrbiterMentor = Number(referralData?.paidToOrbiterMentor || 0);
  const paidToCosmoMentor = Number(referralData?.paidToCosmoMentor || 0);

  const ujbBalance = Number(referralData?.ujbBalance || 0);

  const totalEarned =
    Number(payment.cosmoPaid || 0) -
    (paidToOrbiter + paidToOrbiterMentor + paidToCosmoMentor);

  return (
    <main className="w-full">
      {/* HEADER */}
      <Card className={`p-5 bg-gradient-to-r ${headerColor}`}>
        <div className="flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-6">

            <div className="flex items-center gap-2">
              <FileText className="text-indigo-600" size={18} />
              <Text as="h2">
                Referral #{referralData?.referralId}
              </Text>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="text-gray-500" size={16} />
              <Text muted>
                {referralData?.referralSource || "Referral"}
              </Text>
            </div>

          </div>

          {/* CENTER */}
          <StatusBadge status={formState.dealStatus} />

          {/* RIGHT */}
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-lg">
            <Wallet className="text-emerald-600" size={18} />
            <Text variant="label">UJB</Text>
            <Text as="h3" className="text-emerald-700">
              ₹{ujbBalance.toLocaleString("en-IN")}
            </Text>
          </div>

        </div>
      </Card>


      {/* MAIN CONTENT */}
      {/* MAIN CONTENT */}
      <div className="w-full flex gap-6 mt-4">

        {/* LEFT PANEL */}
        <div className="w-[400px] space-y-6 sticky top-6 h-fit">

          {/* PARTICIPANTS */}
          <Card className="p-5 border-l-4 border-indigo-500 shadow-sm">

            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <Text as="h3">Participants</Text>
              </div>

              <Text variant="caption" className="text-gray-400">
                Deal network
              </Text>
            </div>

            {/* TABS */}
            <div className="mt-4 flex bg-slate-100 rounded-lg p-1">
              <button
                className={`flex-1 text-sm py-1.5 rounded-md transition ${participantTab === "orbiter"
                  ? "bg-white shadow-sm font-medium"
                  : "text-gray-500"
                  }`}
                onClick={() => setParticipantTab("orbiter")}
              >
                Orbiter
              </button>

              <button
                className={`flex-1 text-sm py-1.5 rounded-md transition ${participantTab === "cosmo"
                  ? "bg-white shadow-sm font-medium"
                  : "text-gray-500"
                  }`}
                onClick={() => setParticipantTab("cosmo")}
              >
                Cosmo
              </button>
            </div>

            {/* CONTENT */}
            <div className="mt-4">
              {participantTab === "orbiter" && (
                <OrbiterDetailsCard
                  orbiter={orbiter}
                  referralData={referralData}
                />
              )}

              {participantTab === "cosmo" && (
                <CosmoOrbiterDetailsCard
                  cosmoOrbiter={cosmoOrbiter}
                  referralData={referralData}
                />
              )}
            </div>

          </Card>


          {/* FOLLOWUP STATS */}
          <Card className="p-4 bg-gradient-to-r from-amber-50 to-white border-l-4 border-amber-400">
            <div className="flex items-center justify-between">

              <div>
                <Text variant="label" className="text-gray-500">
                  Total Followups
                </Text>
                <Text as="h2">
                  {followups?.length || 0}
                </Text>
              </div>

              <div className="text-right">
                <Text variant="label" className="text-gray-500">
                  Pending
                </Text>
                <Text as="h2">
                  {followups?.filter(f => f.status === "Pending").length || 0}
                </Text>
              </div>

            </div>
          </Card>



          {/* QUICK ACTION */}
          <Card className="p-4 bg-indigo-50 border border-indigo-100">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-indigo-600" />
                <div>
                  <Text as="h4">Quick Action</Text>
                  <Text variant="caption" className="text-gray-500">
                    Log next followup
                  </Text>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setActiveTab("followups")}
              >
                + Add
              </Button>
            </div>

          </Card>

        </div>


        {/* RIGHT WORKSPACE */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* TABS */}
          <Card>
            <div className="flex gap-3">
              <Button
                variant={activeTab === "overview" ? "primary" : "ghost"}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </Button>

              <Button
                variant={activeTab === "payments" ? "primary" : "ghost"}
                onClick={() => setActiveTab("payments")}
              >
                Payments
              </Button>

              <Button
                variant={activeTab === "followups" ? "primary" : "ghost"}
                onClick={() => setActiveTab("followups")}
              >
                Add Followup
              </Button>
            </div>
          </Card>

          {activeTab === "overview" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 1fr",
                gap: "16px",
                alignItems: "start"
              }}
            >
              {/* COLUMN 1 */}
              <Card>
                {/* <Text as="h3">Status</Text> */}
                <StatusCard
                  formState={formState}
                  setFormState={setFormState}
                  onUpdate={async () => {
                    await handleStatusUpdate(formState?.dealStatus);
                  }}
                  statusLogs={referralData?.statusLogs || []}
                />
              </Card>

              {/* COLUMN 2 */}
              <Card>
                {/* <Text as="h3">Service Details</Text> */}
                <ServiceDetailsCard
                  referralData={referralData}
                  dealLogs={dealLogs}
                  dealAlreadyCalculated={dealAlreadyCalculated}
                  onSaveDealLog={handleSaveDealLog}
                />
              </Card>

              {/* COLUMN 3 */}
              <Card>
                {/* <Text as="h3">Referral Info</Text> */}
                <ReferralInfoCard
                  referralData={referralData}
                  onUploadLeadDoc={uploadLeadDoc}
                />
              </Card>
            </div>
          )}



          {/* PAYMENTS TAB */}
          {/* PAYMENTS TAB */}
          {activeTab === "payments" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.3fr",
                gap: "16px",
                alignItems: "start"
              }}
            >
              {dealEverWon && (
                <Card>
                  {/* <Text as="h3">Payment Summary</Text> */}

                  <PaymentSummary
                    agreedAmount={payment.agreedAmount}
                    cosmoPaid={payment.cosmoPaid}
                    agreedRemaining={payment.agreedRemaining}
                    totalEarned={totalEarned}
                    ujbBalance={ujbBalance}
                    paidTo={{
                      orbiter: paidToOrbiter,
                      orbiterMentor: paidToOrbiterMentor,
                      cosmoMentor: paidToCosmoMentor,
                    }}
                    referralData={referralData}
                    onAddPayment={payment.openPaymentModal}
                  />

                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowPaymentDrawer(true)}
                    >
                      Open Payment Panel
                    </Button>
                  </div>
                </Card>
              )}

              <Card>
                {/* <Text as="h3">Payment History</Text> */}

                <PaymentHistory
                  payments={payments}
                  mapName={mapName}
                  paidToOrbiter={paidToOrbiter}
                  paidToOrbiterMentor={paidToOrbiterMentor}
                  paidToCosmoMentor={paidToCosmoMentor}
                  onRequestPayout={(data) => openPayoutModal(data)}
                />
              </Card>
            </div>
          )}


          {/* FOLLOWUP FORM TAB */}
          {activeTab === "followups" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.4fr",
                gap: "16px",
                alignItems: "start"
              }}
            >

              {/* LEFT COLUMN — ACTION PANEL */}
              <Card>
                {/* <div className="flex items-center justify-between mb-2">
                  <Text as="h3">
                    {isEditingFollowup ? "Edit Followup" : "Add Followup"}
                  </Text>

                  {isEditingFollowup && (
                    <Text variant="caption" className="text-amber-600">
                      Editing existing entry
                    </Text>
                  )}
                </div> */}

                <FollowupForm
                  form={followupForm}
                  setForm={setFollowupForm}
                  isEditing={isEditingFollowup}
                  onSave={async () => {
                    if (isEditingFollowup && editIndex !== null) {
                      await editFollowup(editIndex, followupForm);
                    } else {
                      await addFollowup(followupForm);
                    }

                    setFollowupForm(defaultFollowupForm);
                    setEditIndex(null);
                    setIsEditingFollowup(false);
                  }}
                  onCancel={() => {
                    setFollowupForm(defaultFollowupForm);
                    setIsEditingFollowup(false);
                    setEditIndex(null);
                  }}
                />
              </Card>

              {/* RIGHT COLUMN — TIMELINE PANEL */}
              <Card>
                {/* <div className="flex items-center justify-between mb-2">
                  <Text as="h3">Followup Timeline</Text>

                  <Text variant="caption" className="text-slate-500">
                    {followups?.length || 0} activities
                  </Text>
                </div> */}

                <FollowupList
                  followups={followups}
                  onEdit={(i) => {
                    setEditIndex(i);
                    setFollowupForm(followups[i]);
                    setIsEditingFollowup(true);
                  }}
                  onDelete={deleteFollowup}
                />
              </Card>
            </div>
          )}


        </div>
      </div>

      {/* ADD COSMO → UJB PAYMENT MODAL */}
      <Modal
        open={payment.showAddPaymentForm}
        onClose={payment.closePaymentModal}
        title="Add Payment (Cosmo → UJB)"
      >
        <div className="space-y-5">

          {/* FINANCIAL HEADER */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200">
            <Text variant="caption" className="text-gray-500">
              Remaining Agreed Amount
            </Text>

            <Text className="text-xl font-semibold mt-1">
              ₹{payment.agreedRemaining.toLocaleString("en-IN")}
            </Text>
          </div>

          {/* PAYMENT CORE */}
          <div className="space-y-4">

            <FormField
              label="Amount Received"
              required
              error={payment.errors?.amountReceived}
            >
              <NumberInput
                value={payment.newPayment.amountReceived || ""}
                onChange={(value) =>
                  payment.updateNewPayment("amountReceived", value)
                }
                error={!!payment.errors?.amountReceived}
              />
            </FormField>

            {/* LIVE IMPACT PREVIEW */}
            {payment.newPayment.amountReceived > 0 && (
              <div className="p-3 rounded bg-blue-50 border border-slate-200">
                <Text variant="caption" className="text-gray-600">
                  After this payment
                </Text>

                <Text className="font-medium">
                  Remaining: ₹
                  {Math.max(
                    payment.agreedRemaining -
                    Number(payment.newPayment.amountReceived || 0),
                    0
                  ).toLocaleString("en-IN")}
                </Text>
              </div>
            )}

            {/* OVERPAYMENT WARNING */}
            {Number(payment.newPayment.amountReceived) >
              payment.agreedRemaining && (
                <Text variant="caption" className="text-red-600">
                  Amount exceeds remaining agreed value.
                </Text>
              )}

            <FormField
              label="Mode of Payment"
              required
              error={payment.errors?.modeOfPayment}
            >
              <Select
                value={payment.newPayment.modeOfPayment}
                onChange={(v) =>
                  payment.updateNewPayment("modeOfPayment", v)
                }
                options={[
                  { label: "Bank Transfer", value: "Bank Transfer" },
                  { label: "GPay", value: "GPay" },
                  { label: "Razorpay", value: "Razorpay" },
                  { label: "Cash", value: "Cash" },
                ]}
                error={!!payment.errors?.modeOfPayment}
              />
            </FormField>

            <FormField
              label="Transaction Reference"
              error={payment.errors?.transactionRef}
            >
              <Input
                value={payment.newPayment.transactionRef}
                onChange={(e) =>
                  payment.updateNewPayment("transactionRef", e.target.value)
                }
                error={!!payment.errors?.transactionRef}
              />
            </FormField>

            <FormField label="Payment Date">
              <DateInput
                value={payment.newPayment.paymentDate}
                onChange={(v) =>
                  payment.updateNewPayment("paymentDate", v)
                }
              />
            </FormField>
          </div>

          {/* TAX SECTION */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <Text variant="label" className="text-gray-500">
              Tax Details
            </Text>

            <FormField label="TDS Deducted by Cosmo?">
              <Select
                value={payment.newPayment.tdsDeducted ?? "no"}
                onChange={(v) =>
                  payment.updateNewPayment("tdsDeducted", v)
                }
                options={[
                  { label: "No", value: "no" },
                  { label: "Yes", value: "yes" },
                ]}
              />
            </FormField>

            {payment.newPayment.tdsDeducted === "yes" && (
              <FormField label="TDS Percentage" error={payment.errors?.tdsRate}>
                <NumberInput
                  value={payment.newPayment.tdsRate ?? 10}
                  onChange={(v) =>
                    payment.updateNewPayment("tdsRate", v)
                  }
                  error={!!payment.errors?.tdsRate}
                />
              </FormField>
            )}
          </div>

          {/* ACTION BAR */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={payment.closePaymentModal}
              disabled={payment.isSubmitting}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={payment.handleSavePayment}
              disabled={payment.isSubmitting}
            >
              {payment.isSubmitting ? "Recording…" : "Record Payment"}
            </Button>
          </div>
        </div>
      </Modal>



      {/* PAYMENT DRAWER → MODAL */}
      <Modal
        open={showPaymentDrawer}
        onClose={() => setShowPaymentDrawer(false)}
        title="Payment Panel"
      >
        <PaymentDrawer
          isOpen={showPaymentDrawer}
          onClose={() => setShowPaymentDrawer(false)}
          payment={payment}
          referralData={referralData}
          ujbBalance={ujb.ujbBalance}
          paidTo={{
            orbiter: paidToOrbiter,
            orbiterMentor: paidToOrbiterMentor,
            cosmoMentor: paidToCosmoMentor,
          }}
          payments={payments}
          mapName={mapName}
          dealEverWon={dealEverWon}
          totalEarned={totalEarned}
          onRequestPayout={({ recipient, slotKey, amount, fromPaymentId }) =>
            openPayoutModal({ cosmoPaymentId: fromPaymentId || null, slot: slotKey || recipient, amount })
          }
        />
      </Modal>

      <Modal
        open={payoutModal.open}
        onClose={closePayoutModal}
        title={`Payout — ${payoutModal.slot} (${payoutModal.recipientName})`}
      >
        <div className="space-y-5">

          {/* HEADER INFO STRIP */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-1">
            <Text variant="caption" className="text-gray-500">
              Slot Logical Amount (Due)
            </Text>

            <Text className="text-xl font-semibold">
              ₹{Number(payoutModal.logicalAmount || 0).toLocaleString("en-IN")}
            </Text>

            <Text variant="caption" className="text-gray-500">
              Recipient UJB: {payoutModal.recipientUjb || "—"}
            </Text>
          </div>

          {/* BREAKDOWN PANEL */}
          {payoutModal.open && (
            <Card>
              <Text variant="h4">Payout Breakdown</Text>

              <div className="mt-3 space-y-2 text-sm">

                <div className="flex justify-between">
                  <Text>Logical Amount</Text>
                  <Text>₹{payoutModal.logicalAmount.toLocaleString("en-IN")}</Text>
                </div>

                <div className="flex justify-between">
                  <Text>Adjustment Used</Text>
                  <Text>
                    ₹{Number(payoutModal.preview?.deducted || 0).toLocaleString("en-IN")}
                  </Text>
                </div>

                <div className="flex justify-between">
                  <Text>Gross After Adjustment</Text>
                  <Text>₹{previewGross.toLocaleString("en-IN")}</Text>
                </div>

                <div className="flex justify-between">
                  <Text>TDS ({previewIsNri ? "20%" : "5%"})</Text>
                  <Text>₹{previewTds.toLocaleString("en-IN")}</Text>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <Text className="font-semibold">Net Payable</Text>
                  <Text className="font-semibold">
                    ₹{previewNet.toLocaleString("en-IN")}
                  </Text>
                </div>
              </div>
            </Card>
          )}

          {/* PAYMENT DETAILS */}
          <div className="space-y-4">

            {/* MODE */}
            <div>
              <Text variant="label">Mode of Payment</Text>
              <select
                className="w-full border border-slate-200 rounded-lg p-2 mt-1"
                value={payoutModal.modeOfPayment}
                onChange={(e) =>
                  setPayoutModal((p) => ({
                    ...p,
                    modeOfPayment: e.target.value,
                  }))
                }
              >
                <option value="">--Select--</option>
                <option>Bank Transfer</option>
                <option>GPay</option>
                <option>Razorpay</option>
                <option>Cash</option>
              </select>
            </div>

            {/* TRANSACTION */}
            <div>
              <Text variant="label">Transaction / Ref ID</Text>
              <input
                className="w-full border border-slate-200 rounded-lg p-2 mt-1"
                value={payoutModal.transactionRef}
                onChange={(e) =>
                  setPayoutModal((p) => ({
                    ...p,
                    transactionRef: e.target.value,
                  }))
                }
              />
            </div>

            {/* DATE */}
            <div>
              <Text variant="label">Payment Date</Text>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg p-2 mt-1"
                value={payoutModal.paymentDate}
                onChange={(e) =>
                  setPayoutModal((p) => ({
                    ...p,
                    paymentDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={closePayoutModal}
            >
              Cancel
            </Button>

            <Button
              onClick={confirmPayout}
              disabled={
                payoutModal.processing ||
                ujb.isSubmitting ||
                adjustment.loading
              }
            >
              {payoutModal.processing ||
                ujb.isSubmitting ||
                adjustment.loading
                ? "Processing..."
                : "Confirm Payout"}
            </Button>
          </div>

          {/* ERRORS */}
          {adjustment.error && (
            <Text variant="caption" className="text-red-500">
              Adjustment error: {adjustment.error}
            </Text>
          )}

          {ujb.error && (
            <Text variant="caption" className="text-red-500">
              Payout error: {ujb.error}
            </Text>
          )}
        </div>
      </Modal>



    </main>
  );

}