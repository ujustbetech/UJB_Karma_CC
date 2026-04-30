import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "@/lib/firebase/firebaseClient";

export async function uploadContentFiles(files, onProgress) {
  if (!files?.length) return [];

  const urls = [];

  for (const file of files) {
    const storageRef = ref(storage, `content/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (!onProgress) return;

          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );

          onProgress(percent);
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          urls.push(url);
          resolve();
        }
      );
    });
  }

  return urls;
}
