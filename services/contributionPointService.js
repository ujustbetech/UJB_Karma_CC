import {
  collection,
  doc,
  deleteDoc,
  addDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

const CP_BOARD_COLLECTION = "CPBoard";
const CP_ACTIVITY_COLLECTION = "cpactivity";
const USER_ACTIVITY_LOG_COLLECTION = "user_activity_log";

export function getCpCategoryLabel(category) {
  if (category === "R") return "Relation";
  if (category === "H") return "Health";
  return "Wealth";
}

function buildTotals(activities) {
  return activities.reduce(
    (totals, activity) => {
      const points = Number(activity.points || 0);
      totals.total += points;

      if (activity.categories?.includes("R")) totals.relation += points;
      if (activity.categories?.includes("H")) totals.health += points;
      if (activity.categories?.includes("W")) totals.wealth += points;

      return totals;
    },
    { total: 0, relation: 0, health: 0, wealth: 0 }
  );
}

export async function fetchCpBoardUser(ujbCode) {
  const userSnap = await getDoc(doc(db, CP_BOARD_COLLECTION, ujbCode));

  if (!userSnap.exists()) {
    return null;
  }

  return {
    id: userSnap.id,
    ...userSnap.data(),
  };
}

export async function fetchCpActivities(ujbCode) {
  const activityQuery = query(
    collection(db, CP_BOARD_COLLECTION, ujbCode, "activities"),
    orderBy("addedAt", "desc")
  );

  const snap = await getDocs(activityQuery);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function fetchCpBoardSummary(ujbCode) {
  const [user, activities] = await Promise.all([
    fetchCpBoardUser(ujbCode),
    fetchCpActivities(ujbCode),
  ]);

  return {
    user,
    activities,
    totals: buildTotals(activities),
  };
}

export function filterCpActivities(activities, category = "All", searchTerm = "") {
  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();

  return activities.filter((activity) => {
    const matchesCategory =
      category === "All" || activity.categories?.includes(category);

    const matchesSearch =
      !normalizedSearch ||
      activity.activityName?.toLowerCase().includes(normalizedSearch) ||
      activity.purpose?.toLowerCase().includes(normalizedSearch) ||
      activity.month?.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
}

export async function fetchCpBoardMembers() {
  const snap = await getDocs(collection(db, CP_BOARD_COLLECTION));

  const members = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const summary = await fetchCpBoardSummary(docSnap.id);
      return {
        id: docSnap.id,
        ...docSnap.data(),
        totalPoints: summary.totals.total,
      };
    })
  );

  return members.sort((a, b) => b.totalPoints - a.totalPoints);
}

export function parseCpActivityWorkbook(arrayBuffer) {
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

export async function importCpActivities(rows) {
  await Promise.all(
    rows.map((row) =>
      setDoc(doc(collection(db, CP_ACTIVITY_COLLECTION)), {
        activityName: row.activityName,
        categories: row.categories,
        points: Number(row.points || 0),
        purpose: row.purpose || "",
        month: row.month || "",
        createdAt: serverTimestamp(),
      })
    )
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

export async function fetchCpActivityDefinitions() {
  const snap = await getDocs(collection(db, CP_ACTIVITY_COLLECTION));

  const rows = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const usageQuery = query(
        collection(db, USER_ACTIVITY_LOG_COLLECTION),
        where("activityId", "==", docSnap.id)
      );
      const usageSnap = await getDocs(usageQuery);
      const data = docSnap.data();
      const categories = normalizeActivityCategories(data);

      return {
        id: docSnap.id,
        ...data,
        category: categories[0],
        categories,
        usageCount: usageSnap.size,
      };
    })
  );

  return rows;
}

export async function getNextCpActivityId() {
  const snap = await getDocs(collection(db, CP_ACTIVITY_COLLECTION));

  let maxId = 0;

  snap.docs.forEach((docSnap) => {
    if (/^\d+$/.test(docSnap.id)) {
      maxId = Math.max(maxId, Number(docSnap.id));
    }
  });

  return String(maxId + 1).padStart(3, "0");
}

export async function saveCpActivityDefinition(form, editingId = null) {
  const category = String(form.category || "W").trim().toUpperCase();
  const payload = {
    activityName: String(form.activityName || "").trim(),
    category,
    categories: [category],
    points: Number(form.points || 0),
    purpose: String(form.purpose || "").trim(),
    automationType: String(form.automationType || "AUTO").trim().toUpperCase(),
    status: String(form.status || "ACTIVE").trim().toUpperCase(),
    updatedAt: serverTimestamp(),
  };

  if (editingId) {
    await updateDoc(doc(db, CP_ACTIVITY_COLLECTION, editingId), payload);
    return editingId;
  }

  const nextId = await getNextCpActivityId();

  await setDoc(doc(db, CP_ACTIVITY_COLLECTION, nextId), {
    ...payload,
    activityNo: nextId,
    createdAt: serverTimestamp(),
  });

  return nextId;
}

export async function toggleCpActivityStatus(activity) {
  const nextStatus = activity.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  await updateDoc(doc(db, CP_ACTIVITY_COLLECTION, activity.id), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCpActivityDefinition(activity) {
  if (activity.usageCount > 0) {
    throw new Error("Cannot delete an activity that is already used.");
  }

  await deleteDoc(doc(db, CP_ACTIVITY_COLLECTION, activity.id));
}

export async function fetchActiveCpActivityDefinitions() {
  const rows = await fetchCpActivityDefinitions();

  return rows
    .filter((row) => row.status === "ACTIVE")
    .sort((left, right) =>
      String(left.activityName || "").localeCompare(String(right.activityName || ""))
    );
}

export async function searchCpMembersByName(searchTerm) {
  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();

  if (normalizedSearch.length < 2) {
    return [];
  }

  const snap = await getDocs(collection(db, COLLECTIONS.userDetail));

  return snap.docs
    .map((docSnap) => {
      const data = docSnap.data();
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

export async function ensureCpBoardMember(member) {
  if (!member?.ujbCode) {
    throw new Error("Selected member is missing a UJB code.");
  }

  await setDoc(
    doc(db, CP_BOARD_COLLECTION, member.ujbCode),
    {
      id: member.ujbCode,
      name: member.name,
      phoneNumber: member.phoneNumber || "",
      role: member.role || "CosmOrbiter",
    },
    { merge: true }
  );
}

export async function assignCpActivityToMember(member, activity) {
  if (!member?.ujbCode) {
    throw new Error("Selected member is missing a UJB code.");
  }

  if (!activity?.id) {
    throw new Error("Select an activity before assigning it.");
  }

  await ensureCpBoardMember(member);

  const activitiesRef = collection(
    db,
    CP_BOARD_COLLECTION,
    member.ujbCode,
    "activities"
  );

  await addDoc(activitiesRef, {
    activityNo: activity.activityNo || activity.id,
    activityName: activity.activityName,
    categories: activity.categories?.length ? activity.categories : [activity.category || "W"],
    category: activity.category || activity.categories?.[0] || "W",
    points: Number(activity.points || 0),
    purpose: activity.purpose || "",
    activityDescription: activity.purpose || "",
    name: member.name,
    phoneNumber: member.phoneNumber || "",
    month: new Date().toLocaleString("default", {
      month: "short",
      year: "numeric",
    }),
    addedAt: serverTimestamp(),
  });
}
