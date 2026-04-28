"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    User,
    Phone,
    Mail,
    Search,
    Briefcase,
    Tag,
    Calendar,
    Plus
} from "lucide-react";
import Link from "next/link";
import UserPageHeader from "@/components/user/UserPageHeader";
import { fetchUserProspects } from "@/services/prospectService";

function toDateValue(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return value;
    }

    if (typeof value?.toDate === "function") {
        return value.toDate();
    }

    if (typeof value?.seconds === "number") {
        return new Date(value.seconds * 1000);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatProspectDate(value) {
    if (!value) return "";

    const date = toDateValue(value);

    if (!date) {
        return String(value || "");
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ProspectListPage() {
    const [isClosing, setIsClosing] = useState(false);
    const [prospects, setProspects] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedProspect, setSelectedProspect] = useState(null);

    useEffect(() => {
        const fetchProspects = async () => {
            try {
                const results = await fetchUserProspects();

                setProspects(
                    results.map((prospect) => ({
                        ...prospect,
                        date: formatProspectDate(prospect.date || prospect.registeredAt),
                        registeredAt: toDateValue(prospect.registeredAt || prospect.date),
                    }))
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchProspects();
    }, []);

    const filteredProspects = useMemo(() => {
        return prospects.filter((p) =>
            `${p.prospectName || ""} ${p.prospectPhone || ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [prospects, search]);

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <UserPageHeader
                        title="My Prospects"
                        description="Manage your registered leads, search quickly, and open prospect details without losing context."
                        icon={User}
                    />

                    <div className="relative w-full rounded-2xl bg-white md:ml-auto md:w-72">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-orange-200 focus:border-orange-500"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">

                    {loadingData ? (
                        <div className="p-6 space-y-4 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
                            ))}
                        </div>
                    ) : filteredProspects.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            No prospects found.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {filteredProspects.map((prospect) => (
                                <div
                                    key={prospect.id}
                                    onClick={() => setSelectedProspect(prospect)}
                                    className="
                    p-5 cursor-pointer transition
                    hover:bg-slate-50 hover:shadow-sm
                    active:scale-[0.99]
                  "
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                        {/* LEFT */}
                                        <div className="space-y-3">

                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-orange-500" />
                                                <p className="font-semibold text-slate-800">
                                                    {prospect.prospectName}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">

                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {prospect.prospectPhone}
                                                </div>

                                                {prospect.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-4 w-4 text-slate-400" />
                                                        {prospect.email}
                                                    </div>
                                                )}

                                                {prospect.occupation && (
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                                        {prospect.occupation}
                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        {/* RIGHT META */}
                                        <div className="flex flex-col items-start md:items-end gap-2">

                                            {prospect.source && (
                                                <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                                                    <Tag className="h-3 w-3" />
                                                    {prospect.source.replace("_", " ")}
                                                </div>
                                            )}

                                            {prospect.date && (
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Calendar className="h-3 w-3" />
                                                    {prospect.date}
                                                </div>
                                            )}

                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Sheet / Drawer */}
            {selectedProspect && (
                <div className="fixed inset-0 z-99 flex items-end md:items-stretch md:justify-end">

                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => {
                            setIsClosing(true);
                            setTimeout(() => {
                                setSelectedProspect(null);
                                setIsClosing(false);
                            }, 250);
                        }}
                    />

                    {/* Panel */}
                    <div
                        className={`
        relative bg-white shadow-2xl
        w-full md:w-[420px]
        h-[85%] md:h-full
        rounded-t-2xl md:rounded-none
        p-6 overflow-y-auto
        ${isClosing ? "animate-slideDown" : "animate-slideUp md:animate-slideInRight"}
      `}
                    >
                        {/* Mobile Drag Indicator */}
                        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 md:hidden" />

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">
                                Prospect Details
                            </h2>
                            <button
                                onClick={() => {
                                    setIsClosing(true);
                                    setTimeout(() => {
                                        setSelectedProspect(null);
                                        setIsClosing(false);
                                    }, 250);
                                }}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <Detail label="Name" value={selectedProspect.prospectName} />
                            <Detail label="Phone" value={selectedProspect.prospectPhone} />
                            <Detail label="Email" value={selectedProspect.email} />
                            <Detail label="Occupation" value={selectedProspect.occupation} />
                            <Detail label="Hobbies" value={selectedProspect.hobbies} />
                            <Detail label="Source" value={selectedProspect.source} />
                            <Detail label="Mentor UJB" value={selectedProspect.mentorUjbCode} />
                            <Detail label="Registered On" value={selectedProspect.date} />
                        </div>
                    </div>
                </div>
            )}

            <Link
                href="/user/prospects/add"
                className="
    md:hidden fixed bottom-28 right-6 z-40
    bg-gradient-to-r from-orange-600 to-pink-600
    hover:from-indigo-700 hover:to-violet-700
    text-white p-4 rounded-full shadow-xl
    transition-all duration-200
    active:scale-95
  "
            >
                <Plus className="h-6 w-6" />
            </Link>
        </div>
    );
}

const Detail = ({ label, value }) => (
    <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="font-medium text-slate-800">{value || "-"}</p>
    </div>
);
