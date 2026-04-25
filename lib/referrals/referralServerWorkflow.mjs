import {
  buildReferralDuplicateKey,
  buildReferralId,
  buildReferralLockId,
  buildReferralNotifications,
  buildReferralWritePayload,
  normalizeReferralItem,
} from "@/lib/referrals/referralWorkflow.mjs";
import {
  buildReferralStatusUpdatePayload,
  validateReferralCreationRequest,
  validateReferralStatusUpdate,
} from "@/lib/referrals/referralMutationWorkflow.mjs";
import { REFERRAL_STATUSES } from "@/lib/referrals/referralStates.mjs";

const DEFAULT_REFERRAL_LAST_NUMBER = 2999;
const REFERRAL_COUNTER_COLLECTION = "counters";
const REFERRAL_COUNTER_DOC = "referral";
const REFERRAL_LOCKS_COLLECTION = "referralLocks";

function getDocData(snapshot) {
  if (!snapshot) {
    return null;
  }

  return typeof snapshot.data === "function" ? snapshot.data() : snapshot.data;
}

export async function getCanonicalReferralItem({ adminDb, userCollectionName, cosmoUjbCode, selectedItem }) {
  const cosmoSnap = await adminDb.collection(userCollectionName).doc(cosmoUjbCode).get();

  if (!cosmoSnap.exists) {
    const error = new Error("Cosmo profile not found");
    error.status = 404;
    throw error;
  }

  const data = getDocData(cosmoSnap);
  const rawServices = data?.services
    ? Array.isArray(data.services)
      ? data.services
      : Object.values(data.services)
    : [];
  const rawProducts = data?.products
    ? Array.isArray(data.products)
      ? data.products
      : Object.values(data.products)
    : [];
  const label = String(selectedItem?.label || "").trim();

  return (
    rawServices.find((service) => (service.serviceName || service.name) === label) ||
    rawProducts.find((product) => (product.productName || product.name) === label) ||
    selectedItem.raw ||
    selectedItem
  );
}

export async function createReferralRecord({
  adminDb,
  referralCollectionName,
  userCollectionName,
  payload,
}) {
  const canonical = await getCanonicalReferralItem({
    adminDb,
    userCollectionName,
    cosmoUjbCode: payload.cosmoDetails?.ujbCode,
    selectedItem: payload.selectedItem,
  });
  const finalItem = normalizeReferralItem(canonical);
  const duplicateKey = buildReferralDuplicateKey({
    selectedItem: payload.selectedItem,
    finalItem,
    selectedFor: payload.selectedFor,
    otherName: payload.otherName,
    otherPhone: payload.otherPhone,
    otherEmail: payload.otherEmail,
    cosmoDetails: payload.cosmoDetails,
    orbiterDetails: payload.orbiterDetails,
  });
  const lockRef = adminDb
    .collection(REFERRAL_LOCKS_COLLECTION)
    .doc(buildReferralLockId(duplicateKey));
  const duplicateSnap = await lockRef.get();
  const validation = validateReferralCreationRequest({
    payload,
    isDuplicate: duplicateSnap.exists,
  });

  if (!validation.ok) {
    const error = new Error(validation.message);
    error.status = validation.status || 400;
    throw error;
  }

  const notifications = buildReferralNotifications({
    selectedItem: payload.selectedItem,
    orbiterDetails: payload.orbiterDetails,
    cosmoDetails: payload.cosmoDetails,
  });

  return adminDb.runTransaction(async (transaction) => {
    const lockSnap = await transaction.get(lockRef);

    if (lockSnap.exists) {
      const error = new Error("This referral has already been passed.");
      error.status = 409;
      throw error;
    }

    const counterRef = adminDb
      .collection(REFERRAL_COUNTER_COLLECTION)
      .doc(REFERRAL_COUNTER_DOC);
    const counterSnap = await transaction.get(counterRef);
    const storedNumber = counterSnap.exists
      ? Number(getDocData(counterSnap)?.lastNumber)
      : NaN;
    const currentNumber = Number.isFinite(storedNumber)
      ? storedNumber
      : DEFAULT_REFERRAL_LAST_NUMBER;
    const nextNumber = currentNumber + 1;
    const referralId = buildReferralId(nextNumber, new Date());
    const referralRef = adminDb.collection(referralCollectionName).doc();
    const auditTimestamp = new Date();

    transaction.set(
      counterRef,
      { lastNumber: nextNumber },
      { merge: true }
    );
    transaction.set(lockRef, {
      duplicateKey,
      referralDocId: referralRef.id,
      referralId,
      referralSource: payload.referralSource || "User",
      status: REFERRAL_STATUSES.PENDING,
      createdAt: auditTimestamp,
      orbiterUjbCode: payload.orbiterDetails?.ujbCode || "",
      cosmoUjbCode: payload.cosmoDetails?.ujbCode || "",
    });
    transaction.set(
      referralRef,
      buildReferralWritePayload({
        referralId,
        referralSource: payload.referralSource || "User",
        leadDescription: payload.leadDescription,
        selectedFor: payload.selectedFor,
        otherName: payload.otherName,
        otherPhone: payload.otherPhone,
        otherEmail: payload.otherEmail,
        selectedItem: payload.selectedItem,
        finalItem,
        cosmoDetails: payload.cosmoDetails,
        orbiterDetails: payload.orbiterDetails,
        duplicateKey,
        timestampValue: auditTimestamp,
        auditTimestamp,
      })
    );

    if (payload.dealStatus && payload.dealStatus !== REFERRAL_STATUSES.PENDING) {
      transaction.set(
        referralRef,
        {
          dealStatus: payload.dealStatus,
          status: payload.dealStatus,
        },
        { merge: true }
      );
    }

    return {
      id: referralRef.id,
      referralId,
      duplicateKey,
      notifications,
    };
  });
}

export async function updateReferralStatusRecord({
  adminDb,
  referralCollectionName,
  referralId,
  nextStatus,
  rejectReason = "",
}) {
  const referralRef = adminDb.collection(referralCollectionName).doc(referralId);
  const referralSnap = await referralRef.get();

  if (!referralSnap.exists) {
    const error = new Error("Referral not found");
    error.status = 404;
    throw error;
  }

  const referral = getDocData(referralSnap);
  const validation = validateReferralStatusUpdate({
    currentStatus: referral.dealStatus || referral.status || REFERRAL_STATUSES.PENDING,
    nextStatus,
    rejectReason,
  });

  if (!validation.ok) {
    const error = new Error(validation.message);
    error.status = validation.status || 400;
    throw error;
  }

  const now = new Date();
  const payload = buildReferralStatusUpdatePayload({
    nextStatus: validation.nextStatus,
    rejectReason,
    now,
  });

  await referralRef.set(
    {
      ...payload,
      statusLogs: [...(Array.isArray(referral.statusLogs) ? referral.statusLogs : []), payload.statusLogs[0]],
    },
    { merge: true }
  );

  const updatedSnap = await referralRef.get();
  return {
    id: updatedSnap.id,
    ...getDocData(updatedSnap),
  };
}
