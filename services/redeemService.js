import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

const CC_REDEMPTION_COLLECTION = "CCRedemption";
const CC_REFERRAL_COLLECTION = "CCReferral";

function normalizeNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function normalizeTimestamp(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getUserRoleFromCategory(category) {
  const normalized = String(category || "").toLowerCase();

  if (normalized.includes("cosmo")) return "CosmoOrbiter";
  if (normalized.includes("ujustbe") || normalized === "admin") return "UJustBe";
  if (normalized.includes("orbiter")) return "Orbiter";
  return "";
}

export function getOriginalPercent(item) {
  if (!item?.agreedValue) return 0;

  if (
    item.agreedValue.mode === "single" &&
    item.agreedValue.single?.type === "percentage"
  ) {
    return normalizeNumber(item.agreedValue.single.value);
  }

  if (
    item.agreedValue.mode === "multiple" &&
    item.agreedValue.multiple?.slabs?.length
  ) {
    return normalizeNumber(item.agreedValue.multiple.slabs[0]?.value);
  }

  return 0;
}

export function getAveragePercent(items = []) {
  const percents = items.map(getOriginalPercent).filter((value) => value > 0);

  if (!percents.length) {
    return 0;
  }

  return Math.round(
    percents.reduce((sum, value) => sum + value, 0) / percents.length
  );
}

export async function fetchRedeemUserProfile(ujbCode) {
  if (!ujbCode) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.userDetail, ujbCode));
  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    id: snap.id,
    ujbCode: data.UJBCode || ujbCode,
    name: data.Name || "",
    phone: data.MobileNo || "",
    email: data.Email || "",
    category: data.Category || "",
    services: Array.isArray(data.services) ? data.services : [],
    products: Array.isArray(data.products) ? data.products : [],
    agreementAccepted: data.ccRedemptionAgreementAccepted === true,
  };
}

export async function acceptRedeemAgreement(ujbCode) {
  await updateDoc(doc(db, COLLECTIONS.userDetail, ujbCode), {
    ccRedemptionAgreementAccepted: true,
    ccRedemptionAgreementAcceptedAt: serverTimestamp(),
  });
}

export async function submitRedeemRequest({
  profile,
  mode,
  selectedItem,
  multipleItems,
  originalPercent,
  enhanceRequired,
  enhancedPercent,
  finalPercent,
}) {
  const payload = {
    requestedBy: profile.ujbCode,
    cosmo: {
      Name: profile.name,
      MobileNo: profile.phone,
      Email: profile.email,
      ujbCode: profile.ujbCode,
    },
    mode,
    selectedItem: mode === "single" ? selectedItem : null,
    multipleItems: mode === "multiple" ? multipleItems : [],
    allItems: mode === "all",
    agreedPercentage: {
      originalPercent: normalizeNumber(originalPercent),
      enhancementApplied: enhanceRequired,
      enhancedPercent:
        enhanceRequired === "YES" ? normalizeNumber(enhancedPercent) : 0,
      finalAgreedPercent:
        enhanceRequired === "YES"
          ? normalizeNumber(finalPercent)
          : normalizeNumber(originalPercent),
    },
    status: "Requested",
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, CC_REDEMPTION_COLLECTION), payload);
  return ref.id;
}

export async function fetchAllRedeemUsers() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.userDetail));

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      ujbCode: data.UJBCode || docSnap.id,
      name: data.Name || "",
      phone: data.MobileNo || "",
      email: data.Email || "",
      category: data.Category || "",
      services: Array.isArray(data.services) ? data.services : [],
      products: Array.isArray(data.products) ? data.products : [],
    };
  });
}

export async function createApprovedRedeemDeal({
  user,
  category,
  mode,
  selectedItem,
  multipleItems,
  originalPercent,
  enhanceRequired,
  enhancedPercent,
  finalPercent,
  minPoints,
  maxPoints,
}) {
  const payload = {
    requestedBy: user.ujbCode,
    cosmo: {
      Name: user.name,
      MobileNo: user.phone,
      Email: user.email,
      ujbCode: user.ujbCode,
    },
    category,
    redemptionCategory: category,
    mode,
    selectedItem: mode === "single" ? selectedItem : null,
    multipleItems: mode === "multiple" ? multipleItems : [],
    allItems: mode === "all",
    agreedPercentage: {
      originalPercent: normalizeNumber(originalPercent),
      enhancementApplied: enhanceRequired,
      enhancedPercent:
        enhanceRequired === "YES" ? normalizeNumber(enhancedPercent) : 0,
      finalAgreedPercent:
        enhanceRequired === "YES"
          ? normalizeNumber(finalPercent)
          : normalizeNumber(originalPercent),
    },
    redeemPointsRequired: {
      minPoints: normalizeNumber(minPoints),
      maxPoints: normalizeNumber(maxPoints),
    },
    modelLocked: true,
    status: "Approved",
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, CC_REDEMPTION_COLLECTION), payload);
  return ref.id;
}

export async function fetchRedeemDeals() {
  const snapshot = await getDocs(
    query(collection(db, CC_REDEMPTION_COLLECTION), orderBy("createdAt", "desc"))
  );

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function approveRedeemDeal(id, category) {
  await updateDoc(doc(db, CC_REDEMPTION_COLLECTION, id), {
    status: "Approved",
    redemptionCategory: category,
    category,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectRedeemDeal(id) {
  await updateDoc(doc(db, CC_REDEMPTION_COLLECTION, id), {
    status: "Rejected",
    updatedAt: serverTimestamp(),
  });
}

export async function updateRedeemDeal(id, payload) {
  await updateDoc(doc(db, CC_REDEMPTION_COLLECTION, id), {
    redemptionCategory: payload.category,
    category: payload.category,
    agreedPercentage: {
      originalPercent: normalizeNumber(payload.originalPercent),
      enhancementApplied: payload.enhancedPercent > 0 ? "YES" : "NO",
      enhancedPercent: normalizeNumber(payload.enhancedPercent),
      finalAgreedPercent: normalizeNumber(payload.finalPercent),
    },
    redeemPointsRequired: {
      minPoints: normalizeNumber(payload.minPoints),
      maxPoints: normalizeNumber(payload.maxPoints),
    },
    updatedAt: serverTimestamp(),
  });
}

export async function fetchUserPayments({ ujbCode, category }) {
  if (!ujbCode) {
    return { payments: [], totalReceived: 0, role: "" };
  }

  let resolvedCategory = category;

  if (!resolvedCategory) {
    const userSnap = await getDoc(doc(db, COLLECTIONS.userDetail, ujbCode));
    if (userSnap.exists()) {
      resolvedCategory = userSnap.data()?.Category || "";
    }
  }

  const role = getUserRoleFromCategory(resolvedCategory);
  const collectionsToScan = [COLLECTIONS.referral, CC_REFERRAL_COLLECTION];

  const snapshots = await Promise.all(
    collectionsToScan.map((name) => getDocs(collection(db, name)))
  );

  const payments = [];

  snapshots.forEach((snapshot, index) => {
    const sourceCollection = collectionsToScan[index];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const orbiterUjb = data?.orbiter?.ujbCode || data?.orbiterUJBCode;
      const cosmoUjb =
        data?.cosmoOrbiter?.ujbCode || data?.cosmo?.ujbCode || data?.requestedBy;

      const userIsOrbiter = ujbCode === orbiterUjb;
      const userIsCosmo = ujbCode === cosmoUjb;
      const userIsUjb = role === "UJustBe";

      if (!Array.isArray(data.payments)) return;

      data.payments.forEach((payment, paymentIndex) => {
        const normalizedDate = normalizeTimestamp(payment.paymentDate);
        const stablePaymentId =
          payment.transactionRef ||
          normalizedDate?.toISOString() ||
          `payment-${paymentIndex}`;

        const isSender =
          (userIsOrbiter && payment.paymentFrom === "Orbiter") ||
          (userIsCosmo && payment.paymentFrom === "CosmoOrbiter") ||
          (userIsUjb && payment.paymentFrom === "UJustBe");

        const isReceiver =
          (userIsOrbiter && payment.paymentTo === "Orbiter") ||
          (userIsCosmo && payment.paymentTo === "CosmoOrbiter") ||
          (userIsUjb && payment.paymentTo === "UJustBe");

        if (!isSender && !isReceiver) return;

        payments.push({
          id: `${docSnap.id}-${stablePaymentId}`,
          referralId: payment.referralId || docSnap.id,
          sourceCollection,
          paymentFrom: payment.paymentFrom || "-",
          paymentFromName: payment.paymentFromName || "-",
          paymentTo: payment.paymentTo || "-",
          paymentToName: payment.paymentToName || "-",
          amountReceived: normalizeNumber(payment.amountReceived),
          adjustedAmount: normalizeNumber(payment.adjustedAmount),
          actualReceived: normalizeNumber(payment.actualReceived),
          modeOfPayment: payment.modeOfPayment || "-",
          paymentDate: normalizedDate,
          paymentDateLabel: formatPaymentDate(payment.paymentDate),
          feeType: payment.feeType || "-",
          transactionRef: payment.transactionRef || "-",
        });
      });
    });
  });

  payments.sort((left, right) => {
    const leftTime = left.paymentDate?.getTime?.() || 0;
    const rightTime = right.paymentDate?.getTime?.() || 0;
    return rightTime - leftTime;
  });

  const totalReceived = payments.reduce(
    (sum, payment) => sum + normalizeNumber(payment.actualReceived),
    0
  );

  return { payments, totalReceived, role };
}

export function formatPaymentDate(value) {
  const date = normalizeTimestamp(value);
  return date ? date.toLocaleDateString("en-GB") : "N/A";
}
