"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import hookUseAdminReferralDetails from "@/hooks/useAdminReferralDetails";
import {
  recordAdminReferralCosmoPayment,
  recordAdminReferralUjbPayout,
} from "@/services/adminReferralService";
import StatusCard from "@/components/admin/referral/StatusCard";
import ReferralInfoCard from "@/components/admin/referral/ReferralInfoCard";
import OrbiterDetailsCard from "@/components/admin/referral/OrbiterDetailsCard";
import CosmoOrbiterDetailsCard from "@/components/admin/referral/CosmoOrbiterDetailsCard";
import ServiceDetailsCard from "@/components/admin/referral/ServiceDetailsCard";
import PaymentHistory from "@/components/admin/referral/PaymentHistory";
import FollowupList from "@/components/admin/referral/FollowupList";
import FollowupForm from "@/components/admin/referral/FollowupForm";
import PaymentSummary from "@/components/admin/referral/PaymentSummary";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import NumberInput from "@/components/ui/NumberInput";
import DateInput from "@/components/ui/DateInput";

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-transparent animate-spin" />
    </div>
  );
}

function getPaymentIdentity(payment, index = 0) {
  return (
    payment?.paymentId ||
    payment?.meta?.paymentId ||
    payment?.transactionRef ||
    `payment-${index}`
  );
}

function dedupePayments(paymentList = []) {
  const seen = new Set();

  return paymentList.filter((payment, index) => {
    const identity = getPaymentIdentity(payment, index);

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
}

export default function AdminReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [followupForm, setFollowupForm] = useState({
    priority: "Medium",
    date: "",
    description: "",
    status: "Pending",
  });
  const [followupErrors, setFollowupErrors] = useState({});
  const [isEditingFollowup, setIsEditingFollowup] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [payoutModal, setPayoutModal] = useState({
    open: false,
    cosmoPaymentId: null,
    slot: "",
    logicalAmount: 0,
    recipientName: "",
    modeOfPayment: "",
    transactionRef: "",
    paymentDate: new Date().toISOString().split("T")[0],
    processing: false,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [newPayment, setNewPayment] = useState({
    amountReceived: "",
    modeOfPayment: "",
    transactionRef: "",
    paymentDate: new Date().toISOString().split("T")[0],
    tdsDeducted: false,
    tdsRate: 10,
  });

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
    handleStatusUpdate,
    handleSaveDealLog,
    addFollowup,
    editFollowup,
    deleteFollowup,
    uploadLeadDoc,
    deleteLeadDoc,
    refreshDetail,
  } = hookUseAdminReferralDetails(id);

  const safePayments = useMemo(
    () =>
      dedupePayments(
        Array.isArray(payments)
          ? payments
          : payments && typeof payments === "object"
            ? Object.values(payments)
            : []
      ),
    [payments]
  );

  const agreedAmount = useMemo(() => {
    if (!Array.isArray(dealLogs) || dealLogs.length === 0) {
      return 0;
    }

    return Number(dealLogs[dealLogs.length - 1]?.agreedAmount || 0);
  }, [dealLogs]);

  const cosmoPaid = useMemo(
    () =>
      safePayments
        .filter((payment) => payment?.meta?.isCosmoToUjb)
        .reduce(
          (sum, payment) =>
            sum + Number(payment?.grossAmount ?? payment?.amountReceived ?? 0),
          0
        ),
    [safePayments]
  );

  const agreedRemaining = Math.max(agreedAmount - cosmoPaid, 0);
  const paidTo = {
    orbiter: Number(referralData?.paidToOrbiter || 0),
    orbiterMentor: Number(referralData?.paidToOrbiterMentor || 0),
    cosmoMentor: Number(referralData?.paidToCosmoMentor || 0),
  };
  const ujbBalance = Number(referralData?.ujbBalance || 0);

  const mapName = (name) => {
    if (name === "Orbiter") return orbiter?.name || "Orbiter";
    if (name === "OrbiterMentor") return orbiter?.mentorName || "Orbiter Mentor";
    if (name === "CosmoMentor") return cosmoOrbiter?.mentorName || "Cosmo Mentor";
    if (name === "CosmoOrbiter") return cosmoOrbiter?.name || "Cosmo";
    if (name === "UJustBe") return "UJustBe";
    return name || "-";
  };

  const validateFollowup = () => {
    const nextErrors = {};

    if (!String(followupForm.priority || "").trim()) {
      nextErrors.priority = "Priority required";
    }
    if (!String(followupForm.date || "").trim()) {
      nextErrors.date = "Date required";
    }
    if (!String(followupForm.description || "").trim()) {
      nextErrors.description = "Description required";
    }
    if (!String(followupForm.status || "").trim()) {
      nextErrors.status = "Status required";
    }

    setFollowupErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetFollowupForm = () => {
    setFollowupForm({
      priority: "Medium",
      date: "",
      description: "",
      status: "Pending",
    });
    setFollowupErrors({});
    setIsEditingFollowup(false);
    setEditIndex(null);
  };

  const onSaveFollowup = async () => {
    if (!validateFollowup()) {
      return;
    }

    if (isEditingFollowup && editIndex !== null) {
      await editFollowup(editIndex, followupForm);
    } else {
      await addFollowup(followupForm);
    }

    resetFollowupForm();
  };

  const openPayoutModal = ({ cosmoPaymentId, slot, amount }) => {
    setPayoutModal({
      open: true,
      cosmoPaymentId: cosmoPaymentId || null,
      slot,
      logicalAmount: Number(amount || 0),
      recipientName: mapName(slot),
      modeOfPayment: "",
      transactionRef: "",
      paymentDate: new Date().toISOString().split("T")[0],
      processing: false,
    });
  };

  const closePayoutModal = () => {
    setPayoutModal((prev) => ({ ...prev, open: false }));
  };

  const calculateDistribution = (amount) => {
    if (!Array.isArray(dealLogs) || dealLogs.length === 0) {
      return null;
    }

    const deal = dealLogs[dealLogs.length - 1];

    if (!deal?.agreedAmount) {
      return null;
    }

    const ratio = Number(amount) / Number(deal.agreedAmount || 1);

    return {
      orbiter: Math.round((Number(deal.orbiterShare || 0) * ratio) * 100) / 100,
      orbiterMentor:
        Math.round((Number(deal.orbiterMentorShare || 0) * ratio) * 100) / 100,
      cosmoMentor:
        Math.round((Number(deal.cosmoMentorShare || 0) * ratio) * 100) / 100,
      ujustbe:
        Math.round((Number(deal.ujustbeShare || 0) * ratio) * 100) / 100,
    };
  };

  const handleSavePayment = async () => {
    if (!id || isSavingPayment) {
      return;
    }

    const grossAmount = Number(newPayment.amountReceived || 0);
    if (grossAmount <= 0) {
      return;
    }

    const distribution = calculateDistribution(grossAmount);
    if (!distribution) {
      return;
    }

    const tdsRate = newPayment.tdsDeducted ? Number(newPayment.tdsRate || 0) : 0;
    const tdsAmount = Math.max(0, Math.round(((grossAmount * tdsRate) / 100) * 100) / 100);
    const netAmount = Math.round((grossAmount - tdsAmount) * 100) / 100;

    setIsSavingPayment(true);

    try {
      const entry = {
        paymentId: `COSMO-${Date.now()}`,
        paymentFrom: "CosmoOrbiter",
        paymentTo: "UJustBe",
        grossAmount,
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

      await recordAdminReferralCosmoPayment({ id, entry });
      setPayments((prev = []) => dedupePayments([...(prev || []), entry]));
      setShowAddPaymentForm(false);
      await refreshDetail();
    } finally {
      setIsSavingPayment(false);
    }
  };

  const confirmPayout = async () => {
    if (!id || payoutModal.processing) {
      return;
    }

    setPayoutModal((prev) => ({ ...prev, processing: true }));

    try {
      const amount = Math.max(0, Number(payoutModal.logicalAmount || 0));
      const entry = {
        paymentId: `UJB-PAYOUT-${Date.now()}`,
        paymentFrom: "UJustBe",
        paymentTo: payoutModal.slot,
        paymentToName: payoutModal.recipientName,
        amountReceived: amount,
        paymentDate: payoutModal.paymentDate,
        modeOfPayment: payoutModal.modeOfPayment,
        transactionRef: payoutModal.transactionRef,
        createdAt: new Date().toISOString(),
        meta: {
          isUjbPayout: true,
          slot: payoutModal.slot,
          belongsToPaymentId: payoutModal.cosmoPaymentId || null,
          logicalAmount: amount,
          tdsAmount: 0,
          adjustment: null,
        },
      };

      await recordAdminReferralUjbPayout({
        id,
        recipient: payoutModal.slot,
        entry,
      });

      setPayments((prev = []) => dedupePayments([...(prev || []), entry]));
      closePayoutModal();
      await refreshDetail();
    } finally {
      setPayoutModal((prev) => ({ ...prev, processing: false }));
    }
  };

  const saveStatus = async () => {
    await handleStatusUpdate(formState.dealStatus, rejectReason);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!referralData) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <Text as="h2" variant="h2">Referral not found</Text>
        </Card>
        <Button onClick={() => router.push("/admin/referral/manage")}>
          Back to referrals
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text as="h1" variant="h1">
            Referral {referralData.referralId || referralData.id}
          </Text>
          <Text variant="muted">
            Admin workflow for status, deal progress, payments, and follow-ups.
          </Text>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/referral/manage")}>
          Back
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={activeTab === "overview" ? "primary" : "ghost"} onClick={() => setActiveTab("overview")}>
          Overview
        </Button>
        <Button variant={activeTab === "payments" ? "primary" : "ghost"} onClick={() => setActiveTab("payments")}>
          Payments
        </Button>
        <Button variant={activeTab === "followups" ? "primary" : "ghost"} onClick={() => setActiveTab("followups")}>
          Followups
        </Button>
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card>
              <StatusCard
                formState={formState}
                setFormState={setFormState}
                onUpdate={saveStatus}
                statusLogs={referralData.statusLogs || []}
              />
              {formState.dealStatus === "Reject" || formState.dealStatus === "Deal Lost" ? (
                <div className="mt-4">
                  <FormField label="Reject Reason">
                    <Input
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                    />
                  </FormField>
                </div>
              ) : null}
            </Card>

            <Card>
              <ReferralInfoCard
                referralData={referralData}
                onUploadLeadDoc={uploadLeadDoc}
                onDeleteLeadDoc={deleteLeadDoc}
              />
            </Card>

            <Card>
              <ServiceDetailsCard
                referralData={referralData}
                dealLogs={dealLogs}
                onSaveDealLog={handleSaveDealLog}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <OrbiterDetailsCard orbiter={orbiter} referralData={referralData} />
            </Card>
            <Card>
              <CosmoOrbiterDetailsCard
                cosmoOrbiter={cosmoOrbiter}
                referralData={referralData}
              />
            </Card>
          </div>
        </>
      ) : null}

      {activeTab === "payments" ? (
        <div className="space-y-6">
          <Card>
            <PaymentSummary
              agreedAmount={agreedAmount}
              cosmoPaid={cosmoPaid}
              agreedRemaining={agreedRemaining}
              ujbBalance={ujbBalance}
              paidTo={paidTo}
              referralData={referralData}
              onAddPayment={() => setShowAddPaymentForm(true)}
            />
          </Card>

          <Card>
            <PaymentHistory
              payments={safePayments}
              mapName={mapName}
              onRequestPayout={(data) => openPayoutModal(data)}
            />
          </Card>
        </div>
      ) : null}

      {activeTab === "followups" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <FollowupForm
              form={followupForm}
              setForm={setFollowupForm}
              isEditing={isEditingFollowup}
              onSave={onSaveFollowup}
              onCancel={resetFollowupForm}
              errors={followupErrors}
            />
          </Card>

          <Card>
            <FollowupList
              followups={followups}
              onEdit={(index) => {
                setFollowupForm(followups[index]);
                setIsEditingFollowup(true);
                setEditIndex(index);
              }}
              onDelete={deleteFollowup}
            />
          </Card>
        </div>
      ) : null}

      <Modal
        open={showAddPaymentForm}
        onClose={() => setShowAddPaymentForm(false)}
        title="Add Payment (Cosmo to UJustBe)"
      >
        <div className="space-y-4">
          <FormField label="Amount Received" required>
            <NumberInput
              value={newPayment.amountReceived || ""}
              onChange={(value) =>
                setNewPayment((prev) => ({ ...prev, amountReceived: value }))
              }
            />
          </FormField>

          <FormField label="Mode of Payment" required>
            <Select
              value={newPayment.modeOfPayment}
              onChange={(value) =>
                setNewPayment((prev) => ({ ...prev, modeOfPayment: value }))
              }
              options={[
                { label: "UPI", value: "UPI" },
                { label: "Bank Transfer", value: "Bank Transfer" },
                { label: "Cash", value: "Cash" },
                { label: "Cheque", value: "Cheque" },
              ]}
            />
          </FormField>

          <FormField label="Transaction Ref">
            <Input
              value={newPayment.transactionRef}
              onChange={(event) =>
                setNewPayment((prev) => ({
                  ...prev,
                  transactionRef: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Payment Date">
            <DateInput
              value={newPayment.paymentDate}
              onChange={(value) =>
                setNewPayment((prev) => ({ ...prev, paymentDate: value }))
              }
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddPaymentForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment} disabled={isSavingPayment}>
              {isSavingPayment ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={payoutModal.open}
        onClose={closePayoutModal}
        title={`Payout - ${payoutModal.slot} (${payoutModal.recipientName})`}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Text variant="h3">Amount</Text>
            <Text>Rs. {Number(payoutModal.logicalAmount || 0).toLocaleString("en-IN")}</Text>
          </div>

          <FormField label="Mode of Payment" required>
            <Select
              value={payoutModal.modeOfPayment}
              onChange={(value) =>
                setPayoutModal((prev) => ({ ...prev, modeOfPayment: value }))
              }
              options={[
                { label: "UPI", value: "UPI" },
                { label: "Bank Transfer", value: "Bank Transfer" },
                { label: "Cash", value: "Cash" },
                { label: "Cheque", value: "Cheque" },
              ]}
            />
          </FormField>

          <FormField label="Transaction Ref" required>
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
              onChange={(value) =>
                setPayoutModal((prev) => ({ ...prev, paymentDate: value }))
              }
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closePayoutModal}>
              Cancel
            </Button>
            <Button onClick={confirmPayout} disabled={payoutModal.processing}>
              {payoutModal.processing ? "Paying..." : "Confirm Payout"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
