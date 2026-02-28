"use client";

import { useEffect, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";

import { app } from "@/firebaseConfig";
import toast from "react-hot-toast";
import { COLLECTIONS } from "@/lib/utility_collection";
import { Search } from "lucide-react";

const db = getFirestore(app);

const DealsForYou = () => {
  const [deals, setDeals] = useState([]);
  const [orbiterDetails, setOrbiterDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [alternate, setAlternate] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [leadDescription, setLeadDescription] = useState("");

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const stored = localStorage.getItem("mmUJBCode");
    if (!stored) return;

    const load = async () => {
      const snap = await getDoc(
        doc(db, COLLECTIONS.userDetail, stored)
      );

      if (!snap.exists()) return;

      const data = snap.data();
      setOrbiterDetails({
        name: data.Name,
        phone: data.MobileNo,
        email: data.Email,
        ujbCode: data.UJBCode,
      });
    };

    load();
  }, []);

  /* ================= FETCH DEALS ================= */
  useEffect(() => {
    const fetchDeals = async () => {
      const snapshot = await getDocs(collection(db, "CCRedemption"));

      const approved = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => d.status === "Approved");

      setDeals(approved);
    };

    fetchDeals();
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (!search) {
      setFiltered([]);
      setAlternate([]);
      return;
    }

    const match = deals.filter((d) => {
      const items = [
        ...(d.selectedItem ? [d.selectedItem] : []),
        ...(d.multipleItems || []),
      ];

      return items.some((i) =>
        i?.name?.toLowerCase().includes(search.toLowerCase())
      );
    });

    if (match.length > 0) {
      setFiltered(match);
      setAlternate([]);
    } else {
      setAlternate(deals.slice(0, 5));
      setFiltered([]);
    }
  }, [search, deals]);

  const openReferralModal = (deal) => {
    setSelectedDeal(deal);
    setModalOpen(true);
  };

  const handlePassReferral = async () => {
    if (!leadDescription.trim()) {
      toast.error("Enter Requirement");
      return;
    }

    try {
      await addDoc(collection(db, "CCReferral"), {
        referralSource: "CC",
        status: "Pending",
        createdAt: new Date(),
        orbiter: orbiterDetails,
        category: selectedDeal.redemptionCategory || null,
        itemName:
          selectedDeal.selectedItem?.name ||
          selectedDeal.multipleItems?.map((i) => i.name).join(", "),
        itemImage:
          selectedDeal.selectedItem?.imageURL ||
          selectedDeal.multipleItems?.[0]?.imageURL,
        leadRequirement: leadDescription,
      });

      toast.success("Referral Passed Successfully");
      setModalOpen(false);
      setLeadDescription("");
      setSelectedDeal(null);
    } catch (err) {
      toast.error("Error Passing Referral");
    }
  };

  const renderCard = (deal) => {
    const name =
      deal.selectedItem?.name ||
      deal.multipleItems?.map((i) => i.name).join(", ");

    const desc =
      deal.selectedItem?.description ||
      deal.multipleItems?.map((i) => i.description).join(", ");

    const img =
      deal.selectedItem?.imageURL ||
      deal.multipleItems?.[0]?.imageURL;

    return (
      <div
        key={deal.id}
        onClick={() => openReferralModal(deal)}
        className="bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition duration-300 cursor-pointer overflow-hidden"
      >
        {img && (
          <img
            src={img}
            alt={name}
            className="w-full h-52 object-cover"
          />
        )}

        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {name}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {desc}
          </p>

          <p className="text-xs text-indigo-600 font-semibold">
            By {deal.cosmo?.Name}
          </p>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen ">

      {/* PAGE HEADER */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          CC Referral Marketplace
        </h1>

        <div className="relative max-w-md mx-auto">
          <Search
            size={18}
            className="absolute left-4 top-3.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search Product / Service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* DEAL GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

        {!search && deals.map(renderCard)}

        {filtered.length > 0 && filtered.map(renderCard)}

        {alternate.length > 0 && (
          <>
            <div className="col-span-full text-center text-gray-500 mb-4">
              Requested item not available. Showing alternatives.
            </div>
            {alternate.map(renderCard)}
          </>
        )}

      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">

            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {selectedDeal?.selectedItem?.name ||
                selectedDeal?.multipleItems
                  ?.map((i) => i.name)
                  .join(", ")}
            </h3>

            <textarea
              placeholder="Requirement / Location / Timeline"
              value={leadDescription}
              onChange={(e) => setLeadDescription(e.target.value)}
              className="w-full border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={4}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handlePassReferral}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition"
              >
                Submit
              </button>

              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-200 px-6 py-2 rounded-xl hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
};

export default DealsForYou;