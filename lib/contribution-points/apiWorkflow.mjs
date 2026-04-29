import * as XLSX from "xlsx";
import { serializeFirestoreValue } from "@/lib/data/firebase/documentRepository.mjs";
import sanitizeForFirestore from "@/utils/sanitizeForFirestore";

export const CP_BOARD_COLLECTION = "CPBoard";
export const CP_ACTIVITY_COLLECTION = "cpactivity";
export const USER_ACTIVITY_LOG_COLLECTION = "user_activity_log";

function normalizeNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function buildCpTotals(activities) {
  return activities.reduce(
    (totals, activity) => {
      const points = normalizeNumber(activity.points);
      totals.total += points;

      if (activity.categories?.includes("R")) totals.relation += points;
      if (activity.categories?.includes("H")) totals.health += points;
      if (activity.categories?.includes("W")) totals.wealth += points;

      return totals;
    },
    { total: 0, relation: 0, health: 0, wealth: 0 }
  );
}

function normalizeActivityCategories(activity) {
  if (Array.isArray(activity.categories) && activity.categories.length > 0) {
    return activity.categories;
  }

  if (activity.category) {
    return [String(activity.category).trim().toUpperCase()];
  }

  return ["W"];
}

export function serializeCpBoardUser(docSnap) {
  return {
    id: docSnap.id,
    ...serializeFirestoreValue(docSnap.data() || {}),
  };
}

export function serializeCpActivity(docSnap) {
  const data = serializeFirestoreValue(docSnap.data() || {});
  const categories = normalizeActivityCategories(data);

  return {
    id: docSnap.id,
    ...data,
    category: data.category || categories[0],
    categories,
  };
}

export async function fetchCpBoardSummaryByUjbCode(adminDb, ujbCode) {
  const userSnap = await adminDb.collection(CP_BOARD_COLLECTION).doc(ujbCode).get();

  if (!userSnap.exists) {
    return {
      user: null,
      activities: [],
      totals: buildCpTotals([]),
    };
  }

  const activitiesSnap = await adminDb
    .collection(CP_BOARD_COLLECTION)
    .doc(ujbCode)
    .collection("activities")
    .orderBy("addedAt", "desc")
    .get();

  const activities = activitiesSnap.docs.map(serializeCpActivity);

  return {
    user: serializeCpBoardUser(userSnap),
    activities,
    totals: buildCpTotals(activities),
  };
}

export async function fetchCpBoardMembers(adminDb) {
  const snap = await adminDb.collection(CP_BOARD_COLLECTION).get();

  const members = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const summary = await fetchCpBoardSummaryByUjbCode(adminDb, docSnap.id);
      return {
        ...serializeCpBoardUser(docSnap),
        totalPoints: summary.totals.total,
      };
    })
  );

  return members.sort((a, b) => b.totalPoints - a.totalPoints);
}

export function parseCpActivityWorkbookRows(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows.map((row, index) => ({
    id: index + 1,
    activityName: String(
      row.activityName || row.ActivityName || row.Activity || ""
    ).trim(),
    categories: String(
      row.categories || row.Categories || row.Category || "W"
    )
      .split(",")
      .map((category) => category.trim().toUpperCase())
      .filter(Boolean),
    points: Number(row.points || row.Points || 0),
    purpose: String(row.purpose || row.Purpose || "").trim(),
    month: String(row.month || row.Month || "").trim(),
  }));
}

export async function importCpActivities(adminDb, rows) {
  await Promise.all(
    rows.map((row) =>
      adminDb.collection(CP_ACTIVITY_COLLECTION).add(
        sanitizeForFirestore({
          activityName: row.activityName,
          categories: row.categories,
          points: normalizeNumber(row.points),
          purpose: row.purpose || "",
          month: row.month || "",
          createdAt: new Date(),
        })
      )
    )
  );
}

export async function fetchCpActivityDefinitions(adminDb) {
  const snap = await adminDb.collection(CP_ACTIVITY_COLLECTION).get();

  const rows = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const usageSnap = await adminDb
        .collection(USER_ACTIVITY_LOG_COLLECTION)
        .where("activityId", "==", docSnap.id)
        .get();
      const activity = serializeCpActivity(docSnap);

      return {
        ...activity,
        usageCount: usageSnap.size,
      };
    })
  );

  return rows;
}

export async function fetchActiveCpActivityDefinitions(adminDb) {
  const rows = await fetchCpActivityDefinitions(adminDb);

  return rows
    .filter((row) => row.status === "ACTIVE")
    .sort((left, right) =>
      String(left.activityName || "").localeCompare(String(right.activityName || ""))
    );
}

export async function getNextCpActivityId(adminDb) {
  const snap = await adminDb.collection(CP_ACTIVITY_COLLECTION).get();
  let maxId = 0;

  snap.docs.forEach((docSnap) => {
    if (/^\d+$/.test(docSnap.id)) {
      maxId = Math.max(maxId, Number(docSnap.id));
    }
  });

  return String(maxId + 1).padStart(3, "0");
}

export async function saveCpActivityDefinition(adminDb, form, editingId = null) {
  const category = String(form.category || "W").trim().toUpperCase();
  const payload = sanitizeForFirestore({
    activityName: String(form.activityName || "").trim(),
    category,
    categories: [category],
    points: normalizeNumber(form.points),
    purpose: String(form.purpose || "").trim(),
    automationType: String(form.automationType || "AUTO").trim().toUpperCase(),
    status: String(form.status || "ACTIVE").trim().toUpperCase(),
    updatedAt: new Date(),
  });

  if (editingId) {
    await adminDb.collection(CP_ACTIVITY_COLLECTION).doc(editingId).update(payload);
    return editingId;
  }

  const nextId = await getNextCpActivityId(adminDb);
  await adminDb.collection(CP_ACTIVITY_COLLECTION).doc(nextId).set({
    ...payload,
    activityNo: nextId,
    createdAt: new Date(),
  });

  return nextId;
}

export async function toggleCpActivityStatus(adminDb, activity) {
  const nextStatus = activity.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await adminDb.collection(CP_ACTIVITY_COLLECTION).doc(activity.id).update({
    status: nextStatus,
    updatedAt: new Date(),
  });
}

export async function deleteCpActivityDefinition(adminDb, activity) {
  if (activity.usageCount > 0) {
    throw new Error("Cannot delete an activity that is already used.");
  }

  await adminDb.collection(CP_ACTIVITY_COLLECTION).doc(activity.id).delete();
}

export async function searchCpMembersByName(adminDb, searchTerm) {
  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();

  if (normalizedSearch.length < 2) {
    return [];
  }

  const snap = await adminDb.collection("users").get();

  return snap.docs
    .map((docSnap) => {
      const data = serializeFirestoreValue(docSnap.data() || {});
      const name = String(data.Name || data[" Name"] || "").trim();

      if (!name) {
        return null;
      }

      return {
        id: docSnap.id,
        ujbCode: data.UJBCode || docSnap.id,
        name,
        phoneNumber: String(data.MobileNo || data["Mobile no"] || "").trim(),
        role: String(data.Category || "").trim() || "CosmOrbiter",
      };
    })
    .filter(Boolean)
    .filter((member) => member.name.toLowerCase().includes(normalizedSearch));
}

export async function ensureCpBoardMember(adminDb, member) {
  if (!member?.ujbCode) {
    throw new Error("Selected member is missing a UJB code.");
  }

  await adminDb
    .collection(CP_BOARD_COLLECTION)
    .doc(member.ujbCode)
    .set(
      {
        id: member.ujbCode,
        name: member.name,
        phoneNumber: member.phoneNumber || "",
        role: member.role || "CosmOrbiter",
      },
      { merge: true }
    );
}

export async function assignCpActivityToMember(adminDb, member, activity) {
  if (!member?.ujbCode) {
    throw new Error("Selected member is missing a UJB code.");
  }

  if (!activity?.id) {
    throw new Error("Select an activity before assigning it.");
  }

  await ensureCpBoardMember(adminDb, member);

  await adminDb
    .collection(CP_BOARD_COLLECTION)
    .doc(member.ujbCode)
    .collection("activities")
    .add(
      sanitizeForFirestore({
        activityNo: activity.activityNo || activity.id,
        activityName: activity.activityName,
        categories: activity.categories?.length
          ? activity.categories
          : [activity.category || "W"],
        category: activity.category || activity.categories?.[0] || "W",
        points: normalizeNumber(activity.points),
        purpose: activity.purpose || "",
        activityDescription: activity.purpose || "",
        name: member.name,
        phoneNumber: member.phoneNumber || "",
        month: new Date().toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        addedAt: new Date(),
      })
    );
}
