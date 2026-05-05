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
import { useToast } from "@/components/ui/ToastProvider";
import {
  fetchContentEntry,
  fetchContentReferenceData,
  fetchPartnerDetails,
  updateContentEntry,
} from "@/services/adminContentService";
import { uploadContentFiles } from "@/services/contentUploadService";

const CONTENT_TYPES = ["Normal", "Featured"];
const CONTENT_FORMATS = ["Image", "Video", "Audio", "Text"];

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
    setSaving(true);
    setProgress(0);

    try {
      let nextContentUrls = contentFileUrls;
      let nextThumbUrls = thumbnailUrls;

      if (mainFile) {
        const uploaded = await uploadContentFiles([mainFile], setProgress);
        nextContentUrls = [...contentFileUrls, ...uploaded];
      }

      if (thumbnailFile) {
        const uploaded = await uploadContentFiles([thumbnailFile], setProgress);
        nextThumbUrls = [...thumbnailUrls, ...uploaded];
      }

      await updateContentEntry(contentId, {
        contentFormat,
        contentType,
        contentName,
        contDiscription,
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
        <FormField label="Content Name">
          <Input value={contentName} onChange={(e) => setContentName(e.target.value)} />
        </FormField>

        <FormField label="Content Type">
          <Select
            value={contentType}
            onChange={setContentType}
            options={CONTENT_TYPES.map((value) => ({ label: value, value }))}
          />
        </FormField>

        <FormField label="Content Format">
          <Select
            value={contentFormat}
            onChange={setContentFormat}
            options={[
              { label: "Select format", value: "" },
              ...CONTENT_FORMATS.map((value) => ({ label: value, value })),
            ]}
          />
        </FormField>

        <FormField label="Category">
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

      <FormField label="Ownership">
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
        <FormField label="Partner">
          <Select
            value={parternameId}
            onChange={setPartnerFromDetails}
            options={partnerOptions}
          />
        </FormField>
      )}

      <FormField label="Description">
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
        <FormField label="Replace Main File">
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setMainFile(file);
              setMainPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
          {contentFileUrls[0] ? <Text variant="muted">Existing file attached</Text> : null}
        </FormField>

        <FormField label="Replace Thumbnail">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setThumbnailFile(file);
              setThumbnailPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
          {thumbnailUrls[0] ? <Text variant="muted">Existing thumbnail attached</Text> : null}
        </FormField>
      </div>

      <Checkbox
        checked={switchValue}
        onChange={(e) => setSwitchValue(e.target.checked)}
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

