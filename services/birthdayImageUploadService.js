import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/firebaseClient";

export async function uploadBirthdayImage(userId, image) {
  if (!image) return "";

  const imageRef = ref(
    storage,
    `birthdayImages/${userId}/${Date.now()}_${image.name}`
  );

  await uploadBytes(imageRef, image);
  return getDownloadURL(imageRef);
}
