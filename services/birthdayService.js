import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

export function getFormattedDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function parseDobInput(dob) {
  if (!dob) return null;

  if (typeof dob === "string" && dob.includes("/")) {
    const [day, month, year] = dob.split("/");
    return new Date(`${year}-${month}-${day}`);
  }

  return new Date(dob);
}

export function getBirthdayDobInfo(dob) {
  const birthDate = parseDobInput(dob);

  if (!birthDate || Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  const nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return {
    age: nextBirthday.getFullYear() - birthDate.getFullYear(),
    day: nextBirthday.toLocaleDateString("en-US", {
      weekday: "long",
    }),
  };
}

export async function fetchBirthdayUsersForAdmin() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.birthdayCanva));
  const today = getFormattedDate(0);
  const tomorrow = getFormattedDate(1);

  const users = [];
  const sentIds = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.dob) return;

    const dobDate = data.dob?.toDate ? data.dob.toDate() : new Date(data.dob);
    const dayMonth = `${String(dobDate.getDate()).padStart(2, "0")}/${String(
      dobDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (dayMonth !== today && dayMonth !== tomorrow) {
      return;
    }

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

  return {
    users,
    sentIds,
    today,
    tomorrow,
  };
}

export async function sendBirthdayMessage(user) {
  await fetch("/api/send-birthday", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user }),
  });
}

export async function markBirthdayMessageSent(userId, sentDate) {
  await updateDoc(doc(db, COLLECTIONS.birthdayCanva, userId), {
    birthdayMessageSent: true,
    birthdayMessageSentDate: sentDate,
  });
}

export async function fetchBirthdayUserOptions() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.userDetail));

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
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

export async function checkBirthdayEntryExists(userId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.birthdayCanva, userId));
  return snapshot.exists();
}

async function uploadBirthdayImage(userId, image) {
  if (!image) return "";

  const imageRef = ref(
    storage,
    `birthdayImages/${userId}/${Date.now()}_${image.name}`
  );

  await uploadBytes(imageRef, image);
  return getDownloadURL(imageRef);
}

export async function saveBirthdayEntry({ selectedUserData, dob, image }) {
  const birthdayDate = parseDobInput(dob);

  if (!selectedUserData?.value || !dob || !birthdayDate) {
    throw new Error("Missing birthday entry details");
  }

  const imageUrl = await uploadBirthdayImage(selectedUserData.value, image);

  await setDoc(doc(db, COLLECTIONS.birthdayCanva, selectedUserData.value), {
    name: selectedUserData.label,
    phone: selectedUserData.value,
    email: selectedUserData.email,
    dob,
    dobTimestamp: birthdayDate,
    imageUrl,
    registeredAt: serverTimestamp(),
  });
}
