import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export async function createContent(data) {
  return await addDoc(collection(db, "ContentData"), {
    ...data,
    comments: [],
    totallike: 0,
    totalViews: 0,
    totalCp: 0,
    createdAt: Timestamp.now(),
  });
}