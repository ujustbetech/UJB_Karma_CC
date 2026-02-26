"use client";

import { useEffect, useState, useRef, } from "react";
import { useParams, useRouter } from "next/navigation";


import {
    ArrowLeft,
    Heart,
    MapPin,
    BadgeCheck,
    Star,
    Calendar,
    Briefcase,
    Package,
    CheckCircle,
    Percent,
    Phone,
    MessageCircle,
    Award,
    Info,
    Layers,
    Building2
} from "lucide-react";

import { useReferral } from "@/hooks/useReferral";
import { useToast } from "@/components/ui/ToastProvider";

import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { app } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

import OfferingCarousel from "@/components/cosmorbiters/OfferingCarousel";
import ServiceDetailModal from "@/components/cosmorbiters/ServiceDetailModal";
import ReferralModal from "@/components/cosmorbiters/ReferralModal";

const db = getFirestore(app);

// Loader

function BusinessProfileSkeleton() {
    return (
        <main className="min-h-screen bg-gray-100 animate-pulse">

            {/* HERO SKELETON */}
            <div className="relative h-[260px] w-full bg-gray-300" />

            {/* BOTTOM SHEET */}
            <div className="relative -mt-12">
                <div className="bg-white rounded-t-3xl shadow-xl pt-16 px-4 pb-28">

                    {/* LOGO */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-10">
                        <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-white" />
                    </div>

                    {/* NAME */}
                    <div className="text-center mt-2">
                        <div className="h-5 w-40 bg-gray-300 mx-auto rounded mb-2" />
                        <div className="h-4 w-24 bg-gray-200 mx-auto rounded" />
                    </div>

                    {/* BADGES */}
                    <div className="flex justify-center gap-2 mt-4">
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                        <div className="h-6 w-24 bg-gray-200 rounded-full" />
                        <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-4 mt-6 gap-4 text-center">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-5 w-10 bg-gray-300 mx-auto rounded" />
                                <div className="h-3 w-16 bg-gray-200 mx-auto rounded" />
                            </div>
                        ))}
                    </div>

                    {/* CONTENT */}
                    <div className="mt-8 space-y-4">
                        <div className="h-4 w-full bg-gray-200 rounded" />
                        <div className="h-4 w-5/6 bg-gray-200 rounded" />
                        <div className="h-4 w-4/6 bg-gray-200 rounded" />
                    </div>

                </div>
            </div>
        </main>
    );
}

export default function ReferralDetails() {
    const { id } = useParams();
    const router = useRouter();

    const { submitReferral, loading } = useReferral();
    const toast = useToast();

    const [userDetails, setUserDetails] = useState(null);
    const [orbiterDetails, setOrbiterDetails] = useState(null);
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState("about");
    const [scrollY, setScrollY] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [referralCount, setReferralCount] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    // 🔥 Safely normalize Firestore array/string/null into array
    const normalizeArrayField = (value) => {
        if (!value || value === "—") return [];

        if (Array.isArray(value)) {
            return value.filter(Boolean);
        }

        if (typeof value === "string") {
            return [value];
        }

        return [];
    };



    /* ================= FETCH BUSINESS ================= */
    useEffect(() => {
        if (!id) return;

        const fetchBusiness = async () => {
            const snap = await getDoc(doc(db, COLLECTIONS.userDetail, id));
            if (!snap.exists()) return;

            const data = snap.data();

            setUserDetails({
                name: data.Name || "",
                email: data.Email || "",
                phone: data.MobileNo || "",
                ujbCode: data.UJBCode || "",
                businessName: data.BusinessName || "",
                businessDetails: data.BusinessHistory || "",
                profilePic: data.ProfilePhotoURL || "",
                logo: data.BusinessLogo || "",
                Locality: data.Locality || "",
                tagline: data.TagLine || "",
                category1: data.Category1 || "",
                category2: data.Category2 || "",
                businessStage: data.BusinessStage || "",
                professionType: data.ProfessionType || "",
                skills: data.Skills || [],
                languages: normalizeArrayField(data.LanguagesKnown),
                mentorName: data.MentorName || "",
                mentorPhone: data.MentorPhone || "",
                subscriptionStatus: data.subscription?.status || null,
                subscriptionStart: data.subscription?.startDate || null,
            });


            const rawServices = Object.values(data.services || []);
            const rawProducts = Object.values(data.products || []);




            setServices(
                rawServices.map((s, index) => ({
                    id: `service_${index}`,
                    label: s.name || "",
                    description: s.description || "",
                    imageURL: s.imageURL || "",
                    type: "service",
                    raw: s, // 🔥 important
                }))
            );


            setProducts(
                rawProducts.map((p, index) => ({
                    id: `product_${index}`,
                    label: p.name || "",
                    description: p.description || "",
                    imageURL: p.imageURL || "",
                    type: "product",
                    raw: p, // 🔥 important
                }))
            );
        };

        fetchBusiness();
    }, [id]);

    /* ================= FETCH ORBITER ================= */
    useEffect(() => {
        const storedUjbCode = localStorage.getItem("mmUJBCode");
        if (!storedUjbCode) return;

        const fetchOrbiter = async () => {
            const snap = await getDoc(
                doc(db, COLLECTIONS.userDetail, storedUjbCode)
            );
            if (!snap.exists()) return;

            const data = snap.data();

            setOrbiterDetails({
                name: data.Name || "",
                email: data.Email || "",
                phone: data.MobileNo || "",
                ujbCode: data.UJBCode || "",
                mentorName: data.MentorName || "",
                mentorPhone: data.MentorPhone || "",
            });
        };

        fetchOrbiter();
    }, []);

    /* ================= HANDLE REFERRAL ================= */
    const handlePassReferral = async (payload) => {
        try {
            if (!orbiterDetails) {
                toast.error("Orbiter not found");
                return;
            }

            const referralId = await submitReferral({
                ...payload,
                cosmoDetails: userDetails,
                orbiterDetails,
            });

            toast.success(`Referral ${referralId} created 🚀`);
            setModalOpen(false);

        } catch (error) {
            console.error(error);
            toast.error("Failed to create referral");
        }
    };

    const toggleFavorite = async () => {
        try {
            const storedUjbCode = localStorage.getItem("mmUJBCode");
            if (!storedUjbCode) return;

            const favRef = doc(
                db,
                "favorites",
                `${storedUjbCode}_${userDetails.ujbCode}`
            );

            if (isFavorite) {
                await deleteDoc(favRef);
                setIsFavorite(false);
            } else {
                await setDoc(favRef, {
                    orbiter: storedUjbCode,
                    cosmoUjbCode: userDetails.ujbCode,
                    timestamp: new Date(),
                });
                setIsFavorite(true);
            }

        } catch (err) {
            console.error("Favorite toggle error:", err);
        }
    };

    // Referral Count
    useEffect(() => {
        if (!userDetails?.ujbCode) return;

        const fetchReferralCount = async () => {
            try {
                const q = query(
                    collection(db, COLLECTIONS.referral),
                    where("cosmoUjbCode", "==", userDetails.ujbCode)
                );

                const snapshot = await getDocs(q);
                setReferralCount(snapshot.size);

            } catch (error) {
                console.error("Error fetching referral count:", error);
            }
        };

        fetchReferralCount();
    }, [userDetails?.ujbCode]);

    const calculateAverageCommission = () => {
        const allItems = [...services, ...products];

        const percentages = allItems
            .map((item) => {
                const value = item.raw?.agreedValue?.single?.value;
                return value ? Number(value) : null;
            })
            .filter((val) => val !== null && !isNaN(val));

        if (!percentages.length) return 0;

        const total = percentages.reduce((sum, val) => sum + val, 0);

        return Math.round(total / percentages.length);
    };

    const averageCommission = calculateAverageCommission();

    // favriout
    useEffect(() => {
        if (!userDetails?.ujbCode) return;

        const checkFavorite = async () => {
            try {
                const storedUjbCode = localStorage.getItem("mmUJBCode");
                if (!storedUjbCode) return;

                const favRef = doc(
                    db,
                    "favorites",
                    `${storedUjbCode}_${userDetails.ujbCode}`
                );

                const snap = await getDoc(favRef);

                if (snap.exists()) {
                    setIsFavorite(true);
                } else {
                    setIsFavorite(false);
                }

            } catch (err) {
                console.error("Favorite check error:", err);
            }
        };

        checkFavorite();
    }, [userDetails?.ujbCode]);

    const getMainImage = () => {
        if (
            userDetails?.profilePic &&
            userDetails.profilePic !== "—"
        ) {
            return userDetails.profilePic;
        }

        if (
            userDetails?.logo &&
            userDetails.logo !== "—"
        ) {
            return userDetails.logo;
        }

        return "/space.jpeg"; // put image in public folder
    };


    if (!userDetails) return <BusinessProfileSkeleton />;

    return (
        <main className="min-h-screen bg-gray-100 relative">

            {/* HERO */}
            <div className="relative h-[260px] w-full overflow-hidden">
                {(userDetails?.profilePic && userDetails.profilePic !== "—") ||
                    (userDetails?.logo && userDetails.logo !== "—") ? (
                    <img
                        src={
                            userDetails.profilePic && userDetails.profilePic !== "—"
                                ? userDetails.profilePic
                                : userDetails.logo
                        }
                        alt={userDetails.businessName || "Business Image"}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                        style={{
                            transform: `translateY(${scrollY * 0.25}px)`,
                        }}
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <div
                        className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center"
                        style={{
                            transform: `translateY(${scrollY * 0.25}px)`,
                        }}
                    >
                        <Building2 size={48} className="text-gray-400" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />

                {/* Back + Heart */}
                <div className="absolute top-6 left-4 right-4 flex justify-between text-white z-20">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-md"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <button
                        onClick={toggleFavorite}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-md active:scale-90 transition"
                    >
                        <Heart
                            size={20}
                            className={`transition ${isFavorite ? "text-red-500 fill-red-500" : "text-white"
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* BOTTOM SHEET */}
            <div className="relative -mt-12">
                <div className="bg-white rounded-t-3xl shadow-xl pt-16 px-4 pb-28">

                    {/* LOGO OVERLAP */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-30">
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {userDetails.logo && userDetails.logo !== "—" ? (
                                <img
                                    src={userDetails.logo}
                                    alt="logo"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "/space.jpeg";
                                    }}
                                />
                            ) : (
                                <span className="text-gray-400 text-xl font-semibold">
                                    {userDetails.businessName?.charAt(0) || "B"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* COMPANY NAME */}
                    <div className="text-center mt-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {userDetails.businessName}
                        </h2>
                        {/* BADGES */}
                        <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">

                            {/* Verified */}
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold border border-green-300">
                                <BadgeCheck size={14} />
                                Verified
                            </span>

                            {/* Active Member */}
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                                <Star size={14} />
                                Active Member
                            </span>

                            {/* Since */}
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                                <Calendar size={14} />
                                Since 2026
                            </span>

                            {/* Referrals Count */}
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold cursor-pointer hover:bg-purple-200 transition">
                                <Award size={14} />
                                {referralCount || 0} Referrals
                            </span>

                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1 text-gray-500">
                            <MapPin size={14} />
                            <p className="text-sm">
                                {userDetails.Locality}
                            </p>
                        </div>
                    </div>

                    {/* STATS */}
                    {/* STATS CARD */}
                    <div className="bg-gray-50 rounded-2xl shadow-inner py-5 px-3 mt-6">
                        <div className="grid grid-cols-4 text-center">

                            {/* Services */}
                            <button
                                onClick={() => setActiveTab("services")}
                                className="flex flex-col items-center active:scale-95 transition"
                            >
                                <Briefcase size={18} className="text-orange-500 mb-1" />
                                <p className="text-lg font-semibold">{services.length}</p>
                                <p className="text-xs text-gray-500">Services</p>
                            </button>

                            {/* Products */}
                            <button
                                onClick={() => setActiveTab("products")}
                                className="flex flex-col items-center active:scale-95 transition"
                            >
                                <Package size={18} className="text-blue-500 mb-1" />
                                <p className="text-lg font-semibold">{products.length}</p>
                                <p className="text-xs text-gray-500">Products</p>
                            </button>

                            {/* Status */}
                            <div className="flex flex-col items-center">
                                <CheckCircle size={18} className="text-green-500 mb-1" />
                                <p className="text-lg font-semibold text-green-600">Active</p>
                                <p className="text-xs text-gray-500">Status</p>
                            </div>

                            {/* Avg Commission */}
                            <div className="flex flex-col items-center">
                                <Percent size={18} className="text-emerald-600 mb-1" />
                                <p className="text-lg font-bold text-emerald-600">
                                    {averageCommission || 0}%
                                </p>
                                <p className="text-xs text-gray-500">Avg Commission</p>
                            </div>

                        </div>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="flex justify-center gap-6 mt-4 text-sm">

                        <button
                            onClick={() => window.location.href = `tel:${userDetails.phone}`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-medium active:scale-95 transition"
                        >
                            <Phone size={16} />
                            Call
                        </button>

                        <a
                            href={`https://wa.me/${userDetails.phone}`}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full font-medium active:scale-95 transition"
                        >
                            <MessageCircle size={16} />
                            WhatsApp
                        </a>

                        {/* WEBSITE */}
                        {userDetails.website && (
                            <a
                                href={`https://${userDetails.website}`}
                                target="_blank"
                                className="text-gray-600 underline"
                            >
                                🌐 Website
                            </a>
                        )}

                    </div>

                    {/* TABS */}
                    <div className="sticky top-0">
                        <div className="flex mt-6 bg-gray-100 rounded-full p-1 text-sm">

                            {[
                                { key: "about", label: "About", icon: <Info size={16} /> },
                                { key: "services", label: "Services", icon: <Briefcase size={16} /> },
                                { key: "products", label: "Products", icon: <Layers size={16} /> },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-full transition ${activeTab === tab.key
                                        ? "bg-white shadow text-orange-600 font-semibold"
                                        : "text-gray-500"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}

                        </div>
                    </div>
                    {/* CONTENT */}
                    <div className="mt-6">
                        {activeTab === "about" && (
                            <div className="space-y-6">

                                {/* Description */}
                                {userDetails.businessDetails && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                            About Business
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {userDetails.businessDetails}
                                        </p>
                                    </div>
                                )}

                                {/* Tagline */}
                                {userDetails.tagline && (
                                    <div className="bg-orange-50 p-4 rounded-xl">
                                        <p className="text-sm text-orange-600 font-medium text-center">
                                            "{userDetails.tagline}"
                                        </p>
                                    </div>
                                )}

                                {/* Categories */}
                                {(userDetails.category1 || userDetails.category2) && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                            Categories
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {userDetails.category1 && (
                                                <span className="px-3 py-1 bg-gray-100 text-xs rounded-full">
                                                    {userDetails.category1}
                                                </span>
                                            )}
                                            {userDetails.category2 && (
                                                <span className="px-3 py-1 bg-gray-100 text-xs rounded-full">
                                                    {userDetails.category2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Business Info */}
                                {(userDetails.businessStage || userDetails.professionType) && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                            Business Info
                                        </h3>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            {userDetails.businessStage && (
                                                <p>Stage: {userDetails.businessStage}</p>
                                            )}
                                            {userDetails.professionType && (
                                                <p>Profession: {userDetails.professionType}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Skills */}
                                {userDetails.skills?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                            Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {userDetails.skills.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Languages */}
                                {userDetails.languages?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                            Languages
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {userDetails.languages.map((lang, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Website */}
                                {userDetails.website && userDetails.website !== "—" && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                            Website
                                        </h3>
                                        <a
                                            href={`https://${userDetails.website}`}
                                            target="_blank"
                                            className="text-blue-600 text-sm underline"
                                        >
                                            {userDetails.website}
                                        </a>
                                    </div>
                                )}

                            </div>
                        )}

                        {activeTab === "services" && (
                            <OfferingCarousel
                                items={services}
                                onSelect={(item) => setSelectedItem(item)}
                            />
                        )}

                        {activeTab === "products" && (
                            <OfferingCarousel
                                items={products}
                                onSelect={(item) => setSelectedItem(item)}
                            />
                        )}
                    </div>

                </div>
            </div>

            {selectedItem && (
                <ServiceDetailModal
                    item={selectedItem}
                    phone={userDetails.phone}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {modalOpen && (
                <ReferralModal
                    services={services}
                    products={products}
                    userDetails={userDetails}
                    onClose={() => setModalOpen(false)}
                    handlePassReferral={handlePassReferral} // your existing firestore function
                />
            )}

            {/* PASS REFERRAL */}
            <button
                onClick={() => setModalOpen(true)}
                className="fixed bottom-20 left-6 right-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl shadow-xl font-semibold active:scale-95 transition-all duration-200 hover:shadow-2xl"
            >
                Pass Referral
            </button>

        </main>
    );
}