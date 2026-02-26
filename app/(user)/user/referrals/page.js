"use client";

import React, { useEffect, useState } from "react";
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    Timestamp,
    arrayUnion,
    onSnapshot,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";
import Link from "next/link";
// import HeaderNav from "../component/HeaderNav";
// import Swal from "sweetalert2";

// import Headertop from "../component/Header";
import { COLLECTIONS } from "@/lib/utility_collection";
// import "../src/app/styles/user.scss";
import { CheckCircle, Inbox, Mail, Phone, Send, X } from "lucide-react";

import {
    Search,
    Filter,
    Trophy,
    TrendingUp,
    Users,
    Share2,
    CheckCircle2,
    XCircle,
    Clock,
    PauseCircle,
    AlertTriangle,
} from "lucide-react";

import { SlidersHorizontal } from "lucide-react";

const db = getFirestore(app);

// Function to get dynamic message
const getDynamicMessage = (template, referral) => {
    if (!template) return "";

    const serviceOrProduct =
        (referral.product && referral.product.name) ||
        (referral.service && referral.service.name) ||
        "-";

    return template
        .replace(/\(CosmOrbiter Name\)/g, referral.cosmoOrbiter.name)
        .replace(/\(Orbiter Name\)/g, referral.orbiter.name)
        .replace(/\(Product\/Service\)/g, serviceOrProduct);
};



// Predefined status messages
const statusMessages = {
    "Not Connected": {
        Orbiter: `Referral Accepted! 🤝 Good news! (CosmOrbiter Name) has accepted your referral for (Product/Service). You may reach out directly if the matter is urgent. 🌟`,
        CosmOrbiter: `Let’s Connect! 📲 You’ve accepted a referral from (Orbiter Name) for (Product/Service). Time to reach out and explore possibilities within the next 24 hours!`,
    },
    "Called but Not Answered": {
        Orbiter: `Hello knock knock! 📞 Our CosmOrbiter (CosmOrbiter Name) tried connecting with you for the referral you passed. Please reconnect so the opportunity doesn’t go cold. 🔄`,
        CosmOrbiter: `Effort Noticed! 🙏 We see your attempt to connect with (Orbiter Name). The Orbiter’s been notified — kindly try again after 24 hours. Your persistence builds trust! 💪`,
    },
    "Discussion in Progress": {
        Orbiter: `Lets do it together 💬 Thank you, (Orbiter Name), for connecting with (CosmOrbiter Name). Your referral is now progressing beautifully! 🌈 You’ve earned Contribution Points for sharing a valid referral. 🌟`,
        CosmOrbiter: `Let the Collaboration Flow! 💬 Thank you, (CosmOrbiter Name), for engaging with (Orbiter Name). You’ve earned Contribution Points for validating this referral. Let’s make this one count! 🚀`,
    },
    "Deal Lost": {
        Orbiter: `We are listening 💭 The referral with (CosmOrbiter Name) for (Product/Service) couldn’t close this time. 🌱 Your efforts matter — please share feedback so we can grow stronger together. 💪`,
        CosmOrbiter: `Every Effort Counts! 🌦️ This referral from (Orbiter Name) didn’t close, but your efforts are valued. Share your learnings — each experience adds wisdom to our Universe. ✨`,
    },
    "Deal Won": {
        Orbiter: `You Did It! 🏆 The referral you passed to (CosmOrbiter Name) for (Product/Service) has been WON! 🌟 Your contribution just turned into real impact. Keep shining! 💫`,
        CosmOrbiter: `Victory Unlocked! 🎉 Amazing, (CosmOrbiter Name)! The referral from (Orbiter Name) for (Product/Service) has been successfully won. Here’s to purposeful partnerships! 🔑`,
    },
    "Work in Progress": {
        Orbiter: `Work in Progress! 🔧 The referral you passed to (CosmOrbiter Name) for (Product/Service) is now actively in motion. Great teamwork happening behind the scenes! 💥`,
        CosmOrbiter: `Steady Progress! ⚙️ Thank you, (CosmOrbiter Name)! You’ve marked this referral from (Orbiter Name) as ‘Work in Progress.’ Keep the momentum going! 🔄`,
    },
    "Work Completed": {
        Orbiter: `Work Completed! ✅ The referral you passed to (CosmOrbiter Name) for (Product/Service) is now completed. You’re one step closer to closure and contribution rewards! 🌟`,
        CosmOrbiter: `Fantastic Finish! 🌈 Great job, (CosmOrbiter Name)! The work for the referral from (Orbiter Name) is complete. Another successful collaboration in our UJustBe Universe! 🌍`,
    },
    "Received Full & Final Payment": {
        Orbiter: `Payment Confirmed! 💰 You’ve released full payment to (CosmOrbiter Name) for (Product/Service). Contribution cycle is almost complete — reciprocation is on its way! 💫`,
        CosmOrbiter: `Payment Received! 🎯 Congratulations, (CosmOrbiter Name)! You’ve received full payment for (Product/Service). UJustBe will now process your agreed % invoice. Contribution Points coming soon! 🌟`,
    },
    "Received Part Payment & Transferred to UJustBe": {
        Orbiter: `Part Payment Released! 💸 Thank you for your payment to (CosmOrbiter Name) for (Product/Service). The agreed % has been successfully shared with UJustBe. 🌍`,
        CosmOrbiter: `Part Payment Acknowledged! 💸 You’ve received part payment for (Product/Service). UJustBe has your update and will share your agreed % invoice soon. Keep up the progress! 🚀`,
    },
    "Agreed % Transferred to UJustBe": {
        Orbiter: `Referral Journey Complete! 🎉 Your referral with (CosmOrbiter Name) for (Product/Service) is officially closed. The agreed % has been received by UJustBe, and your reciprocation points are credited! 🌟💎`,
        CosmOrbiter: `Closure Confirmed! 🌟 Cheers, (CosmOrbiter Name)! The referral from (Orbiter Name) is now closed, and UJustBe has received the agreed %. The Orbiter’s reciprocation will be shared soon. ✨`,
    },
    "Hold": {
        Orbiter: `Referral on Pause! ⏸️ Your referral for (Product/Service) with (CosmOrbiter Name) is currently on hold. Don’t worry — we’ll notify you once it’s active again. Stay tuned! 🔔`,
        CosmOrbiter: `Temporary Pause! 🕓 The referral from (Orbiter Name) for (Product/Service) is on hold for now. Await further updates before resuming action. Your patience keeps the process smooth! 🌼`,
    },
};

const statusOptions = [
    "Not Connected",
    "Called but Not Answered",
    "Discussion in Progress",
    "Deal Lost",
    "Deal Won",
    "Work in Progress",
    "Work Completed",
    "Received Full and Final Payment",
    "Received Part Payment & Transferred to UJustBe",
    "Agreed % Transferred to UJustBe",
    "Hold",
];

// WhatsApp sending
const sendWhatsAppTemplate = async (phone, name, message) => {
    if (!message || !phone) return;

    const formatted = String(phone).replace(/\D/g, ""); // clean phone



    const payload = {
        messaging_product: "whatsapp",
        to: formatted,
        type: "template",
        template: {
            name: "referral_module", // must match WhatsApp template name
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: name },
                        { type: "text", text: message },
                    ],
                },
            ],
        },
    };

    const res = await fetch(
        "https://graph.facebook.com/v19.0/527476310441806/messages",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD", // move to env in real app
            },
            body: JSON.stringify(payload),
        }
    );

    const result = await res.json();
    console.log("WhatsApp API Response:", result);
};

const UserReferrals = () => {
    const [loading, setLoading] = useState(true);
    const [ntMeetCount, setNtMeetCount] = useState(0); // My referrals count
    const [monthlyMetCount, setMonthlyMetCount] = useState(0); // Passed referrals count
    const [activeTab, setActiveTab] = useState("my");
    const [allReferrals, setAllReferrals] = useState({
        my: [],
        passed: [],
    });

    const [modalType, setModalType] = useState(null);
    // "accept" | "reject" | null

    const [selectedReferral, setSelectedReferral] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [filterOpen, setFilterOpen] = useState(false);

    const tabs = [
        { name: "My Referrals", key: "my" },
        { name: "Passed Referrals", key: "passed" },
    ];

    // Firestore realtime subscriptions (lists + counts)
    useEffect(() => {
        const storedUJB = localStorage.getItem("mmUJBCode");
        if (!storedUJB) {
            console.warn("UJB code not found in localStorage");
            setLoading(false);
            return;
        }

        setLoading(true);

        const referralsCol = collection(db, COLLECTIONS.referral);

        const myQuery = query(
            referralsCol,
            where("cosmoOrbiter.ujbCode", "==", storedUJB),
            orderBy("timestamp", "desc")
        );

        const passedQuery = query(
            referralsCol,
            where("orbiter.ujbCode", "==", storedUJB),
            orderBy("timestamp", "desc")
        );

        const unsubMy = onSnapshot(
            myQuery,
            (snapshot) => {
                const myReferrals = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                setAllReferrals((prev) => ({ ...prev, my: myReferrals }));
                setNtMeetCount(myReferrals.length);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching my referrals:", error);
                setLoading(false);
            }
        );

        const unsubPassed = onSnapshot(
            passedQuery,
            (snapshot) => {
                const passedReferrals = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                setAllReferrals((prev) => ({
                    ...prev,
                    passed: passedReferrals,
                }));
                setMonthlyMetCount(passedReferrals.length);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching passed referrals:", error);
                setLoading(false);
            }
        );

        return () => {
            unsubMy();
            unsubPassed();
        };
    }, []);

    // Handle deal status change (My Referrals)
    const handleStatusChange = async (referral, newStatus) => {
        try {
            const docRef = doc(db, COLLECTIONS.referral, referral.id);
            const statusLog = { status: newStatus, updatedAt: Timestamp.now() };

            await updateDoc(docRef, {
                dealStatus: newStatus,
                "cosmoOrbiter.dealStatus": newStatus,
                statusLogs: arrayUnion(statusLog),
                lastUpdated: Timestamp.now(),
            });

            // Send WhatsApp messages dynamically if templates exist
            const templates = statusMessages[newStatus];
            if (templates) {
                await Promise.all([
                    sendWhatsAppTemplate(
                        referral.orbiter.phone,
                        referral.orbiter.name,
                        getDynamicMessage(templates.Orbiter, referral)
                    ),
                    sendWhatsAppTemplate(
                        referral.cosmoOrbiter.phone,
                        referral.cosmoOrbiter.name,
                        getDynamicMessage(templates.CosmOrbiter, referral)
                    ),
                ]);
            }
        } catch (error) {
            console.error("Error updating deal status:", error);
            Swal.fire("Error", "Failed to update deal status.", "error");
        }
    };

    // // Accept referral (My Referrals)
    // const handleAccept = async (ref) => {
    //     Swal.fire({
    //         title: "Accept Referral?",
    //         text: "Are you sure you want to accept this referral?",
    //         icon: "question",
    //         showCancelButton: true,
    //         confirmButtonColor: "#3085d6",
    //         cancelButtonColor: "#d33",
    //         confirmButtonText: "Yes, Accept",
    //         cancelButtonText: "No",
    //     }).then(async (result) => {
    //         if (result.isConfirmed) {
    //             try {
    //                 const docRef = doc(db, COLLECTIONS.referral, ref.id);

    //                 const newStatus = "Not Connected";

    //                 await updateDoc(docRef, {
    //                     dealStatus: newStatus,
    //                     "cosmoOrbiter.dealStatus": newStatus,
    //                     statusLogs: arrayUnion({
    //                         status: newStatus,
    //                         updatedAt: Timestamp.now(),
    //                     }),
    //                     lastUpdated: Timestamp.now(),
    //                 });

    //                 const templates = statusMessages[newStatus];
    //                 if (templates) {
    //                     await Promise.all([
    //                         sendWhatsAppTemplate(
    //                             ref.orbiter.phone,
    //                             ref.orbiter.name,
    //                             getDynamicMessage(templates.Orbiter, ref)
    //                         ),
    //                         sendWhatsAppTemplate(
    //                             ref.cosmoOrbiter.phone,
    //                             ref.cosmoOrbiter.name,
    //                             getDynamicMessage(templates.CosmOrbiter, ref)
    //                         ),
    //                     ]);
    //                 }

    //                 Swal.fire({
    //                     title: "Accepted!",
    //                     text: "Referral has been accepted successfully.",
    //                     icon: "success",
    //                     timer: 2000,
    //                     showConfirmButton: false,
    //                 });
    //                 // UI auto-updates via onSnapshot
    //             } catch (error) {
    //                 console.error("Error accepting referral:", error);
    //                 Swal.fire(
    //                     "Error",
    //                     "Failed to accept referral. Try again.",
    //                     "error"
    //                 );
    //             }
    //         }
    //     });
    // };

    // Reject referral with reason
    const handleReject = async (ref) => {
        Swal.fire({
            title: "Reject Referral?",
            html: `
                <p>Please enter the reason for rejection:</p>
                <textarea id="rejectReason" class="swal2-textarea" placeholder="Reason here..."></textarea>
            `,
            showCancelButton: true,
            confirmButtonText: "Reject",
            cancelButtonText: "Cancel",
            preConfirm: () => {
                const reasonEl = document.getElementById("rejectReason");
                const reason = reasonEl ? reasonEl.value : "";
                if (!reason.trim()) {
                    Swal.showValidationMessage("Reason is required");
                    return false;
                }
                return reason;
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                const reason = result.value;

                try {
                    const docRef = doc(db, COLLECTIONS.referral, ref.id);

                    await updateDoc(docRef, {
                        dealStatus: "Rejected",
                        "cosmoOrbiter.dealStatus": "Rejected",
                        rejectReason: reason,
                        statusLogs: arrayUnion({
                            status: "Rejected",
                            reason: reason,
                            updatedAt: Timestamp.now(),
                        }),
                        lastUpdated: Timestamp.now(),
                    });

                    const orbiterMsg = `Your referral was rejected.\nReason: ${reason}`;
                    const cosmoMsg = `You have rejected a referral.\nReason: ${reason}`;

                    await Promise.all([
                        sendWhatsAppTemplate(
                            ref.orbiter.phone,
                            ref.orbiter.name,
                            orbiterMsg
                        ),
                        sendWhatsAppTemplate(
                            ref.cosmoOrbiter.phone,
                            ref.cosmoOrbiter.name,
                            cosmoMsg
                        ),
                    ]);

                    Swal.fire({
                        icon: "success",
                        title: "Referral Rejected",
                        text: "Reason saved & notifications sent.",
                    });
                } catch (error) {
                    console.error("Reject error:", error);
                    Swal.fire("Error", "Failed to reject referral.", "error");
                }
            }
        });
    };

    const handleTabClick = (tabKey) => {
        setActiveTab(tabKey);
    };

    const referrals = React.useMemo(() => {
        return allReferrals[activeTab].filter((r) => {
            const name =
                activeTab === "my"
                    ? r.orbiter?.businessName || r.orbiter?.name || ""
                    : r.cosmoOrbiter?.businessName || r.cosmoOrbiter?.name || "";

            const status = r.dealStatus || "Pending";

            const searchMatch = name
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase());

            const statusMatch =
                statusFilter === "All" || status === statusFilter;

            return searchMatch && statusMatch;
        });
    }, [allReferrals, activeTab, searchTerm, statusFilter]);

    // 👇 ADD HERE (after state, before return)

    const won = allReferrals.my.filter(
        (r) => r.dealStatus === "Deal Won"
    ).length;

    const lost = allReferrals.my.filter(
        (r) => r.dealStatus === "Deal Lost"
    ).length;

    const winRate =
        won + lost > 0
            ? ((won / (won + lost)) * 100).toFixed(0)
            : 0;

    const confirmAccept = async () => {
        if (!selectedReferral) return;

        try {
            setActionLoading(true);

            const docRef = doc(db, COLLECTIONS.referral, selectedReferral.id);
            const newStatus = "Not Connected";

            await updateDoc(docRef, {
                dealStatus: newStatus,
                "cosmoOrbiter.dealStatus": newStatus,
                statusLogs: arrayUnion({
                    status: newStatus,
                    updatedAt: Timestamp.now(),
                }),
                lastUpdated: Timestamp.now(),
            });

            const templates = statusMessages[newStatus];

            if (templates) {
                await Promise.all([
                    sendWhatsAppTemplate(
                        selectedReferral.orbiter.phone,
                        selectedReferral.orbiter.name,
                        getDynamicMessage(templates.Orbiter, selectedReferral)
                    ),
                    sendWhatsAppTemplate(
                        selectedReferral.cosmoOrbiter.phone,
                        selectedReferral.cosmoOrbiter.name,
                        getDynamicMessage(templates.CosmOrbiter, selectedReferral)
                    ),
                ]);
            }

            // Close modal
            setModalType(null);
            setSelectedReferral(null);
        } catch (error) {
            console.error("Error accepting referral:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmReject = async () => {
        if (!selectedReferral) return;

        if (!rejectReason.trim()) return;

        try {
            setActionLoading(true);

            const docRef = doc(db, COLLECTIONS.referral, selectedReferral.id);

            await updateDoc(docRef, {
                dealStatus: "Rejected",
                "cosmoOrbiter.dealStatus": "Rejected",
                rejectReason: rejectReason,
                statusLogs: arrayUnion({
                    status: "Rejected",
                    reason: rejectReason,
                    updatedAt: Timestamp.now(),
                }),
                lastUpdated: Timestamp.now(),
            });

            const orbiterMsg = `Your referral was rejected.\nReason: ${rejectReason}`;
            const cosmoMsg = `You have rejected a referral.\nReason: ${rejectReason}`;

            await Promise.all([
                sendWhatsAppTemplate(
                    selectedReferral.orbiter.phone,
                    selectedReferral.orbiter.name,
                    orbiterMsg
                ),
                sendWhatsAppTemplate(
                    selectedReferral.cosmoOrbiter.phone,
                    selectedReferral.cosmoOrbiter.name,
                    cosmoMsg
                ),
            ]);

            // Reset & close
            setRejectReason("");
            setSelectedReferral(null);
            setModalType(null);

        } catch (error) {
            console.error("Reject error:", error);
        } finally {
            setActionLoading(false);
        }
    };
    return (
        <main className="min-h-screen">
            <section className="max-w-7xl mx-auto pb-13">

                {/* Page Heading */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {activeTab === "my"
                            ? `My Referrals (${ntMeetCount})`
                            : `Passed Referrals (${monthlyMetCount})`}
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

                    {/* My Referrals */}
                    <div className="bg-white border rounded-2xl p-5 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">My Referrals</p>
                            <h3 className="text-2xl font-bold">{ntMeetCount}</h3>
                        </div>
                        <Users className="text-indigo-600" size={26} />
                    </div>

                    {/* Passed */}
                    <div className="bg-white border rounded-2xl p-5 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Passed</p>
                            <h3 className="text-2xl font-bold">{monthlyMetCount}</h3>
                        </div>
                        <Share2 className="text-blue-600" size={26} />
                    </div>

                    {/* Won */}
                    <div className="bg-white border rounded-2xl p-5 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Won</p>
                            <h3 className="text-2xl font-bold text-green-600">{won}</h3>
                        </div>
                        <Trophy className="text-green-600" size={26} />
                    </div>

                    {/* Lost */}
                    <div className="bg-white border rounded-2xl p-5 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Lost</p>
                            <h3 className="text-2xl font-bold text-red-600">{lost}</h3>
                        </div>
                        <XCircle className="text-red-500" size={26} />
                    </div>

                    {/* Win Rate */}
                    <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-2xl p-5 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Win Rate</p>
                            <h3 className="text-2xl font-bold text-green-600">{winRate}%</h3>
                            <p className="text-xs text-gray-400 mt-1">{won} Won • {lost} Lost</p>
                        </div>
                        <TrendingUp className="text-green-600" size={26} />
                    </div>

                </div>

                {/* Tabs */}
                <div className="bg-gray-100 p-1 rounded-xl flex w-full md:w-fit mb-8">

                    {/* My Referrals */}
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200
      ${activeTab === "my"
                                ? "bg-white shadow text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Inbox size={16} />
                        Receive
                        <span className="font-medium text-gray-700">
                            {ntMeetCount}
                        </span>
                    </button>

                    {/* Passed Referrals */}
                    <button
                        onClick={() => setActiveTab("passed")}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200
      ${activeTab === "passed"
                                ? "bg-white shadow text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Send size={16} />
                        Passed
                        <span className="font-medium text-gray-700">
                            {monthlyMetCount}
                        </span>
                    </button>

                </div>



                {/* Referral List */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20">
                            <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : referrals.length === 0 ? (
                        <p className="col-span-full text-center text-gray-500 py-20">
                            No referrals found.
                        </p>
                    ) : (
                        referrals.map((ref) => {
                            const status =
                                ref.dealStatus ||
                                (ref.cosmoOrbiter && ref.cosmoOrbiter.dealStatus) ||
                                "Pending";

                            const isRejected =
                                status === "Rejected" || status === "Reject";
                            const isPending = status === "Pending";

                            const getStatusColor = () => {
                                if (status === "Pending")
                                    return "bg-yellow-100 text-yellow-700";
                                if (status === "Deal Lost" || status === "Rejected")
                                    return "bg-red-100 text-red-600";
                                if (status === "Deal Won")
                                    return "bg-green-100 text-green-600";
                                return "bg-blue-100 text-blue-700";
                            };

                            return (
                                <div
                                    key={ref.id}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        {/* <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}
                                        >
                                            {status}
                                        </span> */}

                                        <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
                                            {status === "Deal Won" && <CheckCircle size={14} />}
                                            {status === "Deal Lost" && <XCircle size={14} />}
                                            {status === "Pending" && <Clock size={14} />}
                                            {status === "Hold" && <PauseCircle size={14} />}
                                            {status}
                                        </span>

                                        <div className="text-xs text-gray-500 text-right space-y-1">
                                            <p>{ref.referralId || "-"}</p>
                                            <p>
                                                {ref.timestamp?.toDate
                                                    ? ref.timestamp.toDate().toLocaleString()
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Product / Service */}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {(ref.product && ref.product.name) ||
                                                (ref.service && ref.service.name) ||
                                                "-"}
                                        </h3>

                                        {ref.leadDescription && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                {ref.leadDescription}
                                            </p>
                                        )}
                                    </div>

                                    {/* Business Name & Contact */}
                                    <div className="mb-4">
                                        <p
                                            className={`font-medium text-gray-700 ${activeTab === "my" && isPending ? "blur-sm" : ""
                                                }`}
                                        >
                                            {activeTab === "passed"
                                                ? ref.cosmoOrbiter?.businessName ||
                                                ref.cosmoOrbiter?.name ||
                                                "-"
                                                : ref.orbiter?.businessName ||
                                                ref.orbiter?.name ||
                                                "-"}
                                        </p>

                                        <div
                                            className={`text-sm text-gray-500 space-y-1 mt-2 ${activeTab === "my" && isPending ? "blur-sm" : ""
                                                }`}
                                        >
                                            {activeTab === "passed" ? (
                                                <>
                                                    <p className="flex items-center gap-2">
                                                        <Mail size={16} className="text-gray-400" />
                                                        {ref.cosmoOrbiter?.email}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <Phone size={16} className="text-gray-400" />
                                                        {ref.cosmoOrbiter?.phone}
                                                    </p>
                                                </>
                                            ) : isRejected ? (
                                                <p className="text-xs text-red-500">
                                                    Contact details hidden (Referral Rejected)
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="flex items-center gap-2">
                                                        <Mail size={16} className="text-gray-400" />
                                                        {ref.orbiter?.email}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <Phone size={16} className="text-gray-400" />
                                                        {ref.orbiter?.phone}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reject Reason */}
                                    {ref.rejectReason && (
                                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mb-4">
                                            <strong>Reject Reason:</strong> {ref.rejectReason}
                                        </p>
                                    )}

                                    {/* Status Dropdown */}
                                    {activeTab === "my" && !isPending && !isRejected && (
                                        <div className="mb-4">
                                            <label className="block text-xs text-gray-500 mb-1">
                                                Update Deal Status
                                            </label>
                                            <select
                                                value={status}
                                                onChange={(e) =>
                                                    handleStatusChange(ref, e.target.value)
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            >
                                                {statusOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 mt-auto pt-4">
                                        {activeTab === "my" ? (
                                            isPending ? (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReferral(ref);
                                                            setModalType("accept");
                                                        }}
                                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReferral(ref);
                                                            setModalType("reject");
                                                        }}
                                                        className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <Link
                                                    href={`referrals/${ref.id}`}
                                                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                                >
                                                    View Details
                                                </Link>
                                            )
                                        ) : (
                                            <Link
                                                href={`referrals/${ref.id}`}
                                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                            >
                                                View Details
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {modalType === "accept" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">

                        <h2 className="text-lg font-semibold mb-2">
                            Accept Referral?
                        </h2>

                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to accept this referral?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setModalType(null)}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm rounded-lg border"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmAccept}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white flex items-center gap-2"
                            >
                                {actionLoading && (
                                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalType === "reject" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">

                        <h2 className="text-lg font-semibold mb-2 text-red-600">
                            Reject Referral
                        </h2>

                        <p className="text-sm text-gray-500 mb-3">
                            Please provide a reason for rejection.
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full border rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-red-400"
                        />

                        {!rejectReason.trim() && (
                            <p className="text-xs text-red-500 mb-3">
                                Reason is required
                            </p>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setModalType(null);
                                    setRejectReason("");
                                }}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm rounded-lg border"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmReject}
                                disabled={actionLoading || !rejectReason.trim()}
                                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white flex items-center gap-2"
                            >
                                {actionLoading && (
                                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                Reject
                            </button>
                        </div>

                    </div>
                </div>
            )}

            <>
                {/* Backdrop */}
                <div
                    onClick={() => setFilterOpen(false)}
                    className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-90 transition-opacity duration-300
      ${filterOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}
    `}
                />

                {/* Bottom Sheet */}
                <div
                    className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-99 md:hidden
      transform transition-transform duration-300 ease-out
      ${filterOpen ? "translate-y-0" : "translate-y-full"}
    `}
                >
                    {/* Drag Handle */}
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">Filters</h2>
                        <button onClick={() => setFilterOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-500 block mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search business name..."
                            className="w-full border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Status */}
                    <div className="mb-6">
                        <label className="text-xs text-gray-500 block mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border rounded-xl px-4 py-2 text-sm"
                        >
                            <option value="All">All Status</option>
                            {statusOptions.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setFilterOpen(false)}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium"
                    >
                        Apply Filters
                    </button>
                </div>
            </>

            <button
                onClick={() => setFilterOpen(true)}
                className="fixed bottom-26 right-6 md:hidden bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 z-40"
            >
                <SlidersHorizontal size={20} />
            </button>
        </main>


    );


};

export default UserReferrals;
