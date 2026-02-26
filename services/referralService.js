// /services/referralService.js

import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

/* ================= NORMALIZE AGREED VALUE ================= */
function normalizeItem(item) {
  if (!item) return null;

  const it = JSON.parse(JSON.stringify(item));

  if (!it.agreedValue && it.percentage != null) {
    it.agreedValue = {
      mode: "single",
      single: { type: "percentage", value: String(it.percentage) },
      multiple: { slabs: [], itemSlabs: [] },
    };
  }

  return it;
}

/* ================= FETCH CANONICAL ITEM ================= */
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
    rawServices.find((s) => (s.serviceName || s.name) === label) ||
    rawProducts.find((p) => (p.productName || p.name) === label) ||
    selectedItem.raw
  );
}

/* ================= MAIN FUNCTION ================= */
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

  return await runTransaction(db, async (transaction) => {

    /* ================= SAFE COUNTER ================= */

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

    const now = new Date();
    const year1 = now.getFullYear() % 100;
    const year2 = (now.getFullYear() + 1) % 100;

    const referralId =
      `Ref/${year1}-${year2}/${String(nextNumber).padStart(8, "0")}`;

    /* ================= ITEM LOGIC ================= */

    const canonical = await getCanonicalItem(
      cosmoDetails.ujbCode,
      selectedItem
    );

    const finalItem = normalizeItem(canonical);

    const newReferralRef = doc(collection(db, COLLECTIONS.referral));

    transaction.set(newReferralRef, {
      referralId,
      referralSource: "User",
      referralType: selectedFor === "self" ? "Self" : "Others",
      leadDescription,
      dealStatus: "Pending",
      lastUpdated: serverTimestamp(),
      timestamp: serverTimestamp(),

      cosmoUjbCode: cosmoDetails.ujbCode,

      cosmoOrbiter: {
        name: cosmoDetails.name,
        email: cosmoDetails.email,
        phone: cosmoDetails.phone,
        ujbCode: cosmoDetails.ujbCode,
        mentorName: cosmoDetails.mentorName || null,
        mentorPhone: cosmoDetails.mentorPhone || null,
      },

      orbiter: {
        name: orbiterDetails.name,
        email: orbiterDetails.email,
        phone: orbiterDetails.phone,
        ujbCode: orbiterDetails.ujbCode,
        mentorName: orbiterDetails.mentorName || null,
        mentorPhone: orbiterDetails.mentorPhone || null,
      },

      referredForName: selectedFor === "someone" ? otherName : null,
      referredForPhone: selectedFor === "someone" ? otherPhone : null,
      referredForEmail: selectedFor === "someone" ? otherEmail : null,

      service: selectedItem.type === "service" ? finalItem : null,
      product: selectedItem.type === "product" ? finalItem : null,

      dealLogs: [],
      followups: [],
      statusLogs: [],
    });

    /* ================= WHATSAPP ================= */

    try {
      const itemLabel = selectedItem.label;

      await Promise.all([
        fetch("/api/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: orbiterDetails.phone,
            parameters: [
              orbiterDetails.name,
              `🚀 You’ve successfully passed a referral for ${itemLabel}.`,
            ],
          }),
        }),
        fetch("/api/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cosmoDetails.phone,
            parameters: [
              cosmoDetails.name,
              `✨ You’ve received a referral for ${itemLabel}.`,
            ],
          }),
        }),
      ]);
    } catch (err) {
      console.warn("WhatsApp failed:", err);
    }

    return referralId;
  });
}