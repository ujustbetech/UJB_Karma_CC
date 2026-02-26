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
import { COLLECTIONS } from '@/lib/utility_collection';

import { Eye, User, Layers, Tag, Upload, Rocket, AlignLeft, Shapes, Type, Hash, FileText, Folder, Users, Video, Link } from "lucide-react";

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
    const [contentOwnerType, setContentOwnerType] = useState("UJB");
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

    const [contentStatus, setContentStatus] = useState("draft");

    const [mainFile, setMainFile] = useState(null);
    const [mainPreview, setMainPreview] = useState(null);

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const [dragMain, setDragMain] = useState(false);
    const [dragThumb, setDragThumb] = useState(false);

    // auto suggestion 
    const [users, setUsers] = useState([]);
    const [orbiterSearch, setOrbiterSearch] = useState('');
    const [filteredOrbiters, setFilteredOrbiters] = useState([]);
    const [selectedOrbiter, setSelectedOrbiter] = useState(null);

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

    // autosuggest 


    /* ================= LOAD USERS ================= */
    useEffect(() => {
        const load = async () => {
            // setPageLoading(true);

            const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
            const data = snap.docs.map((d) => ({
                id: d.id,
                name: d.data().Name || '',
                phone: d.data().MobileNo || '',
                category: d.data().Category || '',
            }));

            setUsers(data);
            // setPageLoading(false);
        };
        load();
    }, []);

    const selectOrbiter = (user) => {
        setSelectedOrbiter(user);
        setOrbiterSearch(user.name);
        setFilteredOrbiters([]);
    };



    const handleOrbiterSearch = (value) => {
        setOrbiterSearch(value);
        setSelectedOrbiter(null);
        clearError("orbiter");

        // If empty → clear dropdown
        if (!value.trim()) {
            setFilteredOrbiters([]);
            return;
        }

        // Filter + limit results
        const results = users
            .filter((u) =>
                u.name?.toLowerCase().includes(value.toLowerCase())
            )
            .slice(0, 8); // limit to 8 suggestions

        setFilteredOrbiters(results);
    };

    const clearError = (field) =>
        setErrors((p) => ({
            ...p,
            [field]: '',
        }));

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
        if (contentOwnerType === "ORBITER" && !selectedOrbiter) {
            newErrors.orbiter = "Orbiter required";
        }

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


    const isValidMainFile = (file) => {
        if (!contentFormat) return false;

        if (contentFormat === "Image") return file.type.startsWith("image/");
        if (contentFormat === "Video") return file.type.startsWith("video/");
        if (contentFormat === "Audio") return file.type.startsWith("audio/");
        if (contentFormat === "Text") return true;

        return false;
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

    const handleMainFile = (file) => {
        if (!file || !isValidMainFile(file)) {
            toast.error("Invalid file for selected format");
            return;
        }

        setMainFile(file);

        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
            setMainPreview(URL.createObjectURL(file));
        } else {
            setMainPreview(null);
        }
    };

    const handleThumbnail = (file) => {
        if (!file?.type.startsWith("image/")) {
            toast.error("Thumbnail must be an image");
            return;
        }

        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
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
                status: contentStatus,
                contentOwnerType,

                ownerId:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.id || ""
                        : "",

                ownerName:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.name || ""
                        : adminDetails?.currentuser || "",

                ownerUjbCode:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.ujbCode || ""
                        : "",
                AdminCreatedby: Timestamp.now(),
            });

            toast.success("Content submitted successfully");
            resetForm();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error("SAVE ERROR:", err);
            toast.error("Submission failed");
        }

        setLoading(false);
    };

    const handleSaveDraft = async () => {
        setContentStatus("draft");
        setLoading(true);

        try {
            const adminDetails = JSON.parse(localStorage.getItem("AdminData") || "{}");

            await addDoc(collection(db, "ContentData"), {
                AdminName: adminDetails?.currentuser || "",
                Thumbnail: [],
                contentFileImages: [],
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
                status: "draft",
                totallike: 0,
                totalViews: 0,
                totalCp: 0,
                contentOwnerType,

                ownerId:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.id || ""
                        : "",

                ownerName:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.name || ""
                        : adminDetails?.currentuser || "",

                ownerUjbCode:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.ujbCode || ""
                        : "",
                AdminCreatedby: Timestamp.now(),
            });

            toast.success("Draft Save successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save draft");
            // toast({ type: "error", message: "Failed to save draft" });
        }

        setLoading(false);
    };


    const handlePublish = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setContentStatus("published");
        setLoading(true);

        try {
            const contentUploads = await uploadFiles(contentFiles);
            const thumbUploads = await uploadFiles(thumbnailFiles);

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
                status: "published",
                totallike: 0,
                totalViews: 0,
                totalCp: 0,
                // AdminName: adminName,

                contentOwnerType,

                ownerId:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.id || ""
                        : "UJB",

                ownerName:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.name || ""
                        : adminName,

                ownerUjbCode:
                    contentOwnerType === "ORBITER"
                        ? selectedOrbiter?.ujbCode || ""
                        : "UJB",
                AdminCreatedby: Timestamp.now(),
            });
            toast.success("Content published");
            // toast({ type: "success", message: "Content published" });
            resetForm();

        } catch (err) {
            console.error(err);
            toast.error("Failed to publish");
            // toast({ type: "error", message: "Failed to publish" });
        }

        setLoading(false);
    };


    const handleImageSelect = (files) => {
        const validImages = Array.from(files).filter(file =>
            file.type.startsWith("image/")
        );

        const mapped = validImages.map(file => ({
            id: `${file.name}-${file.size}`,
            file,
            preview: URL.createObjectURL(file),
            sizeMB: (file.size / 1024 / 1024).toFixed(2)
        }));

        setImageItems(prev => [...prev, ...mapped]);
        setContentFiles(prev => [...prev, ...validImages]); // keep your original upload flow
    };

    const removeImage = (id) => {
        setImageItems(prev => prev.filter(img => img.id !== id));
        setContentFiles(prev =>
            prev.filter(file => `${file.name}-${file.size}` !== id)
        );
    };


    return (
        <>
            {/* <Text as="h1">Add Content</Text> */}

            <Card className="p-4 mb-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <Text variant="muted" className="text-xs">Files</Text>
                            <Text className="font-medium">{contentFiles.length}</Text>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <Text variant="muted" className="text-xs">Category</Text>
                            <Text className="font-medium">{contentCategoryName || "-"}</Text>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <Text variant="muted" className="text-xs">Partner</Text>
                            <Text className="font-medium">{partnerNamelp || "-"}</Text>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <Text variant="muted" className="text-xs">Tags</Text>
                            <Text className="font-medium">{tags.length}</Text>
                        </div>
                    </div>

                </div>
            </Card>




            <form onSubmit={handleSubmit}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.6fr 1fr",
                        gap: 24,
                        alignItems: "start"
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <Card className="p-6 space-y-6">

                            {/* Header */}
                            <div className="flex items-center gap-2 pb-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <Text as="h2" className="font-semibold">Content Identity</Text>
                            </div>

                            {/* Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <FormField
                                    label="Content Owner"
                                    required
                                >
                                    <RadioGroup
                                        value={contentOwnerType}
                                        onChange={(val) => {
                                            setContentOwnerType(val);

                                            // Clear orbiter if switching to UJB
                                            if (val === "UJB") {
                                                setSelectedOrbiter(null);
                                                setOrbiterSearch("");
                                            }
                                        }}
                                        options={[
                                            { label: "UJustBe", value: "UJB" },
                                            { label: "Orbiter", value: "ORBITER" }
                                        ]}
                                    />
                                </FormField>

                                {/* LEFT COLUMN */}

                                <FormField
                                    label={
                                        <div className="flex items-center gap-2">
                                            <Type className="w-4 h-4 text-muted-foreground" />
                                            Content Name
                                        </div>
                                    }
                                    error={errors.contentName}
                                    required
                                    data-field="contentName"
                                >
                                    <Input
                                        ref={firstFieldRef}
                                        value={contentName}
                                        onChange={(e) => setContentName(e.target.value)}
                                        error={!!errors.contentName}
                                        placeholder="Enter content name"
                                    />
                                </FormField>

                                <FormField
                                    label={
                                        <div className="flex items-center gap-2">
                                            <Shapes className="w-4 h-4 text-muted-foreground" />
                                            Content Type
                                        </div>
                                    }
                                    error={errors.contentType}
                                    required
                                >
                                    <RadioGroup
                                        value={contentType}
                                        onChange={setContentType}
                                        options={[
                                            { label: "Exclusive", value: "Exclusive" },
                                            { label: "Normal", value: "Normal" }
                                        ]}
                                    />
                                </FormField>

                                {/* RIGHT COLUMN */}

                                <FormField
                                    label={
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            Content Format
                                        </div>
                                    }
                                    error={errors.contentFormat}
                                    required
                                >
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

                                <FormField
                                    label={
                                        <div className="flex items-center gap-2">
                                            <AlignLeft className="w-4 h-4 text-muted-foreground" />
                                            Description
                                        </div>
                                    }
                                    error={errors.contDiscription}
                                    required
                                    data-field="contDiscription"
                                >
                                    <Textarea
                                        value={contDiscription}
                                        onChange={(e) => setContDiscription(e.target.value)}
                                        error={!!errors.contDiscription}
                                        placeholder="Write a short description..."
                                        rows={4}
                                    />
                                </FormField>

                            </div>
                        </Card>
                        <Card>
                            <Text as="h2">Main Content</Text>

                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragMain(true);
                                }}
                                onDragLeave={() => setDragMain(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragMain(false);
                                    handleMainFile(e.dataTransfer.files[0]);
                                }}
                                style={{
                                    border: dragMain ? "2px dashed #3b82f6" : "2px dashed #d0d5dd",
                                    background: dragMain ? "#eff6ff" : "#fafafa",
                                    padding: 20,
                                    borderRadius: 10,
                                    textAlign: "center",
                                    marginBottom: 12
                                }}
                            >
                                <Text>
                                    {contentFormat
                                        ? `Drop ${contentFormat.toLowerCase()} file here`
                                        : "Select content format first"}
                                </Text>
                            </div>

                            <Input
                                type="file"
                                disabled={!contentFormat}
                                accept={
                                    contentFormat === "Image"
                                        ? "image/*"
                                        : contentFormat === "Video"
                                            ? "video/*"
                                            : contentFormat === "Audio"
                                                ? "audio/*"
                                                : "*"
                                }
                                onChange={(e) => handleMainFile(e.target.files[0])}
                            />

                            {mainFile && (
                                <div
                                    style={{
                                        marginTop: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        border: "1px solid #e5e7eb",
                                        padding: 8,
                                        borderRadius: 8,
                                        background: "#fafafa",
                                        width: "fit-content"
                                    }}
                                >
                                    {/* Small Preview */}
                                    {mainPreview ? (
                                        contentFormat === "Video" ? (
                                            <video
                                                src={mainPreview}
                                                style={{
                                                    width: 70,
                                                    height: 50,
                                                    objectFit: "cover",
                                                    borderRadius: 6
                                                }}
                                            />
                                        ) : (
                                            <img
                                                src={mainPreview}
                                                style={{
                                                    width: 70,
                                                    height: 50,
                                                    objectFit: "cover",
                                                    borderRadius: 6
                                                }}
                                            />
                                        )
                                    ) : (
                                        <div
                                            style={{
                                                width: 70,
                                                height: 50,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 11,
                                                border: "1px dashed #ccc",
                                                borderRadius: 6
                                            }}
                                        >
                                            FILE
                                        </div>
                                    )}

                                    {/* File Info */}
                                    <div>
                                        <Text className="text-xs">{mainFile.name}</Text>
                                        <Text className="text-xs text-muted-foreground">
                                            {(mainFile.size / 1024 / 1024).toFixed(2)} MB
                                        </Text>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMainFile(null);
                                            setMainPreview(null);
                                        }}
                                        style={{
                                            marginLeft: 8,
                                            background: "#ef4444",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            padding: "2px 8px",
                                            fontSize: 11,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}

                        </Card>
                        <Card>
                            <Text as="h2">Thumbnail</Text>

                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragThumb(true);
                                }}
                                onDragLeave={() => setDragThumb(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragThumb(false);
                                    handleThumbnail(e.dataTransfer.files[0]);
                                }}
                                style={{
                                    border: dragThumb ? "2px dashed #10b981" : "2px dashed #d0d5dd",
                                    background: dragThumb ? "#ecfdf5" : "#fafafa",
                                    padding: 20,
                                    borderRadius: 10,
                                    textAlign: "center",
                                    marginBottom: 12
                                }}
                            >
                                <Text>Drop thumbnail image here</Text>
                            </div>

                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleThumbnail(e.target.files[0])}
                            />

                            {thumbnailFile && (
                                <div
                                    style={{
                                        marginTop: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        border: "1px solid #e5e7eb",
                                        padding: 8,
                                        borderRadius: 8,
                                        background: "#f0fdf4",
                                        width: "fit-content"
                                    }}
                                >
                                    <img
                                        src={thumbnailPreview}
                                        style={{
                                            width: 70,
                                            height: 50,
                                            objectFit: "cover",
                                            borderRadius: 6
                                        }}
                                    />

                                    <div>
                                        <Text className="text-xs">{thumbnailFile.name}</Text>
                                        <Text className="text-xs text-muted-foreground">
                                            {(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB
                                        </Text>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setThumbnailFile(null);
                                            setThumbnailPreview(null);
                                        }}
                                        style={{
                                            marginLeft: 8,
                                            background: "#ef4444",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            padding: "2px 8px",
                                            fontSize: 11,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </Card>



                        <Card className="p-6 space-y-6">

                            {/* Header */}
                            <div className="flex items-center gap-2 pb-3">
                                <Folder className="w-5 h-5 text-muted-foreground" />
                                <Text as="h2" className="font-semibold">Classification</Text>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Category */}
                                <FormField
                                    label={
                                        <div className="flex items-center gap-2">
                                            <Folder className="w-4 h-4 text-muted-foreground" />
                                            Category
                                        </div>
                                    }
                                    error={errors.contentCategoryId}
                                    required
                                >
                                    <Select
                                        value={contentCategoryId}
                                        onChange={handleCategoryChange}
                                        options={categoryOptions}
                                    />
                                </FormField>


                                {contentOwnerType === "ORBITER" && (
                                    <FormField label={
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            Search Orbiter
                                        </div>
                                    } error={errors.orbiter} required>
                                        <div className="relative">

                                            <Input
                                                value={orbiterSearch}
                                                onChange={(e) => handleOrbiterSearch(e.target.value)}
                                                error={!!errors.orbiter}
                                                placeholder="Type member name"
                                            />

                                            {/* Dropdown */}
                                            {orbiterSearch && (
                                                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow max-h-56 overflow-auto">

                                                    {filteredOrbiters.length > 0 ? (
                                                        filteredOrbiters.map((u) => (
                                                            <div
                                                                key={u.id}
                                                                onClick={() => selectOrbiter(u)}
                                                                className="px-4 py-2 cursor-pointer hover:bg-gray-50 transition"
                                                            >
                                                                <div className="text-sm font-medium">
                                                                    {u.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {u.phone}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-sm text-gray-500">
                                                            No members found
                                                        </div>
                                                    )}

                                                </div>
                                            )}
                                        </div>
                                    </FormField>
                                )}
                                {/* Hashtags - Full Width */}
                                <FormField
                                    className="md:col-span-2"
                                    label={
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-muted-foreground" />
                                            Hashtags
                                        </div>
                                    }
                                >
                                    <TagsInput value={tags} onChange={setTags} />
                                </FormField>

                            </div>
                        </Card>

                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <Card>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Eye size={18} />
                                <Text as="h2">Preview</Text>
                            </div>

                            {/* Thumbnail */}
                            <div style={{ marginBottom: 12 }}>
                                {thumbnailFiles && thumbnailFiles.length > 0 ? (
                                    <img
                                        src={URL.createObjectURL(thumbnailFiles[0])}
                                        alt="thumbnail preview"
                                        style={{
                                            width: "100%",
                                            borderRadius: 8,
                                            objectFit: "cover",
                                            maxHeight: 220
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 180,
                                            borderRadius: 8,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: "1px dashed #d0d5dd"
                                        }}
                                    >
                                        <Text variant="muted">Thumbnail preview will appear here</Text>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <Text as="h3">
                                {contentName || "Content title will appear here"}
                            </Text>

                            {/* Description */}
                            <Text variant="muted" style={{ marginTop: 8 }}>
                                {contDiscription
                                    ? contDiscription.slice(0, 140)
                                    : "Description preview will appear here…"}
                            </Text>

                            {/* Meta info */}
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <User size={14} />
                                    <Text variant="muted">
                                        {partnerNamelp || "Partner name"}
                                    </Text>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Layers size={14} />
                                    <Text variant="muted">
                                        {contentCategoryName || "Category"}
                                    </Text>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Tag size={14} />
                                    <Text variant="muted">
                                        {tags && tags.length ? tags.join(", ") : "No tags added"}
                                    </Text>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 space-y-6">

                            {/* Header */}
                            <div className="flex items-center gap-2 pb-3">
                                <Link className="w-5 h-5 text-muted-foreground" />
                                <Text as="h2" className="font-semibold">Distribution Links</Text>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <FormField
                                    label={
                                        <div className="flex items-center gap-2">
                                            <Video className="w-4 h-4 text-muted-foreground" />
                                            Video URL
                                        </div>
                                    }
                                >
                                    <Input
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://youtube.com/..."
                                    />
                                </FormField>

                                <FormField
                                    label={
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            Blog URL
                                        </div>
                                    }
                                >
                                    <Input
                                        value={blogUrl}
                                        onChange={(e) => setBlogUrl(e.target.value)}
                                        placeholder="https://yourblog.com/article"
                                    />
                                </FormField>

                            </div>
                        </Card>


                    </div>
                </div>

                <div
                    style={{
                        position: "sticky",
                        bottom: 0,
                        background: "#fff",
                        borderTop: "1px solid #e5e7eb",
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 12,
                        zIndex: 50
                    }}
                >
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={loading}
                    >
                        {loading ? "Saving…" : "Save Draft"}
                    </Button>

                    <Button
                        type="button"
                        variant="primary"
                        onClick={handlePublish}
                        disabled={loading || uploading}
                    >
                        {loading || uploading ? "Publishing…" : "Publish Now"}
                    </Button>
                </div>

            </form>





        </>
    );
}
