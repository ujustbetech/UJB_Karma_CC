'use client';

import { useState } from "react";
import {
    Copy,
    LayoutDashboard,
    CreditCard,
    Briefcase,
    Users,
    MessageCircle,
    FileText,
    X
} from "lucide-react";

import OverviewTab from "./tabs/OverviewTab";
import PaymentsTab from "./tabs/PaymentsTab";
import ServiceTab from "./tabs/ServiceTab";
import StakeholdersTab from "./tabs/StakeholdersTab";
import DiscussionTab from "./tabs/DiscussionTab";
import InvoiceModal from "./tabs/InvoiceModal";
import InvoiceTab from "./tabs/InvoiceTab";

export default function ReferralDashboardMobile({ referral, userRole, currentUserUjbCode }) {

    const [activeTab, setActiveTab] = useState("overview");
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const tabs = [
        { key: "overview", label: "Overview", icon: LayoutDashboard },
        { key: "payments", label: "Payments", icon: CreditCard },
        { key: "service", label: "Service", icon: Briefcase },
        { key: "invoice", label: "Invoice", icon: FileText },
        { key: "stakeholders", label: "People", icon: Users },
        { key: "discussion", label: "Chat", icon: MessageCircle }
    ];

    const handleCopy = () => {
        navigator.clipboard.writeText(referral?.referralId);
        toast.success("Referral ID copied");
    };

    const statusColor = {
        Closed: "bg-green-50 border-green-100",
        Pending: "bg-yellow-50 border-yellow-100",
        Lost: "bg-red-50 border-red-100",
    };

    return (
        <div className="min-h-screen pb-24">

            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`sticky top-0 z-20 
    bg-gradient-to-r from-orange-50 via-white to-orange-50
    border border-orange-100
    px-4 
    transition-all duration-300 
    rounded-2xl shadow-sm cursor-pointer
  `}
            >
                <div className={`overflow-hidden transition-all duration-300 
    ${isExpanded ? "py-4" : "py-3"}
  `}>

                    <div className="flex justify-between items-start">

                        <div>
                            {/* Compact Always Visible */}
                            <p className="text-lg font-bold">
                                ₹{referral?.dealValue?.toLocaleString() || 0}
                            </p>

                            <p className="text-xs text-slate-500">
                                Deal Value
                            </p>

                            {/* Expandable Section */}
                            <div
                                className={`transition-all duration-300 overflow-hidden
            ${isExpanded ? "max-h-20 mt-2 opacity-100" : "max-h-0 opacity-0"}
          `}
                            >
                                <p className="text-xs text-slate-400">
                                    Referral #{referral?.referralId}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                                {referral?.dealStatus}
                            </span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(referral?.referralId);
                                }}
                                className="p-2 rounded-lg bg-white shadow-sm"
                            >
                                <Copy size={16} />
                            </button>
                        </div>

                    </div>

                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-[84px] z-20 bg-white shadow-sm mt-3 rounded-2xl">

                <div className="flex overflow-x-auto no-scrollbar">

                    {tabs.map(tab => {

                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex flex-col items-center justify-center min-w-[80px] px-4 py-3 transition-all duration-200 relative
            ${isActive
                                        ? "text-orange-600"
                                        : "text-slate-400"
                                    }
          `}
                            >
                                <Icon
                                    size={18}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />

                                <span className="text-[11px] mt-1 whitespace-nowrap">
                                    {tab.label}
                                </span>

                                {isActive && (
                                    <div className="absolute bottom-0 h-[3px] w-8 bg-orange-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}

                </div>

            </div>
            {/* Tab Content */}
            {activeTab === "overview" && (
                <OverviewTab
                    referral={referral}
                    userRole={userRole}
                    openInvoice={() => setShowInvoiceModal(true)}
                />
            )}

            {activeTab === "payments" && (
                <PaymentsTab referral={referral} />
            )}

            {activeTab === "service" && (
                <ServiceTab referral={referral} />
            )}

            {activeTab === "stakeholders" && (
                <StakeholdersTab referral={referral} />
            )}
            {activeTab === "invoice" && (
                <InvoiceTab referral={referral} />
            )}

            {activeTab === "discussion" && (
                <DiscussionTab referral={referral} referralId={referral.id} currentUserUjbCode={currentUserUjbCode} />
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