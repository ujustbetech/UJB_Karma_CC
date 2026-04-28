import { serializeFirestoreValue } from "@/lib/data/firebase/documentRepository.mjs";

function toRecord(docSnap) {
  if (!docSnap?.exists) {
    return null;
  }

  return {
    id: docSnap.id,
    ...serializeFirestoreValue(docSnap.data()),
  };
}

export function createFirebaseMeetingRepository({ db, collectionName }) {
  if (!db) {
    throw new Error("Missing Firebase admin database");
  }

  if (!collectionName) {
    throw new Error("Missing Firebase collection name");
  }

  const collection = () => db.collection(collectionName);

  return Object.freeze({
    async listAll() {
      const snapshot = await collection().get();

      return snapshot.docs
        .map((docSnap) => toRecord(docSnap))
        .filter(Boolean);
    },

    async getById(id) {
      const docId = String(id || "").trim();
      if (!docId) return null;

      const snap = await collection().doc(docId).get();
      return toRecord(snap);
    },

    async isUserRegistered(eventId, phone) {
      const docId = String(eventId || "").trim();
      const phoneId = String(phone || "").trim();

      if (!docId || !phoneId) {
        return false;
      }

      const snap = await collection()
        .doc(docId)
        .collection("registeredUsers")
        .doc(phoneId)
        .get();

      return snap.exists;
    },

    async listRegisteredUsers(eventId) {
      const docId = String(eventId || "").trim();
      if (!docId) return [];

      const snapshot = await collection()
        .doc(docId)
        .collection("registeredUsers")
        .get();

      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...serializeFirestoreValue(docSnap.data()),
      }));
    },
  });
}
