"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/context/authContext";
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
  Building2,
} from "lucide-react";

import { useReferral } from "@/hooks/useReferral";
import { useToast } from "@/components/ui/ToastProvider";
import { buildDuplicateKeyFromReferralRecord } from "@/lib/referrals/referralWorkflow.mjs";
import {
  addCosmOrbiterFavorite,
  fetchCosmOrbiterDetails,
  removeCosmOrbiterFavorite,
} from "@/services/cosmorbitersService";

import OfferingCarousel from "@/components/cosmorbiters/OfferingCarousel";
import ServiceDetailModal from "@/components/cosmorbiters/ServiceDetailModal";
import ReferralModal from "@/components/cosmorbiters/ReferralModal";

function BusinessProfileSkeleton() {
  return (
    <main className="min-h-screen bg-gray-100 animate-pulse">
      <div className="relative h-[260px] w-full bg-gray-300" />

      <div className="relative -mt-12">
        <div className="bg-white rounded-t-3xl shadow-xl pt-16 px-4 pb-28">
          <div className="absolute left-1/2 -translate-x-1/2 -top-10">
            <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-white" />
          </div>

          <div className="text-center mt-2">
            <div className="h-5 w-40 bg-gray-300 mx-auto rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 mx-auto rounded" />
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
            <div className="h-6 w-24 bg-gray-200 rounded-full" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>

          <div className="grid grid-cols-4 mt-6 gap-4 text-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-10 bg-gray-300 mx-auto rounded" />
                <div className="h-3 w-16 bg-gray-200 mx-auto rounded" />
              </div>
            ))}
          </div>

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

  const { submitReferral, loading: referralSubmitting } = useReferral();
  const toast = useToast();
  const { user: sessionUser } = useAuth();
  const currentUserUjbCode = sessionUser?.profile?.ujbCode;

  const [userDetails, setUserDetails] = useState(null);
  const [orbiterDetails, setOrbiterDetails] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("about");
  const [scrollY] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [existingReferrals, setExistingReferrals] = useState([]);
  const isSelfReferralBlocked =
    Boolean(currentUserUjbCode) &&
    Boolean(userDetails?.ujbCode) &&
    currentUserUjbCode === userDetails.ujbCode;
  const canPassReferral =
    !isSelfReferralBlocked &&
    !referralSubmitting &&
    Boolean(orbiterDetails) &&
    (services.length > 0 || products.length > 0);
  const existingDuplicateLookup = useMemo(
    () =>
      new Set(
        existingReferrals
          .map((referral) => referral.duplicateKey || buildDuplicateKeyFromReferralRecord(referral))
          .filter(Boolean)
      ),
    [existingReferrals]
  );

  useEffect(() => {
    if (!id) return;

    const loadDetails = async () => {
      try {
        const data = await fetchCosmOrbiterDetails(id);
        setUserDetails(data.business || null);
        setOrbiterDetails(data.orbiter || null);
        setServices(data.services || []);
        setProducts(data.products || []);
        setIsFavorite(Boolean(data.isFavorite));
        setReferralCount(Number(data.referralCount || 0));
        setExistingReferrals(data.existingReferrals || []);
      } catch (error) {
        console.error("Failed to load CosmOrbiter details:", error);
      }
    };

    loadDetails();
  }, [id, currentUserUjbCode]);

  const handlePassReferral = async (payload) => {
    try {
      if (!orbiterDetails) {
        toast.error("Orbiter not found");
        return;
      }

      if (isSelfReferralBlocked) {
        toast.error("You cannot pass a referral to yourself.");
        return;
      }

      const referralId = await submitReferral({
        ...payload,
        cosmoDetails: userDetails,
        orbiterDetails,
      });

      toast.success(`Referral ${referralId} created`);
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to create referral");
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeCosmOrbiterFavorite(id);
        setIsFavorite(false);
      } else {
        await addCosmOrbiterFavorite(id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  const calculateAverageCommission = () => {
    const allItems = [...services, ...products];
    const percentages = allItems
      .map((item) => {
        const value = item.raw?.agreedValue?.single?.value;
        return value ? Number(value) : null;
      })
      .filter((val) => val !== null && !Number.isNaN(val));

    if (!percentages.length) return 0;
    const total = percentages.reduce((sum, val) => sum + val, 0);
    return Math.round(total / percentages.length);
  };

  const averageCommission = calculateAverageCommission();

  if (!userDetails) return <BusinessProfileSkeleton />;

  return (
    <main className="min-h-screen bg-gray-100 relative">
      <div className="relative h-[260px] w-full overflow-hidden">
        {(userDetails?.profilePic && userDetails.profilePic !== "aEUR") ||
        (userDetails?.logo && userDetails.logo !== "aEUR") ? (
          <img
            src={
              userDetails.profilePic && userDetails.profilePic !== "aEUR"
                ? userDetails.profilePic
                : userDetails.logo
            }
            alt={userDetails.businessName || "Business Image"}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ transform: `translateY(${scrollY * 0.25}px)` }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center"
            style={{ transform: `translateY(${scrollY * 0.25}px)` }}
          >
            <Building2 size={48} className="text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />

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
              className={`transition ${
                isFavorite ? "text-red-500 fill-red-500" : "text-white"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="relative -mt-12">
        <div className="bg-white rounded-t-3xl shadow-xl pt-16 px-4 pb-28">
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-30">
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {userDetails.logo && userDetails.logo !== "aEUR" ? (
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

          <div className="text-center mt-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {userDetails.businessName}
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold border border-green-300">
                <BadgeCheck size={14} />
                Verified
              </span>

              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                <Star size={14} />
                Active Member
              </span>

              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                <Calendar size={14} />
                Since 2026
              </span>

              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold cursor-pointer hover:bg-purple-200 transition">
                <Award size={14} />
                {referralCount || 0} Referrals
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 text-gray-500">
              <MapPin size={14} />
              <p className="text-sm">{userDetails.Locality}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl shadow-inner py-5 px-3 mt-6">
            <div className="grid grid-cols-4 text-center">
              <button
                onClick={() => setActiveTab("services")}
                className="flex flex-col items-center active:scale-95 transition"
              >
                <Briefcase size={18} className="text-orange-500 mb-1" />
                <p className="text-lg font-semibold">{services.length}</p>
                <p className="text-xs text-gray-500">Services</p>
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className="flex flex-col items-center active:scale-95 transition"
              >
                <Package size={18} className="text-blue-500 mb-1" />
                <p className="text-lg font-semibold">{products.length}</p>
                <p className="text-xs text-gray-500">Products</p>
              </button>

              <div className="flex flex-col items-center">
                <CheckCircle size={18} className="text-green-500 mb-1" />
                <p className="text-lg font-semibold text-green-600">Active</p>
                <p className="text-xs text-gray-500">Status</p>
              </div>

              <div className="flex flex-col items-center">
                <Percent size={18} className="text-emerald-600 mb-1" />
                <p className="text-lg font-bold text-emerald-600">
                  {averageCommission || 0}%
                </p>
                <p className="text-xs text-gray-500">Avg Commission</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-4 text-sm">
            <button
              onClick={() => {
                window.location.href = `tel:${userDetails.phone}`;
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-medium active:scale-95 transition"
            >
              <Phone size={16} />
              Call
            </button>

            <a
              href={`https://wa.me/${userDetails.phone}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full font-medium active:scale-95 transition"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>

            {userDetails.website && (
              <a
                href={`https://${userDetails.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-600 underline"
              >
                Website
              </a>
            )}
          </div>

          <div>
            <div className="flex mt-6 bg-gray-100 rounded-full p-1 text-sm">
              {[
                { key: "about", label: "About", icon: <Info size={16} /> },
                {
                  key: "services",
                  label: "Services",
                  icon: <Briefcase size={16} />,
                },
                {
                  key: "products",
                  label: "Products",
                  icon: <Layers size={16} />,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-full transition ${
                    activeTab === tab.key
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

          <div className="mt-6">
            {activeTab === "about" && (
              <div className="space-y-6">
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

                {userDetails.tagline && (
                  <div className="bg-orange-50 p-4 rounded-xl">
                    <p className="text-sm text-orange-600 font-medium text-center">
                      {userDetails.tagline}
                    </p>
                  </div>
                )}

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

                {userDetails.website && userDetails.website !== "aEUR" && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Website
                    </h3>
                    <a
                      href={`https://${userDetails.website}`}
                      target="_blank"
                      rel="noreferrer"
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
          orbiterDetails={orbiterDetails}
          userDetails={userDetails}
          existingDuplicateLookup={existingDuplicateLookup}
          loading={referralSubmitting}
          onClose={() => setModalOpen(false)}
          handlePassReferral={handlePassReferral}
        />
      )}

      <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
        {isSelfReferralBlocked && (
          <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600 shadow-sm">
            You cannot pass a referral to your own profile.
          </p>
        )}
        <button
          onClick={() => setModalOpen(true)}
          disabled={!canPassReferral}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl shadow-xl font-semibold active:scale-95 transition-all duration-200 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {referralSubmitting
            ? "Passing..."
            : isSelfReferralBlocked
              ? "Unavailable"
              : "Pass Referral"}
        </button>
      </div>
    </main>
  );
}


