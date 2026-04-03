// /services/referralService.js

import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  buildReferralId,
  buildReferralNotifications,
  buildReferralWritePayload,
  normalizeReferralItem,
} from "@/lib/referrals/referralWorkflow.mjs";

async function getCanonicalItem(cosmoUjbCode, selectedItem) {
  const cosmoRef = doc(db, COLLECTIONS.userDetail, cosmoUjbCode);
  const snap = await getDoc(cosmoRef);

  if (!snap.exists()) return selectedItem.raw;

  const data = snap.data();

  const rawServices = data.services
    ? Array.isArray(data.services)
      ? data.services
      : Object.values(data.services)
    : [];

  const rawProducts = data.products
    ? Array.isArray(data.products)
      ? data.products
      : Object.values(data.products)
    : [];

  const label = selectedItem.label;

  return (
    rawServices.find((service) => (service.serviceName || service.name) === label) ||
    rawProducts.find((product) => (product.productName || product.name) === label) ||
    selectedItem.raw
  );
}

export async function createReferral({
  selectedItem,
  leadDescription,
  selectedFor,
  otherName,
  otherPhone,
  otherEmail,
  cosmoDetails,
  orbiterDetails,
}) {
  if (!selectedItem) throw new Error("No item selected");

  return runTransaction(db, async (transaction) => {
    const counterRef = doc(db, "counters", "referral");
    const counterSnap = await transaction.get(counterRef);

    if (!counterSnap.exists()) {
      throw new Error("Referral counter missing");
    }

    const currentNumber = counterSnap.data().lastNumber || 2999;
    const nextNumber = currentNumber + 1;

    transaction.update(counterRef, {
      lastNumber: nextNumber,
    });

    const referralId = buildReferralId(nextNumber, new Date());
    const canonical = await getCanonicalItem(cosmoDetails.ujbCode, selectedItem);
    const finalItem = normalizeReferralItem(canonical);
    const newReferralRef = doc(collection(db, COLLECTIONS.referral));

    transaction.set(
      newReferralRef,
      buildReferralWritePayload({
        referralId,
        leadDescription,
        selectedFor,
        otherName,
        otherPhone,
        otherEmail,
        selectedItem,
        finalItem,
        cosmoDetails,
        orbiterDetails,
        timestampValue: serverTimestamp(),
      })
    );

    try {
      const notifications = buildReferralNotifications({
        selectedItem,
        orbiterDetails,
        cosmoDetails,
      });

      await Promise.all(
        notifications.map((payload) =>
          fetch("/api/send-whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        )
      );
    } catch (err) {
      console.warn("WhatsApp failed:", err);
    }

    return referralId;
  });
}
