import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { publicEnv } from "@/lib/config/publicEnv";
import { adminDb } from "@/lib/firebase/firebaseAdmin";

const collections = publicEnv.collections;
const ccReferralCollectionName = "CCReferral";
const redemptionCollectionName = "CCRedeem";
const maxNotifications = 40;

function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(value) {
  const date = toDateValue(value);
  if (!date) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeNotification(item) {
  const createdAt = item.createdAt || new Date(0);
  return {
    ...item,
    createdAt: createdAt.toISOString(),
    createdAtLabel: formatDateLabel(createdAt),
  };
}

function dedupeNotifications(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

async function fetchReferralNotifications(ujbCode) {
  if (!ujbCode) return [];

  const referralCollection = adminDb.collection(collections.referral);
  const ccReferralCollection = adminDb.collection(ccReferralCollectionName);
  const [myReferrals, passedReferrals, myCc, passedCc] = await Promise.all([
    referralCollection.where("cosmoOrbiter.ujbCode", "==", ujbCode).get(),
    referralCollection.where("orbiter.ujbCode", "==", ujbCode).get(),
    ccReferralCollection.where("cosmoOrbiter.ujbCode", "==", ujbCode).get(),
    ccReferralCollection.where("orbiter.ujbCode", "==", ujbCode).get(),
  ]);

  const items = [];
  const pushNotification = (docSnap, role, sourceCollection) => {
    const data = docSnap.data() || {};
    const status = data.dealStatus || data.status || "Pending";
    const counterpartName =
      role === "received"
        ? data.orbiter?.name || data.orbiter?.businessName || "Orbiter"
        : data.cosmoOrbiter?.name || data.cosmoOrbiter?.businessName || "Cosmo";
    const itemName =
      data.itemName ||
      data.sourceDealTitle ||
      data.selectedItem?.name ||
      data.product?.name ||
      data.service?.name ||
      "your referral";
    const createdAt =
      toDateValue(data.lastUpdated) ||
      toDateValue(data.timestamp) ||
      toDateValue(data.createdAt) ||
      new Date(0);
    const href =
      sourceCollection === ccReferralCollectionName
        ? `/user/ccreferral/${docSnap.id}`
        : `/user/referrals/${docSnap.id}`;

    items.push(
      makeNotification({
        id: `${sourceCollection}-${docSnap.id}-${status}`,
        type: "referral",
        category: status === "Pending" ? "attention" : "update",
        title:
          status === "Pending"
            ? "Referral waiting for action"
            : `Referral status: ${status}`,
        message:
          role === "received"
            ? `${counterpartName} sent you a referral for ${itemName}.`
            : `${counterpartName} updated your referral for ${itemName}.`,
        createdAt,
        href,
      })
    );
  };

  myReferrals.forEach((docSnap) =>
    pushNotification(docSnap, "received", collections.referral)
  );
  passedReferrals.forEach((docSnap) =>
    pushNotification(docSnap, "passed", collections.referral)
  );
  myCc.forEach((docSnap) =>
    pushNotification(docSnap, "received", ccReferralCollectionName)
  );
  passedCc.forEach((docSnap) =>
    pushNotification(docSnap, "passed", ccReferralCollectionName)
  );

  return items;
}

async function fetchProspectNotifications({ ujbCode, phone }) {
  if (!ujbCode && !phone) return [];

  const prospectCollection = adminDb.collection(collections.prospect);
  const [mentoredProspects, contactProspects] = await Promise.all([
    ujbCode
      ? prospectCollection.where("mentorUjbCode", "==", ujbCode).get()
      : Promise.resolve(null),
    phone
      ? prospectCollection.where("orbiterContact", "==", phone).get()
      : Promise.resolve(null),
  ]);

  const items = [];
  [mentoredProspects, contactProspects]
    .filter(Boolean)
    .forEach((snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {};
        items.push(
          makeNotification({
            id: `prospect-${docSnap.id}`,
            type: "prospect",
            category: "prospect",
            title: "Prospect registered",
            message: `${data.prospectName || "A prospect"} was added to your network.`,
            createdAt:
              toDateValue(data.registeredAt) ||
              toDateValue(data.date) ||
              new Date(0),
            href: "/user/prospects",
          })
        );
      });
    });

  return items;
}

async function fetchMeetingNotifications(phone) {
  if (!phone) return [];

  const monthlyMeetings = await adminDb.collection(collections.monthlyMeeting).get();
  const items = [];

  await Promise.all(
    monthlyMeetings.docs.map(async (docSnap) => {
      const meetingData = docSnap.data() || {};
      const registrationSnap = await adminDb
        .collection(collections.monthlyMeeting)
        .doc(docSnap.id)
        .collection("registeredUsers")
        .doc(phone)
        .get();

      if (!registrationSnap.exists) {
        return;
      }

      const meetingTime = toDateValue(meetingData.time);
      if (!meetingTime) {
        return;
      }

      items.push(
        makeNotification({
          id: `meeting-${docSnap.id}`,
          type: "meeting",
          category: meetingTime > new Date() ? "upcoming" : "history",
          title:
            meetingTime > new Date()
              ? "Upcoming monthly meeting"
              : "Monthly meeting attended",
          message: `${meetingData.Eventname || "Monthly meeting"} is linked to your registration.`,
          createdAt: meetingTime,
          href: `/user/monthlymeeting/${docSnap.id}`,
        })
      );
    })
  );

  return items;
}

async function fetchPaymentNotifications({ ujbCode, category }) {
  if (!ujbCode) return [];

  const snapshot = await adminDb
    .collection(redemptionCollectionName)
    .where("UJBCode", "==", ujbCode)
    .get();

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};
      const amount =
        Number(data.ActualReceivedAmount || data.actualReceivedAmount || 0) || 0;
      return makeNotification({
        id: `payment-${docSnap.id}`,
        type: "payment",
        category: "finance",
        title: "Payment activity recorded",
        message: `${data.FeeType || "Payment"} payment of Rs. ${amount.toLocaleString(
          "en-IN"
        )} was recorded.`,
        createdAt:
          toDateValue(data.PaymentDate) ||
          toDateValue(data.createdAt) ||
          new Date(0),
        href: category === "CosmOrbiter" ? "/user/payments" : "/user/redeem",
      });
    })
    .filter(Boolean);
}

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/notifications",
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return jsonError(authResult.message, {
      status: authResult.status,
      code: authResult.code,
    });
  }

  try {
    const ujbCode = String(authResult.context?.ujbCode || "").trim();
    const userSnap = await adminDb.collection(collections.userDetail).doc(ujbCode).get();
    const userData = userSnap.data() || {};
    const phone = String(userData.MobileNo || "").trim();
    const category = String(userData.Category || "").trim();

    const [referrals, prospects, meetings, payments] = await Promise.all([
      fetchReferralNotifications(ujbCode),
      fetchProspectNotifications({ ujbCode, phone }),
      fetchMeetingNotifications(phone),
      fetchPaymentNotifications({ ujbCode, category }),
    ]);

    const notifications = dedupeNotifications([
      ...referrals,
      ...prospects,
      ...meetings,
      ...payments,
    ])
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
      .slice(0, maxNotifications);

    return jsonSuccess({ notifications });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/notifications",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to load notifications", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


