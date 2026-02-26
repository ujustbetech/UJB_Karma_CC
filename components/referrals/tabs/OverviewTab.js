"use client";

import { useState } from "react";
import {
    Wallet,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    Eye,
} from "lucide-react";

import {
    doc,
    updateDoc,
    Timestamp,
    arrayUnion,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import InfoCard from "../shared/InfoCard";
import InfoRow from "../shared/InfoRow";

/* ================= STATUS OPTIONS ================= */

const statusOptions = [
    "Not Connected",
    "Called but Not Answered",
    "Discussion in Progress",
    "Deal Lost",
    "Deal Won",
    "Work in Progress",
    "Work Completed",
    "Received Full & Final Payment",
    "Received Part Payment & Transferred to UJustBe",
    "Agreed % Transferred to UJustBe",
    "Hold",
];

/* ================= STATUS MESSAGES ================= */

const statusMessages = {
    "Deal Won": {
        Orbiter:
            "You Did It! 🏆 The referral has been WON! 🌟",
        CosmOrbiter:
            "Victory Unlocked! 🎉 The referral has been successfully won.",
    },
    "Deal Lost": {
        Orbiter:
            "The referral could not close this time. 🌱 Keep going!",
        CosmOrbiter:
            "This referral didn’t close, but your efforts matter.",
    },
    "Work in Progress": {
        Orbiter:
            "Work is now in progress for your referral. 🔧",
        CosmOrbiter:
            "You’ve marked this referral as Work in Progress.",
    },
    "Received Full & Final Payment": {
        Orbiter:
            "Full payment confirmed. 💰 Thank you!",
        CosmOrbiter:
            "Payment received successfully. 🎯",
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

/* ================= DYNAMIC MESSAGE HELPER ================= */

const getDynamicMessage = (template, referral) => {
    if (!template) return "";

    const serviceOrProduct =
        referral?.product?.name ||
        referral?.service?.name ||
        "-";

    return template
        .replace(/\(Product\/Service\)/g, serviceOrProduct);
};

export default function OverviewTab({
    referral,
    openInvoice,
}) {
    const [updating, setUpdating] = useState(false);

    const latestLog =
        referral?.dealLogs?.[referral.dealLogs.length - 1];

    const totalEarned = latestLog?.orbiterShare || 0;
    const received = referral?.paidToOrbiter || 0;
    const pending = totalEarned - received;

    const documentURL = referral?.dealDocumentURL;
    const isPDF = documentURL?.toLowerCase().includes(".pdf");

    const [selectedStatus, setSelectedStatus] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    /* ================= WHATSAPP API CALL ================= */

    // const sendWhatsApp = async (phone, name, message) => {
    //     if (!phone || !message) return;

    //     try {
    //         await fetch("/api/send-whatsapp", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({ phone, name, message }),
    //         });
    //     } catch (err) {
    //         console.error("WhatsApp send failed:", err);
    //     }
    // };

    // WhatsApp sending


    /* ================= STATUS UPDATE ================= */

    const confirmStatusChange = async () => {
        if (!selectedStatus) return;

        try {
            setUpdating(true);

            const docRef = doc(db, COLLECTIONS.referral, referral.id);

            const statusLog = {
                status: selectedStatus,
                updatedAt: Timestamp.now(),
            };

            await updateDoc(docRef, {
                dealStatus: selectedStatus,
                "cosmoOrbiter.dealStatus": selectedStatus,
                statusLogs: arrayUnion(statusLog),
                lastUpdated: Timestamp.now(),
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
            setSelectedStatus(null);

        } catch (err) {
            console.error("Status update failed", err);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="mt-5 space-y-5">

            {/* ================= DEAL STATUS ================= */}
            <InfoCard
                title="Deal Status"
                icon={TrendingUp}
            >
                <div className="space-y-3">

                    <div>
                        <label className="block text-xs text-slate-500 mb-1">
                            Current Status
                        </label>

                        <select
                            value={referral?.dealStatus || "Pending"}
                            onChange={(e) => {
                                const newStatus = e.target.value;

                                if (newStatus === referral?.dealStatus) return;

                                setSelectedStatus(newStatus);
                                setModalOpen(true);
                            }}
                            disabled={updating}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {updating && (
                        <p className="text-xs text-slate-500">
                            Updating status...
                        </p>
                    )}

                    {/* Status History */}
                    {referral?.statusLogs?.length > 0 && (
                        <div className="border-t pt-3 space-y-2">
                            <p className="text-xs font-medium text-slate-500">
                                Status History
                            </p>

                            {referral.statusLogs
                                .slice()
                                .reverse()
                                .map((log, i) => (
                                    <div
                                        key={i}
                                        className="text-xs text-slate-600 flex justify-between"
                                    >
                                        <span>{log.status}</span>
                                        <span>
                                            {log.updatedAt?.toDate?.().toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </InfoCard>

            {/* ===================== Earnings ===================== */}
            <InfoCard
                title="My Earnings"
                icon={Wallet}
            >
                <InfoRow
                    label="Total Earned"
                    value={`₹${totalEarned.toLocaleString()}`}
                    icon={TrendingUp}
                    valueClassName="text-slate-900"
                />

                <InfoRow
                    label="Received"
                    value={`₹${received.toLocaleString()}`}
                    icon={CheckCircle2}
                    valueClassName="text-green-600"
                />

                <InfoRow
                    label="Pending"
                    value={`₹${pending.toLocaleString()}`}
                    icon={AlertCircle}
                    valueClassName="text-amber-600"
                />
            </InfoCard>

            {/* ===================== Invoice ===================== */}
            {documentURL && (
                <InfoCard
                    title="Invoice / Agreement"
                    icon={FileText}
                    action={
                        <button
                            onClick={openInvoice}
                            className="flex items-center gap-1 text-blue-600 text-sm font-medium"
                        >
                            <Eye size={14} />
                            Preview
                        </button>
                    }
                >
                    <div className="flex items-center gap-3">
                        {isPDF ? (
                            <FileText
                                size={22}
                                className="text-red-500"
                            />
                        ) : (
                            <ImageIcon
                                size={22}
                                className="text-blue-500"
                            />
                        )}

                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">
                                Uploaded Document
                            </span>

                            <span className="text-xs bg-slate-100 px-2 py-1 rounded w-fit mt-1">
                                {isPDF
                                    ? "PDF Document"
                                    : "Image File"}
                            </span>
                        </div>
                    </div>
                </InfoCard>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/40 backdrop-blur-sm">

                    <div className="bg-white w-[90vw] max-w-md rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">

                        <h2 className="text-lg font-semibold mb-2">
                            Confirm Status Change
                        </h2>

                        <div className="text-sm text-gray-600 space-y-2 mb-6">
                            <p>
                                Current Status:
                                <span className="font-medium text-gray-800">
                                    {" "}{referral?.dealStatus || "Pending"}
                                </span>
                            </p>

                            <p>
                                New Status:
                                <span className="font-medium text-blue-800">
                                    {" "}{selectedStatus}
                                </span>
                            </p>

                            <p className="text-xs text-gray-500 mt-3">
                                This action will:
                            </p>

                            <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                                <li>Update deal status</li>
                                <li>Add entry in status history</li>
                                <li>Send WhatsApp notification</li>
                            </ul>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setSelectedStatus(null);
                                }}
                                disabled={updating}
                                className="px-4 py-2 text-sm rounded-lg border"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmStatusChange}
                                disabled={updating}
                                className="px-4 py-2 text-sm rounded-lg bg-blue-800 text-white flex items-center gap-2"
                            >
                                {updating && (
                                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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