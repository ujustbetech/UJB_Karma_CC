import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";
import { publicEnv } from "@/lib/config/publicEnv";
import { adminDb } from "@/lib/firebase/firebaseAdmin";

const collections = publicEnv.collections;
const contentCollectionName = "ContentData";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(value) {
  const date = toDate(value);
  return date ? date.toISOString() : null;
}

function getTimeMs(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

function normalizeServiceList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).filter(Boolean);
  return [];
}

function mapMonthlyEvent(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    title: data.Eventname || data.title || "Community Event",
    image: data.image || data.EventImage || data.thumbnail || "",
    time: toIso(data.time),
  };
}

function mapConclaveMeeting(docSnap, conclaveData) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    conclaveId: conclaveData.id,
    title: data.title || data.Eventname || conclaveData.title || "Conclave Meeting",
    image: data.image || conclaveData.image || "",
    time: toIso(data.time),
  };
}

function mapRecentReferral(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: data.cosmoOrbiter?.name || "Orbiter",
    serviceName: data.service?.name || data.serviceName || "Service",
    createdAt: toIso(data.timestamp || data.createdAt),
    status: data.dealStatus || "Pending",
  };
}

function mapNetworkActivity(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    orbiterName: data.cosmoOrbiter?.name || "Orbiter",
    serviceName: data.serviceName || data.service?.name || "a service",
    createdAt: toIso(data.createdAt || data.timestamp),
  };
}

function calculateHomePayload({
  userData,
  allUsers,
  referrals,
  monthlyMeetings,
  conclaves,
  dewdropContents,
  cpActivities,
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const profile = userData || {};
  const currentUjbCode = String(profile.UJBCode || "").trim();
  const currentPhone = String(profile.MobileNo || "").trim();

  const totalOrbiters = allUsers.length;
  const totalCosmOrbiters = allUsers.filter(
    (item) => String(item.Category || "").trim() === "CosmOrbiter"
  ).length;

  let totalBusiness = 0;
  for (const referral of referrals) {
    const data = referral.data() || {};
    const payments = Array.isArray(data.payments) ? data.payments : [];
    for (const payment of payments) {
      if (payment?.paymentFrom === "CosmoOrbiter") {
        const amount = Number.parseFloat(payment?.amountReceived);
        if (!Number.isNaN(amount)) {
          totalBusiness += amount;
        }
      }
    }

    totalBusiness += Number(data.amount || 0);
  }

  const networkOverview = {
    totalOrbiters,
    totalCosmOrbiters,
    totalReferrals: referrals.length,
    totalBusiness,
  };

  const monthlyEvents = monthlyMeetings
    .map(mapMonthlyEvent)
    .filter((item) => item.time)
    .sort((left, right) => getTimeMs(left.time) - getTimeMs(right.time));

  const conclaveEvents = conclaves
    .flatMap((conclave) => {
      const conclaveData = { id: conclave.id, ...(conclave.data() || {}) };
      const meetings = normalizeServiceList(conclaveData.__meetings);
      return meetings.map((meeting) =>
        mapConclaveMeeting(
          {
            id: meeting.id,
            data: () => meeting,
          },
          conclaveData
        )
      );
    })
    .filter((item) => item.time)
    .sort((left, right) => getTimeMs(left.time) - getTimeMs(right.time));

  const recentReferrals = referrals
    .map(mapRecentReferral)
    .sort((left, right) => getTimeMs(right.createdAt) - getTimeMs(left.createdAt))
    .slice(0, 5);

  const userKeywords = [
    profile.Category1,
    profile.Category2,
    ...(Array.isArray(profile.Skills) ? profile.Skills : []),
    ...(Array.isArray(profile.Mastery) ? profile.Mastery : []),
    ...(Array.isArray(profile.InterestArea) ? profile.InterestArea : []),
  ]
    .filter((value) => value && value !== "—")
    .map((value) => String(value).toLowerCase());

  const recommendedServices = [];
  for (const userDoc of allUsers) {
    const services = normalizeServiceList(userDoc.services);
    for (const service of services) {
      if (!service?.name || !service?.description) continue;

      const keywords = Array.isArray(service.keywords)
        ? service.keywords
            .filter(Boolean)
            .map((value) => String(value).trim().toLowerCase())
        : typeof service.keywords === "string"
          ? service.keywords
              .split(",")
              .map((value) => value.trim().toLowerCase())
              .filter(Boolean)
          : [];

      let score = 0;
      const reasons = [];

      if (
        profile.Category1 &&
        keywords.includes(String(profile.Category1).toLowerCase())
      ) {
        score += 6;
        reasons.push(profile.Category1);
      }

      if (
        profile.Category2 &&
        keywords.includes(String(profile.Category2).toLowerCase())
      ) {
        score += 5;
        reasons.push(profile.Category2);
      }

      const matches = keywords.filter((keyword) => userKeywords.includes(keyword));
      if (matches.length > 0) {
        score += matches.length * 2;
        reasons.push(...matches.slice(0, 2));
      }

      if (
        profile.City &&
        userDoc.City &&
        profile.City !== "—" &&
        profile.City === userDoc.City
      ) {
        score += 2;
        reasons.push("Local");
      }

      if (score > 0) {
        recommendedServices.push({
          score,
          businessName: userDoc.BusinessName || "",
          serviceName: service.name,
          description: service.description,
          ujbCode: userDoc.UJBCode || "",
          reason:
            [...new Set(reasons)].slice(0, 2).join(" + ") || "Popular Service",
        });
      }
    }
  }

  recommendedServices.sort((left, right) => right.score - left.score);

  const dewdropStories = dewdropContents
    .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }))
    .filter((item) => item.switchValue === true)
    .sort((left, right) =>
      String(right.AdminCreatedby || "").localeCompare(
        String(left.AdminCreatedby || "")
      )
    )
    .slice(0, 8);

  let totalReferrals = 0;
  let monthlyReferrals = 0;
  for (const referral of referrals) {
    const data = referral.data() || {};
    if (data.cosmoOrbiter?.ujbCode !== currentUjbCode) continue;
    totalReferrals += 1;

    const createdAt = toDate(data.createdAt);
    if (
      createdAt &&
      createdAt.getMonth() === currentMonth &&
      createdAt.getFullYear() === currentYear
    ) {
      monthlyReferrals += 1;
    }
  }

  const totalCP = cpActivities.reduce(
    (sum, item) => sum + (Number(item.points) || 0),
    0
  );

  const performance = {
    totalReferrals,
    monthlyReferrals,
    totalCP,
  };

  const networkActivity = referrals
    .map(mapNetworkActivity)
    .sort((left, right) => getTimeMs(right.createdAt) - getTimeMs(left.createdAt))
    .slice(0, 5);

  const newlyAdded = allUsers
    .slice()
    .sort(
      (left, right) =>
        getTimeMs(right.subscription?.startDate) -
        getTimeMs(left.subscription?.startDate)
    )
    .slice(0, 5)
    .flatMap((item) =>
      normalizeServiceList(item.services).map((service) => ({
        businessName: item.BusinessName || "",
        serviceName: service?.name || "",
        description: service?.description || "",
        ujbCode: item.UJBCode || "",
      }))
    )
    .filter((item) => item.serviceName)
    .slice(0, 4);

  const leaderboardMap = new Map();
  for (const referral of referrals) {
    const data = referral.data() || {};
    const createdAt = toDate(data.createdAt);
    if (
      !createdAt ||
      createdAt.getMonth() !== currentMonth ||
      createdAt.getFullYear() !== currentYear
    ) {
      continue;
    }

    const ujbCode = data.cosmoOrbiter?.ujbCode || "";
    const name = data.cosmoOrbiter?.name || "Orbiter";
    if (!ujbCode) continue;

    const current = leaderboardMap.get(ujbCode) || { name, count: 0 };
    current.count += 1;
    leaderboardMap.set(ujbCode, current);
  }

  const topOrbiters = Array.from(leaderboardMap.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  return {
    agreement: {
      shouldPrompt: profile.agreementAccepted !== true,
      category: profile.Category || "",
      name: profile.Name || profile.BusinessName || "User",
      address: profile.Address || "-",
      city: profile.City || "-",
    },
    networkOverview,
    eventEnrollment: {
      monthlyEvents,
      conclaveEvents,
    },
    recentReferrals,
    recommendedServices: recommendedServices.slice(0, 6),
    dewdropStories,
    performance,
    networkActivity,
    newlyAdded,
    topOrbiters,
    header: {
      cpPoints: totalCP,
      userCategory: profile.Category || "Member",
      profileImage: profile.ProfilePhotoURL || "",
    },
    notificationContext: {
      ujbCode: currentUjbCode,
      phone: currentPhone,
      category: profile.Category || "",
    },
  };
}

export async function GET(req) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/home",
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
    const sessionUjbCode = String(authResult.context?.ujbCode || "").trim();
    const userCollection = adminDb.collection(collections.userDetail);
    const referralCollection = adminDb.collection(collections.referral);
    const monthlyCollection = adminDb.collection(collections.monthlyMeeting);
    const conclaveCollection = adminDb.collection(collections.conclaves);
    const contentCollection = adminDb.collection(contentCollectionName);
    const cpBoardCollection = adminDb.collection("CPBoard");

    const [userSnap, usersSnap, referralsSnap, monthlySnap, conclavesSnap, dewdropSnap] =
      await Promise.all([
      userCollection.doc(sessionUjbCode).get(),
      userCollection.get(),
      referralCollection.get(),
      monthlyCollection.get(),
      conclaveCollection.get(),
      contentCollection.get(),
    ]);

    const conclaves = await Promise.all(
      conclavesSnap.docs.map(async (docSnap) => {
        const meetingsSnap = await conclaveCollection.doc(docSnap.id).collection("meetings").get();
        return {
          id: docSnap.id,
          data: () => ({
            ...docSnap.data(),
            __meetings: meetingsSnap.docs.map((meetingDoc) => ({
              id: meetingDoc.id,
              ...meetingDoc.data(),
            })),
          }),
        };
      })
    );

    async function getCpActivities() {
      if (!sessionUjbCode) {
        return [];
      }

      const boardDoc = await cpBoardCollection.doc(sessionUjbCode).get();
      const totals = boardDoc.data()?.totals;
      if (totals && typeof totals === "object") {
        return Object.values(totals).map((points) => ({ points }));
      }

      const activitiesSnapshot = await cpBoardCollection.doc(sessionUjbCode).collection("activities").get();

      return activitiesSnapshot.docs.map((docSnap) => docSnap.data() || {});
    }

    const cpActivities = await getCpActivities();

    const payload = calculateHomePayload({
      userData: userSnap.data() || {},
      allUsers: usersSnap.docs.map((docSnap) => docSnap.data() || {}),
      referrals: referralsSnap.docs,
      monthlyMeetings: monthlySnap.docs,
      conclaves,
      dewdropContents: dewdropSnap.docs,
      cpActivities,
    });

    return jsonSuccess(payload);
  } catch (error) {
    logProviderFailure({
      route: "/api/user/home",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to load home data", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


