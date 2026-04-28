"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Wallet,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    Eye,
    ShieldCheck,
    RefreshCcw,
} from "lucide-react";

import InfoCard from "../shared/InfoCard";
import InfoRow from "../shared/InfoRow";
import { useToast } from "@/components/ui/ToastProvider";
import { updateReferralStatus } from "@/services/referralService";
import {
    REFERRAL_STATUSES,
    REFERRAL_STATUS_OPTIONS,
} from "@/lib/referrals/referralStates.mjs";

const statusOptions = REFERRAL_STATUS_OPTIONS.filter(
    (status) => status !== REFERRAL_STATUSES.REJECTED
);

const statusMessages = {
    [REFERRAL_STATUSES.DEAL_WON]: {
        Orbiter: "You Did It! The referral has been won.",
        CosmOrbiter: "Victory unlocked. The referral has been successfully won.",
    },
    [REFERRAL_STATUSES.DEAL_LOST]: {
        Orbiter: "The referral did not close this time. Keep going.",
        CosmOrbiter: "This referral did not close, but your efforts matter.",
    },
    [REFERRAL_STATUSES.WORK_IN_PROGRESS]: {
        Orbiter: "Work is now in progress for your referral.",
        CosmOrbiter: "You marked this referral as Work in Progress.",
    },
    [REFERRAL_STATUSES.RECEIVED_FULL_AND_FINAL_PAYMENT]: {
        Orbiter: "Full payment confirmed. Thank you.",
        CosmOrbiter: "Payment received successfully.",
    },
};

const sendWhatsAppTemplate = async (phone, name, message) => {
    if (!message || !phone) return;

    try {
        await fetch("/api/send-whatsapp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone,
                name,
                message,
            }),
        });
    } catch (err) {
        console.error("WhatsApp send failed:", err);
    }
};

const getDynamicMessage = (template, referral) => {
    if (!template) return "";

    const serviceOrProduct =
        referral?.product?.name ||
        referral?.service?.name ||
        "-";

    return template.replace(/\(Product\/Service\)/g, serviceOrProduct);
};

export default function OverviewTab({
    referral,
    userRole,
    openInvoice,
    onReferralUpdated,
}) {
    const [updating, setUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(
        referral?.dealStatus || REFERRAL_STATUSES.PENDING
    );
    const [modalOpen, setModalOpen] = useState(false);
    const [statusError, setStatusError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const toast = useToast();

    const latestLog =
        referral?.dealLogs?.length
            ? referral.dealLogs[referral.dealLogs.length - 1]
            : null;

    const totalEarned = Number(latestLog?.orbiterShare || 0);
    const received = Number(referral?.paidToOrbiter || 0);
    const pending = Math.max(totalEarned - received, 0);

    const documentURL = referral?.dealDocumentURL;
    const isPDF = documentURL?.toLowerCase().includes(".pdf");
    const canUpdateStatus = userRole === "cosmo";
    const currentStatus =
        referral?.dealStatus || REFERRAL_STATUSES.PENDING;
    const hasStatusChange = selectedStatus !== currentStatus;
    const roleLabel =
        userRole === "cosmo"
            ? "CosmOrbiter"
            : userRole === "orbiter"
                ? "Orbiter"
                : "Viewer";
    const currentStatusTone = useMemo(
        () => getStatusAppearance(currentStatus),
        [currentStatus]
    );

    useEffect(() => {
        setSelectedStatus(currentStatus);
        setStatusError("");
    }, [currentStatus]);

    const confirmStatusChange = async () => {
        if (!selectedStatus || updating || !canUpdateStatus) return;

        try {
            setUpdating(true);
            setStatusError("");
            setSuccessMessage("");

            await updateReferralStatus({
                id: referral.id,
                status: selectedStatus,
            });

            const templates = statusMessages[selectedStatus];

            if (templates) {
                if (referral?.orbiter?.phone) {
                    await sendWhatsAppTemplate(
                        referral.orbiter.phone,
                        referral.orbiter.name,
                        getDynamicMessage(templates.Orbiter, referral)
                    );
                }

                if (referral?.cosmoOrbiter?.phone) {
                    await sendWhatsAppTemplate(
                        referral.cosmoOrbiter.phone,
                        referral.cosmoOrbiter.name,
                        getDynamicMessage(templates.CosmOrbiter, referral)
                    );
                }
            }

            setModalOpen(false);
            setSuccessMessage(`Deal status updated to ${selectedStatus}.`);
            toast.success(`Deal status updated to ${selectedStatus}.`);
            await onReferralUpdated?.();
        } catch (err) {
            const message =
                err?.message || "Status update failed. Please try again.";
            setStatusError(message);
            toast.error(message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="mt-5 space-y-5">
            <InfoCard title="Deal Status" icon={TrendingUp}>
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Current status
                                </p>
                                <span
                                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${currentStatusTone.badge}`}
                                >
                                    {currentStatus}
                                </span>
                            </div>

                            <div className="text-right">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Your role
                                </p>
                                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                                    <ShieldCheck size={14} />
                                    {roleLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-slate-500">
                            Change Status
                        </label>

                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setStatusError("");
                                setSuccessMessage("");
                                setSelectedStatus(e.target.value);
                            }}
                            disabled={updating || !canUpdateStatus}
                            aria-label="Deal status"
                            title={
                                canUpdateStatus
                                    ? "Select a new deal status"
                                    : "Only CosmOrbiter can change deal status."
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (!canUpdateStatus) {
                                    setStatusError(
                                        "Only CosmOrbiter can change deal status."
                                    );
                                    return;
                                }

                                if (!hasStatusChange) {
                                    setStatusError("Choose a different status to update.");
                                    return;
                                }

                                setModalOpen(true);
                            }}
                            disabled={updating || !canUpdateStatus || !hasStatusChange}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {updating ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <RefreshCcw size={15} />
                            )}
                            {updating ? "Updating..." : "Update Status"}
                        </button>

                        {!canUpdateStatus && (
                            <p className="text-xs text-amber-700">
                                Only CosmOrbiter can change deal status.
                            </p>
                        )}
                    </div>

                    {successMessage && (
                        <p className="text-xs text-emerald-700">
                            {successMessage}
                        </p>
                    )}

                    {statusError && (
                        <p className="text-xs text-rose-600">
                            {statusError}
                        </p>
                    )}

                    {referral?.statusLogs?.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                            <p className="text-xs font-medium text-slate-500">
                                Status History
                            </p>

                            {referral.statusLogs
                                .slice()
                                .reverse()
                                .map((log, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-3 text-xs text-slate-600"
                                    >
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 font-medium ${getStatusAppearance(log.status).badge}`}
                                        >
                                            {log.status}
                                        </span>
                                        <span>
                                            {log.updatedAt?.toDate?.().toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </InfoCard>

            <InfoCard title="My Earnings" icon={Wallet}>
                <InfoRow
                    label="Total Earned"
                    value={`₹${totalEarned.toLocaleString("en-IN")}`}
                    icon={TrendingUp}
                    valueClassName="text-slate-900"
                />

                <InfoRow
                    label="Received"
                    value={`₹${received.toLocaleString("en-IN")}`}
                    icon={CheckCircle2}
                    valueClassName="text-green-600"
                />

                <InfoRow
                    label="Pending"
                    value={`₹${pending.toLocaleString("en-IN")}`}
                    icon={AlertCircle}
                    valueClassName="text-amber-600"
                />
            </InfoCard>

            {documentURL && (
                <InfoCard
                    title="Invoice / Agreement"
                    icon={FileText}
                    action={
                        <button
                            onClick={openInvoice}
                            className="flex items-center gap-1 text-sm font-medium text-blue-600"
                        >
                            <Eye size={14} />
                            Preview
                        </button>
                    }
                >
                    <div className="flex items-center gap-3">
                        {isPDF ? (
                            <FileText size={22} className="text-red-500" />
                        ) : (
                            <ImageIcon size={22} className="text-blue-500" />
                        )}

                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">
                                Uploaded Document
                            </span>

                            <span className="mt-1 w-fit rounded bg-slate-100 px-2 py-1 text-xs">
                                {isPDF ? "PDF Document" : "Image File"}
                            </span>
                        </div>
                    </div>
                </InfoCard>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <h2 className="mb-2 text-lg font-semibold">
                            Confirm Status Change
                        </h2>

                        <div className="mb-6 space-y-2 text-sm text-gray-600">
                            <p>
                                Current Status:
                                <span className="font-medium text-gray-800">
                                    {" "}{currentStatus}
                                </span>
                            </p>

                            <p>
                                New Status:
                                <span className="font-medium text-blue-800">
                                    {" "}{selectedStatus}
                                </span>
                            </p>

                            <p className="mt-3 text-xs text-gray-500">
                                This action will:
                            </p>

                            <ul className="list-disc space-y-1 pl-4 text-xs text-gray-500">
                                <li>Update deal status</li>
                                <li>Add entry in status history</li>
                                <li>Send WhatsApp notification</li>
                            </ul>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    if (updating) return;
                                    setModalOpen(false);
                                }}
                                disabled={updating}
                                className="rounded-lg border px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmStatusChange}
                                disabled={updating}
                                className="flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm text-white"
                            >
                                {updating && (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                )}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getStatusAppearance(status) {
    const tones = {
        [REFERRAL_STATUSES.PENDING]: {
            badge: "bg-amber-100 text-amber-800",
        },
        [REFERRAL_STATUSES.ACCEPTED]: {
            badge: "bg-slate-200 text-slate-700",
        },
        [REFERRAL_STATUSES.CALLED_NOT_ANSWERED]: {
            badge: "bg-yellow-100 text-yellow-800",
        },
        [REFERRAL_STATUSES.DISCUSSION_IN_PROGRESS]: {
            badge: "bg-sky-100 text-sky-800",
        },
        [REFERRAL_STATUSES.DEAL_LOST]: {
            badge: "bg-rose-100 text-rose-800",
        },
        [REFERRAL_STATUSES.DEAL_WON]: {
            badge: "bg-emerald-100 text-emerald-800",
        },
        [REFERRAL_STATUSES.WORK_IN_PROGRESS]: {
            badge: "bg-indigo-100 text-indigo-800",
        },
        [REFERRAL_STATUSES.WORK_COMPLETED]: {
            badge: "bg-violet-100 text-violet-800",
        },
        [REFERRAL_STATUSES.RECEIVED_FULL_AND_FINAL_PAYMENT]: {
            badge: "bg-teal-100 text-teal-800",
        },
        [REFERRAL_STATUSES.RECEIVED_PART_PAYMENT_AND_TRANSFERRED_TO_UJB]: {
            badge: "bg-cyan-100 text-cyan-800",
        },
        [REFERRAL_STATUSES.AGREED_PERCENT_TRANSFERRED_TO_UJB]: {
            badge: "bg-fuchsia-100 text-fuchsia-800",
        },
        [REFERRAL_STATUSES.HOLD]: {
            badge: "bg-orange-100 text-orange-800",
        },
    };

    return tones[status] || {
        badge: "bg-slate-100 text-slate-700",
    };
}
