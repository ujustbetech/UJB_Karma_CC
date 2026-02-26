// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  OAuthProvider
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyARJI0DZgGwH9j2Hz318ddonBd55IieUBs",
  authDomain: "monthlymeetingapp.firebaseapp.com",
  projectId: "monthlymeetingapp",
  storageBucket: "monthlymeetingapp.appspot.com",
  messagingSenderId: "139941390700",
  appId: "1:139941390700:web:ab6aa16fcd8ca71bb52b49",
  measurementId: "G-26KEDXQKK9"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ⭐ MICROSOFT LOGIN PROVIDER
export const microsoftProvider = new OAuthProvider("microsoft.com");

microsoftProvider.setCustomParameters({
  prompt: "select_account"
});

export {
  app,
  auth,
  db,
  storage,
  microsoftProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
};