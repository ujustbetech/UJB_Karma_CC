import { serializeFirestoreValue } from "@/lib/data/firebase/documentRepository.mjs";
import sanitizeForFirestore from "@/utils/sanitizeForFirestore";
import { getFormattedDate, parseDobInput } from "@/services/birthdayShared";

export function serializeBirthdayEntry(docSnap) {
  return {
    id: docSnap.id,
    ...serializeFirestoreValue(docSnap.data() || {}),
  };
}

export async function fetchBirthdayUsersForAdmin(adminDb, collectionName) {
  const snapshot = await adminDb.collection(collectionName).get();
  const today = getFormattedDate(0);
  const tomorrow = getFormattedDate(1);

  const users = [];
  const sentIds = [];

  snapshot.forEach((docSnap) => {
    const data = serializeFirestoreValue(docSnap.data() || {});
    if (!data.dob) return;

    const dobDate = parseDobInput(data.dob);
    if (!dobDate || Number.isNaN(dobDate.getTime())) return;

    const dayMonth = `${String(dobDate.getDate()).padStart(2, "0")}/${String(
      dobDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (dayMonth !== today && dayMonth !== tomorrow) return;

    const user = {
      id: docSnap.id,
      ...data,
      dayMonth,
      birthdayMessageSent: data.birthdayMessageSent || false,
    };

    users.push(user);

    if (user.birthdayMessageSent) {
      sentIds.push(docSnap.id);
    }
  });

  return { users, sentIds, today, tomorrow };
}

export async function fetchBirthdayEntries(adminDb, collectionName) {
  const snapshot = await adminDb.collection(collectionName).get();
  return snapshot.docs.map(serializeBirthdayEntry);
}

export async function fetchBirthdayEntry(adminDb, collectionName, id) {
  const snap = await adminDb.collection(collectionName).doc(id).get();
  if (!snap.exists) return null;
  return serializeBirthdayEntry(snap);
}

export async function deleteBirthdayEntry(adminDb, collectionName, id) {
  await adminDb.collection(collectionName).doc(id).delete();
}

export async function markBirthdayMessageSent(adminDb, collectionName, userId, sentDate) {
  await adminDb.collection(collectionName).doc(userId).update({
    birthdayMessageSent: true,
    birthdayMessageSentDate: sentDate,
  });
}

export async function fetchBirthdayUserOptions(adminDb, userCollectionName) {
  const snapshot = await adminDb.collection(userCollectionName).get();

  return snapshot.docs
    .map((docSnap) => {
      const data = serializeFirestoreValue(docSnap.data() || {});
      const name = (data?.Name || "").trim();
      const phone = data?.MobileNo ? String(data.MobileNo) : "";

      if (!name || !phone) return null;

      return {
        label: name,
        value: phone,
        email: data?.Email || "",
        photoURL: data?.ProfilePhotoURL || "",
        dob: data?.DOB || data?.dob || "",
      };
    })
    .filter(Boolean);
}

export async function checkBirthdayEntryExists(adminDb, collectionName, userId) {
  const snapshot = await adminDb.collection(collectionName).doc(userId).get();
  return snapshot.exists;
}

export async function saveBirthdayEntry(adminDb, collectionName, payload) {
  const birthdayDate = parseDobInput(payload?.dob);

  if (!payload?.selectedUserData?.value || !payload?.dob || !birthdayDate) {
    throw new Error("Missing birthday entry details");
  }

  await adminDb
    .collection(collectionName)
    .doc(payload.selectedUserData.value)
    .set(
      sanitizeForFirestore({
        name: payload.selectedUserData.label,
        phone: payload.selectedUserData.value,
        email: payload.selectedUserData.email,
        dob: payload.dob,
        dobTimestamp: birthdayDate,
        imageUrl: payload.imageUrl || "",
        registeredAt: new Date(),
      })
    );
}

export async function updateBirthdayEntry(adminDb, collectionName, id, payload) {
  await adminDb
    .collection(collectionName)
    .doc(id)
    .set(
      sanitizeForFirestore({
        ...payload,
        updatedAt: new Date(),
      }),
      { merge: true }
    );
}
