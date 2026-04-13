import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

const CC_REDEMPTION_COLLECTION = "CCRedemption";
const CC_REFERRAL_COLLECTION = "CCReferral";

function buildDealItems(deal) {
  return [
    ...(deal.selectedItem ? [deal.selectedItem] : []),
    ...(Array.isArray(deal.multipleItems) ? deal.multipleItems : []),
  ];
}

function normalizeDeal(docSnap) {
  const deal = { id: docSnap.id, ...docSnap.data() };
  const items = buildDealItems(deal);

  return {
    ...deal,
    items,
    displayName: items.map((item) => item?.name).filter(Boolean).join(", "),
    displayDescription: items
      .map((item) => item?.description)
      .filter(Boolean)
      .join(" "),
    displayImage: items.find((item) => item?.imageURL)?.imageURL || "",
    searchText: [
      deal.cosmo?.Name,
      deal.redemptionCategory,
      ...items.flatMap((item) => [item?.name, item?.description]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

export async function fetchApprovedCcDeals() {
  const snapshot = await getDocs(collection(db, CC_REDEMPTION_COLLECTION));

  return snapshot.docs
    .map(normalizeDeal)
    .filter((deal) => deal.status === "Approved");
}

export async function fetchApprovedCcDealById(id) {
  const snap = await getDoc(doc(db, CC_REDEMPTION_COLLECTION, id));

  if (!snap.exists()) {
    return null;
  }

  const deal = normalizeDeal(snap);
  return deal.status === "Approved" ? deal : null;
}

export async function fetchUserOrbiterByCode(ujbCode) {
  if (!ujbCode) {
    return null;
  }

  const snap = await getDoc(doc(db, COLLECTIONS.userDetail, ujbCode));

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();
  return {
    ujbCode: data.UJBCode || ujbCode,
    name: data.Name || "",
    phone: data.MobileNo || "",
    email: data.Email || "",
    mentorName: data.mentorName || data.MentorName || "",
    mentorUJBCode: data.mentorUJBCode || data.MentorUJBCode || "",
    mentorResidentStatus:
      data.mentorResidentStatus || data.MentorResidentStatus || "Resident",
    residentStatus: data.residentStatus || data.ResidentStatus || "Resident",
  };
}

export async function createCcReferral({
  deal,
  orbiter,
  leadDescription,
}) {
  const cosmo = deal?.cosmo || {};
  const firstItem = deal?.items?.[0] || {};

  const payload = {
    referralId: `CCR-${Date.now()}`,
    referralSource: "CC",
    referralType: "CCDeal",
    dealStatus: "Pending",
    status: "Pending",
    createdAt: serverTimestamp(),
    timestamp: serverTimestamp(),
    orbiter: orbiter || null,
    orbiterUJBCode: orbiter?.ujbCode || "",
    cosmoOrbiter: {
      name: cosmo.Name || cosmo.name || "",
      phone: cosmo.MobileNo || cosmo.phone || "",
      email: cosmo.Email || cosmo.email || "",
      ujbCode: cosmo.UJBCode || cosmo.ujbCode || "",
      mentorName: cosmo.mentorName || cosmo.MentorName || "",
      mentorUJBCode: cosmo.mentorUJBCode || cosmo.MentorUJBCode || "",
      mentorResidentStatus:
        cosmo.mentorResidentStatus || cosmo.MentorResidentStatus || "Resident",
      residentStatus:
        cosmo.residentStatus || cosmo.ResidentStatus || "Resident",
    },
    leadRequirement: leadDescription,
    category: deal.redemptionCategory || "",
    itemName: deal.displayName || firstItem.name || "",
    itemDescription: deal.displayDescription || firstItem.description || "",
    itemImage: deal.displayImage || firstItem.imageURL || "",
    selectedItem: {
      name: deal.displayName || firstItem.name || "",
      description: deal.displayDescription || firstItem.description || "",
      imageURL: deal.displayImage || firstItem.imageURL || "",
    },
    sourceDealId: deal.id,
    sourceDealTitle: deal.displayName || firstItem.name || "",
    followups: [],
    payments: [],
    dealLogs: [],
    statusLogs: [
      {
        status: "Pending",
        updatedAt: new Date().toISOString(),
      },
    ],
    supportingDocs: [],
    paidToOrbiter: 0,
    paidToOrbiterMentor: 0,
    paidToCosmoMentor: 0,
    ujbBalance: 0,
  };

  const ref = await addDoc(collection(db, CC_REFERRAL_COLLECTION), payload);
  return ref.id;
}

export async function fetchCcReferralById(id) {
  const snap = await getDoc(doc(db, CC_REFERRAL_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
