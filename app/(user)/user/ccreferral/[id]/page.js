"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import useReferralDetails from "@/hooks/useReferralDetails";
import useReferralPayments from "@/hooks/useReferralPayments";
import { useUjbDistribution } from "@/hooks/useUjbDistribution";
import { useReferralAdjustment } from "@/hooks/useReferralAdjustment";
import StatusCard from "@/components/admin/referral/StatusCard";
import ReferralInfoCard from "@/components/admin/referral/ReferralInfoCard";
import OrbiterDetailsCard from "@/components/admin/referral/OrbiterDetailsCard";
import CosmoOrbiterDetailsCard from "@/components/admin/referral/CosmoOrbiterDetailsCard";
import ServiceDetailsCard from "@/components/admin/referral/ServiceDetailsCard";
import PaymentHistory from "@/components/admin/referral/PaymentHistory";
import FollowupList from "@/components/admin/referral/FollowupList";
import FollowupForm from "@/components/admin/referral/FollowupForm";
import PaymentSummary from "@/components/admin/referral/PaymentSummary";
import PaymentDrawer from "@/components/admin/referral/PaymentDrawer";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import NumberInput from "@/components/ui/NumberInput";
import DateInput from "@/components/ui/DateInput";

const CC_REFERRAL_COLLECTION = "CCReferral";

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-transparent animate-spin" />
    </div>
  );
}

export default function UserCcReferralDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [followupForm, setFollowupForm] = useState({
    priority: "Medium",
    date: "",
    description: "",
    status: "Pending",
  });
  const [isEditingFollowup, setIsEditingFollowup] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const today = new Date().toISOString().split("T")[0];

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
    refreshDetail,
  } = useReferralDetails(id, { collectionName: CC_REFERRAL_COLLECTION });

  const payment = useReferralPayments({
    id,
    referralData,
    payments,
    setPayments,
    dealLogs,
    collectionName: CC_REFERRAL_COLLECTION,
    onRefresh: refreshDetail,
  });

  const ujb = useUjbDistribution({
    referralId: id,
    referralData,
    payments,
    onPaymentsUpdate: setPayments,
    orbiter,
    cosmoOrbiter,
    collectionName: CC_REFERRAL_COLLECTION,
    onRefresh: refreshDetail,
  });

  const primaryOrbiterUjb =
    referralData?.orbiterUJBCode ||
    orbiter?.ujbCode ||
    orbiter?.UJBCode ||
    null;

  const adjustment = useReferralAdjustment(id, primaryOrbiterUjb, {
    collectionName: CC_REFERRAL_COLLECTION,
    orbiterProfile: orbiter,
    onRefresh: refreshDetail,
  });

  const [payoutModal, setPayoutModal] = useState({
    open: false,
    cosmoPaymentId: null,
    slot: "",
    logicalAmount: 0,
    recipientUjb: null,
    recipientName: "",
    preview: null,
    modeOfPayment: "",
    transactionRef: "",
    paymentDate: new Date().toISOString().split("T")[0],
    processing: false,
  });

  const getUjbTdsRate = (isNri) => (isNri ? 0.2 : 0.05);
  const calculateUjbTDS = (gross, isNri) => {
    const g = Number(gross || 0);
    const rate = getUjbTdsRate(isNri);
    const tds = Math.round(g * rate);
    const net = g - tds;
    return { gross: g, tds, net, rate };
  };

  const getRecipientInfo = (slot) => {
    const normalize = (status) =>
      status === "Non-Resident" ? "nri" : "resident";

    switch (slot) {
      case "Orbiter":
        return {
          ujb: referralData?.orbiterUJBCode || orbiter?.ujbCode || null,
          name: orbiter?.name || "Orbiter",
          payeeType: normalize(
            referralData?.orbiter?.residentStatus ?? orbiter?.residentStatus
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

  const openPayoutModal = ({ cosmoPaymentId, slot, amount }) => {
    const info = getRecipientInfo(slot);
    const logical = Math.max(0, Number(amount || 0));

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

    (async () => {
      try {
        const lastDeal = dealLogs?.[dealLogs.length - 1];
        const preview = await adjustment.applyAdjustmentForRole({
          role: slot,
          requestedAmount: logical,
          dealValue: lastDeal?.dealValue || null,
          ujbCode: info.ujb,
          previewOnly: true,
          referral: { id },
        });
        setPayoutModal((prev) => ({ ...prev, preview }));
      } catch {
        setPayoutModal((prev) => ({
          ...prev,
          preview: { error: "Preview failed" },
        }));
      }
    })();
  };

  const closePayoutModal = () => {
    setPayoutModal((prev) => ({ ...prev, open: false, preview: null }));
  };

  const confirmPayout = async () => {
    const recipientInfo = getRecipientInfo(payoutModal.slot);
    const deducted = Number(payoutModal.preview?.deducted || 0);
    const logical = Number(payoutModal.logicalAmount || 0);
    const adjustedGross = deducted > 0 ? Math.max(logical - deducted, 0) : logical;
    const isNri = recipientInfo.payeeType === "nri";
    const { gross, tds, net } = calculateUjbTDS(adjustedGross, isNri);

    if (!payoutModal.modeOfPayment || !payoutModal.transactionRef) {
      alert("Mode of payment and transaction reference are required.");
      return;
    }

    setPayoutModal((prev) => ({ ...prev, processing: true }));

    try {
      const lastDeal = dealLogs?.[dealLogs.length - 1];

      const adjResult = await adjustment.applyAdjustmentForRole({
        role: payoutModal.slot,
        requestedAmount: logical,
        dealValue: lastDeal?.dealValue || null,
        ujbCode: payoutModal.recipientUjb,
        referral: { id },
      });

      await ujb.payFromSlot({
        recipient: payoutModal.slot,
        amount: net,
        logicalAmount: gross,
        tdsAmount: tds,
        fromPaymentId: payoutModal.cosmoPaymentId,
        modeOfPayment: payoutModal.modeOfPayment,
        transactionRef: payoutModal.transactionRef,
        paymentDate: payoutModal.paymentDate,
        adjustmentMeta:
          Number(adjResult?.deducted || 0) > 0
            ? {
                deducted: Number(adjResult.deducted || 0),
                cashPaid: net,
              }
            : undefined,
      });

      closePayoutModal();
    } catch (error) {
      console.error("CC payout failed", error);
      alert("Payout failed");
      setPayoutModal((prev) => ({ ...prev, processing: false }));
    }
  };

  if (loading || !referralData) {
    return <LoadingState />;
  }

  const paidToOrbiter = Number(referralData?.paidToOrbiter || 0);
  const paidToOrbiterMentor = Number(referralData?.paidToOrbiterMentor || 0);
  const paidToCosmoMentor = Number(referralData?.paidToCosmoMentor || 0);
  const ujbBalance = Number(referralData?.ujbBalance || 0);
  const totalEarned =
    Number(payment.cosmoPaid || 0) -
    (paidToOrbiter + paidToOrbiterMentor + paidToCosmoMentor);

  const mapName = (key) => {
    switch (key) {
      case "Orbiter":
        return orbiter?.name || "Orbiter";
      case "OrbiterMentor":
        return orbiter?.mentorName || "Orbiter Mentor";
      case "CosmoOrbiter":
        return cosmoOrbiter?.name || "Cosmo Orbiter";
      case "CosmoMentor":
        return cosmoOrbiter?.mentorName || "Cosmo Mentor";
      case "UJustBe":
        return "UJustBe";
      default:
        return key || "";
    }
  };

  const previewGross =
    payoutModal.open && payoutModal.preview
      ? Math.max(
          Number(payoutModal.logicalAmount || 0) -
            Number(payoutModal.preview?.deducted || 0),
          0
        )
      : 0;
  const previewRecipient = getRecipientInfo(payoutModal.slot);
  const previewIsNri = previewRecipient.payeeType === "nri";
  const { tds: previewTds, net: previewNet } = calculateUjbTDS(
    previewGross,
    previewIsNri
  );

  return (
    <main className="space-y-6 py-6">
      <Card className="space-y-2 shadow-sm">
        <Text as="h1" variant="h1">
          CC Referral #{referralData?.referralId || id}
        </Text>
        <Text variant="muted">
          Source: {referralData?.referralSource || "CC"} · Status:{" "}
          {formState.dealStatus}
        </Text>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <Text variant="caption">UJB Balance</Text>
          <Text as="p" variant="h1">₹{ujbBalance.toLocaleString("en-IN")}</Text>
        </Card>
        <Card className="shadow-sm">
          <Text variant="caption">Total Followups</Text>
          <Text as="p" variant="h1">{followups?.length || 0}</Text>
        </Card>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-wrap gap-2">
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
            Followups
          </Button>
        </div>
      </Card>

      {activeTab === "overview" ? (
        <div className="space-y-4">
          <Card><StatusCard formState={formState} setFormState={setFormState} onUpdate={async () => handleStatusUpdate(formState?.dealStatus)} statusLogs={referralData?.statusLogs || []} /></Card>
          <Card><ServiceDetailsCard referralData={referralData} dealLogs={dealLogs} dealAlreadyCalculated={dealAlreadyCalculated} onSaveDealLog={handleSaveDealLog} /></Card>
          <Card><ReferralInfoCard referralData={referralData} onUploadLeadDoc={uploadLeadDoc} /></Card>
          <Card><OrbiterDetailsCard orbiter={orbiter} referralData={referralData} /></Card>
          <Card><CosmoOrbiterDetailsCard cosmoOrbiter={cosmoOrbiter} referralData={referralData} /></Card>
        </div>
      ) : null}

      {activeTab === "payments" ? (
        <div className="space-y-4">
          {dealEverWon ? (
            <Card>
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
              <div className="mt-4">
                <Button variant="secondary" onClick={() => setShowPaymentDrawer(true)}>
                  Open Payment Panel
                </Button>
              </div>
            </Card>
          ) : null}

          <Card>
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
      ) : null}

      {activeTab === "followups" ? (
        <div className="space-y-4">
          <Card>
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
                setFollowupForm({
                  priority: "Medium",
                  date: "",
                  description: "",
                  status: "Pending",
                });
                setEditIndex(null);
                setIsEditingFollowup(false);
              }}
              onCancel={() => {
                setFollowupForm({
                  priority: "Medium",
                  date: "",
                  description: "",
                  status: "Pending",
                });
                setEditIndex(null);
                setIsEditingFollowup(false);
              }}
            />
          </Card>

          <Card>
            <FollowupList
              followups={followups}
              onEdit={(index) => {
                setEditIndex(index);
                setFollowupForm(followups[index]);
                setIsEditingFollowup(true);
              }}
              onDelete={deleteFollowup}
            />
          </Card>
        </div>
      ) : null}

      <Modal
        open={payment.showAddPaymentForm}
        onClose={payment.closePaymentModal}
        title="Add Payment (Cosmo → UJB)"
      >
        <div className="space-y-5">
          <FormField label="Amount Received" required>
            <NumberInput
              value={payment.newPayment.amountReceived || ""}
              onChange={(value) => payment.updateNewPayment("amountReceived", value)}
            />
          </FormField>

          <FormField label="Mode of Payment" required>
            <Select
              value={payment.newPayment.modeOfPayment}
              onChange={(value) => payment.updateNewPayment("modeOfPayment", value)}
              options={[
                { label: "Bank Transfer", value: "Bank Transfer" },
                { label: "GPay", value: "GPay" },
                { label: "Razorpay", value: "Razorpay" },
                { label: "Cash", value: "Cash" },
              ]}
            />
          </FormField>

          <FormField label="Transaction Reference">
            <Input
              value={payment.newPayment.transactionRef}
              onChange={(event) =>
                payment.updateNewPayment("transactionRef", event.target.value)
              }
            />
          </FormField>

          <FormField label="Payment Date">
            <DateInput
              value={payment.newPayment.paymentDate}
              max={today}
              onChange={(value) => payment.updateNewPayment("paymentDate", value)}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={payment.closePaymentModal}>
              Cancel
            </Button>
            <Button onClick={payment.handleSavePayment} disabled={payment.isSubmitting}>
              {payment.isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </Modal>

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
            openPayoutModal({
              cosmoPaymentId: fromPaymentId || null,
              slot: slotKey || recipient,
              amount,
            })
          }
        />
      </Modal>

      <Modal
        open={payoutModal.open}
        onClose={closePayoutModal}
        title={`Payout — ${payoutModal.slot} (${payoutModal.recipientName})`}
      >
        <div className="space-y-5">
          <Card>
            <Text variant="caption">Logical Amount</Text>
            <Text as="p" variant="h1">
              ₹{Number(payoutModal.logicalAmount || 0).toLocaleString("en-IN")}
            </Text>
            <Text variant="muted">Recipient UJB: {payoutModal.recipientUjb || "-"}</Text>
          </Card>

          <Card>
            <Text variant="h2">Payout Breakdown</Text>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><Text>Adjustment Used</Text><Text>₹{Number(payoutModal.preview?.deducted || 0).toLocaleString("en-IN")}</Text></div>
              <div className="flex justify-between"><Text>Gross After Adjustment</Text><Text>₹{previewGross.toLocaleString("en-IN")}</Text></div>
              <div className="flex justify-between"><Text>TDS</Text><Text>₹{previewTds.toLocaleString("en-IN")}</Text></div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><Text className="font-semibold">Net Payable</Text><Text className="font-semibold">₹{previewNet.toLocaleString("en-IN")}</Text></div>
            </div>
          </Card>

          <FormField label="Mode of Payment">
            <Select
              value={payoutModal.modeOfPayment}
              onChange={(value) =>
                setPayoutModal((prev) => ({ ...prev, modeOfPayment: value }))
              }
              options={[
                { label: "Bank Transfer", value: "Bank Transfer" },
                { label: "GPay", value: "GPay" },
                { label: "Razorpay", value: "Razorpay" },
                { label: "Cash", value: "Cash" },
              ]}
            />
          </FormField>

          <FormField label="Transaction / Ref ID">
            <Input
              value={payoutModal.transactionRef}
              onChange={(event) =>
                setPayoutModal((prev) => ({
                  ...prev,
                  transactionRef: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Payment Date">
            <DateInput
              value={payoutModal.paymentDate}
              max={today}
              onChange={(value) =>
                setPayoutModal((prev) => ({ ...prev, paymentDate: value }))
              }
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closePayoutModal}>Cancel</Button>
            <Button
              onClick={confirmPayout}
              disabled={payoutModal.processing || ujb.isSubmitting || adjustment.loading}
            >
              {payoutModal.processing || ujb.isSubmitting || adjustment.loading
                ? "Processing..."
                : "Confirm Payout"}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
