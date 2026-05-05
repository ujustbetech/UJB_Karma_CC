"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import RadioGroup from "@/components/ui/RadioGroup";
import TagsInput from "@/components/ui/TagsInput";
import Checkbox from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  createContentEntry,
  fetchContentReferenceData,
  fetchPartnerDetails,
} from "@/services/adminContentService";
import { validateContentForm, validateFileSizes } from "@/services/contentShared";
import { uploadContentFiles } from "@/services/contentUploadService";

const CONTENT_TYPES = ["Normal", "Featured"];
const CONTENT_FORMATS = ["Image", "Video", "Audio", "Text"];
const VIDEO_MAX_MB = 200;
const DEFAULT_CONTENT_MAX_MB = 25;
const THUMBNAIL_MAX_MB = 5;

export default function AddContentPage() {
  const toast = useToast();
  const { admin } = useAdminSession();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState([]);
  const [partners, setPartners] = useState([]);
  const [errors, setErrors] = useState({});

  const [contentType, setContentType] = useState("Normal");
  const [contentFormat, setContentFormat] = useState("");
  const [contentName, setContentName] = useState("");
  const [contDiscription, setContDiscription] = useState("");
  const [contentCategoryId, setContentCategoryId] = useState("");
  const [contentCategoryName, setContentCategoryName] = useState("");
  const [ownershipType, setOwnershipType] = useState("UjustBe");
  const [parternameId, setParternameId] = useState("");
  const [partnerDesig, setPartnerDesig] = useState("");
  const [lpProfile, setLpProfile] = useState("");
  const [partnerNamelp, setPartnerNamelp] = useState("");
  const [tags, setTags] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [switchValue, setSwitchValue] = useState(true);
  const [mainFile, setMainFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [mainPreview, setMainPreview] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const normalizedFormat = String(contentFormat || "").trim().toLowerCase();
  const isImageFormat = normalizedFormat === "image";
  const isVideoFormat = normalizedFormat === "video";

  useEffect(() => {
    fetchContentReferenceData()
      .then((data) => {
        setCategories(data.categories || []);
        setPartners(data.partners || []);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load content data");
      });
  }, [toast]);

  const categoryOptions = useMemo(
    () => [
      { label: "Select category", value: "" },
      ...categories.map((item) => ({
        label: item.contentCategory || item.name || item.id,
        value: item.id,
      })),
    ],
    [categories]
  );

  const partnerOptions = useMemo(
    () => [
      { label: "Select partner", value: "" },
      ...partners.map((item) => ({
        label: item.partnerName || item.id,
        value: item.id,
      })),
    ],
    [partners]
  );

  const setPartnerFromDetails = async (partnerId) => {
    setParternameId(partnerId);
    if (!partnerId) {
      setPartnerDesig("");
      setPartnerNamelp("");
      setLpProfile("");
      return;
    }

    const partner = await fetchPartnerDetails(partnerId);
    setPartnerDesig(partner?.partnerDesignation || "");
    setPartnerNamelp(partner?.partnerName || "");
    setLpProfile(partner?.lpProfile || "");
  };

  const resetForm = () => {
    setContentType("Normal");
    setContentFormat("");
    setContentName("");
    setContDiscription("");
    setContentCategoryId("");
    setContentCategoryName("");
    setOwnershipType("UjustBe");
    setParternameId("");
    setPartnerDesig("");
    setLpProfile("");
    setPartnerNamelp("");
    setTags([]);
    setVideoUrl("");
    setBlogUrl("");
    setSwitchValue(true);
    setMainFile(null);
    setThumbnailFile(null);
    setMainPreview("");
    setThumbnailPreview("");
    setErrors({});
  };

  const buildFormData = () => ({
    contentCategoryId,
    contentFiles: mainFile ? [mainFile] : [],
    contentFormat,
    contentName,
    contentType,
    contDiscription,
    ownershipType,
    parternameId,
    thumbnailFiles: isImageFormat ? [] : (thumbnailFile ? [thumbnailFile] : []),
  });

  useEffect(() => {
    if (!isImageFormat) return;
    setThumbnailFile(null);
    setThumbnailPreview("");
  }, [isImageFormat]);

  const handleSave = async (status) => {
    const formData = buildFormData();
    const nextErrors = validateContentForm(formData);

    if (status === "draft") {
      delete nextErrors.contentFiles;
      delete nextErrors.thumbnailFiles;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (isImageFormat && mainFile && !String(mainFile.type || "").startsWith("image/")) {
      setErrors((current) => ({ ...current, contentFiles: "Only image files are allowed for Image format" }));
      return;
    }

    if (isVideoFormat && mainFile && !String(mainFile.type || "").startsWith("video/")) {
      setErrors((current) => ({ ...current, contentFiles: "Only video files are allowed for Video format" }));
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      let contentFileImages = [];
      let Thumbnail = [];

      if (status !== "draft") {
        const contentMaxMb = isVideoFormat ? VIDEO_MAX_MB : DEFAULT_CONTENT_MAX_MB;
        const contentSizeError = validateFileSizes(formData.contentFiles, contentMaxMb);
        const thumbnailSizeError = isImageFormat
          ? null
          : validateFileSizes(formData.thumbnailFiles, THUMBNAIL_MAX_MB);
        if (contentSizeError || thumbnailSizeError) {
          throw new Error(contentSizeError || thumbnailSizeError);
        }

        setUploading(true);
        [contentFileImages, Thumbnail] = await Promise.all([
          uploadContentFiles(formData.contentFiles, setProgress),
          isImageFormat ? Promise.resolve([]) : uploadContentFiles(formData.thumbnailFiles, setProgress),
        ]);
      }

      await createContentEntry({
        adminName: admin?.name || "",
        Thumbnail,
        contentFileImages,
        contentFormat,
        contentType,
        contentName,
        comments: [],
        ownershipType,
        parternameId: ownershipType === "Partner" ? parternameId : "",
        contDiscription,
        contentCategoryId,
        contentCategoryName,
        partnerDesig: ownershipType === "Partner" ? partnerDesig : "",
        inputTag: tags,
        partnerNamelp: ownershipType === "Partner" ? partnerNamelp : "UjustBe",
        lpProfile: ownershipType === "Partner" ? lpProfile : "",
        videoUrl,
        blogUrl,
        switchValue,
        status,
        totallike: 0,
        totalViews: 0,
        totalCp: 0,
        AdminCreatedby: new Date(),
      });

      toast.success(status === "draft" ? "Draft saved successfully" : "Content published");
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to save content");
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <Text variant="h1">Add Content</Text>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Content Name" error={errors.contentName} required>
            <Input value={contentName} onChange={(e) => setContentName(e.target.value)} />
          </FormField>

          <FormField label="Content Type" error={errors.contentType} required>
            <Select
              value={contentType}
              onChange={setContentType}
              options={CONTENT_TYPES.map((value) => ({ label: value, value }))}
            />
          </FormField>

          <FormField label="Content Format" error={errors.contentFormat} required>
            <Select
              value={contentFormat}
              onChange={setContentFormat}
              options={[
                { label: "Select format", value: "" },
                ...CONTENT_FORMATS.map((value) => ({ label: value, value })),
              ]}
            />
          </FormField>

          <FormField label="Category" error={errors.contentCategoryId} required>
            <Select
              value={contentCategoryId}
              onChange={(value) => {
                setContentCategoryId(value);
                const selected = categories.find((item) => item.id === value);
                setContentCategoryName(selected?.contentCategory || "");
              }}
              options={categoryOptions}
            />
          </FormField>
        </div>

        <FormField label="Ownership" error={errors.parternameId}>
          <RadioGroup
            value={ownershipType}
            onChange={(value) => {
              setOwnershipType(value);
              if (value !== "Partner") {
                setPartnerFromDetails("");
              }
            }}
            options={[
              { label: "UjustBe", value: "UjustBe" },
              { label: "Partner", value: "Partner" },
            ]}
          />
        </FormField>

        {ownershipType === "Partner" && (
          <FormField label="Partner" error={errors.parternameId} required>
            <Select
              value={parternameId}
              onChange={setPartnerFromDetails}
              options={partnerOptions}
            />
          </FormField>
        )}

        <FormField label="Description" error={errors.contDiscription} required>
          <Textarea
            value={contDiscription}
            onChange={(e) => setContDiscription(e.target.value)}
            rows={5}
          />
        </FormField>

        <FormField label="Tags">
          <TagsInput value={tags} onChange={setTags} />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Video URL">
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </FormField>

          <FormField label="Blog URL">
            <Input value={blogUrl} onChange={(e) => setBlogUrl(e.target.value)} />
          </FormField>
        </div>

      <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Main File" error={errors.contentFiles} required={ownershipType !== "draft"}>
            <Input
              type="file"
              accept={isImageFormat ? "image/*" : isVideoFormat ? "video/*" : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setMainFile(file);
                setMainPreview(file ? URL.createObjectURL(file) : "");
              }}
            />
            {mainFile && <Text variant="muted">{mainFile.name}</Text>}
          </FormField>

          {!isImageFormat ? (
            <FormField label="Thumbnail" error={errors.thumbnailFiles} required={ownershipType !== "draft"}>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setThumbnailFile(file);
                  setThumbnailPreview(file ? URL.createObjectURL(file) : "");
                }}
              />
              {thumbnailFile && <Text variant="muted">{thumbnailFile.name}</Text>}
            </FormField>
          ) : null}
        </div>

        <Checkbox
          checked={switchValue}
          onChange={(e) => setSwitchValue(e.target.checked)}
          label="Active"
        />

        {uploading ? (
          <Text variant="muted">Uploading... {progress}%</Text>
        ) : null}

        {thumbnailPreview ? (
          <img src={thumbnailPreview} alt="Thumbnail preview" className="h-40 rounded-xl object-cover" />
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={loading}>
            {loading ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={() => handleSave("published")} disabled={loading || uploading}>
            {loading ? "Publishing..." : "Publish Now"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

