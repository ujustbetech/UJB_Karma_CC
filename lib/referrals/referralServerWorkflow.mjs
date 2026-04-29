import {
  buildReferralDuplicateKey,
  buildReferralId,
  buildReferralLockId,
  buildReferralNotifications,
  buildReferralWritePayload,
  normalizeReferralItem,
} from "./referralWorkflow.mjs";
import {
  buildReferralStatusUpdatePayload,
  validateReferralCreationRequest,
  validateReferralStatusUpdate,
} from "./referralMutationWorkflow.mjs";
import { REFERRAL_STATUSES } from "./referralStates.mjs";
import {sanitizeForFirestore} from "../../utils/sanitizeForFirestore.js";

const DEFAULT_REFERRAL_LAST_NUMBER = 2999;
const REFERRAL_COUNTER_COLLECTION = "counters";
const REFERRAL_COUNTER_DOC = "referral";
const REFERRAL_LOCKS_COLLECTION = "referralLocks";

function normalizeUjbCode(value) {
  return String(value || "").trim();
}

function getDocData(snapshot) {
  if (!snapshot) {
    return null;
  }

  return typeof snapshot.data === "function" ? snapshot.data() : snapshot.data;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function buildUserProfileSummary(profile, fallback = {}) {
  if (!profile) {
    return fallback;
  }

  return {
    ...fallback,
    ...profile,
    ujbCode:
      profile.ujbCode ||
      profile.UJBCode ||
      fallback.ujbCode ||
      fallback.UJBCode ||
      "",
    name: profile.name || profile.Name || fallback.name || "",
    phone: profile.phone || profile.MobileNo || fallback.phone || "",
    email: profile.email || profile.Email || fallback.email || "",
    mentorName:
      profile.mentorName || profile.MentorName || fallback.mentorName || "",
    mentorUJBCode:
      profile.mentorUJBCode || profile.MentorUJBCode || fallback.mentorUJBCode || "",
    mentorResidentStatus:
      profile.mentorResidentStatus ||
      profile.MentorResidentStatus ||
      fallback.mentorResidentStatus ||
      "Resident",
    residentStatus:
      profile.residentStatus ||
      profile.ResidentStatus ||
      fallback.residentStatus ||
      "Resident",
  };
}

function mergeParticipant(participant, profile) {
  return buildUserProfileSummary(profile, participant || {});
}

function buildPaymentIdentity(payment, index = 0) {
  return (
    payment?.paymentId ||
    payment?.meta?.paymentId ||
    payment?.transactionRef ||
    `payment-${index}`
  );
}

function dedupePayments(paymentList = []) {
  const seen = new Set();

  return paymentList.filter((payment, index) => {
    const identity = buildPaymentIdentity(payment, index);

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
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
  provider,
  adminDb,
  referralCollectionName,
  referralId,
  nextStatus,
  rejectReason = "",
}) {
  const referral = provider
    ? await provider.referrals.getById(referralId)
    : null;

  if (!provider) {
    const referralRef = adminDb.collection(referralCollectionName).doc(referralId);
    const referralSnap = await referralRef.get();

    if (!referralSnap.exists) {
      const error = new Error("Referral not found");
      error.status = 404;
      throw error;
    }
  }

  const currentReferral =
    referral ||
    getDocData(
      await adminDb.collection(referralCollectionName).doc(referralId).get()
    );

  if (!currentReferral) {
    const error = new Error("Referral not found");
    error.status = 404;
    throw error;
  }

  const validation = validateReferralStatusUpdate({
    currentStatus:
      currentReferral.dealStatus ||
      currentReferral.status ||
      REFERRAL_STATUSES.PENDING,
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

  const update = {
    ...payload,
    statusLogs: [
      ...(Array.isArray(currentReferral.statusLogs)
        ? currentReferral.statusLogs
        : []),
      payload.statusLogs[0],
    ],
  };

  if (provider) {
    return provider.referrals.updateById(referralId, update);
  }

  const referralRef = adminDb.collection(referralCollectionName).doc(referralId);
  await referralRef.set(update, { merge: true });

  const updatedSnap = await referralRef.get();
  return {
    id: updatedSnap.id,
    ...getDocData(updatedSnap),
  };
}

export async function fetchAdminReferralDetail({ provider, id }) {
  const referral = await provider.referrals.getById(id);

  if (!referral) {
    return null;
  }

  const [orbiterProfile, cosmoProfile] = await Promise.all([
    referral.orbiter?.ujbCode
      ? provider.users.getByUjbCode(referral.orbiter.ujbCode)
      : null,
    referral.cosmoOrbiter?.ujbCode
      ? provider.users.getByUjbCode(referral.cosmoOrbiter.ujbCode)
      : null,
  ]);

  return {
    referral,
    orbiter: mergeParticipant(referral.orbiter, orbiterProfile),
    cosmoOrbiter: mergeParticipant(referral.cosmoOrbiter, cosmoProfile),
  };
}

export async function saveAdminReferralDealLog({
  provider,
  referral,
  id,
  distribution,
}) {
  const nextLog = sanitizeForFirestore({
    ...distribution,
    dealStatus: referral?.dealStatus || "Deal Won",
    timestamp: new Date().toISOString(),
    lastDealCalculatedAt: new Date().toISOString(),
  });
  const existingLogs = Array.isArray(referral.dealLogs) ? referral.dealLogs : [];

  return provider.referrals.updateById(id, {
    dealLogs: [...existingLogs, nextLog],
    lastDealCalculatedAt: new Date().toISOString(),
    agreedTotal: nextLog.agreedAmount,
    dealValue: nextLog.dealValue,
  });
}

export async function replaceAdminReferralFollowups({
  provider,
  id,
  followups,
}) {
  return provider.referrals.updateById(id, {
    followups: sanitizeForFirestore(followups || []),
  });
}

export async function attachAdminReferralFile({
  provider,
  referral,
  id,
  type,
  url,
  name,
}) {
  const existing = Array.isArray(referral.supportingDocs)
    ? referral.supportingDocs
    : [];

  return provider.referrals.updateById(id, {
    supportingDocs: [
      ...existing,
      sanitizeForFirestore({
        url,
        name,
        type,
        uploadedAt: Date.now(),
      }),
    ],
  });
}

export async function deleteAdminReferralFile({
  provider,
  referral,
  id,
  url,
  type,
}) {
  const existing = Array.isArray(referral.supportingDocs)
    ? referral.supportingDocs
    : [];

  return provider.referrals.updateById(id, {
    supportingDocs: existing.filter(
      (entry) =>
        !(String(entry?.url || "") === String(url || "") && String(entry?.type || "") === String(type || ""))
    ),
  });
}

export async function recordAdminReferralCosmoPayment({
  provider,
  referral,
  id,
  entry,
}) {
  const existingPayments = Array.isArray(referral.payments) ? referral.payments : [];
  const nextPayments = dedupePayments([
    ...existingPayments,
    sanitizeForFirestore(entry),
  ]);
  const nextUjbBalance =
    toNumber(referral.ujbBalance, 0) + toNumber(entry.amountReceived, 0);
  const nextTdsReceivable =
    toNumber(referral.tdsReceivable, 0) + toNumber(entry.tdsAmount, 0);

  return provider.referrals.updateById(id, {
    payments: nextPayments,
    ujbBalance: nextUjbBalance,
    tdsReceivable: nextTdsReceivable,
  });
}

export async function recordAdminReferralUjbPayout({
  provider,
  referral,
  id,
  entry,
  recipientField,
}) {
  const existingPayments = Array.isArray(referral.payments) ? referral.payments : [];
  const nextPayments = dedupePayments([
    ...existingPayments,
    sanitizeForFirestore(entry),
  ]);
  const nextUjbBalance =
    toNumber(referral.ujbBalance, 0) - toNumber(entry.amountReceived, 0);
  const nextRecipientTotal =
    toNumber(referral[recipientField], 0) +
    toNumber(entry.meta?.logicalAmount, 0);

  return provider.referrals.updateById(id, {
    payments: nextPayments,
    ujbBalance: nextUjbBalance,
    [recipientField]: nextRecipientTotal,
  });
}

export function getReferralParticipantRole({ referral, sessionUjbCode }) {
  const actorCode = normalizeUjbCode(sessionUjbCode);

  if (!actorCode) {
    return null;
  }

  const cosmoCode = normalizeUjbCode(
    referral?.cosmoUjbCode || referral?.cosmoOrbiter?.ujbCode
  );
  const orbiterCode = normalizeUjbCode(
    referral?.orbiterUJBCode ||
      referral?.orbiter?.ujbCode ||
      referral?.orbiter?.UJBCode
  );

  if (actorCode === cosmoCode) {
    return "cosmo";
  }

  if (actorCode === orbiterCode) {
    return "orbiter";
  }

  return null;
}

export function canUserUpdateReferralStatus({ referral, sessionUjbCode }) {
  const role = getReferralParticipantRole({ referral, sessionUjbCode });
  return role === "cosmo" || role === "orbiter";
}
