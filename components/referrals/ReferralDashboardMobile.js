'use client';

import { useMemo, useState } from "react";
import {
    Copy,
    LayoutDashboard,
    CreditCard,
    Briefcase,
    Users,
    MessageCircle,
    FileText,
} from "lucide-react";

import OverviewTab from "./tabs/OverviewTab";
import PaymentsTab from "./tabs/PaymentsTab";
import ServiceTab from "./tabs/ServiceTab";
import StakeholdersTab from "./tabs/StakeholdersTab";
import DiscussionTab from "./tabs/DiscussionTab";
import InvoiceModal from "./tabs/InvoiceModal";
import InvoiceTab from "./tabs/InvoiceTab";
import { useToast } from "@/components/ui/ToastProvider";
import { REFERRAL_STATUSES } from "@/lib/referrals/referralStates.mjs";

export default function ReferralDashboardMobile({
    referral,
    userRole,
    currentUserUjbCode,
    onReferralUpdated,
}) {
    const [activeTab, setActiveTab] = useState("overview");
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [copying, setCopying] = useState(false);
    const toast = useToast();

    const tabs = [
        { key: "overview", label: "Overview", icon: LayoutDashboard },
        { key: "payments", label: "Payments", icon: CreditCard },
        { key: "service", label: "Service", icon: Briefcase },
        { key: "invoice", label: "Invoice", icon: FileText },
        { key: "stakeholders", label: "People", icon: Users },
        { key: "discussion", label: "Chat", icon: MessageCircle },
    ];

    const statusTone = useMemo(
        () => getStatusTone(referral?.dealStatus),
        [referral?.dealStatus]
    );
    const roleLabel =
        userRole === "cosmo"
            ? "CosmOrbiter"
            : userRole === "orbiter"
                ? "Orbiter"
                : "Viewer";

    const handleCopy = async (event) => {
        event.stopPropagation();

        const shareValue =
            typeof window !== "undefined"
                ? window.location.href
                : referral?.referralId || "";

        if (!shareValue) {
            toast.error("Nothing to copy yet.");
            return;
        }

        try {
            setCopying(true);
            await navigator.clipboard.writeText(shareValue);
            toast.success("Deal link copied.");
        } catch {
            toast.error("Copy failed. Please try again.");
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className="min-h-screen pb-24">
            <div
                onClick={() => setIsExpanded((prev) => !prev)}
                className="sticky top-0 z-20 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-orange-50 px-4 shadow-sm transition-all duration-300"
            >
                <div
                    className={`overflow-hidden transition-all duration-300 ${
                        isExpanded ? "py-4" : "py-3"
                    }`}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-lg font-bold">
                                ₹{Number(referral?.dealValue || 0).toLocaleString("en-IN")}
                            </p>

                            <p className="text-xs text-slate-500">
                                Deal Value
                            </p>

                            <div
                                className={`overflow-hidden transition-all duration-300 ${
                                    isExpanded ? "mt-2 max-h-24 opacity-100" : "max-h-0 opacity-0"
                                }`}
                            >
                                <p className="text-xs text-slate-400">
                                    Referral #{referral?.referralId || referral?.id}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                        Your Role: {roleLabel}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-medium text-orange-700">
                                        {userRole === "cosmo"
                                            ? "Can update deal status"
                                            : "Read only"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusTone.badge}`}
                            >
                                {referral?.dealStatus || REFERRAL_STATUSES.PENDING}
                            </span>

                            <button
                                onClick={handleCopy}
                                disabled={copying}
                                aria-label="Copy deal link"
                                title={copying ? "Copying..." : "Copy deal link"}
                                className="rounded-lg bg-white p-2 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sticky top-[84px] z-20 mt-3 rounded-2xl bg-white shadow-sm">
                <div className="flex overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative flex min-w-[80px] flex-col items-center justify-center px-4 py-3 transition-all duration-200 ${
                                    isActive ? "text-orange-600" : "text-slate-400"
                                }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />

                                <span className="mt-1 whitespace-nowrap text-[11px]">
                                    {tab.label}
                                </span>

                                {isActive && (
                                    <div className="absolute bottom-0 h-[3px] w-8 rounded-full bg-orange-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === "overview" && (
                <OverviewTab
                    referral={referral}
                    userRole={userRole}
                    openInvoice={() => setShowInvoiceModal(true)}
                    onReferralUpdated={onReferralUpdated}
                />
            )}

            {activeTab === "payments" && <PaymentsTab referral={referral} />}
            {activeTab === "service" && <ServiceTab referral={referral} />}
            {activeTab === "stakeholders" && (
                <StakeholdersTab
                    referral={referral}
                    currentUserUjbCode={currentUserUjbCode}
                />
            )}
            {activeTab === "invoice" && <InvoiceTab referral={referral} />}
            {activeTab === "discussion" && (
                <DiscussionTab
                    referral={referral}
                    referralId={referral.id}
                    currentUserUjbCode={currentUserUjbCode}
                />
            )}

            {showInvoiceModal && (
                <InvoiceModal
                    url={referral?.dealDocumentURL}
                    onClose={() => setShowInvoiceModal(false)}
                />
            )}
        </div>
    );
}

function getStatusTone(status) {
    const tones = {
        [REFERRAL_STATUSES.PENDING]: {
            badge: "bg-amber-100 text-amber-800",
        },
        [REFERRAL_STATUSES.ACCEPTED]: {
            badge: "bg-slate-200 text-slate-700",
        },
        [REFERRAL_STATUSES.DISCUSSION_IN_PROGRESS]: {
            badge: "bg-sky-100 text-sky-800",
        },
        [REFERRAL_STATUSES.DEAL_WON]: {
            badge: "bg-emerald-100 text-emerald-800",
        },
        [REFERRAL_STATUSES.DEAL_LOST]: {
            badge: "bg-rose-100 text-rose-800",
        },
        [REFERRAL_STATUSES.WORK_IN_PROGRESS]: {
            badge: "bg-indigo-100 text-indigo-800",
        },
        [REFERRAL_STATUSES.WORK_COMPLETED]: {
            badge: "bg-violet-100 text-violet-800",
        },
        [REFERRAL_STATUSES.HOLD]: {
            badge: "bg-orange-100 text-orange-800",
        },
    };

    return tones[status] || {
        badge: "bg-slate-100 text-slate-700",
    };
}
