"use client";
import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebaseConfig";

export function useContentUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (files, path = "content") => {
    if (!files?.length) return [];

    setUploading(true);
    const urls = [];

    for (let file of files) {
      const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
      const task = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          snap => {
            setProgress(
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            );
          },
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            urls.push(url);
            resolve();
          }
        );
      });
    }

    setUploading(false);
    return urls;
  };

  return { uploadFiles, uploading, progress };
}