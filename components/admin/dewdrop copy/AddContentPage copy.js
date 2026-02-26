"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Checkbox from "@/components/ui/Checkbox";
import RadioGroup from "@/components/ui/RadioGroup";
import FormField from "@/components/ui/FormField";
import TagsInput from "@/components/ui/TagsInput";
import { useToast } from "@/components/ui/ToastProvider";
import FilePreview from "@/components/ui/FilePreview";

import { db, storage } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  Timestamp
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";

export default function AddContentPage() {
  const toast = useToast(); // object-style API

  const firstFieldRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Identity
  const [contentType, setContentType] = useState("Normal");
  const [contentFormat, setContentFormat] = useState("");
  const [contentName, setContentName] = useState("");
  const [contDiscription, setContDiscription] = useState("");

  // Classification
  const [contentCategoryId, setContentCategoryId] = useState("");
  const [contentCategoryName, setContentCategoryName] = useState("");
  const [parternameId, setParternameId] = useState("");
  const [partnerDesig, setPartnerDesig] = useState("");
  const [lpProfile, setLpProfile] = useState("");
  const [partnerNamelp, setPartnerNamelp] = useState("");
  const [tags, setTags] = useState([]);

  // Links
  const [videoUrl, setVideoUrl] = useState("");
  const [blogUrl, setBlogUrl] = useState("");

  // Status
  const [switchValue, setSwitchValue] = useState(true);

  // Media
  const [contentFiles, setContentFiles] = useState([]);
  const [thumbnailFiles, setThumbnailFiles] = useState([]);
  const [contentFileUrls, setContentFileUrls] = useState([]);
  const [thumbnailUrls, setThumbnailUrls] = useState([]);

  // Data sources
  const [ContentData, setContentData] = useState([]);
  const [Userdata, setUserdata] = useState([]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Parallel load
  useEffect(() => {
    const fetchData = async () => {
      const [contentSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "ContentCategory")),
        getDocs(collection(db, "UsersData"))
      ]);

      setContentData(contentSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setUserdata(userSnap.docs.map(d => ({ ...d.data(), id: d.id })));
    };
    fetchData();
  }, []);

  const categoryOptions = useMemo(
    () => [
      { label: "Select category", value: "" },
      ...ContentData.map(c => ({ label: c.contentCategory, value: c.id }))
    ],
    [ContentData]
  );

  const partnerOptions = useMemo(
    () => [
      { label: "Select partner", value: "" },
      ...Userdata.map(u => ({ label: u.partnerName, value: u.id }))
    ],
    [Userdata]
  );

  const validate = () => {
    const newErrors = {};

    if (!contentType) newErrors.contentType = "Required";
    if (!contentFormat) newErrors.contentFormat = "Required";
    if (!contentName) newErrors.contentName = "Required";
    if (!contentCategoryId) newErrors.contentCategoryId = "Required";
    if (!parternameId) newErrors.parternameId = "Required";
    if (!contDiscription) newErrors.contDiscription = "Required";
    if (!contentFiles.length) newErrors.contentFiles = "Content file required";
    if (!thumbnailFiles.length) newErrors.thumbnailFiles = "Thumbnail required";

    setErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      const el = document.querySelector(
        `[data-field="${firstErrorKey}"] input, [data-field="${firstErrorKey}"] textarea`
      );
      el?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handlePartnerChange = async (id) => {
    setParternameId(id);
    const docRef = doc(db, "UsersData", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setLpProfile(docSnap.data().lpProfileimg);
      setPartnerNamelp(docSnap.data().partnerName);
      setPartnerDesig(docSnap.data().PartnerType);
    }
  };

  const handleCategoryChange = (id) => {
    setContentCategoryId(id);
    const selected = ContentData.find(c => c.id === id);
    setContentCategoryName(selected?.contentCategory || "");
    setErrors(prev => ({ ...prev, contentCategoryId: "" }));
  };

  const validateFiles = (files, maxMB) => {
    const maxBytes = maxMB * 1024 * 1024;
    for (const f of files) {
      if (f.size > maxBytes) return `File too large: ${f.name}`;
    }
    return null;
  };

  const uploadFiles = async (files) => {
    if (!files.length) return [];

    setUploading(true);
    const urls = [];

    for (let file of files) {
      const storageRef = ref(
        storage,
        `content/${Date.now()}-${file.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(pct);
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

    setUploading(false);
    return urls;
  };

  const resetForm = () => {
    setContentName("");
    setVideoUrl("");
    setBlogUrl("");
    setContDiscription("");
    setTags([]);
    setSwitchValue(true);
    setContentFiles([]);
    setThumbnailFiles([]);
    setContentFileUrls([]);
    setThumbnailUrls([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const err1 = validateFiles(contentFiles, 25);
      const err2 = validateFiles(thumbnailFiles, 5);
      if (err1 || err2) throw new Error(err1 || err2);

      const contentUploads = await uploadFiles(contentFiles);
      const thumbUploads = await uploadFiles(thumbnailFiles);

      setContentFileUrls(prev => [...prev, ...contentUploads]);
      setThumbnailUrls(prev => [...prev, ...thumbUploads]);

      const adminDetails = JSON.parse(localStorage.getItem("AdminData") || "{}");

      await addDoc(collection(db, "ContentData"), {
        AdminName: adminDetails?.currentuser || "",
        Thumbnail: thumbUploads,
        contentFileImages: contentUploads,
        contentFormat,
        contentType,
        contentName,
        comments: [],
        parternameId,
        contDiscription,
        contentCategoryId,
        contentCategoryName,
        partnerDesig,
        inputTag: tags,
        partnerNamelp,
        lpProfile,
        videoUrl,
        blogUrl,
        switchValue,
        totallike: 0,
        totalViews: 0,
        totalCp: 0,
        AdminCreatedby: Timestamp.now(),
      });

      toast.success("Referral submitted successfully");
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("SAVE ERROR:", err);
      toast.error("Submission failed");
    }

    setLoading(false);
  };

  return (
    <>
      <Text as="h1">Add Content</Text>

      <form onSubmit={handleSubmit}>
        <Card>
          <Text as="h2">Content Identity</Text>

          <FormField label="Content Name" error={errors.contentName} required data-field="contentName">
            <Input
              ref={firstFieldRef}
              value={contentName}
              onChange={(e) => setContentName(e.target.value)}
              error={!!errors.contentName}
            />
          </FormField>

          <FormField label="Content Type" error={errors.contentType} required>
            <RadioGroup
              value={contentType}
              onChange={setContentType}
              options={[
                { label: "Exclusive", value: "Exclusive" },
                { label: "Normal", value: "Normal" }
              ]}
            />
          </FormField>

          <FormField label="Content Format" error={errors.contentFormat} required>
            <RadioGroup
              value={contentFormat}
              onChange={setContentFormat}
              options={[
                { label: "Text", value: "Text" },
                { label: "Audio", value: "Audio" },
                { label: "Image", value: "Image" },
                { label: "Video", value: "Video" }
              ]}
            />
          </FormField>

          <FormField label="Description" error={errors.contDiscription} required data-field="contDiscription">
            <Textarea
              value={contDiscription}
              onChange={(e) => setContDiscription(e.target.value)}
              error={!!errors.contDiscription}
            />
          </FormField>
        </Card>

        <Card>
          <Text as="h2">Media Upload</Text>

          <FormField label="Content File" error={errors.contentFiles} required>
            <Input
              type="file"
              multiple
              onChange={(e) =>
                setContentFiles(prev => [...prev, ...Array.from(e.target.files)])
              }
            />
            <Text variant="muted">
              {contentFiles.length
                ? contentFiles.map(f => f.name).join(", ")
                : "No files selected"}
            </Text>
          </FormField>

          <FormField label="Thumbnail" error={errors.thumbnailFiles} required>
            <Input
              type="file"
              multiple
              onChange={(e) =>
                setThumbnailFiles(prev => [...prev, ...Array.from(e.target.files)])
              }
            />
            <Text variant="muted">
              {thumbnailFiles.length
                ? thumbnailFiles.map(f => f.name).join(", ")
                : "No files selected"}
            </Text>
          </FormField>

          {uploading && (
            <Text variant="muted">Uploading: {progress}%</Text>
          )}

          <FilePreview files={[...contentFiles, ...thumbnailFiles]} />
        </Card>

        <Card>
          <Text as="h2">Classification</Text>

          <FormField label="Category" error={errors.contentCategoryId} required>
            <Select
              value={contentCategoryId}
              onChange={handleCategoryChange}
              options={categoryOptions}
            />
          </FormField>

          <FormField label="Partner" error={errors.parternameId} required>
            <Select
              value={parternameId}
              onChange={(v) => {
                handlePartnerChange(v);
                setErrors(prev => ({ ...prev, parternameId: "" }));
              }}
              options={partnerOptions}
            />
          </FormField>

          <FormField label="Hashtags">
            <TagsInput value={tags} onChange={setTags} />
          </FormField>
        </Card>

        <Card>
          <Text as="h2">Distribution Links</Text>

          <FormField label="Video URL">
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </FormField>

          <FormField label="Blog URL">
            <Input value={blogUrl} onChange={(e) => setBlogUrl(e.target.value)} />
          </FormField>
        </Card>

        <Card>
          <Text as="h2">Status & Publish</Text>

          <FormField label="Active">
            <Checkbox
              checked={switchValue}
              onChange={() => setSwitchValue(!switchValue)}
            />
          </FormField>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button type="submit" variant="primary" disabled={loading || uploading}>
              {loading || uploading ? "Saving…" : "Submit"}
            </Button>
            <Button type="reset" variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
