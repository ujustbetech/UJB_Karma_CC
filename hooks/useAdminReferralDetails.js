import { useCallback, useEffect, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/firebaseClient";
import {
  attachAdminReferralFile,
  deleteAdminReferralFile,
  fetchAdminReferralDetails,
  replaceAdminReferralFollowups,
  saveAdminReferralDealLog,
  updateAdminReferralStatus,
} from "@/services/adminReferralService";

export default function useAdminReferralDetails(id) {
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [orbiter, setOrbiter] = useState(null);
  const [cosmoOrbiter, setCosmoOrbiter] = useState(null);
  const [formState, setFormState] = useState({
    dealStatus: "Pending",
    dealValue: "",
    referralType: "",
    referralSource: "",
  });
  const [followups, setFollowups] = useState([]);
  const [dealLogs, setDealLogs] = useState([]);
  const [payments, setPayments] = useState([]);

  const loadDetails = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const detail = await fetchAdminReferralDetails(id);
      const referral = detail?.referral || null;

      setReferralData(referral);
      setOrbiter(detail?.orbiter || referral?.orbiter || null);
      setCosmoOrbiter(detail?.cosmoOrbiter || referral?.cosmoOrbiter || null);
      setFollowups(Array.isArray(referral?.followups) ? referral.followups : []);
      setDealLogs(Array.isArray(referral?.dealLogs) ? referral.dealLogs : []);
      setPayments(Array.isArray(referral?.payments) ? referral.payments : []);
      setFormState((prev) => ({
        ...prev,
        dealStatus: referral?.dealStatus || "Pending",
        dealValue: referral?.dealValue || "",
        referralType: referral?.referralType || "",
        referralSource: referral?.referralSource || "",
      }));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleStatusUpdate = async (newStatus, rejectReason = "") => {
    await updateAdminReferralStatus({
      id,
      status: newStatus ?? formState.dealStatus ?? "Pending",
      rejectReason,
    });
    await loadDetails();
  };

  const handleSaveDealLog = async (distribution) => {
    await saveAdminReferralDealLog({ id, distribution });
    await loadDetails();
  };

  const persistFollowups = async (nextFollowups) => {
    await replaceAdminReferralFollowups({
      id,
      followups: nextFollowups,
    });
    setFollowups(nextFollowups);
    await loadDetails();
  };

  const addFollowup = async (followup) => {
    const entry = {
      priority: followup.priority || "Medium",
      date: followup.date || new Date().toISOString().split("T")[0],
      description: followup.description || "",
      status: followup.status || "Pending",
      createdAt: Date.now(),
    };

    await persistFollowups([...(followups || []), entry]);
  };

  const editFollowup = async (index, updatedItem) => {
    const nextFollowups = [...followups];
    nextFollowups[index] = updatedItem;
    await persistFollowups(nextFollowups);
  };

  const deleteFollowup = async (index) => {
    const nextFollowups = [...followups];
    nextFollowups.splice(index, 1);
    await persistFollowups(nextFollowups);
  };

  const uploadReferralFile = async (file, type = "supporting") => {
    if (!id || !file) {
      return { error: "Missing file or referral ID" };
    }

    try {
      const path = `referrals/${id}/${type}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await attachAdminReferralFile({
        id,
        type,
        url,
        name: file.name,
      });
      await loadDetails();

      return { success: true, url };
    } catch (error) {
      console.error("Admin referral file upload failed:", error);
      return { error: "File upload failed" };
    }
  };

  const deleteReferralFile = async ({ url, type }) => {
    try {
      await deleteAdminReferralFile({
        id,
        url,
        type,
      });
      await loadDetails();
      return { success: true };
    } catch (error) {
      console.error("Admin referral file delete failed:", error);
      return { error: "Delete failed" };
    }
  };

  return {
    loading,
    referralData,
    orbiter,
    cosmoOrbiter,
    formState,
    setFormState,
    followups,
    dealLogs,
    payments,
    setPayments,
    handleStatusUpdate,
    handleSaveDealLog,
    addFollowup,
    editFollowup,
    deleteFollowup,
    uploadLeadDoc: (file) => uploadReferralFile(file, "lead"),
    deleteLeadDoc: (doc) => deleteReferralFile({ url: doc?.url, type: "lead" }),
    refreshDetail: loadDetails,
  };
}
