import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { db, storage } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

export async function fetchContentReferenceData() {
  const [contentSnap, userSnap] = await Promise.all([
    getDocs(collection(db, "ContentCategory")),
    getDocs(collection(db, COLLECTIONS.userDetail)),
  ]);

  return {
    categories: contentSnap.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })),
    partners: userSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        partnerName: data["Name"] || "",
        PartnerType: data["Category"] || "",
        lpProfileimg: data["ProfilePhotoURL"] || "",
        ujbCode: data["ujbCode"] || data["UJBCode"] || "",
      };
    }),
  };
}

export async function fetchPartnerDetails(partnerId) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.userDetail, partnerId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    lpProfile: data["ProfilePhotoURL"] || "",
    partnerName: data["Name"] || "",
    partnerDesignation: data["Category"] || "",
  };
}

export function validateContentForm({
  contentCategoryId,
  contentFiles,
  contentFormat,
  contentName,
  contentType,
  contDiscription,
  ownershipType,
  parternameId,
  thumbnailFiles,
}) {
  const errors = {};

  if (!contentType) errors.contentType = "Required";
  if (!contentFormat) errors.contentFormat = "Required";
  if (!contentName) errors.contentName = "Required";
  if (!contentCategoryId) errors.contentCategoryId = "Required";
  if (ownershipType === "Partner" && !parternameId) {
    errors.parternameId = "Required";
  }
  if (!contDiscription) errors.contDiscription = "Required";
  if (!contentFiles.length) errors.contentFiles = "Content file required";
  if (!thumbnailFiles.length) errors.thumbnailFiles = "Thumbnail required";

  return errors;
}

export function validateFileSizes(files, maxMB) {
  const maxBytes = maxMB * 1024 * 1024;

  for (const file of files) {
    if (file.size > maxBytes) {
      return `File too large: ${file.name}`;
    }
  }

  return null;
}

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

function createContentPayload({
  adminName,
  contentCategoryId,
  contentCategoryName,
  contentFileImages,
  contentFormat,
  contentName,
  contentType,
  contDiscription,
  blogUrl,
  inputTag,
  lpProfile,
  ownershipType,
  parternameId,
  partnerDesig,
  partnerNamelp,
  status,
  switchValue,
  thumbnail,
  videoUrl,
}) {
  const isPartnerOwned = ownershipType === "Partner";

  return {
    AdminName: adminName || "",
    AdminCreatedby: Timestamp.now(),
    Thumbnail: thumbnail,
    blogUrl,
    comments: [],
    contentCategoryId,
    contentCategoryName,
    contentFileImages,
    contentFormat,
    contentName,
    contentType,
    contDiscription,
    inputTag,
    lpProfile: isPartnerOwned ? lpProfile : "",
    ownershipType,
    parternameId: isPartnerOwned ? parternameId : "",
    partnerDesig: isPartnerOwned ? partnerDesig : "",
    partnerNamelp: isPartnerOwned ? partnerNamelp : "UjustBe",
    status,
    switchValue,
    totalCp: 0,
    totallike: 0,
    totalViews: 0,
    videoUrl,
  };
}

export async function createContent(data) {
  return addDoc(collection(db, "ContentData"), {
    ...data,
    comments: [],
    totallike: 0,
    totalViews: 0,
    totalCp: 0,
    createdAt: Timestamp.now(),
  });
}

export async function fetchContentListing() {
  const snapshot = await getDocs(collection(db, "ContentData"));

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      partner: data.partnerNamelp || "",
      partnerType: data.partnerDesig || "",
      name: data.contentName || "",
      format: data.contentFormat || "",
      type: data.contentType || "",
      views: data.totalViews || 0,
      likes: data.totallike || 0,
      status: data.switchValue ? "active" : "inactive",
    };
  });
}

export async function deleteContentEntry(contentId) {
  await deleteDoc(doc(db, "ContentData", contentId));
}

export async function saveContentDraft(formData) {
  return addDoc(
    collection(db, "ContentData"),
    createContentPayload({
      ...formData,
      contentFileImages: [],
      status: "draft",
      thumbnail: [],
    })
  );
}

export async function publishContent(formData, onProgress) {
  const [contentFileImages, thumbnail] = await Promise.all([
    uploadContentFiles(formData.contentFiles, onProgress),
    uploadContentFiles(formData.thumbnailFiles, onProgress),
  ]);

  return addDoc(
    collection(db, "ContentData"),
    createContentPayload({
      ...formData,
      contentFileImages,
      status: formData.status || "published",
      thumbnail,
    })
  );
}
