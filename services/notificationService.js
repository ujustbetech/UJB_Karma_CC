import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import { fetchUserPayments } from "@/services/redeemService";

const CC_REFERRAL_COLLECTION = "CCReferral";
const MAX_NOTIFICATIONS = 40;

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
  return {
    ...item,
    createdAt: item.createdAt || new Date(0),
    createdAtLabel: formatDateLabel(item.createdAt),
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

  const referralsRef = collection(db, COLLECTIONS.referral);
  const ccReferralsRef = collection(db, CC_REFERRAL_COLLECTION);

  const [myReferralsSnap, passedReferralsSnap, myCcSnap, passedCcSnap] =
    await Promise.all([
      getDocs(query(referralsRef, where("cosmoOrbiter.ujbCode", "==", ujbCode))),
      getDocs(query(referralsRef, where("orbiter.ujbCode", "==", ujbCode))),
      getDocs(query(ccReferralsRef, where("cosmoOrbiter.ujbCode", "==", ujbCode))),
      getDocs(query(ccReferralsRef, where("orbiter.ujbCode", "==", ujbCode))),
    ]);

  const notificationMap = [];

  const pushReferralNotification = (docSnap, role, sourceCollection) => {
    const data = docSnap.data();
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
      toDateValue(data.createdAt);
    const href =
      sourceCollection === CC_REFERRAL_COLLECTION
        ? `/user/ccreferral/${docSnap.id}`
        : `/user/referrals/${docSnap.id}`;

    notificationMap.push(
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

  myReferralsSnap.forEach((docSnap) =>
    pushReferralNotification(docSnap, "received", COLLECTIONS.referral)
  );
  passedReferralsSnap.forEach((docSnap) =>
    pushReferralNotification(docSnap, "passed", COLLECTIONS.referral)
  );
  myCcSnap.forEach((docSnap) =>
    pushReferralNotification(docSnap, "received", CC_REFERRAL_COLLECTION)
  );
  passedCcSnap.forEach((docSnap) =>
    pushReferralNotification(docSnap, "passed", CC_REFERRAL_COLLECTION)
  );

  return notificationMap;
}

async function fetchProspectNotifications({ ujbCode, phone }) {
  if (!ujbCode && !phone) return [];

  const prospectRef = collection(db, COLLECTIONS.prospect);
  const notifications = [];

  const snapshots = await Promise.all([
    ujbCode
      ? getDocs(query(prospectRef, where("mentorUjbCode", "==", ujbCode)))
      : Promise.resolve(null),
    phone
      ? getDocs(query(prospectRef, where("orbiterContact", "==", phone)))
      : Promise.resolve(null),
  ]);

  snapshots
    .filter(Boolean)
    .forEach((snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.push(
          makeNotification({
            id: `prospect-${docSnap.id}`,
            type: "prospect",
            category: "prospect",
            title: "Prospect registered",
            message: `${data.prospectName || "A prospect"} was added to your network.`,
            createdAt: toDateValue(data.registeredAt) || toDateValue(data.date),
            href: "/user/prospects",
          })
        );
      });
    });

  return notifications;
}

async function fetchMeetingNotifications(phone) {
  if (!phone) return [];

  const monthlyMeetingSnap = await getDocs(collection(db, COLLECTIONS.monthlyMeeting));
  const notifications = [];

  await Promise.all(
    monthlyMeetingSnap.docs.map(async (docSnap) => {
      const meetingData = docSnap.data();
      const registrationSnap = await getDoc(
        doc(db, COLLECTIONS.monthlyMeeting, docSnap.id, "registeredUsers", phone)
      );

      if (!registrationSnap.exists()) {
        return;
      }

      const meetingTime = toDateValue(meetingData.time);
      if (!meetingTime) {
        return;
      }

      notifications.push(
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

  return notifications;
}

async function fetchPaymentNotifications({ ujbCode, category }) {
  const result = await fetchUserPayments({ ujbCode, category });

  return result.payments.map((payment) =>
    makeNotification({
      id: `payment-${payment.id}`,
      type: "payment",
      category: "finance",
      title: "Payment activity recorded",
      message: `${payment.feeType} payment of Rs. ${payment.actualReceived.toLocaleString(
        "en-IN"
      )} was recorded.`,
      createdAt: payment.paymentDate,
      href: "/user/payments",
    })
  );
}

export async function fetchUserNotifications({ ujbCode, phone, category }) {
  const [referrals, prospects, meetings, payments] = await Promise.all([
    fetchReferralNotifications(ujbCode),
    fetchProspectNotifications({ ujbCode, phone }),
    fetchMeetingNotifications(phone),
    fetchPaymentNotifications({ ujbCode, category }),
  ]);

  return dedupeNotifications([...referrals, ...prospects, ...meetings, ...payments])
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, MAX_NOTIFICATIONS);
}

export function subscribeUserNotificationSources(
  { ujbCode, phone },
  onChange,
  onError
) {
  const subscriptions = [];

  const handleSnapshotChange = () => {
    if (typeof onChange === "function") {
      onChange();
    }
  };

  const subscribe = (target) => {
    subscriptions.push(
      onSnapshot(
        target,
        () => {
          handleSnapshotChange();
        },
        (error) => {
          if (typeof onError === "function") {
            onError(error);
          }
        }
      )
    );
  };

  const referralsRef = collection(db, COLLECTIONS.referral);
  const ccReferralsRef = collection(db, CC_REFERRAL_COLLECTION);
  const prospectsRef = collection(db, COLLECTIONS.prospect);
  const monthlyMeetingRef = collection(db, COLLECTIONS.monthlyMeeting);

  if (ujbCode) {
    subscribe(query(referralsRef, where("cosmoOrbiter.ujbCode", "==", ujbCode)));
    subscribe(query(referralsRef, where("orbiter.ujbCode", "==", ujbCode)));
    subscribe(query(ccReferralsRef, where("cosmoOrbiter.ujbCode", "==", ujbCode)));
    subscribe(query(ccReferralsRef, where("orbiter.ujbCode", "==", ujbCode)));
    subscribe(query(prospectsRef, where("mentorUjbCode", "==", ujbCode)));
  }

  if (phone) {
    subscribe(query(prospectsRef, where("orbiterContact", "==", phone)));
  }

  subscribe(monthlyMeetingRef);

  return () => {
    subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch {}
    });
  };
}

function getReadStorageKey(ujbCode) {
  return `user-notifications-read:${ujbCode}`;
}

export function getReadNotificationIds(ujbCode) {
  if (typeof window === "undefined" || !ujbCode) return [];

  try {
    const raw = window.localStorage.getItem(getReadStorageKey(ujbCode));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReadNotificationIds(ujbCode, ids) {
  if (typeof window === "undefined" || !ujbCode) return;

  window.localStorage.setItem(getReadStorageKey(ujbCode), JSON.stringify(ids));
}

export function markNotificationAsRead(ujbCode, notificationId) {
  const current = new Set(getReadNotificationIds(ujbCode));
  current.add(notificationId);
  saveReadNotificationIds(ujbCode, Array.from(current));
}

export function markAllNotificationsAsRead(ujbCode, notificationIds) {
  const current = new Set(getReadNotificationIds(ujbCode));
  notificationIds.forEach((id) => current.add(id));
  saveReadNotificationIds(ujbCode, Array.from(current));
}
