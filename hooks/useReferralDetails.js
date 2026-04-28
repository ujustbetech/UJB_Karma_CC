import { useCallback, useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";
import {
  attachCcReferralFile as attachCcReferralFileMetadata,
  fetchCcReferralDetails,
  replaceCcReferralFollowups,
  saveCcReferralDealLog,
  updateCcReferralStatus,
} from "@/services/ccReferralService";

export default function useReferralDetails(
  id,
  { collectionName = COLLECTIONS.referral } = {}
) {
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [orbiter, setOrbiter] = useState(null);
  const [cosmoOrbiter, setCosmoOrbiter] = useState(null);
  const [payments, setPayments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [formState, setFormState] = useState({
    dealStatus: "Pending",
    dealValue: "",
    referralType: "",
    referralSource: "",
  });
  const [dealLogs, setDealLogs] = useState([]);
  const [dealAlreadyCalculated, setDealAlreadyCalculated] = useState(false);
  const [dealEverWon, setDealEverWon] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      if (collectionName !== "CCReferral") {
        setLoading(false);
        return;
      }

      const detail = await fetchCcReferralDetails(id);
      const referral = detail?.referral || null;

      setReferralData(referral);
      setOrbiter(detail?.orbiter || referral?.orbiter || null);
      setCosmoOrbiter(detail?.cosmoOrbiter || referral?.cosmoOrbiter || null);

      setFormState((prev) => ({
        ...prev,
        dealStatus: referral?.dealStatus || "Pending",
        dealValue: referral?.dealValue || "",
        referralType: referral?.referralType || "",
        referralSource: referral?.referralSource || "",
      }));

      const nextPayments = referral?.payments || [];
      const nextFollowups = referral?.followups || [];
      const nextDealLogs = referral?.dealLogs || [];

      setPayments(nextPayments);
      setFollowups(nextFollowups);
      setDealLogs(nextDealLogs);
      setDealAlreadyCalculated(nextDealLogs.length > 0);

      const eligible = [
        "Deal Won",
        "Work in Progress",
        "Work Completed",
        "Received Part Payment and Transferred to UJustBe",
        "Received Full and Final Payment",
        "Agreed % Transferred to UJustBe",
      ];
      setDealEverWon(eligible.includes(referral?.dealStatus));
    } catch (error) {
      console.error("CC referral detail load failed:", error);
      setReferralData(null);
      setOrbiter(null);
      setCosmoOrbiter(null);
    } finally {
      setLoading(false);
    }
  }, [collectionName, id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleStatusUpdate = async (newStatus) => {
    if (!id) return;

    try {
      const finalStatus =
        newStatus ??
        formState?.dealStatus ??
        "Pending";

      if (!finalStatus) {
        return;
      }

      await updateCcReferralStatus({
        id,
        status: finalStatus,
      });

      setFormState((prev) => ({
        ...prev,
        dealStatus: finalStatus,
      }));

      await loadDetails();
    } catch (error) {
      console.error("CC referral status update failed:", error);
    }
  };

  const handleSaveDealLog = async (distribution) => {
    if (!id || !distribution) return;

    try {
      await saveCcReferralDealLog({
        id,
        distribution: {
          ...distribution,
          dealValue: Number(distribution.dealValue || 0),
        },
      });

      await loadDetails();
    } catch (error) {
      console.error("CC referral deal log save failed:", error);
    }
  };

  const persistFollowups = async (nextFollowups) => {
    await replaceCcReferralFollowups({
      id,
      followups: nextFollowups,
    });
    setFollowups(nextFollowups);
    await loadDetails();
  };

  const addFollowup = async (followup) => {
    if (!id) return;

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
    if (!id) return;

    const nextFollowups = [...followups];
    nextFollowups[index] = updatedItem;
    await persistFollowups(nextFollowups);
  };

  const deleteFollowup = async (index) => {
    if (!id) return;

    const nextFollowups = [...followups];
    nextFollowups.splice(index, 1);
    await persistFollowups(nextFollowups);
  };

  const uploadReferralFile = async (file, type = "supporting") => {
    if (!id || !file) return { error: "Missing file or referral ID" };

    try {
      const path = `referrals/${id}/${type}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      await attachCcReferralFileMetadata({
        id,
        type,
        url,
        name: file.name,
      });

      await loadDetails();
      return { success: true, url };
    } catch (error) {
      console.error("CC referral file upload failed:", error);
      return { error: "File upload failed" };
    }
  };

  const uploadInvoice = async (file) => uploadReferralFile(file, "invoice");
  const uploadSupportingDoc = async (file, type = "supporting") =>
    uploadReferralFile(file, type);
  const uploadLeadDoc = async (file) => uploadReferralFile(file, "lead");

  return {
    loading,
    referralData,
    orbiter,
    cosmoOrbiter,
    payments,
    setPayments,
    followups,
    formState,
    setFormState,
    dealLogs,
    dealAlreadyCalculated,
    dealEverWon,
    handleStatusUpdate,
    handleSaveDealLog,
    addFollowup,
    editFollowup,
    deleteFollowup,
    uploadInvoice,
    uploadSupportingDoc,
    uploadLeadDoc,
    refreshDetail: loadDetails,
  };
}
