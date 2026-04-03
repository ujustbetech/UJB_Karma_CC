import admin from "firebase-admin";
import { serverEnv } from "@/lib/config/serverEnv";

let firebaseAdminInitError = null;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serverEnv.firebaseAdmin.projectId,
        clientEmail: serverEnv.firebaseAdmin.clientEmail,
        privateKey: serverEnv.firebaseAdmin.privateKey,
      }),
    });
  }
} catch (error) {
  firebaseAdminInitError = error;
  console.error("Firebase Admin initialization error:", error);
}

export const adminApp = admin.apps.length ? admin.app() : null;
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
export function getFirebaseAdminInitError() {
  return firebaseAdminInitError;
}
export default adminApp;
