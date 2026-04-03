import admin from "firebase-admin";
import { serverEnv } from "@/lib/config/serverEnv";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serverEnv.firebaseAdmin.projectId,
      clientEmail: serverEnv.firebaseAdmin.clientEmail,
      privateKey: serverEnv.firebaseAdmin.privateKey,
    }),
  });
}

export const adminApp = admin.app();
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default adminApp;
