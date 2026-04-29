import { useCallback, useEffect, useState } from "react";

import {
  createContentEntry,
  fetchContentReferenceData,
  fetchPartnerDetails,
} from "@/services/adminContentService";
import { validateContentForm, validateFileSizes } from "@/services/contentShared";
import { uploadContentFiles } from "@/services/contentUploadService";

export function useContentForm({ admin, toast }) {
  const [categories, setCategories] = useState([]);
  const [partners, setPartners] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadReferenceData = useCallback(async () => {
    const data = await fetchContentReferenceData();
    setCategories(data.categories);
    setPartners(data.partners);
  }, []);

  useEffect(() => {
    loadReferenceData().catch((error) => {
      console.error(error);
      toast?.error("Failed to load content data");
    });
  }, [loadReferenceData, toast]);

  const validate = useCallback((formData) => {
    const nextErrors = validateContentForm(formData);
    setErrors(nextErrors);
    return nextErrors;
  }, []);

  const getPartnerDetails = useCallback(async (partnerId) => {
    return fetchPartnerDetails(partnerId);
  }, []);

  const submitDraft = useCallback(
    async (formData) => {
      setLoading(true);

      try {
        await createContentEntry({
          ...formData,
          adminName: admin?.name || "",
          contentFileImages: [],
          Thumbnail: [],
          status: "draft",
        });
        toast?.success("Draft saved successfully");
      } catch (error) {
        console.error(error);
        toast?.error("Failed to save draft");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [admin, toast]
  );

  const submitPublish = useCallback(
    async (formData) => {
      setLoading(true);
      setUploading(true);
      setProgress(0);

      try {
        const contentSizeError = validateFileSizes(formData.contentFiles, 25);
        const thumbnailSizeError = validateFileSizes(formData.thumbnailFiles, 5);

        if (contentSizeError || thumbnailSizeError) {
          throw new Error(contentSizeError || thumbnailSizeError);
        }

        const [contentFileImages, thumbnail] = await Promise.all([
          uploadContentFiles(formData.contentFiles, setProgress),
          uploadContentFiles(formData.thumbnailFiles, setProgress),
        ]);

        await createContentEntry({
          ...formData,
          adminName: admin?.name || "",
          contentFileImages,
          thumbnail,
          Thumbnail: thumbnail,
          status: formData.status || "published",
        });
      } finally {
        setUploading(false);
        setLoading(false);
      }
    },
    [admin]
  );

  return {
    categories,
    errors,
    getPartnerDetails,
    loading,
    partners,
    progress,
    setErrors,
    submitDraft,
    submitPublish,
    uploading,
    validate,
  };
}
