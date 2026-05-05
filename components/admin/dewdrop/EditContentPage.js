"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import RichEditor from "@/components/ui/RichEditor";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fetchContentEntry,
  fetchContentReferenceData,
  fetchPartnerDetails,
  updateContentEntry,
} from "@/services/adminContentService";
import { validateFileSizes } from "@/services/contentShared";
import { uploadContentFiles } from "@/services/contentUploadService";

const CONTENT_TYPES = ["Normal", "Featured"];
const CONTENT_FORMATS = ["Image", "Video", "Audio", "Text"];
const VIDEO_MAX_MB = 200;
const DEFAULT_CONTENT_MAX_MB = 25;
const THUMBNAIL_MAX_MB = 5;

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const contentId = useMemo(() => {
    const raw = params?.id;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return String(value || "").trim();
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState([]);
  const [partners, setPartners] = useState([]);

  const [contentType, setContentType] = useState("Normal");
  const [contentFormat, setContentFormat] = useState("");
  const [contentName, setContentName] = useState("");
  const [contDiscription, setContDiscription] = useState("");
  const [textContent, setTextContent] = useState("");
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
  const [contentFileUrls, setContentFileUrls] = useState([]);
  const [thumbnailUrls, setThumbnailUrls] = useState([]);
  const [mainFile, setMainFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [mainPreview, setMainPreview] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [errors, setErrors] = useState({});
  const normalizedFormat = String(contentFormat || "").trim().toLowerCase();
  const isImageFormat = normalizedFormat === "image";
  const isVideoFormat = normalizedFormat === "video";
  const isTextFormat = normalizedFormat === "text";

  const isRichTextEmpty = (value) =>
    String(value || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length === 0;

  useEffect(() => {
    async function load() {
      try {
        const [referenceData, content] = await Promise.all([
          fetchContentReferenceData(),
          fetchContentEntry(contentId),
        ]);

        if (!content) {
          toast.error("Content not found");
          router.push("/admin/dewdrop/manage");
          return;
        }

        setCategories(referenceData.categories || []);
        setPartners(referenceData.partners || []);
        setContentType(content.contentType || "Normal");
        setContentFormat(content.contentFormat || "");
        setContentName(content.contentName || "");
        setContDiscription(content.contDiscription || "");
        setTextContent(content.textContentHtml || "");
        setContentCategoryId(content.contentCategoryId || "");
        setContentCategoryName(content.contentCategoryName || "");
        setOwnershipType(content.ownershipType || "UjustBe");
        setParternameId(content.parternameId || "");
        setPartnerDesig(content.partnerDesig || "");
        setLpProfile(content.lpProfile || "");
        setPartnerNamelp(content.partnerNamelp || "");
        setTags(content.inputTag || []);
        setVideoUrl(content.videoUrl || "");
        setBlogUrl(content.blogUrl || "");
        setSwitchValue(content.switchValue !== false);
        setContentFileUrls(content.contentFileImages || []);
        setThumbnailUrls(content.Thumbnail || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    if (contentId) {
      load();
      return;
    }

    setLoading(false);
    toast.error("Invalid content id");
    router.push("/admin/dewdrop/manage");
  }, [contentId, router, toast]);

  useEffect(() => {
    if (!(isImageFormat || isTextFormat)) return;
    setThumbnailFile(null);
    setThumbnailPreview("");
    if (isTextFormat) {
      setMainFile(null);
      setMainPreview("");
    }
  }, [isImageFormat, isTextFormat]);

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

  const handleSave = async () => {
    const nextErrors = {};
    if (!contentName.trim()) nextErrors.contentName = "Required";
    if (!contentType.trim()) nextErrors.contentType = "Required";
    if (!contentFormat.trim()) nextErrors.contentFormat = "Required";
    if (!contentCategoryId.trim()) nextErrors.contentCategoryId = "Required";
    if (ownershipType === "Partner" && !parternameId.trim()) nextErrors.parternameId = "Required";
    if (!contDiscription.trim()) nextErrors.contDiscription = "Required";
    if (isTextFormat && isRichTextEmpty(textContent)) nextErrors.textContent = "Content text is required";

    if (isImageFormat && mainFile && !String(mainFile.type || "").startsWith("image/")) {
      nextErrors.contentFiles = "Only image files are allowed for Image format";
    }

    if (isVideoFormat && mainFile && !String(mainFile.type || "").startsWith("video/")) {
      nextErrors.contentFiles = "Only video files are allowed for Video format";
    }

    if (!isImageFormat && !isTextFormat && thumbnailFile && !String(thumbnailFile.type || "").startsWith("image/")) {
      nextErrors.thumbnailFiles = "Thumbnail must be an image file";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setProgress(0);

    try {
      let nextContentUrls = contentFileUrls;
      let nextThumbUrls = thumbnailUrls;

      if (isTextFormat) {
        nextContentUrls = [];
        nextThumbUrls = [];
      }

      if (mainFile && !isTextFormat) {
        const contentMaxMb = isVideoFormat ? VIDEO_MAX_MB : DEFAULT_CONTENT_MAX_MB;
        const contentSizeError = validateFileSizes([mainFile], contentMaxMb);
        if (contentSizeError) {
          throw new Error(contentSizeError);
        }
        const uploaded = await uploadContentFiles([mainFile], setProgress);
        nextContentUrls = uploaded;
      }

      if (isImageFormat) {
        nextThumbUrls = [];
      }

      if (thumbnailFile && !isImageFormat && !isTextFormat) {
        const thumbnailSizeError = validateFileSizes([thumbnailFile], THUMBNAIL_MAX_MB);
        if (thumbnailSizeError) {
          throw new Error(thumbnailSizeError);
        }
        const uploaded = await uploadContentFiles([thumbnailFile], setProgress);
        nextThumbUrls = uploaded;
      }

      await updateContentEntry(contentId, {
        contentFormat,
        contentType,
        contentName,
        contDiscription,
        textContentHtml: isTextFormat ? textContent : "",
        contentCategoryId,
        contentCategoryName,
        ownershipType,
        parternameId: ownershipType === "Partner" ? parternameId : "",
        partnerDesig: ownershipType === "Partner" ? partnerDesig : "",
        partnerNamelp: ownershipType === "Partner" ? partnerNamelp : "UjustBe",
        lpProfile: ownershipType === "Partner" ? lpProfile : "",
        inputTag: tags,
        videoUrl,
        blogUrl,
        switchValue,
        contentFileImages: nextContentUrls,
        Thumbnail: nextThumbUrls,
      });

      toast.success("Content updated successfully");
      setContentFileUrls(nextContentUrls);
      setThumbnailUrls(nextThumbUrls);
      setMainFile(null);
      setThumbnailFile(null);
      setMainPreview("");
      setThumbnailPreview("");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Text variant="muted">Loading...</Text>;
  }

  const ownerLabel =
    ownershipType === "Partner"
      ? (partnerNamelp || "UjustBe")
      : "UjustBe";
  const headerTitle = contentName
    ? `${contentName} by ${ownerLabel}`
    : `Edit Content by ${ownerLabel}`;

  return (
    <Card className="space-y-6">
      

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Content Name" error={errors.contentName}>
          <Input value={contentName} error={Boolean(errors.contentName)} onChange={(e) => setContentName(e.target.value)} />
        </FormField>

        <FormField label="Content Type" error={errors.contentType}>
          <Select
            value={contentType}
            error={Boolean(errors.contentType)}
            onChange={setContentType}
            options={CONTENT_TYPES.map((value) => ({ label: value, value }))}
          />
        </FormField>

        <FormField label="Content Format" error={errors.contentFormat}>
          <Select
            value={contentFormat}
            error={Boolean(errors.contentFormat)}
            onChange={setContentFormat}
            options={[
              { label: "Select format", value: "" },
              ...CONTENT_FORMATS.map((value) => ({ label: value, value })),
            ]}
          />
        </FormField>

        <FormField label="Category" error={errors.contentCategoryId}>
          <Select
            value={contentCategoryId}
            error={Boolean(errors.contentCategoryId)}
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
        <FormField label="Partner" error={errors.parternameId}>
          <Select
            value={parternameId}
            error={Boolean(errors.parternameId)}
            onChange={setPartnerFromDetails}
            options={partnerOptions}
          />
        </FormField>
      )}

      <FormField label="Description" error={errors.contDiscription}>
        <Textarea
          value={contDiscription}
          error={Boolean(errors.contDiscription)}
          onChange={(e) => setContDiscription(e.target.value)}
          rows={5}
        />
      </FormField>

      {isTextFormat ? (
        <FormField label="Content Text" error={errors.textContent}>
          <div className={errors.textContent ? "rounded-lg border border-red-400 p-1" : ""}>
            <RichEditor value={textContent} onChange={setTextContent} />
          </div>
        </FormField>
      ) : null}

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

      {!isTextFormat ? (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Replace Main File" error={errors.contentFiles}>
          <Input
            type="file"
            error={Boolean(errors.contentFiles)}
            accept={isImageFormat ? "image/*" : isVideoFormat ? "video/*" : undefined}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setMainFile(file);
              setMainPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
          {contentFileUrls[0] ? <Text variant="muted">Existing file attached</Text> : null}
        </FormField>

        {!isImageFormat ? (
        <FormField label="Replace Thumbnail" error={errors.thumbnailFiles}>
          <Input
            type="file"
            error={Boolean(errors.thumbnailFiles)}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setThumbnailFile(file);
              setThumbnailPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
          {thumbnailUrls[0] ? <Text variant="muted">Existing thumbnail attached</Text> : null}
        </FormField>
        ) : null}
      </div>
      ) : null}

      <Checkbox
        checked={switchValue}
        onChange={setSwitchValue}
        label="Active"
      />

      {progress > 0 && saving ? <Text variant="muted">Uploading... {progress}%</Text> : null}
      {thumbnailPreview || thumbnailUrls[0] ? (
        <img
          src={thumbnailPreview || thumbnailUrls[0]}
          alt="Thumbnail preview"
          className="h-40 rounded-xl object-cover"
        />
      ) : null}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
}

