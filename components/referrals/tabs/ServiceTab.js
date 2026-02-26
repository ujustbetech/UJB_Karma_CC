'use client';

import { useState } from "react";
import {
    Package,
    Percent,
    BadgeIndianRupee,
    Tag,
    Copy,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    Image as ImageIcon
} from "lucide-react";

import InfoCard from "../shared/InfoCard";
import InfoRow from "../shared/InfoRow";

export default function ServiceTab({ referral }) {

    const [showCommissionLogic, setShowCommissionLogic] = useState(false);

    const latestLog =
        referral?.dealLogs?.[referral.dealLogs.length - 1];

    const service = referral?.service;
    const product = referral?.product;
    const item = service || product;

    if (!item) {
        return (
            <div className="px-4 mt-5">
                <InfoCard>
                    <p className="text-sm text-slate-500">
                        No service or product linked.
                    </p>
                </InfoCard>
            </div>
        );
    }

    const commissionType =
        item?.agreedValue?.single?.type || "percentage";

    const commissionValue =
        latestLog?.percentage ||
        item?.agreedValue?.single?.value ||
        0;

    const dealValue = referral?.dealValue || 0;
    const agreedTotal = referral?.agreedTotal || 0;

    const slabs = item?.agreedValue?.slabs || [];

    const isActive = item?.status !== "inactive";

    return (
        <div className="mt-5 space-y-5">

            {/* ===================== BASIC INFO ===================== */}
            <InfoCard title="Service / Product" icon={Package}>

                {/* Name + Status */}
                <div className="flex justify-between items-center">
                    <p className="text-base font-semibold text-slate-800">
                        {item?.name}
                    </p>

                    <span
                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                    >
                        {isActive ? (
                            <CheckCircle2 size={12} />
                        ) : (
                            <XCircle size={12} />
                        )}
                        {isActive ? "Active" : "Inactive"}
                    </span>
                </div>

                {/* Service ID */}
                {item?.id && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <span>ID: {item.id}</span>
                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(item.id)
                            }
                        >
                            <Copy size={12} />
                        </button>
                    </div>
                )}

                {/* Description */}
                {item?.description && (
                    <div className="mt-3 text-sm text-slate-600 leading-relaxed border-t pt-3">
                        {item.description}
                    </div>
                )}

                {/* Keywords */}
                {item?.keywords && (
                    <div className="mt-4 border-t pt-3">
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                            <Tag size={14} className="text-orange-500" />
                            Keywords
                        </div>

                        <KeywordChips keywords={item.keywords} />
                    </div>
                )}
            </InfoCard>

            {/* ===================== COMMISSION STRUCTURE ===================== */}
            <InfoCard title="Commission Structure" icon={Percent}>

                <InfoRow
                    label="Type"
                    value={commissionType}
                />

                <InfoRow
                    label="Value"
                    value={
                        commissionType === "percentage"
                            ? `${commissionValue}%`
                            : `₹${commissionValue}`
                    }
                    valueClassName="text-green-600"
                />

                {/* Expand Logic */}
                <button
                    onClick={() =>
                        setShowCommissionLogic(!showCommissionLogic)
                    }
                    className="flex items-center gap-1 text-xs text-blue-600 mt-2"
                >
                    View Commission Logic
                    {showCommissionLogic ? (
                        <ChevronUp size={14} />
                    ) : (
                        <ChevronDown size={14} />
                    )}
                </button>

                {showCommissionLogic && (
                    <div className="mt-4 border-t pt-3 text-sm space-y-2">

                        {/* Formula Preview */}
                        {commissionType === "percentage" && (
                            <div className="bg-slate-50 p-3 rounded-lg text-slate-700">
                                Formula:
                                <br />
                                Commission = Deal Value × {commissionValue}%
                                <br />
                                = ₹{dealValue.toLocaleString()} × {commissionValue}%
                                <br />
                                = ₹{agreedTotal.toLocaleString()}
                            </div>
                        )}

                        {/* Slabs */}
                        {slabs.length > 0 && (
                            <div className="space-y-2">
                                <p className="font-medium text-slate-700">
                                    Slab Breakdown
                                </p>

                                {slabs.map((slab, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between text-xs bg-slate-50 px-3 py-2 rounded"
                                    >
                                        <span>
                                            ₹{slab.from} - ₹{slab.to}
                                        </span>
                                        <span>
                                            {slab.value}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                )}

            </InfoCard>

            {/* ===================== DEAL VALUE VS AGREED ===================== */}
            <InfoCard title="Deal Comparison" icon={BadgeIndianRupee}>

                <InfoRow
                    label="Deal Value"
                    value={`₹${dealValue.toLocaleString()}`}
                />

                <InfoRow
                    label="Total Commission"
                    value={`₹${agreedTotal.toLocaleString()}`}
                    valueClassName="text-green-600"
                />

            </InfoCard>

            {/* ===================== PRODUCT GALLERY ===================== */}
            {(item?.images?.length > 0 || item?.imageURL) && (
                <InfoCard title="Product Gallery" icon={ImageIcon}>

                    <div className="grid grid-cols-2 gap-3">

                        {item?.images?.map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                alt="Product"
                                className="rounded-lg border"
                            />
                        ))}

                        {!item?.images?.length && item?.imageURL && (
                            <img
                                src={item.imageURL}
                                alt="Product"
                                className="rounded-lg border"
                            />
                        )}

                    </div>

                </InfoCard>
            )}

        </div>
    );
}

function KeywordChips({ keywords }) {

    const [expanded, setExpanded] = useState(false);

    // Convert string → array if needed
    const keywordArray =
        Array.isArray(keywords)
            ? keywords
            : keywords.split(/\s+/);

    const visibleKeywords = expanded
        ? keywordArray
        : keywordArray.slice(0, 6);

    const remaining = keywordArray.length - 6;

    return (
        <div>

            <div className="flex flex-wrap gap-2">

                {visibleKeywords.map((word, index) => (
                    <span
                        key={index}
                        className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full"
                    >
                        {word}
                    </span>
                ))}

                {!expanded && remaining > 0 && (
                    <button
                        onClick={() => setExpanded(true)}
                        className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full"
                    >
                        +{remaining} more
                    </button>
                )}

                {expanded && keywordArray.length > 6 && (
                    <button
                        onClick={() => setExpanded(false)}
                        className="text-xs text-slate-500 underline ml-2"
                    >
                        Show less
                    </button>
                )}

            </div>

        </div>
    );
}